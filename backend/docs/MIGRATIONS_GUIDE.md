# Database Migrations Guide - Stripe Integration

## Overview

Three new migrations are required to prepare the database for Stripe subscription management:

1. **01-add-stripe-subscription-fields.sql** — Add Stripe fields to `entreprises` table
2. **02-create-invoices-table.sql** — Create `invoices` table for invoice tracking
3. **03-create-email-logs-table.sql** — Create `email_logs` table for email audit trail

## Migration Details

### 1. Add Stripe Subscription Fields

**File**: `backend/migrations/01-add-stripe-subscription-fields.sql`

**Changes to `entreprises` table**:
- `stripe_customer_id` (VARCHAR 255) — Unique Stripe customer identifier
- `stripe_subscription_id` (VARCHAR 255) — Unique Stripe subscription identifier
- `subscription_status` (ENUM) — One of: `active`, `trialing`, `past_due`, `canceled`, `unpaid`
- `subscription_plan` (ENUM) — Either `monthly` or `yearly`
- `current_period_end` (DATETIME) — When the current billing period ends
- `cancel_at_period_end` (BOOLEAN) — If true, subscription cancels at period end instead of immediately

**Indexes created**:
- `idx_stripe_customer_id` on `stripe_customer_id`
- `idx_stripe_subscription_id` on `stripe_subscription_id`
- `idx_subscription_status` on `subscription_status`

### 2. Create Invoices Table

**File**: `backend/migrations/02-create-invoices-table.sql`

**New table: `invoices`**

| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY | Auto-increment ID |
| entreprise_id | INT FK | Foreign key to `entreprises(id)` |
| stripe_invoice_id | VARCHAR 255 UNIQUE | Stripe invoice identifier |
| amount | DECIMAL(10,2) | Invoice amount (cents) |
| currency | VARCHAR(3) | Currency code (default: EUR) |
| status | ENUM | draft, open, paid, uncollectible, void |
| date | DATETIME | Invoice date |
| pdf_url | VARCHAR(500) | URL to PDF invoice from Stripe |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Record last update time |

**Indexes created**:
- `idx_invoices_status` on `status`
- `idx_invoices_created_at` on `created_at`

### 3. Create Email Logs Table

**File**: `backend/migrations/03-create-email-logs-table.sql`

**New table: `email_logs`**

| Column | Type | Description |
|--------|------|-------------|
| id | INT PRIMARY KEY | Auto-increment ID |
| entreprise_id | INT FK | Foreign key to `entreprises(id)` |
| recipient | VARCHAR(255) | Email recipient address |
| subject | VARCHAR(255) | Email subject line |
| type | ENUM | invoice, receipt, payment_failed, subscription_canceled, subscription_started, renewal_reminder, other |
| sent_at | DATETIME | When email was sent |
| status | ENUM | sent, bounced, failed, opened |
| metadata | JSON | Additional data (invoice_id, error, etc.) |
| created_at | TIMESTAMP | Record creation time |

**Indexes created**:
- `idx_email_logs_recipient` on `recipient`
- `idx_email_logs_status` on `status`
- `idx_email_logs_created_at` on `created_at`

## How to Run Migrations

### Option A: MySQL Command Line

```bash
cd backend

# Run each migration in order
mysql -u root -p loyalty_saas < migrations/01-add-stripe-subscription-fields.sql
mysql -u root -p loyalty_saas < migrations/02-create-invoices-table.sql
mysql -u root -p loyalty_saas < migrations/03-create-email-logs-table.sql
```

### Option B: SQL Client (MySQL Workbench, DBeaver, etc.)

1. Open your SQL client
2. Connect to `loyalty_saas` database
3. Copy and paste each migration file's contents
4. Execute in order

### Option C: Node.js Script (If API Endpoint Exists)

```javascript
// Example: Run migration via API
async function runMigrations() {
  const migrations = [
    '01-add-stripe-subscription-fields.sql',
    '02-create-invoices-table.sql',
    '03-create-email-logs-table.sql'
  ];

  for (const migration of migrations) {
    const response = await fetch('http://localhost:5000/api/setup/run-migration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer <admin-token>'
      },
      body: JSON.stringify({ migration })
    });
    console.log(`${migration}: ${response.ok ? '✅' : '❌'}`);
  }
}
```

## Verification

After running all migrations, verify the changes:

```sql
-- Check entreprises table structure
DESC entreprises;

-- Should include these new columns:
-- | stripe_customer_id       | varchar(255) |
-- | stripe_subscription_id   | varchar(255) |
-- | subscription_status      | enum(...)    |
-- | subscription_plan        | enum(...)    |
-- | current_period_end       | datetime     |
-- | cancel_at_period_end     | tinyint(1)   |

-- Check new tables exist
SHOW TABLES LIKE 'invoices';  -- Should return: invoices
SHOW TABLES LIKE 'email_logs'; -- Should return: email_logs

-- Check table structures
DESC invoices;
DESC email_logs;
```

## Rollback (If Needed)

If you need to rollback these migrations:

```sql
-- Rollback 3: Drop email_logs table
DROP TABLE IF EXISTS email_logs;

-- Rollback 2: Drop invoices table
DROP TABLE IF EXISTS invoices;

-- Rollback 1: Remove Stripe columns from entreprises
ALTER TABLE entreprises 
DROP COLUMN IF EXISTS stripe_customer_id,
DROP COLUMN IF EXISTS stripe_subscription_id,
DROP COLUMN IF EXISTS subscription_status,
DROP COLUMN IF EXISTS subscription_plan,
DROP COLUMN IF EXISTS current_period_end,
DROP COLUMN IF EXISTS cancel_at_period_end;
```

## Notes

- ✅ All migrations use `IF NOT EXISTS` or `IF NOT EXISTS` clauses for safety
- ✅ Foreign key constraints are properly configured with `ON DELETE CASCADE`
- ✅ Indexes are created for common query patterns (filtering by status, date, etc.)
- ✅ All tables use `utf8mb4` charset for full UTF-8 support
- ⚠️ Run migrations in order — do not skip or reorder
- ⚠️ Make a database backup before running migrations on production

## Timeline

These migrations should be run:
- **Development**: Immediately to set up local environment
- **Staging**: Before Stripe testing begins
- **Production**: During maintenance window before go-live

---

**Created**: 2026-10-27  
**Status**: Ready for implementation
