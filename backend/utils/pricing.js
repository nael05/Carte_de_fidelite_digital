import pool from '../db.js';
import { PLAN_KEYS, parsePlanKey, planKey } from './plans.js';

// Clés de plan : monthly / yearly (Pro) et business_monthly / business_yearly.
export const PLANS = PLAN_KEYS;

const ENV_PRICES = {
  monthly: 'STRIPE_PRICE_PRO_MONTHLY',
  yearly: 'STRIPE_PRICE_PRO_YEARLY',
  business_monthly: 'STRIPE_PRICE_BUSINESS_MONTHLY',
  business_yearly: 'STRIPE_PRICE_BUSINESS_YEARLY'
};

const envPriceId = (key) => process.env[ENV_PRICES[key]];

// Prix courant d'un plan : la table pricing_config (modifiable depuis l'admin) prime sur les variables d'environnement.
export const getPriceId = async (key) => {
  if (!PLAN_KEYS.includes(key)) return null;
  const [rows] = await pool.query('SELECT stripe_price_id FROM pricing_config WHERE plan = ?', [key]);
  return rows[0]?.stripe_price_id || envPriceId(key) || null;
};

// Prix d'une offre à partir de son nom et de l'intervalle de facturation.
export const getTierPriceId = (tier, interval) => getPriceId(planKey(tier, interval));

// Offre (pro/business) correspondant à un prix Stripe, y compris un ancien prix archivé : on se base
// sur les métadonnées du prix, puis sur le produit connu de pricing_config, puis sur les variables d'environnement.
export const tierOfPrice = async (price) => {
  if (!price) return 'pro';
  if (price.metadata?.tier === 'business' || price.metadata?.tier === 'pro') return price.metadata.tier;

  const productId = typeof price.product === 'string' ? price.product : price.product?.id;
  const [rows] = await pool.query(
    'SELECT plan FROM pricing_config WHERE stripe_price_id = ? OR (stripe_product_id = ? AND ? IS NOT NULL)',
    [price.id, productId || null, productId || null]
  );
  if (rows[0]) return parsePlanKey(rows[0].plan).tier;

  if ([ENV_PRICES.business_monthly, ENV_PRICES.business_yearly].some((name) => process.env[name] === price.id)) return 'business';
  if (price.lookup_key?.startsWith('fidelyz_business')) return 'business';
  return 'pro';
};

export const getPromoTarget = async (promotionCodeId) => {
  const [rows] = await pool.query(
    'SELECT target FROM promo_codes WHERE stripe_promotion_code_id = ?',
    [promotionCodeId]
  );
  return rows[0]?.target || null;
};
