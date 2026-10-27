import pool from '../db.js';
import bcrypt from 'bcrypt';
import { v4 as randomUUID } from 'uuid';
import { stripe, STRIPE_PUBLISHABLE_KEY, validateStripeConfig } from '../utils/stripeConfig.js';
import { createStripeCustomer } from '../utils/stripeService.js';
import logger from '../utils/logger.js';
import emailService from '../utils/emailService.js';

validateStripeConfig();

// POST /api/pro/signup - Public endpoint for Pro signup
export const proSignup = async (req, res) => {
  const { nom, raison_sociale, email, mot_de_passe, siret_tva, adresse, plan, code_promo } = req.body;

  // Validation
  if (!nom || !raison_sociale || !email || !mot_de_passe || !adresse || !plan) {
    return res.status(400).json({ error: 'Tous les champs requis' });
  }

  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'Plan invalide' });
  }

  // Email format validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  // Password strength check (min 8 chars)
  if (mot_de_passe.length < 8) {
    return res.status(400).json({ error: 'Le mot de passe doit faire au minimum 8 caractères' });
  }

  const connection = await pool.getConnection();

  try {
    // Check if email already exists
    const [existingEmail] = await pool.query(
      'SELECT id FROM entreprises WHERE email = ?',
      [email]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Create Stripe Customer first
    let stripeCustomerId;
    try {
      stripeCustomerId = await createStripeCustomer({
        id: null, // Will be set after DB insert
        nom: nom,
        email: email
      });
    } catch (stripeError) {
      logger.error('Stripe customer creation failed', { error: stripeError.message });
      return res.status(400).json({ error: 'Erreur lors de la création du client Stripe' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const entrepriseId = randomUUID();

    await connection.beginTransaction();

    // Create entreprise with 'unpaid' status initially
    await connection.query(
      `INSERT INTO entreprises
       (id, nom, raison_sociale, email, mot_de_passe, siret_tva, adresse,
        stripe_customer_id, subscription_status, subscription_plan, statut, loyalty_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        entrepriseId, nom, raison_sociale, email, hashedPassword, siret_tva || null, adresse,
        stripeCustomerId, 'unpaid', plan, 'actif', 'points'
      ]
    );

    // Create default loyalty config
    const configId = randomUUID();
    await connection.query(
      `INSERT INTO loyalty_config
       (id, entreprise_id, loyalty_type, reward_title, reward_description, points_per_purchase, points_for_reward, points_adding_mode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [configId, entrepriseId, 'points', 'Récompense spéciale', 'Vous avez atteint le nombre de points requis!', 10, 100, 'manual']
    );

    // Create default card customization
    const customizationId = randomUUID();
    await connection.query(
      `INSERT INTO card_customization
       (id, company_id, loyalty_type, primary_color, text_color, accent_color, secondary_color)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customizationId, entrepriseId, 'points', '#1f2937', '#ffffff', '#3b82f6', '#374151']
    );

    await connection.commit();

    // Determine price ID based on plan
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_PRO_YEARLY
      : process.env.STRIPE_PRICE_PRO_MONTHLY;

    if (!priceId) {
      throw new Error(`Stripe price not configured for plan: ${plan}`);
    }

    // Get promo code ID if provided
    let promoCodeId = null;
    let trialDays = 0;

    if (code_promo) {
      try {
        const promoCode = await stripe.promotionCodes.list({
          code: code_promo.toUpperCase(),
          active: true,
          limit: 1
        });

        if (promoCode.data.length === 0) {
          return res.status(400).json({ error: 'Code promo invalide ou expiré' });
        }

        const promo = promoCode.data[0];
        promoCodeId = promo.id;

        // Check if promo gives free trial (1 month free = 30 days trial)
        if (promo.coupon?.percent_off === 100 && promo.coupon?.duration === 'repeating' && promo.coupon?.duration_in_months === 1) {
          trialDays = 30;
        }
      } catch (promoError) {
        logger.error('Promo code validation failed', { error: promoError.message });
        return res.status(400).json({ error: 'Erreur lors de la validation du code promo' });
      }
    }

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        trial_period_days: trialDays,
        metadata: {
          entreprise_id: entrepriseId
        }
      },
      mode: 'subscription',
      ...(promoCodeId && { discounts: [{ promotion_code: promoCodeId }] }),
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pro/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pro/checkout/cancel`,
      metadata: {
        entreprise_id: entrepriseId,
        email: email,
        nom: nom
      }
    });

    res.json({
      success: true,
      checkout_url: checkoutSession.url,
      entreprise_id: entrepriseId,
      message: 'Redirection vers Stripe Checkout'
    });

  } catch (err) {
    await connection.rollback();
    logger.error('Pro signup error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  } finally {
    connection.release();
  }
};

// POST /api/pro/checkout/success - Verify checkout after user returns from Stripe
export const checkoutSuccess = async (req, res) => {
  const { session_id } = req.body;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID manquante' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid' || session.subscription) {
      res.json({
        success: true,
        subscription_id: session.subscription,
        customer_id: session.customer,
        message: 'Paiement reçu, votre compte est en cours d\'activation'
      });
    } else {
      res.status(400).json({ error: 'Paiement non confirmé' });
    }
  } catch (err) {
    logger.error('Checkout verification error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la vérification du paiement' });
  }
};

// POST /api/pro/get-stripe-key - Get publishable key for frontend
export const getStripeKey = (req, res) => {
  if (!STRIPE_PUBLISHABLE_KEY) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }
  res.json({ publishable_key: STRIPE_PUBLISHABLE_KEY });
};

export default {
  proSignup,
  checkoutSuccess,
  getStripeKey
};
