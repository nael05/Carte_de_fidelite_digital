# Stripe Configuration Guide for Fidelyz

## Overview

This guide covers the setup and configuration of Stripe for subscription management in the Fidelyz SaaS platform. The implementation uses the official **Stripe Node.js SDK** with a live Stripe account (no mocks).

## Directory Structure

```
backend/
├── utils/
│   ├── stripeConfig.js          # Stripe initialization & configuration
│   ├── stripeService.js         # High-level subscription management
│   └── webhookHandler.js        # Webhook event processing
├── migrations/
│   ├── 01-add-stripe-subscription-fields.sql  # Entreprises table updates
│   ├── 02-create-invoices-table.sql           # Invoice tracking
│   └── 03-create-email-logs-table.sql         # Email audit trail
└── docs/
    └── STRIPE_SETUP.md          # This file
```

## Step 1: Stripe Account Setup

1. **Create a Stripe Account** (if not already done)
   - Go to https://dashboard.stripe.com/register
   - Complete verification process

2. **Get API Keys**
   - Navigate to: https://dashboard.stripe.com/apikeys
   - You'll find two sets of keys:
     - **Test keys** (start with `sk_test_`, `pk_test_`) — use for development
     - **Live keys** (start with `sk_live_`, `pk_live_`) — use for production
   - Copy both **Secret Key** and **Publishable Key**

3. **Create Webhook Endpoint**
   - Navigate to: https://dashboard.stripe.com/webhooks
   - Click **Add Endpoint**
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to select:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.created`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click **Reveal signing secret** and copy the `whsec_...` key

## Step 2: Environment Configuration

Update `.env` in the backend folder:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXX       # Keep this SECRET!
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXX  # Safe to expose in frontend
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXX     # For webhook verification

# Optional: Stripe Product/Price IDs
# STRIPE_PRODUCT_BASIC=prod_XXXX
# STRIPE_PRICE_BASIC_MONTHLY=price_XXXX
# STRIPE_PRICE_BASIC_YEARLY=price_XXXX
```

> **⚠️ Security Note**: Never commit real keys to version control. Use `.env` and `.env.local` for credentials.

## Step 3: Database Migrations

Run the migration scripts in order:

```bash
# 1. Add Stripe fields to entreprises table
mysql -u root -p loyalty_saas < backend/migrations/01-add-stripe-subscription-fields.sql

# 2. Create invoices table
mysql -u root -p loyalty_saas < backend/migrations/02-create-invoices-table.sql

# 3. Create email_logs table
mysql -u root -p loyalty_saas < backend/migrations/03-create-email-logs-table.sql
```

Or run via the API:
```bash
# From your backend server with nodemon running
POST /api/setup/run-migration
Body: { migration: "01-add-stripe-subscription-fields.sql" }
```

## Step 4: Install Stripe SDK

```bash
cd backend
npm install stripe
```

## API Integration

### Available Functions

#### `stripeService.js`

**Create Customer**
```javascript
import { createStripeCustomer } from './utils/stripeService.js';

const customerId = await createStripeCustomer({
  id: 123,
  nom: 'Acme Corp',
  email: 'billing@acme.fr'
});
```

**Create Subscription**
```javascript
import { createSubscription } from './utils/stripeService.js';

const subscription = await createSubscription(
  entrepriseId,
  'price_xxxxx',  // Stripe price ID (monthly or yearly)
  { trialDays: 14 }  // Optional: free trial
);
```

**Cancel Subscription**
```javascript
// Cancel at end of billing period
await cancelSubscription(entrepriseId, false);

// Cancel immediately
await cancelSubscription(entrepriseId, true);
```

**Update Plan (Upgrade/Downgrade)**
```javascript
const updatedSubscription = await updateSubscriptionPlan(
  entrepriseId,
  'price_new_xxxxx'  // New price ID
);
```

**Get Subscription Details**
```javascript
const subscription = await getSubscription(entrepriseId);
```

**Log Invoice**
```javascript
import { logInvoice } from './utils/stripeService.js';

await logInvoice(stripeInvoiceObject, entrepriseId);
```

**Log Email**
```javascript
import { logEmail } from './utils/stripeService.js';

await logEmail(
  entrepriseId,
  'customer@example.fr',
  'Invoice #INV-001',
  'invoice',
  { invoice_id: 'in_xxxxx' }
);
```

### Example: Create a Subscription Endpoint

