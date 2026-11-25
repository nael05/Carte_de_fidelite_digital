/**
 * Configuration Stripe.
 * Sans STRIPE_SECRET_KEY, le serveur démarre quand même : l'offre gratuite fonctionne et toute
 * opération de paiement échoue proprement avec une erreur « Stripe non configuré » (code stripe_not_configured).
 */

import Stripe from 'stripe';
import 'dotenv/config';

const SECRET_KEY = (process.env.STRIPE_SECRET_KEY || '').trim();

export const isStripeConfigured = () => SECRET_KEY.startsWith('sk_') || SECRET_KEY.startsWith('rk_');

export class StripeNotConfiguredError extends Error {
  constructor() {
    super('Stripe non configuré : ajoutez STRIPE_SECRET_KEY dans backend/.env');
    this.code = 'stripe_not_configured';
    this.statusCode = 503;
  }
}

// Remplaçant de l'SDK : n'importe quel appel (stripe.customers.create(...), etc.) renvoie une promesse rejetée.
const disabledStripe = () => {
  const handler = {
    get: (target, prop) => (prop === 'then' ? undefined : new Proxy(() => {}, handler)),
    apply: () => {
      const promise = Promise.reject(new StripeNotConfiguredError());
      promise.catch(() => {}); // évite un avertissement si l'appelant n'attend pas la promesse
      return promise;
    }
  };
  return new Proxy(() => {}, handler);
};

const stripe = isStripeConfigured()
  ? new Stripe(SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      appInfo: { name: 'Fidelyz', version: '1.0.0', url: 'https://fidelyzapp.fr' }
    })
  : disabledStripe();

if (!isStripeConfigured()) {
  console.warn('⚠️ STRIPE_SECRET_KEY absente : paiements désactivés (seule l\'offre gratuite est disponible).');
}

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export { stripe };
export default stripe;
