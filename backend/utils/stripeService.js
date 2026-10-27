/**
 * Stripe Service Module
 * High-level functions for subscription management using the official Stripe SDK
 *
 * All functions interact with a real Stripe account (not mocked)
 */

import stripe from './stripeConfig.js';
import pool from '../db.js';

/**
 * Create a Stripe customer for an enterprise
 * @param {Object} entrepriseData - Enterprise info { id, nom, email }. id can be null for new signups
 * @returns {Promise<string>} Stripe customer ID
 */
export const createStripeCustomer = async (entrepriseData) => {
  try {
    const customer = await stripe.customers.create({
      email: entrepriseData.email,
      name: entrepriseData.nom,
      ...(entrepriseData.id && {
        metadata: {
          entreprise_id: entrepriseData.id.toString()
        }
      })
    });

    // If entrepriseData.id is provided, save to database
    if (entrepriseData.id) {
      const connection = await pool.getConnection();
      try {
        await connection.query(
          'UPDATE entreprises SET stripe_customer_id = ? WHERE id = ?',
          [customer.id, entrepriseData.id]
        );
      } finally {
        connection.release();
      }
    }

    console.log(`✅ Stripe customer created: ${customer.id}` + (entrepriseData.id ? ` for entreprise ${entrepriseData.id}` : ''));
    return customer.id;
  } catch (error) {
    console.error('❌ Error creating Stripe customer:', error.message);
    throw error;
  }
};

/**
 * Create a subscription for an enterprise
 * @param {number} entrepriseId - Enterprise ID
 * @param {string} priceId - Stripe price ID (e.g., price_xxxx)
 * @param {Object} options - Additional options { trialDays, metadata }
 * @returns {Promise<Object>} Subscription object
 */
