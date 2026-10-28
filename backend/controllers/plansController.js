import { stripe } from '../utils/stripeConfig.js';
import { PLANS, getPriceId } from '../utils/pricing.js';
import { FREE_CLIENT_LIMIT, PUSH_RULES } from '../utils/plans.js';
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
      prices[key] = { amount: price.unit_amount / 100, currency: price.currency };
    } catch (err) {
      logger.warn('Prix public illisible', { plan: key, error: err.message });
    }
  }));
  cache = { at: Date.now(), prices };
  return prices;
};

// GET /api/plans — offres et tarifs courants (publics, utilisés par la page d'accueil et l'inscription).
export const getPublicPlans = async (req, res) => {
  const prices = await loadPrices();
  res.json({
    free_client_limit: FREE_CLIENT_LIMIT,
    push_monthly_quota: PUSH_RULES.monthlyQuota,
    prices: {
      pro: { monthly: prices.monthly || null, yearly: prices.yearly || null },
      business: { monthly: prices.business_monthly || null, yearly: prices.business_yearly || null }
    }
  });
};

export default { getPublicPlans };
