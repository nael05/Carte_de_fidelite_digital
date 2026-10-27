/**
 * Stripe Webhook Handler
 * Processes events from Stripe webhook endpoint
 *
 * Webhook events to handle:
 * - customer.created
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.created
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import stripe from './stripeConfig.js';
import { logInvoice, logEmail } from './stripeService.js';
import pool from '../db.js';

/**
 * Verify webhook signature
 * @param {string} body - Raw request body
 * @param {string} signature - Stripe signature header
 * @param {string} secret - Webhook secret
 * @returns {Object|null} Parsed event or null if invalid
 */
export const verifyWebhookSignature = (body, signature, secret) => {
  try {
    if (!secret) {
      console.warn('⚠️ Webhook secret not configured');
      return null;
    }
    return stripe.webhooks.constructEvent(body, signature, secret);
  } catch (error) {
    console.error('❌ Webhook signature verification failed:', error.message);
    return null;
  }
};

/**
 * Handle webhook event
 * @param {Object} event - Stripe webhook event
 */
export const handleWebhookEvent = async (event) => {
  try {
    switch (event.type) {
      // Subscription events
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      // Invoice events
      case 'invoice.created':
        await handleInvoiceCreated(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;

      // Payment intent events
      case 'payment_intent.succeeded':
        console.log(`ℹ️ Payment intent succeeded: ${event.data.object.id}`);
        break;

      case 'payment_intent.payment_failed':
        console.log(`⚠️ Payment intent failed: ${event.data.object.id}`);
        break;

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('❌ Error handling webhook event:', error.message);
    throw error;
  }
};

/**
 * Handle subscription.created event
 */
const handleSubscriptionCreated = async (subscription) => {
  try {
    const connection = await pool.getConnection();
    const entrepriseId = subscription.metadata?.entreprise_id;

    if (!entrepriseId) {
      console.warn('⚠️ No entreprise_id in subscription metadata');
      connection.release();
      return;
    }

    await connection.execute(
      `UPDATE entreprises
       SET stripe_subscription_id = ?,
           subscription_status = ?,
           current_period_end = ?
       WHERE id = ?`,
      [
        subscription.id,
        subscription.status,
        new Date(subscription.current_period_end * 1000),
        entrepriseId
      ]
    );

    connection.release();
    console.log(`✅ Subscription created: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error handling subscription.created:', error.message);
  }
};

/**
 * Handle subscription.updated event
 */
const handleSubscriptionUpdated = async (subscription) => {
  try {
    const connection = await pool.getConnection();
    const entrepriseId = subscription.metadata?.entreprise_id;

    if (!entrepriseId) {
      console.warn('⚠️ No entreprise_id in subscription metadata');
      connection.release();
      return;
    }

    await connection.execute(
      `UPDATE entreprises
       SET subscription_status = ?,
           current_period_end = ?,
           cancel_at_period_end = ?
       WHERE id = ?`,
      [
        subscription.status,
        new Date(subscription.current_period_end * 1000),
        subscription.cancel_at_period_end || false,
        entrepriseId
      ]
    );

    connection.release();
    console.log(`✅ Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error handling subscription.updated:', error.message);
  }
};

/**
 * Handle subscription.deleted event
 */
const handleSubscriptionDeleted = async (subscription) => {
  try {
    const connection = await pool.getConnection();
    const entrepriseId = subscription.metadata?.entreprise_id;

    if (!entrepriseId) {
      console.warn('⚠️ No entreprise_id in subscription metadata');
      connection.release();
      return;
    }

    await connection.execute(
      `UPDATE entreprises
       SET subscription_status = 'canceled'
       WHERE id = ?`,
      [entrepriseId]
    );

    connection.release();
    console.log(`✅ Subscription deleted: ${subscription.id}`);
  } catch (error) {
    console.error('❌ Error handling subscription.deleted:', error.message);
  }
};

/**
 * Handle invoice.created event
 */
const handleInvoiceCreated = async (invoice) => {
  try {
    const connection = await pool.getConnection();
    const [[subscription]] = await connection.execute(
      'SELECT stripe_subscription_id FROM entreprises WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    connection.release();

    if (subscription) {
      // Invoice will be tracked when payment_succeeded event fires
      console.log(`ℹ️ Invoice created: ${invoice.id}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice.created:', error.message);
  }
};

/**
 * Handle invoice.payment_succeeded event
 */
const handleInvoicePaymentSucceeded = async (invoice) => {
  try {
    const connection = await pool.getConnection();
    const [[entreprise]] = await connection.execute(
      'SELECT id FROM entreprises WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    connection.release();

    if (entreprise) {
      // Log the invoice
      await logInvoice(invoice, entreprise.id);

      // Log email notification
      const customerEmail = invoice.customer_email || invoice.customer;
      if (customerEmail) {
        await logEmail(
          entreprise.id,
          customerEmail,
          `Invoice #${invoice.number} - €${(invoice.amount_paid / 100).toFixed(2)}`,
          'invoice',
          { invoice_id: invoice.id, amount: invoice.amount_paid }
        );
      }

      console.log(`✅ Invoice payment succeeded: ${invoice.id}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice.payment_succeeded:', error.message);
  }
};

/**
 * Handle invoice.payment_failed event
 */
const handleInvoicePaymentFailed = async (invoice) => {
  try {
    const connection = await pool.getConnection();
    const [[entreprise]] = await connection.execute(
      'SELECT id FROM entreprises WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    connection.release();

    if (entreprise) {
      // Update subscription status
      const connection2 = await pool.getConnection();
      await connection2.execute(
        'UPDATE entreprises SET subscription_status = ? WHERE id = ?',
        ['past_due', entreprise.id]
      );
      connection2.release();

      // Log email notification
      const customerEmail = invoice.customer_email || invoice.customer;
      if (customerEmail) {
        await logEmail(
          entreprise.id,
          customerEmail,
          'Payment failed - Action required',
          'payment_failed',
          { invoice_id: invoice.id, amount: invoice.amount_due }
        );
      }

      console.log(`⚠️ Invoice payment failed: ${invoice.id}`);
    }
  } catch (error) {
    console.error('❌ Error handling invoice.payment_failed:', error.message);
  }
};

export default {
  verifyWebhookSignature,
  handleWebhookEvent
};
