import pool from '../db.js';
import { stripe, STRIPE_PUBLISHABLE_KEY } from '../utils/stripeConfig.js';
import { getTierPriceId, getPromoTarget } from '../utils/pricing.js';
import { getAccess } from '../utils/plans.js';
import { validatePromo } from './proSignupController.js';
import logger from '../utils/logger.js';
import emailService from '../utils/emailService.js';

// GET /api/pro/subscription - Get subscription details
export const getSubscription = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT stripe_subscription_id, stripe_customer_id, subscription_status, subscription_plan,
              current_period_end, cancel_at_period_end
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const entreprise = rows[0];
    const access = await getAccess(entrepriseId);

    // Get Stripe subscription details
    let stripeDetails = null;
    if (entreprise.stripe_subscription_id) {
      stripeDetails = await stripe.subscriptions.retrieve(entreprise.stripe_subscription_id);
    }

    res.json({
      status: entreprise.subscription_status,
      tier: access.tier,
      client_count: access.client_count,
      client_limit: access.limit,
      locked: access.locked,
      plan: entreprise.subscription_plan,
      current_period_end: entreprise.current_period_end,
      cancel_at_period_end: entreprise.cancel_at_period_end,
      stripe_subscription_id: entreprise.stripe_subscription_id,
      stripe_customer_id: entreprise.stripe_customer_id,
      stripe_subscription: stripeDetails ? {
        id: stripeDetails.id,
        status: stripeDetails.status,
        current_period_start: new Date(stripeDetails.current_period_start * 1000),
        current_period_end: new Date(stripeDetails.current_period_end * 1000),
        cancel_at_period_end: stripeDetails.cancel_at_period_end,
        items: stripeDetails.items.data.map(item => ({
          id: item.id,
          price: item.price.id,
          amount: item.price.unit_amount / 100,
          currency: item.price.currency
        }))
      } : null
    });
  } catch (err) {
    logger.error('Get subscription error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'abonnement' });
  }
};

// POST /api/pro/subscription/switch-plan { new_tier?: 'pro'|'business', new_plan?: 'monthly'|'yearly' }
// Change d'offre et/ou d'intervalle de facturation, avec prorata.
export const switchPlan = async (req, res) => {
  const { new_tier, new_plan } = req.body;
  const entrepriseId = req.user.id;

  if (!new_tier && !new_plan) return res.status(400).json({ error: 'Offre ou plan requis' });
  if (new_plan && !['monthly', 'yearly'].includes(new_plan)) return res.status(400).json({ error: 'Plan invalide' });
  if (new_tier && !['pro', 'business'].includes(new_tier)) return res.status(400).json({ error: 'Offre invalide' });

  try {
    const [rows] = await pool.query(
      `SELECT stripe_subscription_id, subscription_plan, tier, nom, email
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0 || !rows[0].stripe_subscription_id) {
      return res.status(400).json({ error: "Pas d'abonnement actif" });
    }

    const { stripe_subscription_id, subscription_plan, tier, nom, email } = rows[0];
    const targetTier = new_tier || tier;
    const targetPlan = new_plan || subscription_plan;

    if (targetTier === tier && targetPlan === subscription_plan) {
      return res.status(400).json({ error: 'Même offre sélectionnée' });
    }

    const priceId = await getTierPriceId(targetTier, targetPlan);
    if (!priceId) {
      return res.status(500).json({ error: 'Prix non configuré' });
    }

    const subscription = await stripe.subscriptions.retrieve(stripe_subscription_id);
    const updatedSubscription = await stripe.subscriptions.update(stripe_subscription_id, {
      items: [{ id: subscription.items.data[0].id, price: priceId }],
      proration_behavior: 'create_prorations'
    });

    await pool.query(
      'UPDATE entreprises SET subscription_plan = ?, tier = ? WHERE id = ?',
      [targetPlan, targetTier, entrepriseId]
    );

    const label = `${targetTier === 'business' ? 'Business' : 'Pro'} ${targetPlan === 'yearly' ? 'annuel' : 'mensuel'}`;
    emailService.sendPlanChangeEmail({
      email,
      nom,
      new_plan: label,
      effective_date: new Date(updatedSubscription.current_period_start * 1000).toLocaleDateString('fr-FR')
    }).catch(err => {
      logger.error('Failed to send plan change email', { error: err.message });
    });

    logger.info('Subscription plan switched', { entreprise_id: entrepriseId, tier: targetTier, plan: targetPlan });
    res.json({
      success: true,
      new_plan: targetPlan,
      new_tier: targetTier,
      message: `Passage à l'offre ${label} effectué`
    });
  } catch (err) {
    logger.error('Switch plan error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors du changement de plan' });
  }
};

