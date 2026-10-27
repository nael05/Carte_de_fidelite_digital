// Crée en mode TEST : produit Fidelyz Pro, prix mensuel/annuel et code promo « 1 mois offert ».
// Usage : STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-test-setup.mjs
import 'dotenv/config';
import Stripe from 'stripe';

const key = process.env.STRIPE_SECRET_KEY || '';
if (!key.startsWith('sk_test_')) {
  console.error('Clé de TEST requise (sk_test_...). Ce script refuse de tourner avec une clé live ou absente.');
  process.exit(1);
}
const stripe = new Stripe(key);

const product = await stripe.products.create({ name: 'Fidelyz Pro (test)' });
const monthly = await stripe.prices.create({ product: product.id, currency: 'eur', unit_amount: 2900, recurring: { interval: 'month' } });
const yearly = await stripe.prices.create({ product: product.id, currency: 'eur', unit_amount: 29000, recurring: { interval: 'year' } });
const coupon = await stripe.coupons.create({ percent_off: 100, duration: 'once', name: '1 mois offert' });
const promo = await stripe.promotionCodes.create({ coupon: coupon.id, code: 'MOISOFFERT' });

console.log('\nAjoutez à backend/.env :');
console.log(`STRIPE_PRICE_PRO_MONTHLY=${monthly.id}`);
console.log(`STRIPE_PRICE_PRO_YEARLY=${yearly.id}`);
console.log(`\nCode promo de test créé : ${promo.code}`);
