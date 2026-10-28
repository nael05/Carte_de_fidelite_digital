-- Outils admin : tarifs Stripe, préavis de changement de prix, codes promo, types d'e-mail (MySQL 8)
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `pricing_config` (
  `plan` ENUM('monthly','yearly') NOT NULL,
  `stripe_product_id` VARCHAR(255) NULL,
  `stripe_price_id` VARCHAR(255) NOT NULL,
  `unit_amount` INT NOT NULL COMMENT 'centimes',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'eur',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `price_changes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plan` ENUM('monthly','yearly') NOT NULL,
  `old_price_id` VARCHAR(255) NOT NULL,
  `new_price_id` VARCHAR(255) NOT NULL,
  `old_amount` INT NOT NULL,
  `new_amount` INT NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'eur',
  `effective_date` DATE NULL,
  `notified_at` DATETIME NULL,
  `notified_count` INT NOT NULL DEFAULT 0,
  `applied_at` DATETIME NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_price_changes_pending` (`applied_at`, `effective_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `promo_codes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `stripe_coupon_id` VARCHAR(255) NOT NULL,
  `stripe_promotion_code_id` VARCHAR(255) NOT NULL,
  `discount_type` ENUM('percent','amount','free_period') NOT NULL,
  `percent_off` DECIMAL(5,2) NULL,
  `amount_off` INT NULL COMMENT 'centimes',
  `duration` ENUM('once','repeating','forever') NOT NULL,
  `duration_in_months` INT NULL,
  `target` ENUM('signup','renewal') NOT NULL,
  `expires_at` DATETIME NULL,
  `max_redemptions` INT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_promo_code` (`code`),
  UNIQUE KEY `uq_promo_stripe_pc` (`stripe_promotion_code_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `email_logs`
  MODIFY COLUMN `type` ENUM('invoice','receipt','payment_failed','subscription_canceled','subscription_started','renewal_reminder','admin_message','price_change','other') NOT NULL DEFAULT 'other';
