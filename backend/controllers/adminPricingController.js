import pool from '../db.js';
import { stripe } from '../utils/stripeConfig.js';
import { PLANS, getPriceId } from '../utils/pricing.js';
import { logEmail } from '../utils/stripeService.js';
import emailService from '../utils/emailService.js';
import logger from '../utils/logger.js';

const NOTICE_DAYS = 30;
const SUBSCRIBER_STATUSES = ['active', 'trialing', 'past_due'];
const PLAN_LABELS = { monthly: 'Mensuel', yearly: 'Annuel' };
const INTERVALS = { monthly: 'month', yearly: 'year' };
const MAX_AMOUNT_CENTS = 1_000_000;

const isoDate = (d) => d.toISOString().slice(0, 10);
const addDays = (days) => new Date(Date.now() + days * 86_400_000);
const minEffectiveDate = (change) => isoDate(addDays(change.new_amount > change.old_amount ? NOTICE_DAYS : 0));

const subscribersOf = async (plan, conn = pool) => {
  const [rows] = await conn.query(
    `SELECT id, nom, email, stripe_subscription_id FROM entreprises
     WHERE subscription_plan = ? AND stripe_subscription_id IS NOT NULL
       AND subscription_status IN (?) AND statut = 'actif'`,
    [plan, SUBSCRIBER_STATUSES]
  );
  return rows;
};

const readPlan = async (plan) => {
  const priceId = await getPriceId(plan);
  if (!priceId) return { plan, configured: false };
  try {
    const price = await stripe.prices.retrieve(priceId);
    return {
      plan, configured: true, price_id: price.id, product_id: price.product,
      amount: price.unit_amount / 100, currency: price.currency, active: price.active
    };
  } catch (err) {
    logger.warn('Prix Stripe illisible', { plan, priceId, error: err.message });
    return { plan, configured: false, price_id: priceId, error: 'Prix introuvable dans Stripe' };
  }
};

// GET /api/admin/pricing
export const getPricing = async (req, res) => {
  try {
    const [monthly, yearly] = await Promise.all(PLANS.map(readPlan));
    const [changes] = await pool.query('SELECT * FROM price_changes WHERE applied_at IS NULL ORDER BY id DESC');
    const pending = [];
    for (const c of changes) {
      pending.push({
        ...c,
        old_amount: c.old_amount / 100,
        new_amount: c.new_amount / 100,
        notified: !!c.notified_at,
        effective_date: c.effective_date ? isoDate(new Date(c.effective_date)) : null,
        min_effective_date: minEffectiveDate(c),
        subscribers: (await subscribersOf(c.plan)).length
      });
    }
    res.json({ plans: { monthly, yearly }, pending_changes: pending, notice_days: NOTICE_DAYS });
  } catch (err) {
    logger.error('Get pricing error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la lecture des tarifs' });
  }
};

const resolveProductId = async (plan) => {
  for (const p of [plan, ...PLANS.filter((x) => x !== plan)]) {
    const id = await getPriceId(p);
    if (id) return (await stripe.prices.retrieve(id)).product;
  }
  return (await stripe.products.create({ name: 'Fidelyz Pro' })).id;
};

