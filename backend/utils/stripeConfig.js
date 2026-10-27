/**
 * Stripe Configuration and Initialization
 * Centralizes Stripe SDK setup with environment variables
 *
 * Uses official Stripe Node.js SDK with production Stripe account
 */

import Stripe from 'stripe';
import 'dotenv/config';

// Validate required environment variables
const validateStripeConfig = () => {
  const required = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`⚠️ Missing Stripe environment variables: ${missing.join(', ')}`);
    console.warn('Stripe features will be disabled until these are configured.');
  }
};

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-15.acacia', // Latest stable API version
  appInfo: {
    name: 'Fidelyz',
    version: '1.0.0',
    url: 'https://fidelyzapp.fr'
  }
});

// Export publishable key for frontend
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';

// Export webhook secret for signature verification
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Validate on module load
validateStripeConfig();

/**
 * Stripe Products and Plans Configuration
 * These should be created in Stripe Dashboard and their IDs stored as env vars
 * OR created programmatically in a setup script
 */
export const STRIPE_PRODUCTS = {
  // Example pricing tiers (IDs should match actual Stripe product IDs)
  BASIC: {
    productId: process.env.STRIPE_PRODUCT_BASIC || 'prod_basic',
    plans: {
      monthly: process.env.STRIPE_PRICE_BASIC_MONTHLY || 'price_basic_monthly',
      yearly: process.env.STRIPE_PRICE_BASIC_YEARLY || 'price_basic_yearly'
    }
  },
  PROFESSIONAL: {
    productId: process.env.STRIPE_PRODUCT_PROFESSIONAL || 'prod_professional',
    plans: {
      monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_professional_monthly',
      yearly: process.env.STRIPE_PRICE_PROFESSIONAL_YEARLY || 'price_professional_yearly'
    }
  },
  ENTERPRISE: {
    productId: process.env.STRIPE_PRODUCT_ENTERPRISE || 'prod_enterprise',
    plans: {
      monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
      yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly'
    }
  }
};

// Pro plan pricing (used in signup)
export const PRO_PLANS = {
  monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
  yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly'
};

export { stripe, validateStripeConfig };
export default stripe;
