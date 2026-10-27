# Stripe Integration - Quick Start

This directory contains the complete Stripe configuration for Fidelyz subscription management.

## 📋 Files Added

### Configuration
- **.env** — Updated with Stripe keys (needs manual setup)
- **.env.example** — Updated template with Stripe configuration

### Core Modules
- **utils/stripeConfig.js** — Stripe SDK initialization
- **utils/stripeService.js** — Subscription management functions
- **utils/webhookHandler.js** — Webhook event processing

### Database Migrations
- **migrations/01-add-stripe-subscription-fields.sql** — Entreprises table updates
- **migrations/02-create-invoices-table.sql** — Invoice tracking table
- **migrations/03-create-email-logs-table.sql** — Email audit table

### Documentation
- **docs/STRIPE_SETUP.md** — Complete configuration guide
- **docs/MIGRATIONS_GUIDE.md** — Database migration instructions

---

## 🚀 Quick Start (5 Steps)

### 1. Install Stripe SDK

```bash
cd backend
npm install stripe
```

### 2. Configure Environment

Edit `.env` and add your Stripe keys:

```env
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX

# Get from: https://dashboard.stripe.com/webhooks
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX
```

### 3. Run Database Migrations

```bash
mysql -u root -p loyalty_saas < migrations/01-add-stripe-subscription-fields.sql
mysql -u root -p loyalty_saas < migrations/02-create-invoices-table.sql
mysql -u root -p loyalty_saas < migrations/03-create-email-logs-table.sql
```

### 4. Add Webhook Endpoint (in Express routes)

```javascript
import { verifyWebhookSignature, handleWebhookEvent } from './utils/webhookHandler.js';
import { STRIPE_WEBHOOK_SECRET } from './utils/stripeConfig.js';

app.post('/api/stripe/webhook', 
  express.raw({type: 'application/json'}),
  async (req, res) => {
    const event = verifyWebhookSignature(
      req.rawBody,
      req.headers['stripe-signature'],
      STRIPE_WEBHOOK_SECRET
    );
    
    if (!event) {
      return res.status(400).send('Invalid signature');
    }
    
    await handleWebhookEvent(event);
    res.json({ received: true });
  }
);
```

### 5. Use in Your Routes

```javascript
import { createSubscription, cancelSubscription } from './utils/stripeService.js';

// Create subscription
router.post('/api/subscriptions/create', async (req, res) => {
  const subscription = await createSubscription(
    entrepriseId,
    'price_xxxxx',
    { trialDays: 14 }
  );
  res.json(subscription);
});

// Cancel subscription
router.post('/api/subscriptions/cancel', async (req, res) => {
  await cancelSubscription(entrepriseId, false);
  res.json({ status: 'canceled' });
});
```

---

## 📖 Documentation

- **Full Setup Guide**: See `docs/STRIPE_SETUP.md`
- **Database Migrations**: See `docs/MIGRATIONS_GUIDE.md`

---

## 🔑 Key Functions

### stripeService.js
- `createStripeCustomer()` — Create customer in Stripe
- `createSubscription()` — Create subscription
- `cancelSubscription()` — Cancel subscription
- `updateSubscriptionPlan()` — Change plan (upgrade/downgrade)
- `getSubscription()` — Get subscription details
- `logInvoice()` — Log invoice to database
- `logEmail()` — Log email transaction

### stripeConfig.js
- Centralized Stripe SDK initialization
- Environment variable validation
- Product/price ID configuration

### webhookHandler.js
- `verifyWebhookSignature()` — Verify Stripe webhook
- `handleWebhookEvent()` — Process webhook events

---

## ✅ Database Schema

**New columns in `entreprises` table**:
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status` (active, trialing, past_due, canceled, unpaid)
- `subscription_plan` (monthly, yearly)
- `current_period_end`
- `cancel_at_period_end`

**New tables**:
- `invoices` — Track all invoices
- `email_logs` — Audit trail for transactional emails

---

## 🧪 Testing

**Test with Stripe test keys**:
1. Use test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any 3-digit CVC
4. Check webhook delivery at: https://dashboard.stripe.com/webhooks

---

## 🔒 Security Notes

- ✅ SDK uses official Stripe client (no mocks)
- ✅ Secret key stored in `.env` only (never committed)
- ✅ Webhook signature verified before processing
- ✅ All operations logged to console
- ✅ Database migrations use foreign keys and constraints

---

## 📞 Support

For detailed configuration and troubleshooting:
- See `docs/STRIPE_SETUP.md`
- [Stripe API Docs](https://stripe.com/docs/api)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)

---

**Status**: ✅ Ready for development  
**Last Updated**: 2026-10-27