// PUT /api/admin/pricing  { monthly?: euros, yearly?: euros }
export const updatePricing = async (req, res) => {
  const requested = PLANS.filter((p) => req.body?.[p] !== undefined && req.body[p] !== '');
  if (requested.length === 0) return res.status(400).json({ error: 'Indiquez au moins un tarif' });

  const amounts = {};
  for (const plan of requested) {
    const value = Number(req.body[plan]);
    const cents = Math.round(value * 100);
    if (!Number.isFinite(value) || cents < 100 || cents > MAX_AMOUNT_CENTS) {
      return res.status(400).json({ error: `Tarif ${PLAN_LABELS[plan].toLowerCase()} invalide (entre 1 € et 10 000 €)` });
    }
    amounts[plan] = cents;
  }

  try {
    const results = [];
    for (const plan of requested) {
      const [[notified]] = await pool.query(
        'SELECT id FROM price_changes WHERE plan = ? AND applied_at IS NULL AND notified_at IS NOT NULL LIMIT 1',
        [plan]
      );
      if (notified) {
        return res.status(409).json({ error: `Un préavis est déjà en cours pour le plan ${PLAN_LABELS[plan].toLowerCase()} : attendez son application avant de modifier à nouveau ce tarif.` });
      }

      const currentId = await getPriceId(plan);
      const current = currentId ? await stripe.prices.retrieve(currentId) : null;
      if (current && current.unit_amount === amounts[plan]) {
        results.push({ plan, unchanged: true });
        continue;
      }

      const productId = current ? current.product : await resolveProductId(plan);
      const created = await stripe.prices.create({
        product: productId,
        currency: current?.currency || 'eur',
        unit_amount: amounts[plan],
        recurring: { interval: INTERVALS[plan] },
        lookup_key: `fidelyz_pro_${plan}`,
        transfer_lookup_key: true,
        metadata: { source: 'admin', plan }
      });

      await pool.query(
        `INSERT INTO pricing_config (plan, stripe_product_id, stripe_price_id, unit_amount, currency)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE stripe_product_id = VALUES(stripe_product_id), stripe_price_id = VALUES(stripe_price_id),
           unit_amount = VALUES(unit_amount), currency = VALUES(currency)`,
        [plan, productId, created.id, amounts[plan], created.currency]
      );

      if (current) {
        // Les abonnés existants gardent l'ancien prix (Stripe autorise son utilisation tant qu'il est attaché) ; seuls les nouveaux utilisent le nouveau.
        await stripe.prices.update(current.id, { active: false }).catch((e) =>
          logger.warn('Archivage ancien prix impossible', { price: current.id, error: e.message }));

        const [[pending]] = await pool.query(
          'SELECT id, old_price_id, old_amount FROM price_changes WHERE plan = ? AND applied_at IS NULL LIMIT 1',
          [plan]
        );
        const baseOldId = pending ? pending.old_price_id : current.id;
        const baseOldAmount = pending ? pending.old_amount : current.unit_amount;

        if (pending && baseOldAmount === amounts[plan]) {
          await pool.query('DELETE FROM price_changes WHERE id = ?', [pending.id]);
        } else if (pending) {
          await pool.query('UPDATE price_changes SET new_price_id = ?, new_amount = ? WHERE id = ?', [created.id, amounts[plan], pending.id]);
        } else {
          const affected = (await subscribersOf(plan)).length;
          await pool.query(
            `INSERT INTO price_changes (plan, old_price_id, new_price_id, old_amount, new_amount, currency, applied_at)
             VALUES (?, ?, ?, ?, ?, ?, ${affected === 0 ? 'NOW()' : 'NULL'})`,
            [plan, baseOldId, created.id, baseOldAmount, amounts[plan], created.currency]
          );
        }
      }
      results.push({ plan, price_id: created.id, amount: amounts[plan] / 100 });
    }

    logger.info('Tarifs mis à jour', { admin: req.user.id, results });
    res.json({ success: true, results, message: 'Tarifs mis à jour pour les nouveaux abonnés. Notifiez les abonnés actuels pour leur appliquer le nouveau tarif.' });
  } catch (err) {
    logger.error('Update pricing error', { error: err.message });
    res.status(500).json({ error: `Erreur Stripe : ${err.message}` });
  }
};

