-- Stripe: champs abonnement + informations légales d'inscription (MySQL 8)
SET NAMES utf8mb4;

ALTER TABLE `entreprises`
  ADD COLUMN `raison_sociale` VARCHAR(255) NULL,
  ADD COLUMN `siret_tva` VARCHAR(64) NULL,
  ADD COLUMN `adresse` VARCHAR(500) NULL,
  ADD COLUMN `stripe_customer_id` VARCHAR(255) NULL,
  ADD COLUMN `stripe_subscription_id` VARCHAR(255) NULL,
  ADD COLUMN `subscription_status` ENUM('active','trialing','past_due','canceled','unpaid') NOT NULL DEFAULT 'unpaid',
  ADD COLUMN `subscription_plan` ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  ADD COLUMN `current_period_end` DATETIME NULL,
  ADD COLUMN `cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0,
  ADD UNIQUE KEY `uq_entreprises_stripe_customer` (`stripe_customer_id`),
  ADD UNIQUE KEY `uq_entreprises_stripe_subscription` (`stripe_subscription_id`),
  ADD KEY `idx_subscription_status` (`subscription_status`);

-- Comptes créés avant la mise en place du paiement : accès conservé
UPDATE `entreprises` SET `subscription_status` = 'active' WHERE `stripe_customer_id` IS NULL;
