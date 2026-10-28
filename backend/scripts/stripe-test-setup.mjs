// Crée en mode TEST : prix Pro et Business (mensuel et annuel -20 %) et code promo « 1 mois offert » (rejouable).
// Usage : DOTENV_CONFIG_PATH=.env.test node scripts/stripe-test-setup.mjs
import 'dotenv/config';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';
if (!key.startsWith('sk_test_')) {
  console.error('Clé de TEST requise (sk_test_...). Ce script refuse de tourner avec une clé live ou absente.');
  process.exit(1);
}
const stripe = new Stripe(key, { apiVersion: '2024-12-18.acacia' });

// Crée le prix, ou le remplace (nouveau prix + ancien archivé) si le montant a changé.
const ensurePrice = async (lookup_key, unit_amount, interval, productId, tier) => {
  const found = (await stripe.prices.list({ lookup_keys: [lookup_key], active: true, limit: 1 })).data[0];
  if (found && found.unit_amount === unit_amount) return found;
  const created = await stripe.prices.create({
    product: found ? found.product : productId, currency: 'eur', unit_amount, lookup_key,
    transfer_lookup_key: !!found, recurring: { interval }, metadata: { tier }
  });
  if (found) await stripe.prices.update(found.id, { active: false });
  return created;
};

const productFor = async (lookupKey, name) => {
  const existing = await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 });
  return existing.data[0]?.product || (await stripe.products.create({ name })).id;
};

// Pro : 29 €/mois, annuel = -20 % ; Business : 59 €/mois, annuel = -20 %
const proProduct = await productFor('fidelyz_pro_monthly', 'Fidelyz Pro (test)');
const businessProduct = await productFor('fidelyz_business_monthly', 'Fidelyz Business (test)');
const monthly = await ensurePrice('fidelyz_pro_monthly', 2900, 'month', proProduct, 'pro');
const yearly = await ensurePrice('fidelyz_pro_yearly', 27840, 'year', proProduct, 'pro');
const businessMonthly = await ensurePrice('fidelyz_business_monthly', 5900, 'month', businessProduct, 'business');
const businessYearly = await ensurePrice('fidelyz_business_yearly', 56640, 'year', businessProduct, 'business');

let coupon;
try { coupon = await stripe.coupons.retrieve('moisoffert'); }
catch { coupon = await stripe.coupons.create({ id: 'moisoffert', percent_off: 100, duration: 'once', name: '1 mois offert' }); }

let promo = (await stripe.promotionCodes.list({ code: 'MOISOFFERT', limit: 1 })).data[0];
if (!promo) promo = await stripe.promotionCodes.create({ coupon: coupon.id, code: 'MOISOFFERT' });

console.log('\nAjoutez à backend/.env.test :');
console.log(`STRIPE_PRICE_PRO_MONTHLY=${monthly.id}`);
console.log(`STRIPE_PRICE_PRO_YEARLY=${yearly.id}`);
console.log(`STRIPE_PRICE_BUSINESS_MONTHLY=${businessMonthly.id}`);
console.log(`STRIPE_PRICE_BUSINESS_YEARLY=${businessYearly.id}`);
console.log(`\nCode promo de test : ${promo.code}`);