// POST /api/admin/pricing/notify  { change_id, effective_date: 'YYYY-MM-DD' }
export const notifyPriceChange = async (req, res) => {
  const changeId = Number(req.body?.change_id);
  if (!Number.isInteger(changeId)) return res.status(400).json({ error: 'change_id requis' });

  try {
    const [[change]] = await pool.query('SELECT * FROM price_changes WHERE id = ? AND applied_at IS NULL', [changeId]);
    if (!change) return res.status(404).json({ error: 'Changement de tarif introuvable ou déjà appliqué' });

    let effective = change.effective_date ? isoDate(new Date(change.effective_date)) : null;
    const isRetry = !!change.notified_at;

    if (!isRetry) {
      const requested = String(req.body?.effective_date || '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(requested) || Number.isNaN(Date.parse(requested))) {
        return res.status(400).json({ error: "Date d'application invalide (AAAA-MM-JJ)" });
      }
      const min = minEffectiveDate(change);
      if (requested < min) {
        return res.status(400).json({
          error: `Une augmentation de tarif exige un préavis d'au moins ${NOTICE_DAYS} jours : la date d'application doit être au plus tôt le ${min}.`
        });
      }
      const [claim] = await pool.query(
        'UPDATE price_changes SET notified_at = NOW(), effective_date = ? WHERE id = ? AND notified_at IS NULL',
        [requested, changeId]
      );
      if (claim.affectedRows === 0) return res.status(409).json({ error: 'Ce préavis vient déjà d’être envoyé' });
      effective = requested;
    }

    const [recipients] = await pool.query(
      `SELECT e.id, e.nom, e.email FROM entreprises e
       WHERE e.subscription_plan = ? AND e.stripe_subscription_id IS NOT NULL
         AND e.subscription_status IN (?) AND e.statut = 'actif'
         AND NOT EXISTS (
           SELECT 1 FROM email_logs l WHERE l.entreprise_id = e.id AND l.type = 'price_change'
             AND l.status = 'sent' AND JSON_EXTRACT(l.metadata, '$.change_id') = ?
         )`,
      [change.plan, SUBSCRIBER_STATUSES, changeId]
    );

    const fmt = (cents) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: change.currency.toUpperCase() });
    const effectiveLabel = new Date(effective).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    let sent = 0;
    const failed = [];
    for (const r of recipients) {
      const subject = `Évolution du tarif de votre abonnement Fidelyz au ${effectiveLabel}`;
      const meta = { source: 'admin', kind: 'price_change', change_id: changeId, admin_id: req.user.id, effective_date: effective };
      try {
        await emailService.sendPriceChangeNoticeEmail({
          email: r.email, nom: r.nom, plan_label: PLAN_LABELS[change.plan],
          old_price: fmt(change.old_amount), new_price: fmt(change.new_amount),
          effective_date: effectiveLabel,
          account_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pro/account`
        });
        await logEmail(r.id, r.email, subject, 'price_change', meta);
        sent++;
      } catch (err) {
        await logEmail(r.id, r.email, subject, 'price_change', { ...meta, error: err.message }).catch(() => {});
        failed.push({ id: r.id, email: r.email, error: err.message });
      }
    }

    await pool.query('UPDATE price_changes SET notified_count = notified_count + ? WHERE id = ?', [sent, changeId]);
    logger.info('Préavis de changement de tarif', { change_id: changeId, sent, failed: failed.length });
    res.json({
      success: failed.length === 0, sent, failed, effective_date: effective, retry: isRetry,
      message: failed.length
        ? `${sent} e-mail(s) envoyé(s), ${failed.length} échec(s) : relancez l'envoi pour les destinataires restants.`
        : `${sent} abonné(s) notifié(s). Le nouveau tarif s'appliquera à partir du ${effectiveLabel}.`
    });
  } catch (err) {
    logger.error('Notify price change error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de l’envoi du préavis' });
  }
};

// Appelé chaque jour : bascule les abonnés notifiés sur le nouveau prix à la date prévue (sans prorata).
export const applyDuePriceChanges = async () => {
  const [due] = await pool.query(
    `SELECT * FROM price_changes
     WHERE applied_at IS NULL AND notified_at IS NOT NULL AND effective_date <= CURDATE()`
  );
  for (const change of due) {
    let failures = 0;
    for (const sub of await subscribersOf(change.plan)) {
      try {
        const subscription = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        const item = subscription.items.data[0];
        if (['canceled', 'incomplete_expired'].includes(subscription.status) || item.price.id === change.new_price_id) continue;
        await stripe.subscriptions.update(subscription.id, {
          items: [{ id: item.id, price: change.new_price_id }],
          proration_behavior: 'none'
        });
      } catch (err) {
        failures++;
        logger.error('Application du nouveau tarif échouée', { entreprise_id: sub.id, error: err.message });
      }
    }
    if (failures === 0) {
      await pool.query('UPDATE price_changes SET applied_at = NOW() WHERE id = ?', [change.id]);
      logger.info('Nouveau tarif appliqué aux abonnés', { change_id: change.id });
    }
  }
  return due.length;
};

export default { getPricing, updatePricing, notifyPriceChange, applyDuePriceChanges };
