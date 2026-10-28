import pool from '../db.js';

export const PLANS = ['monthly', 'yearly'];

const envPriceId = (plan) =>
  plan === 'yearly' ? process.env.STRIPE_PRICE_PRO_YEARLY : process.env.STRIPE_PRICE_PRO_MONTHLY;

// Prix courant d'un plan : la table pricing_config (modifiable depuis l'admin) prime sur les variables d'environnement.
export const getPriceId = async (plan) => {
  const [rows] = await pool.query('SELECT stripe_price_id FROM pricing_config WHERE plan = ?', [plan]);
  return rows[0]?.stripe_price_id || envPriceId(plan) || null;
};

export const getPromoTarget = async (promotionCodeId) => {
  const [rows] = await pool.query(
    'SELECT target FROM promo_codes WHERE stripe_promotion_code_id = ?',
    [promotionCodeId]
  );
  return rows[0]?.target || null;
};