// POST /api/pro/subscription/checkout { tier, plan, code_promo? }
// Passage d'un compte gratuit (ou dont l'abonnement a pris fin) à une offre payante via Stripe Checkout.
export const createUpgradeCheckout = async (req, res) => {
  const { tier, plan, code_promo } = req.body;
  const entrepriseId = req.user.id;

  if (!['pro', 'business'].includes(tier) || !['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'Offre ou plan invalide' });
  }

  try {
    const [[entreprise]] = await pool.query(
      `SELECT email, raison_sociale, nom, stripe_customer_id, stripe_subscription_id, subscription_status
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );
    if (!entreprise) return res.status(404).json({ error: 'Entreprise non trouvée' });
    if (['active', 'trialing', 'past_due'].includes(entreprise.subscription_status)) {
      return res.status(400).json({ error: 'Vous avez déjà un abonnement : utilisez le changement de formule.' });
    }

    const priceId = await getTierPriceId(tier, plan);
    if (!priceId) return res.status(500).json({ error: 'Offre indisponible' });

    let discounts;
    if (code_promo) {
      const promo = await validatePromo(code_promo);
      if (!promo) return res.status(400).json({ error: 'Code promo invalide ou expiré' });
      if ((await getPromoTarget(promo.id)) === 'renewal') {
        return res.status(400).json({ error: 'Ce code est réservé aux renouvellements' });
      }
      discounts = [{ promotion_code: promo.id }];
    }

    let customerId = entreprise.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: entreprise.email,
        name: entreprise.raison_sociale || entreprise.nom,
        metadata: { entreprise_id: entrepriseId }
      });
      customerId = customer.id;
      await pool.query('UPDATE entreprises SET stripe_customer_id = ? WHERE id = ?', [customerId, entrepriseId]);
    }

    const base = process.env.FRONTEND_URL || 'http://localhost:3000';
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: entrepriseId,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: { metadata: { entreprise_id: entrepriseId, tier } },
      ...(discounts && { discounts }),
      metadata: { entreprise_id: entrepriseId, tier },
      success_url: `${base}/pro/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/pro/account`
    });

    res.json({ success: true, checkout_url: session.url });
  } catch (err) {
    logger.error('Upgrade checkout error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la création du paiement' });
  }
};

// POST /api/pro/subscription/apply-promo - Apply promo code for next renewal
export const applyPromoCode = async (req, res) => {
  const { code_promo } = req.body;
  const entrepriseId = req.user.id;

  if (!code_promo) {
    return res.status(400).json({ error: 'Code promo requis' });
  }

  try {
    // Validate promo code
    const promoCode = await stripe.promotionCodes.list({
      code: code_promo.toUpperCase(),
      active: true,
      limit: 1
    });

    if (promoCode.data.length === 0) {
      return res.status(400).json({ error: 'Code promo invalide ou expiré' });
    }

    const promo = promoCode.data[0];
    if ((await getPromoTarget(promo.id)) === 'signup') {
      return res.status(400).json({ error: 'Ce code est réservé aux nouvelles inscriptions' });
    }

    const [rows] = await pool.query(
      'SELECT stripe_subscription_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );
    if (!rows[0]?.stripe_subscription_id) {
      return res.status(400).json({ error: "Pas d'abonnement actif" });
    }

    // La remise s'applique à la prochaine facture de l'abonnement
    await stripe.subscriptions.update(rows[0].stripe_subscription_id, {
      discounts: [{ promotion_code: promo.id }]
    });
    await pool.query(
      'UPDATE entreprises SET pending_promo_code = ? WHERE id = ?',
      [promo.id, entrepriseId]
    );

    logger.info('Promo code applied for next renewal', { entreprise_id: entrepriseId });
    res.json({
      success: true,
      discount: promo.coupon?.percent_off || promo.coupon?.amount_off,
      message: 'Code promo appliqué au prochain renouvellement'
    });
  } catch (err) {
    logger.error('Apply promo code error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de l\'application du code promo' });
  }
};

// POST /api/pro/subscription/cancel - Cancel subscription (at period end)
export const cancelSubscription = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT stripe_subscription_id, nom, email, current_period_end
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0 || !rows[0].stripe_subscription_id) {
      return res.status(400).json({ error: 'Pas d\'abonnement actif' });
    }

    const { stripe_subscription_id, nom, email, current_period_end } = rows[0];

    // Cancel at period end (not immediately)
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update database
    await pool.query(
      'UPDATE entreprises SET cancel_at_period_end = true WHERE id = ?',
      [entrepriseId]
    );

    // Send cancellation notice
    emailService.sendSubscriptionCancellationNoticeEmail({
      email: email,
      nom: nom,
      period_end: new Date(current_period_end).toLocaleDateString('fr-FR')
    }).catch(err => {
      logger.error('Failed to send cancellation notice', { error: err.message });
    });

    logger.info('Subscription cancellation scheduled', { entreprise_id: entrepriseId });
    res.json({
      success: true,
      message: `Votre abonnement sera annulé le ${new Date(current_period_end).toLocaleDateString('fr-FR')}`,
      cancel_at_period_end: true
    });
  } catch (err) {
    logger.error('Cancel subscription error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
};

// POST /api/pro/subscription/reactivate - Reactivate canceled subscription
export const reactivateSubscription = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT stripe_subscription_id, nom, email
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0 || !rows[0].stripe_subscription_id) {
      return res.status(400).json({ error: 'Pas d\'abonnement' });
    }

    const { stripe_subscription_id, nom, email } = rows[0];

    // Remove cancellation
    await stripe.subscriptions.update(stripe_subscription_id, {
      cancel_at_period_end: false
    });

    // Update database
    await pool.query(
      'UPDATE entreprises SET cancel_at_period_end = false WHERE id = ?',
      [entrepriseId]
    );

    // Send reactivation email
    emailService.sendSubscriptionReactivatedEmail({
      email: email,
      nom: nom
    }).catch(err => {
      logger.error('Failed to send reactivation email', { error: err.message });
    });

    logger.info('Subscription reactivated', { entreprise_id: entrepriseId });
    res.json({
      success: true,
      message: 'Votre abonnement a été réactivé'
    });
  } catch (err) {
    logger.error('Reactivate subscription error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la réactivation' });
  }
};

// GET /api/pro/subscription/portal-link - Get Stripe Customer Portal link
export const getPortalLink = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT stripe_customer_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (rows.length === 0 || !rows[0].stripe_customer_id) {
      return res.status(400).json({ error: 'Pas de client Stripe' });
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: rows[0].stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pro/account/billing`
    });

    res.json({
      portal_url: session.url
    });
  } catch (err) {
    logger.error('Portal link error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la génération du lien' });
  }
};

export default {
  getSubscription,
  switchPlan,
  createUpgradeCheckout,
  applyPromoCode,
  cancelSubscription,
  reactivateSubscription,
  getPortalLink
};
