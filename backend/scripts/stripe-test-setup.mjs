// Crée en mode TEST : prix mensuel/annuel Fidelyz Pro et code promo « 1 mois offert » (rejouable).
// Usage : DOTENV_CONFIG_PATH=.env.test node scripts/stripe-test-setup.mjs
import 'dotenv/config';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';
if (!key.startsWith('sk_test_')) {
  console.error('Clé de TEST requise (sk_test_...). Ce script refuse de tourner avec une clé live ou absente.');
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });

const ensurePrice = async (lookup_key, unit_amount, interval, productId) => {
  const found = await stripe.prices.list({ lookup_keys: [lookup_key], active: true, limit: 1 });
  if (found.data[0]) return found.data[0];
  return stripe.prices.create({
    product: productId, currency: 'eur', unit_amount, lookup_key,
    recurring: { interval }
  });
};

const existing = await stripe.prices.list({ lookup_keys: ['fidelyz_pro_monthly'], active: true, limit: 1 });
const productId = existing.data[0]?.product
  || (await stripe.products.create({ name: 'Fidelyz Pro (test)' })).id;

const monthly = await ensurePrice('fidelyz_pro_monthly', 2900, 'month', productId);
const yearly = await ensurePrice('fidelyz_pro_yearly', 29000, 'year', productId);

let coupon;
try { coupon = await stripe.coupons.retrieve('moisoffert'); }
catch { coupon = await stripe.coupons.create({ id: 'moisoffert', percent_off: 100, duration: 'once', name: '1 mois offert' }); }

let promo = (await stripe.promotionCodes.list({ code: 'MOISOFFERT', limit: 1 })).data[0];
if (!promo) promo = await stripe.promotionCodes.create({ coupon: coupon.id, code: 'MOISOFFERT' });

console.log('\nAjoutez à backend/.env.test :');
console.log(`STRIPE_PRICE_PRO_MONTHLY=${monthly.id}`);
console.log(`STRIPE_PRICE_PRO_YEARLY=${yearly.id}`);
console.log(`\nCode promo de test : ${promo.code}`);
