import pool from '../db.js';
import { verifyWebhookSignature, handleWebhookEvent } from '../utils/webhookHandler.js';
import { STRIPE_WEBHOOK_SECRET } from '../utils/stripeConfig.js';
import logger from '../utils/logger.js';
import emailService from '../utils/emailService.js';

// POST /api/stripe/webhook - Stripe webhook endpoint
export const stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  if (!signature) {
    logger.warn('Webhook request without signature');
    return res.status(400).send('Webhook signature missing');
  }

  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(
      req.rawBody, // Raw body required for signature verification
      signature,
      STRIPE_WEBHOOK_SECRET
    );

    if (!event) {
      logger.warn('Invalid webhook signature');
      return res.status(400).send('Invalid signature');
    }

    logger.info('Webhook event received', { event_type: event.type, event_id: event.id });

    // Handle the webhook event
    await handleWebhookEvent(event);

    // Always respond with 200 to acknowledge receipt
    res.json({ received: true });

  } catch (err) {
    logger.error('Webhook processing error', { error: err.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Internal webhook event handlers
export const handleCheckoutSessionCompleted = async (event) => {
  const session = event.data.object;
  const entrepriseId = session.metadata?.entreprise_id;
  const subscription = session.subscription;

  if (!entrepriseId) {
    logger.warn('Checkout completed without entreprise_id');
    return;
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Update entreprise with subscription info
    await connection.query(
      `UPDATE entreprises
       SET stripe_subscription_id = ?, subscription_status = ?, subscription_plan = ?
       WHERE id = ?`,
      [subscription, 'active', session.metadata?.plan || 'monthly', entrepriseId]
    );

    // Get entreprise details for email
    const [rows] = await connection.query(
      'SELECT nom, email FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    await connection.commit();

    if (rows.length > 0) {
      const entreprise = rows[0];

      // Send welcome email
      emailService.sendWelcomeEmail({
        email: entreprise.email,
        nom: entreprise.nom,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      }).catch(err => {
        logger.error('Failed to send welcome email', { error: err.message });
      });
    }

    logger.info('Checkout completed successfully', { entreprise_id: entrepriseId, subscription });

  } catch (err) {
    await connection.rollback();
    logger.error('Error handling checkout completed', { error: err.message });
    throw err;
  } finally {
    connection.release();
  }
};

export const handleInvoicePaid = async (event) => {
  const invoice = event.data.object;
  const customerId = invoice.customer;

  const connection = await pool.getConnection();
  try {
    // Find entreprise by stripe_customer_id
    const [rows] = await connection.query(
      'SELECT id, nom, email FROM entreprises WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (rows.length === 0) {
      logger.warn('Invoice paid for unknown customer', { customer_id: customerId });
      return;
    }

    const entreprise = rows[0];

    // Log invoice to database
    await connection.query(
      `INSERT INTO invoices (entreprise_id, stripe_invoice_id, amount, currency, status, date, pdf_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        entreprise.id,
        invoice.id,
        invoice.amount_paid / 100, // Convert cents to dollars
        invoice.currency?.toUpperCase() || 'EUR',
        'paid',
        new Date(invoice.created * 1000).toISOString(),
        invoice.invoice_pdf || null
      ]
    );

    // Send receipt email
    emailService.sendInvoiceEmail({
      email: entreprise.email,
      nom: entreprise.nom,
      invoice_number: invoice.number,
      amount: (invoice.amount_paid / 100).toFixed(2),
      currency: invoice.currency?.toUpperCase() || 'EUR',
      date: new Date(invoice.created * 1000).toLocaleDateString('fr-FR'),
      pdf_url: invoice.invoice_pdf
    }).catch(err => {
      logger.error('Failed to send invoice email', { error: err.message });
    });

    logger.info('Invoice recorded successfully', { entreprise_id: entreprise.id, invoice_id: invoice.id });

  } catch (err) {
    logger.error('Error handling invoice paid', { error: err.message });
  } finally {
    connection.release();
  }
};

export const handleInvoicePaymentFailed = async (event) => {
  const invoice = event.data.object;
  const customerId = invoice.customer;

  const connection = await pool.getConnection();
  try {
    // Find entreprise by stripe_customer_id
    const [rows] = await connection.query(
      'SELECT id, nom, email FROM entreprises WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (rows.length === 0) {
      logger.warn('Invoice payment failed for unknown customer', { customer_id: customerId });
      return;
    }

    const entreprise = rows[0];

    // Update subscription status to past_due
    await connection.query(
      'UPDATE entreprises SET subscription_status = ? WHERE id = ?',
      ['past_due', entreprise.id]
    );

    // Send payment failed email
    emailService.sendPaymentFailedEmail({
      email: entreprise.email,
      nom: entreprise.nom,
      amount: (invoice.amount_due / 100).toFixed(2),
      currency: invoice.currency?.toUpperCase() || 'EUR',
      retry_date: new Date(invoice.next_payment_attempt * 1000).toLocaleDateString('fr-FR')
    }).catch(err => {
      logger.error('Failed to send payment failed email', { error: err.message });
    });

    logger.info('Payment failure handled', { entreprise_id: entreprise.id, invoice_id: invoice.id });

  } catch (err) {
    logger.error('Error handling invoice payment failed', { error: err.message });
  } finally {
    connection.release();
  }
};

export const handleCustomerSubscriptionUpdated = async (event) => {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  const connection = await pool.getConnection();
  try {
    // Find entreprise by stripe_customer_id
    const [rows] = await connection.query(
      'SELECT id FROM entreprises WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (rows.length === 0) {
      logger.warn('Subscription updated for unknown customer', { customer_id: customerId });
      return;
    }

    const entreprise = rows[0];

    // Map Stripe status to our status enum
    const statusMap = {
      'active': 'active',
      'past_due': 'past_due',
      'trialing': 'trialing',
      'canceled': 'canceled',
      'unpaid': 'unpaid'
    };

    const mappedStatus = statusMap[subscription.status] || subscription.status;

    // Update subscription info
    await connection.query(
      `UPDATE entreprises
       SET subscription_status = ?, current_period_end = ?, cancel_at_period_end = ?
       WHERE id = ?`,
      [
        mappedStatus,
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end || false,
        entreprise.id
      ]
    );

    logger.info('Subscription updated', { entreprise_id: entreprise.id, status: mappedStatus });

  } catch (err) {
    logger.error('Error handling subscription updated', { error: err.message });
  } finally {
    connection.release();
  }
};

export const handleCustomerSubscriptionDeleted = async (event) => {
  const subscription = event.data.object;
  const customerId = subscription.customer;

  const connection = await pool.getConnection();
  try {
    // Find entreprise by stripe_customer_id
    const [rows] = await connection.query(
      'SELECT id, nom, email FROM entreprises WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (rows.length === 0) {
      logger.warn('Subscription deleted for unknown customer', { customer_id: customerId });
      return;
    }

    const entreprise = rows[0];

    // Update subscription status to canceled
    await connection.query(
      'UPDATE entreprises SET subscription_status = ? WHERE id = ?',
      ['canceled', entreprise.id]
    );

    // Send cancellation email
    emailService.sendSubscriptionCanceledEmail({
      email: entreprise.email,
      nom: entreprise.nom,
      canceled_at: new Date().toLocaleDateString('fr-FR')
    }).catch(err => {
      logger.error('Failed to send cancellation email', { error: err.message });
    });

    logger.info('Subscription canceled', { entreprise_id: entreprise.id });

  } catch (err) {
    logger.error('Error handling subscription deleted', { error: err.message });
  } finally {
    connection.release();
  }
};

export default {
  stripeWebhook,
  handleCheckoutSessionCompleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleCustomerSubscriptionUpdated,
  handleCustomerSubscriptionDeleted
};