```javascript
// backend/routes/apiRoutes.js
import { createSubscription } from '../utils/stripeService.js';

router.post('/api/subscriptions/create', isPro, async (req, res) => {
  try {
    const { priceId, trialDays } = req.body;
    const entrepriseId = req.user.entreprise_id;

    const subscription = await createSubscription(
      entrepriseId,
      priceId,
      { trialDays }
    );

    res.json({
      success: true,
      subscription: subscription.id,
      status: subscription.status
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Webhook Handling

Create a webhook endpoint in your Express routes:

```javascript
// backend/routes/apiRoutes.js
import { verifyWebhookSignature, handleWebhookEvent } from '../utils/webhookHandler.js';
import { STRIPE_WEBHOOK_SECRET } from '../utils/stripeConfig.js';

router.post('/api/stripe/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  const event = verifyWebhookSignature(
    req.rawBody,  // Raw body, not parsed JSON
    signature,
    STRIPE_WEBHOOK_SECRET
  );

  if (!event) {
    return res.status(400).send('Webhook signature verification failed');
  }

  try {
    await handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

> **Important**: Make sure Express is configured to capture the raw body for webhook verification:
> ```javascript
> app.post('/api/stripe/webhook', 
>   express.raw({type: 'application/json'}),
>   webhookHandler
> );
> ```

## Database Schema

### entreprises table (updated)
```sql
- stripe_customer_id       VARCHAR(255) UNIQUE
- stripe_subscription_id   VARCHAR(255) UNIQUE
- subscription_status      ENUM('active', 'trialing', 'past_due', 'canceled', 'unpaid')
- subscription_plan        ENUM('monthly', 'yearly')
- current_period_end       DATETIME
- cancel_at_period_end     BOOLEAN (default: false)
```

### invoices table (new)
```sql
- id                  INT PRIMARY KEY
- entreprise_id       INT (FK)
- stripe_invoice_id   VARCHAR(255) UNIQUE
- amount              DECIMAL(10, 2)
- currency            VARCHAR(3) default 'EUR'
- status              ENUM('draft', 'open', 'paid', 'uncollectible', 'void')
- date                DATETIME
- pdf_url             VARCHAR(500)
- created_at          TIMESTAMP
- updated_at          TIMESTAMP
```

### email_logs table (new)
```sql
- id           INT PRIMARY KEY
- entreprise_id INT (FK)
- recipient    VARCHAR(255)
- subject      VARCHAR(255)
- type         ENUM('invoice', 'receipt', 'payment_failed', 'subscription_canceled', ...)
- sent_at      DATETIME
- status       ENUM('sent', 'bounced', 'failed', 'opened')
- metadata     JSON
- created_at   TIMESTAMP
```

## Testing Stripe Integration

### Test Cards
Stripe provides test card numbers for different scenarios:

| Card Number | Outcome |
|---|---|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Insufficient funds |
| `4000 0000 0000 9995` | Lost card |

Use any future expiry date and any 3-digit CVC.

### Test Mode Flow

1. Start with **test keys** in `.env`
2. Use test card numbers above
3. Webhooks can be tested via Stripe Dashboard or CLI:
   ```bash
   # Using Stripe CLI
   stripe trigger customer.subscription.created
   ```

### CLI Testing (Advanced)
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

## Monitoring & Logging

All operations log to console:
- ✅ Success: `✅ Subscription created: sub_xxxxx`
- ❌ Error: `❌ Error creating subscription: ...`
- ℹ️ Info: `ℹ️ Unhandled event type: charge.refunded`

Check the `email_logs` and `invoices` tables for audit trail.

## Production Checklist

- [ ] Replace test keys with live keys in production `.env`
- [ ] Update webhook URL in Stripe Dashboard to production domain
- [ ] Run all migrations in production database
- [ ] Test subscription creation with real card (small amount)
- [ ] Verify webhook events are received and logged
- [ ] Set up monitoring/alerting for failed payments
- [ ] Configure email notifications for payment failures
- [ ] Document refund process for your support team
- [ ] Enable API request signing in production

## Troubleshooting

### "STRIPE_SECRET_KEY not configured"
- Check `.env` file in `backend/` folder
- Ensure key starts with `sk_` (test) or `sk_live_` (production)
- Never share secret key

### Webhook not received
- Verify URL is accessible from public internet (https only)
- Check Stripe Dashboard → Webhooks → Event delivery logs
- Ensure raw body is captured for signature verification
- Test with Stripe CLI: `stripe listen --forward-to localhost:5000/api/stripe/webhook`

### "Subscription not found"
- Verify `stripe_subscription_id` is saved in database
- Check that subscription was created via `createSubscription()` function
- Review database `entreprises` table

### Payment failures not updating status
- Verify webhook endpoint is registered
- Check webhook signing secret matches `STRIPE_WEBHOOK_SECRET`
- Review console logs for webhook processing errors

## Further Reading

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Node.js SDK](https://github.com/stripe/stripe-node)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Subscription Guide](https://stripe.com/docs/billing/subscriptions/overview)

---

**Last Updated**: 2026-10-27  
**Author**: Claude Haiku 4.5