export const createSubscription = async (entrepriseId, priceId, options = {}) => {
  try {
    // Get or create Stripe customer ID
    const connection = await pool.getConnection();
    const [[entreprise]] = await connection.execute(
      'SELECT id, nom, email, stripe_customer_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (!entreprise) {
      throw new Error(`Entreprise ${entrepriseId} not found`);
    }

    let customerId = entreprise.stripe_customer_id;
    if (!customerId) {
      customerId = await createStripeCustomer(entreprise);
    }

    // Create subscription
    const subscriptionData = {
      customer: customerId,
      items: [{ price: priceId }],
      metadata: {
        entreprise_id: entrepriseId.toString()
      },
      ...options
    };

    if (options.trialDays) {
      subscriptionData.trial_period_days = options.trialDays;
    }

    const subscription = await stripe.subscriptions.create(subscriptionData);

    // Update database with subscription info
    await connection.execute(
      `UPDATE entreprises
       SET stripe_subscription_id = ?,
           subscription_status = ?,
           subscription_plan = ?,
           current_period_end = ?
       WHERE id = ?`,
      [
        subscription.id,
        subscription.status,
        getPlanType(priceId),
        new Date(subscription.current_period_end * 1000),
        entrepriseId
      ]
    );

    connection.release();
    console.log(`✅ Subscription created: ${subscription.id} for entreprise ${entrepriseId}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error creating subscription:', error.message);
    throw error;
  }
};

/**
 * Cancel a subscription (at end of period or immediately)
 * @param {number} entrepriseId - Enterprise ID
 * @param {boolean} immediately - If true, cancel immediately. If false, cancel at period end
 * @returns {Promise<Object>} Updated subscription
 */
export const cancelSubscription = async (entrepriseId, immediately = false) => {
  try {
    const connection = await pool.getConnection();
    const [[entreprise]] = await connection.execute(
      'SELECT stripe_subscription_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (!entreprise || !entreprise.stripe_subscription_id) {
      throw new Error(`No subscription found for entreprise ${entrepriseId}`);
    }

    const subscription = await stripe.subscriptions.update(
      entreprise.stripe_subscription_id,
      immediately ?
        { metadata: { canceled_at: new Date().toISOString() } } :
        { cancel_at_period_end: true }
    );

    if (immediately) {
      await stripe.subscriptions.cancel(entreprise.stripe_subscription_id);
    }

    // Update database
    await connection.execute(
      `UPDATE entreprises
       SET subscription_status = ?, cancel_at_period_end = ?
       WHERE id = ?`,
      [immediately ? 'canceled' : subscription.status, immediately ? false : true, entrepriseId]
    );

    connection.release();
    console.log(`✅ Subscription canceled: ${entreprise.stripe_subscription_id}`);
    return subscription;
  } catch (error) {
    console.error('❌ Error canceling subscription:', error.message);
    throw error;
  }
};

/**
 * Get subscription details
 * @param {number} entrepriseId - Enterprise ID
 * @returns {Promise<Object>} Subscription object from Stripe
 */
export const getSubscription = async (entrepriseId) => {
  try {
    const connection = await pool.getConnection();
    const [[entreprise]] = await connection.execute(
      'SELECT stripe_subscription_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );
    connection.release();

    if (!entreprise || !entreprise.stripe_subscription_id) {
      return null;
    }

    return await stripe.subscriptions.retrieve(entreprise.stripe_subscription_id);
  } catch (error) {
    console.error('❌ Error retrieving subscription:', error.message);
    throw error;
  }
};

/**
 * Update subscription plan (upgrade/downgrade)
 * @param {number} entrepriseId - Enterprise ID
 * @param {string} newPriceId - New Stripe price ID
 * @returns {Promise<Object>} Updated subscription
 */
export const updateSubscriptionPlan = async (entrepriseId, newPriceId) => {
  try {
    const connection = await pool.getConnection();
    const [[entreprise]] = await connection.execute(
      'SELECT stripe_subscription_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (!entreprise || !entreprise.stripe_subscription_id) {
      throw new Error(`No subscription found for entreprise ${entrepriseId}`);
    }

    // Get current subscription items
    const subscription = await stripe.subscriptions.retrieve(
      entreprise.stripe_subscription_id
    );

    // Update the first item to the new price
    const subscription_updated = await stripe.subscriptions.update(
      entreprise.stripe_subscription_id,
      {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: 'create_prorations'
      }
    );

    // Update database
    await connection.execute(
      `UPDATE entreprises
       SET subscription_plan = ?
       WHERE id = ?`,
      [getPlanType(newPriceId), entrepriseId]
    );

    connection.release();
    console.log(`✅ Subscription updated: ${entreprise.stripe_subscription_id}`);
    return subscription_updated;
  } catch (error) {
    console.error('❌ Error updating subscription:', error.message);
    throw error;
  }
};

/**
 * Log an invoice in the database
 * @param {Object} stripeInvoice - Stripe invoice object
 * @param {number} entrepriseId - Enterprise ID
 */
export const logInvoice = async (stripeInvoice, entrepriseId) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      `INSERT INTO invoices
       (entreprise_id, stripe_invoice_id, amount, currency, status, date, pdf_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        entrepriseId,
        stripeInvoice.id,
        stripeInvoice.amount_paid || 0,
        stripeInvoice.currency || 'eur',
        stripeInvoice.status,
        new Date(stripeInvoice.created * 1000),
        stripeInvoice.hosted_invoice_url || null
      ]
    );
    connection.release();
    console.log(`✅ Invoice logged: ${stripeInvoice.id}`);
  } catch (error) {
    console.error('❌ Error logging invoice:', error.message);
    throw error;
  }
};

/**
 * Log an email transaction
 * @param {number} entrepriseId - Enterprise ID
 * @param {string} recipient - Email recipient
 * @param {string} subject - Email subject
 * @param {string} type - Email type (invoice, receipt, etc.)
 * @param {Object} metadata - Additional metadata
 */
export const logEmail = async (entrepriseId, recipient, subject, type, metadata = {}) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute(
      `INSERT INTO email_logs
       (entreprise_id, recipient, subject, type, status, metadata)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [entrepriseId, recipient, subject, type, metadata.error ? 'failed' : 'sent', JSON.stringify(metadata)]
    );
    connection.release();
    console.log(`✅ Email logged: ${type} to ${recipient}`);
  } catch (error) {
    console.error('❌ Error logging email:', error.message);
    throw error;
  }
};

/**
 * Helper: Determine plan type from price ID
 * @param {string} priceId - Stripe price ID
 * @returns {string} 'monthly' or 'yearly'
 */
const getPlanType = (priceId) => {
  if (priceId.includes('yearly') || priceId.includes('year')) {
    return 'yearly';
  }
  return 'monthly';
};

export default {
  createStripeCustomer,
  createSubscription,
  cancelSubscription,
  getSubscription,
  updateSubscriptionPlan,
  logInvoice,
  logEmail
};
