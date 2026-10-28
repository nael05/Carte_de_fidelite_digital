import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { stripe, STRIPE_PUBLISHABLE_KEY } from '../utils/stripeConfig.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { getTierPriceId, getPromoTarget } from '../utils/pricing.js';
import logger from '../utils/logger.js';

const frontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

// Un code « 1 mois offert » = coupon 100 % sur un mois : appliqué comme remise (carte enregistrée, 0 € prélevé
// à l'inscription) pour que Stripe comptabilise les utilisations et respecte les limites du code.
const isFreeMonth = (coupon) =>
  coupon?.percent_off === 100 && coupon.duration === 'once'
  || (coupon?.percent_off === 100 && coupon.duration === 'repeating' && coupon.duration_in_months === 1);

export const validatePromo = async (code) => {
  const list = await stripe.promotionCodes.list({ code: String(code).trim(), active: true, limit: 1 });
  const promo = list.data[0];
  if (!promo || !promo.coupon?.valid) return null;
  return promo;
};

const insertAccount = async (account) => {
  const hashed = await bcrypt.hash(account.mot_de_passe, 10);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO entreprises
       (id, nom, raison_sociale, email, mot_de_passe, siret_tva, adresse, stripe_customer_id,
        subscription_status, tier, subscription_plan, must_change_password, statut, loyalty_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'free', ?, 0, 'actif', 'points')`,
      [account.id, account.nom, account.raison_sociale, account.email, hashed, account.siret_tva || null,
        account.adresse || null, account.stripe_customer_id || null, account.status, account.plan || 'monthly']
    );
    await connection.query(
      `INSERT INTO loyalty_config (id, entreprise_id, loyalty_type, reward_title, reward_description,
         points_per_purchase, points_for_reward, points_adding_mode)
       VALUES (?, ?, 'points', 'Récompense spéciale', 'Vous avez atteint le nombre de points requis!', 10, 100, 'manual')`,
      [randomUUID(), account.id]
    );
    await connection.query(
      `INSERT INTO card_customization (id, company_id, loyalty_type, primary_color, text_color, accent_color, secondary_color)
       VALUES (?, ?, 'points', '#1f2937', '#ffffff', '#3b82f6', '#374151')`,
      [randomUUID(), account.id]
    );
    await connection.commit();
  } catch (dbErr) {
    await connection.rollback();
    throw dbErr;
  } finally {
    connection.release();
  }
};

// POST /api/pro/signup — tier : free (sans paiement), pro ou business (Stripe Checkout).
export const proSignup = async (req, res) => {
  const { nom, raison_sociale, email, mot_de_passe, siret_tva, adresse, plan, code_promo } = req.body;
  const tier = req.body.tier || 'pro';
  const paid = tier !== 'free';

  if (!['free', 'pro', 'business'].includes(tier)) {
    return res.status(400).json({ error: 'Offre invalide' });
  }
  if (!nom || !raison_sociale || !email || !mot_de_passe || (paid && (!siret_tva || !adresse || !plan))) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (paid && !['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }
  const pwd = validatePassword(mot_de_passe);
  if (!pwd.isValid) {
    return res.status(400).json({ error: pwd.errors.join(', ') });
  }
  const priceId = paid ? await getTierPriceId(tier, plan) : null;
  if (paid && !priceId) {
    logger.error('Prix Stripe non configuré', { tier, plan });
    return res.status(500).json({ error: 'Offre indisponible' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT id, subscription_status, stripe_subscription_id FROM entreprises WHERE email = ?',
      [email]
    );
    if (existing.length > 0) {
      const stale = existing[0].subscription_status === 'unpaid' && !existing[0].stripe_subscription_id;
      if (!stale) return res.status(400).json({ error: 'Cet email est déjà utilisé' });
      await pool.query('DELETE FROM entreprises WHERE id = ?', [existing[0].id]);
    }

    if (!paid) {
      await insertAccount({ id: randomUUID(), nom, raison_sociale, email, mot_de_passe, siret_tva, adresse, status: 'free' });
      return res.json({ success: true, free: true });
    }

    let discounts;
    if (code_promo) {
      const promo = await validatePromo(code_promo);
      if (!promo) return res.status(400).json({ error: 'Code promo invalide ou expiré' });
      if ((await getPromoTarget(promo.id)) === 'renewal') {
        return res.status(400).json({ error: 'Ce code est réservé aux renouvellements' });
      }
      discounts = [{ promotion_code: promo.id }];
    }

    const entrepriseId = randomUUID();
    const customer = await stripe.customers.create({
      email,
      name: raison_sociale,
      address: { line1: adresse },
      metadata: { entreprise_id: entrepriseId, siret_tva }
    });

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customer.id,
      client_reference_id: entrepriseId,
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: 'always',
      subscription_data: { metadata: { entreprise_id: entrepriseId, tier } },
      ...(discounts && { discounts }),
      metadata: { entreprise_id: entrepriseId, tier },
      success_url: `${frontendUrl()}/pro/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl()}/pro/checkout/cancel`
    });

    try {
      await insertAccount({
        id: entrepriseId, nom, raison_sociale, email, mot_de_passe, siret_tva, adresse,
        stripe_customer_id: customer.id, status: 'unpaid', plan
      });
    } catch (dbErr) {
      await stripe.customers.del(customer.id).catch(() => {});
      throw dbErr;
    }

    res.json({ success: true, checkout_url: session.url });
  } catch (err) {
    logger.error('Pro signup error', { error: err.message });
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
};

export const validatePromoCode = async (req, res) => {
  const { code_promo } = req.body;
  if (!code_promo) return res.status(400).json({ error: 'Code promo requis' });
  try {
    const promo = await validatePromo(code_promo);
    if (!promo) return res.status(404).json({ valid: false, error: 'Code promo invalide ou expiré' });
    if ((await getPromoTarget(promo.id)) === 'renewal') {
      return res.status(404).json({ valid: false, error: 'Ce code est réservé aux renouvellements' });
    }
    res.json({
      valid: true,
      free_month: isFreeMonth(promo.coupon),
      percent_off: promo.coupon.percent_off,
      amount_off: promo.coupon.amount_off ? promo.coupon.amount_off / 100 : null
    });
  } catch (err) {
    logger.error('Validation code promo', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la validation du code' });
  }
};

export const checkoutSuccess = async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Session manquante' });
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.status !== 'complete') return res.status(400).json({ error: 'Paiement non confirmé' });
    res.json({ success: true, message: "Paiement reçu, votre compte est en cours d'activation" });
  } catch (err) {
    logger.error('Checkout verification error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la vérification du paiement' });
  }
};

export const getStripeKey = (req, res) => {
  if (!STRIPE_PUBLISHABLE_KEY) return res.status(500).json({ error: 'Stripe non configuré' });
  res.json({ publishable_key: STRIPE_PUBLISHABLE_KEY });
};

export default { proSignup, validatePromoCode, checkoutSuccess, getStripeKey };
