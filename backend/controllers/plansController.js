import { stripe } from '../utils/stripeConfig.js';
import { PLANS, getPriceId } from '../utils/pricing.js';
import { FREE_CLIENT_LIMIT, PUSH_RULES, DEFAULT_PRICES_CENTS } from '../utils/plans.js';
import logger from '../utils/logger.js';

const CACHE_MS = 5 * 60 * 1000;
let cache = { at: 0, prices: null };

const loadPrices = async () => {
  if (cache.prices && Date.now() - cache.at < CACHE_MS) return cache.prices;
  const prices = {};
  await Promise.all(PLANS.map(async (key) => {
    try {
      const id = await getPriceId(key);
      if (!id) return;
      const price = await stripe.prices.retrieve(id);
      prices[key] = { amount: price.unit_amount / 100, currency: price.currency, tax_included: price.tax_behavior !== 'exclusive' };
    } catch (err) {
      logger.warn('Prix public illisible', { plan: key, error: err.message });
    }
  }));
  cache = { at: Date.now(), prices };
  return prices;
};

const fallback = (key) => ({ amount: DEFAULT_PRICES_CENTS[key] / 100, currency: 'eur', tax_included: true, configured: false });

// GET /api/plans — offres et tarifs courants TTC (publics, utilisés par la page d'accueil et l'inscription).
export const getPublicPlans = async (req, res) => {
  const loaded = await loadPrices();
  const prices = Object.fromEntries(PLANS.map((key) => [key, loaded[key] || fallback(key)]));
  res.json({
    tax_included: true,
    free_client_limit: FREE_CLIENT_LIMIT,
    push_daily_limit: PUSH_RULES.dailyLimit,
    prices: {
      pro: { monthly: prices.monthly || null, yearly: prices.yearly || null },
      business: { monthly: prices.business_monthly || null, yearly: prices.business_yearly || null }
    }
  });
};

export default { getPublicPlans };
