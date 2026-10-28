import stripe from './stripeConfig.js';
import pool from '../db.js';
import logger from './logger.js';
import emailService from './emailService.js';
import { logEmail } from './stripeService.js';
import { tierOfPrice } from './pricing.js';

export const verifyWebhookSignature = (body, signature, secret) => {
  if (!secret) {
    logger.warn('STRIPE_WEBHOOK_SECRET non configuré');
    return null;
  }
  try {
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    logger.warn('Signature webhook invalide', { error: error.message });
    return null;
  }
};

const STATUS_MAP = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'unpaid',
  canceled: 'canceled',
  incomplete: 'unpaid',
  incomplete_expired: 'canceled',
  paused: 'past_due'
};

const periodEnd = (sub) => {
  const ts = sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000) : null;
};

const planOf = (sub) =>
  sub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'yearly' : 'monthly';

const findByCustomer = async (customerId) => {
  const [rows] = await pool.query(
    'SELECT id, nom, email FROM entreprises WHERE stripe_customer_id = ?',
    [customerId]
  );
  return rows[0] || null;
};

const syncSubscription = async (entrepriseId, sub) => {
  const tier = await tierOfPrice(sub.items?.data?.[0]?.price);
  await pool.query(
    `UPDATE entreprises
     SET stripe_subscription_id = ?, subscription_status = ?, subscription_plan = ?, tier = ?,
         current_period_end = ?, cancel_at_period_end = ?
     WHERE id = ?`,
    [
      sub.id,
      STATUS_MAP[sub.status] || 'unpaid',
      planOf(sub),
      tier,
      periodEnd(sub),
      sub.cancel_at_period_end ? 1 : 0,
      entrepriseId
    ]
  );
};

const notify = async (entreprise, type, subject, send) => {
  try {
    await send();
    await logEmail(entreprise.id, entreprise.email, subject, type, {});
  } catch (err) {
    logger.error('Envoi e-mail Stripe échoué (non bloquant)', { type, error: err.message });
    await logEmail(entreprise.id, entreprise.email, subject, type, { error: err.message }).catch(() => {});
  }
};

const onCheckoutCompleted = async (session) => {
  const entrepriseId = session.client_reference_id || session.metadata?.entreprise_id;
  if (!entrepriseId || !session.subscription) {
    logger.warn('checkout.session.completed sans entreprise ou abonnement', { id: session.id });
    return;
  }
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await pool.query('UPDATE entreprises SET stripe_customer_id = ? WHERE id = ?', [session.customer, entrepriseId]);
  await syncSubscription(entrepriseId, subscription);
  logger.info('Compte activé via Checkout', { entreprise_id: entrepriseId, status: subscription.status });
};

const onInvoicePaid = async (invoice) => {
  const entreprise = await findByCustomer(invoice.customer);
  if (!entreprise) return logger.warn('invoice.paid pour client inconnu', { customer: invoice.customer });

  await pool.query(
    `INSERT INTO invoices (entreprise_id, stripe_invoice_id, amount, currency, status, date, pdf_url)
     VALUES (?, ?, ?, ?, 'paid', ?, ?)
     ON DUPLICATE KEY UPDATE status = 'paid', amount = VALUES(amount), pdf_url = VALUES(pdf_url)`,
    [
      entreprise.id,
      invoice.id,
      (invoice.amount_paid || 0) / 100,
      (invoice.currency || 'eur').toUpperCase(),
      new Date(invoice.created * 1000),
      invoice.invoice_pdf || invoice.hosted_invoice_url || null
    ]
  );

  await notify(entreprise, 'receipt', `Votre facture Fidelyz ${invoice.number || ''}`.trim(), () =>
    emailService.sendInvoiceEmail({
      email: entreprise.email,
      nom: entreprise.nom,
      invoice_number: invoice.number || invoice.id,
      amount: ((invoice.amount_paid || 0) / 100).toFixed(2),
      currency: (invoice.currency || 'eur').toUpperCase(),
      date: new Date(invoice.created * 1000).toLocaleDateString('fr-FR'),
      pdf_url: invoice.invoice_pdf
    })
  );
};

const onInvoicePaymentFailed = async (invoice) => {
  const entreprise = await findByCustomer(invoice.customer);
  if (!entreprise) return logger.warn('invoice.payment_failed pour client inconnu', { customer: invoice.customer });

  await pool.query("UPDATE entreprises SET subscription_status = 'past_due' WHERE id = ?", [entreprise.id]);

  const retry = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR')
    : 'prochainement';
  await notify(entreprise, 'payment_failed', 'Paiement échoué - Action requise', () =>
    emailService.sendPaymentFailedEmail({
      email: entreprise.email,
      nom: entreprise.nom,
      amount: ((invoice.amount_due || 0) / 100).toFixed(2),
      currency: (invoice.currency || 'eur').toUpperCase(),
      retry_date: retry
    })
  );
};

const onSubscriptionUpdated = async (sub) => {
  const entreprise = await findByCustomer(sub.customer);
  if (!entreprise) return logger.warn('subscription.updated pour client inconnu', { customer: sub.customer });
  await syncSubscription(entreprise.id, sub);
};

const onSubscriptionDeleted = async (sub) => {
  const entreprise = await findByCustomer(sub.customer);
  if (!entreprise) return logger.warn('subscription.deleted pour client inconnu', { customer: sub.customer });
  await pool.query(
    "UPDATE entreprises SET subscription_status = 'canceled', tier = 'free', cancel_at_period_end = 0 WHERE id = ?",
    [entreprise.id]
  );
  await notify(entreprise, 'subscription_canceled', 'Votre abonnement Fidelyz a pris fin', () =>
    emailService.sendSubscriptionCanceledEmail({
      email: entreprise.email,
      nom: entreprise.nom,
      canceled_at: new Date().toLocaleDateString('fr-FR')
    })
  );
};

const HANDLERS = {
  'checkout.session.completed': onCheckoutCompleted,
  'invoice.paid': onInvoicePaid,
  'invoice.payment_failed': onInvoicePaymentFailed,
  'customer.subscription.updated': onSubscriptionUpdated,
  'customer.subscription.deleted': onSubscriptionDeleted
};

// Retourne 'duplicate' si l'événement a déjà été traité. En cas d'échec, l'événement
// n'est pas marqué traité : Stripe le rejouera.
export const handleWebhookEvent = async (event) => {
  const handler = HANDLERS[event.type];
  if (!handler) return 'ignored';

  const [claim] = await pool.query(
    'INSERT IGNORE INTO stripe_events (event_id, type) VALUES (?, ?)',
    [event.id, event.type]
  );
  if (claim.affectedRows === 0) return 'duplicate';

  try {
    await handler(event.data.object);
    return 'processed';
  } catch (err) {
    await pool.query('DELETE FROM stripe_events WHERE event_id = ?', [event.id]).catch(() => {});
    throw err;
  }
};

export default { verifyWebhookSignature, handleWebhookEvent };
