-- ════════════════════════════════════════════════════════════════════════════
-- Fidelyz — schéma complet pour une INSTALLATION NEUVE (MySQL 8+ / MariaDB 10.6+)
--
--   mysql -u <user> -p <base> < backend/schema.sql
--   node scripts/init-admin.mjs          (crée le compte Master Admin)
--
-- Une base existante (créée avec les anciennes migrations) se met à niveau avec
-- migrations/09-mise-en-production.sql, pas avec ce fichier.
-- Rejouable : toutes les tables sont créées « IF NOT EXISTS ».
-- ════════════════════════════════════════════════════════════════════════════
SET NAMES utf8mb4;

-- ───────────── Comptes ─────────────

CREATE TABLE IF NOT EXISTS `super_admins` (
  `id` VARCHAR(36) NOT NULL,
  `identifiant` VARCHAR(50) NOT NULL,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_super_admins_identifiant` (`identifiant`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `entreprises` (
  `id` VARCHAR(36) NOT NULL,
  `nom` VARCHAR(255) NOT NULL,
  `raison_sociale` VARCHAR(255) NULL,
  `prenom` VARCHAR(100) NULL,
  `telephone` VARCHAR(20) NULL,
  `email` VARCHAR(255) NOT NULL,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `temporary_password` VARCHAR(255) NULL,
  `must_change_password` TINYINT(1) NOT NULL DEFAULT 0,
  `statut` ENUM('actif','suspendu') NOT NULL DEFAULT 'actif',
  `loyalty_type` ENUM('points','stamps') NOT NULL DEFAULT 'points',
  `recompense_definition` TEXT NULL,
  `siret_tva` VARCHAR(64) NULL,
  `adresse` VARCHAR(500) NULL,
  `stripe_customer_id` VARCHAR(255) NULL,
  `stripe_subscription_id` VARCHAR(255) NULL,
  `subscription_status` ENUM('free','active','trialing','past_due','canceled','unpaid') NOT NULL DEFAULT 'free',
  `tier` ENUM('free','pro','business') NOT NULL DEFAULT 'free',
  `subscription_plan` ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly',
  `current_period_end` DATETIME NULL,
  `cancel_at_period_end` TINYINT(1) NOT NULL DEFAULT 0,
  `push_suspended` TINYINT(1) NOT NULL DEFAULT 0,
  `pending_promo_code` VARCHAR(255) NULL,
  `email_change_token` VARCHAR(255) NULL,
  `email_change_new_email` VARCHAR(255) NULL,
  `email_change_expiry` DATETIME NULL,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_entreprises_email` (`email`),
  UNIQUE KEY `uq_entreprises_stripe_customer` (`stripe_customer_id`),
  UNIQUE KEY `uq_entreprises_stripe_subscription` (`stripe_subscription_id`),
  KEY `idx_entreprises_statut_nom` (`statut`, `nom`),
  KEY `idx_subscription_status` (`subscription_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `establishments` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `adresse` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_establishments_entreprise` (`entreprise_id`),
  CONSTRAINT `fk_establishments_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `staff_accounts` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `establishment_id` VARCHAR(36) NULL,
  `nom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `mot_de_passe` VARCHAR(255) NOT NULL,
  `role` ENUM('cashier','manager') NOT NULL DEFAULT 'cashier',
  `actif` TINYINT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_staff_email` (`email`),
  KEY `idx_staff_entreprise` (`entreprise_id`),
  CONSTRAINT `fk_staff_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Une ligne par appareil connecté (propriétaire ou compte équipe).
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `device_id` VARCHAR(64) NOT NULL,
  `device_name` VARCHAR(255) NULL,
  `token_hash` VARCHAR(64) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `last_activity` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_sessions_device` (`entreprise_id`, `device_id`),
  KEY `idx_sessions_expires_at` (`expires_at`),
  CONSTRAINT `fk_sessions_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jetons de réinitialisation : seule l'empreinte SHA-256 du jeton est stockée.
CREATE TABLE IF NOT EXISTS `password_resets` (
  `email` VARCHAR(191) NOT NULL,
  `token` VARCHAR(191) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  UNIQUE KEY `uq_password_resets_token` (`token`),
  KEY `idx_password_resets_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `rate_limit_store` (
  `key_id` VARCHAR(255) NOT NULL,
  `hits` INT UNSIGNED NOT NULL DEFAULT 1,
  `reset_time` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`key_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── Programme de fidélité ─────────────

CREATE TABLE IF NOT EXISTS `loyalty_config` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `loyalty_type` ENUM('points','stamps') NOT NULL DEFAULT 'points',
  `reward_title` VARCHAR(255) NULL,
  `reward_description` TEXT NULL,
  `points_per_purchase` INT NOT NULL DEFAULT 10,
  `points_for_reward` INT NOT NULL DEFAULT 100,
  `stamps_for_reward` INT NOT NULL DEFAULT 10,
  `points_adding_mode` VARCHAR(20) NOT NULL DEFAULT 'manual',
  `apple_wallet_key` VARCHAR(255) NULL,
  `google_wallet_key` VARCHAR(255) NULL,
  `push_notifications_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `max_points_balance` INT NULL DEFAULT NULL,
  `points_shortcuts` TEXT NULL,
  `points_expiration_months` INT NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_loyalty_config_entreprise` (`entreprise_id`),
  CONSTRAINT `fk_loyalty_config_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reward_tiers` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `points_required` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reward_tiers_entreprise` (`entreprise_id`, `points_required`),
  CONSTRAINT `fk_reward_tiers_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `card_customization` (
  `id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `loyalty_type` ENUM('points','stamps') NOT NULL DEFAULT 'points',
  `primary_color` VARCHAR(32) NULL DEFAULT '#1f2937',
  `text_color` VARCHAR(32) NULL DEFAULT '#ffffff',
  `accent_color` VARCHAR(32) NULL DEFAULT '#3b82f6',
  `secondary_color` VARCHAR(32) NULL DEFAULT '#374151',
  `logo_url` VARCHAR(500) NULL,
  `icon_url` VARCHAR(500) NULL,
  `strip_image_url` VARCHAR(500) NULL,
  `logo_text` VARCHAR(255) NULL,
  `card_title` VARCHAR(255) NULL,
  `card_subtitle` VARCHAR(255) NULL,
  `back_fields_info` TEXT NULL,
  `back_fields_terms` TEXT NULL,
  `back_fields_website` VARCHAR(255) NULL,
  `back_fields_phone` VARCHAR(30) NULL,
  `back_fields_address` VARCHAR(255) NULL,
  `back_fields_instagram` VARCHAR(255) NULL,
  `back_fields_facebook` VARCHAR(255) NULL,
  `back_fields_tiktok` VARCHAR(255) NULL,
  `apple_organization_name` VARCHAR(255) NULL,
  `apple_pass_description` VARCHAR(255) NULL,
  `apple_background_color` VARCHAR(32) NULL,
  `apple_text_color` VARCHAR(32) NULL,
  `apple_label_color` VARCHAR(32) NULL,
  `apple_logo_url` VARCHAR(500) NULL,
  `apple_icon_url` VARCHAR(500) NULL,
  `apple_strip_image_url` VARCHAR(500) NULL,
  `latitude` DECIMAL(10,8) NULL,
  `longitude` DECIMAL(11,8) NULL,
  `relevant_text` VARCHAR(255) NULL,
  `locations` LONGTEXT NULL,
  `google_primary_color` VARCHAR(32) NULL DEFAULT '#1f2937',
  `google_text_color` VARCHAR(32) NULL DEFAULT '#ffffff',
  `google_logo_url` VARCHAR(500) NULL,
  `google_hero_image_url` VARCHAR(500) NULL,
  `google_card_title` VARCHAR(255) NULL,
  `google_card_subtitle` VARCHAR(255) NULL,
  `google_back_phone` VARCHAR(30) NULL,
  `google_back_website` VARCHAR(255) NULL,
  `google_back_address` VARCHAR(255) NULL,
  `google_back_instagram` VARCHAR(255) NULL,
  `google_back_facebook` VARCHAR(255) NULL,
  `google_back_tiktok` VARCHAR(255) NULL,
  `apple_review_url` TEXT NULL,
  `google_review_url` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_card_customization_company_type` (`company_id`, `loyalty_type`),
  CONSTRAINT `fk_card_customization_entreprise` FOREIGN KEY (`company_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── Clients finaux et cartes Wallet ─────────────

CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `establishment_id` VARCHAR(36) NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NULL,
  `telephone` VARCHAR(20) NULL,
  `points` INT NOT NULL DEFAULT 0,
  `type_wallet` ENUM('apple','google') NOT NULL DEFAULT 'apple',
  `marketing_optin` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_clients_entreprise_telephone` (`entreprise_id`, `telephone`),
  KEY `idx_clients_entreprise_created` (`entreprise_id`, `created_at`),
  CONSTRAINT `fk_clients_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Une carte par client (Apple : numéro de série dérivé de l'id client ; Google : « GOOGLE_<id client> »).
-- notification_message : dernier message affiché au dos de la carte Apple. Apple Wallet affiche une
-- notification sur l'écran verrouillé quand ce texte change (changeMessage).
CREATE TABLE IF NOT EXISTS `wallet_cards` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `client_id` VARCHAR(36) NOT NULL,
  `company_id` VARCHAR(36) NOT NULL,
  `pass_serial_number` VARCHAR(100) NOT NULL,
  `authentication_token` VARCHAR(255) NOT NULL,
  `points_balance` INT NOT NULL DEFAULT 0,
  `stamps_balance` INT NOT NULL DEFAULT 0,
  `qr_code_value` VARCHAR(255) NULL,
  `last_points_change` INT NOT NULL DEFAULT 0,
  `notification_message` VARCHAR(500) NULL,
  `points_expired_up_to` DATE NULL,
  `wallet_added_at` DATETIME NULL,
  `last_updated` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_wallet_cards_client` (`client_id`),
  UNIQUE KEY `uq_wallet_cards_serial` (`pass_serial_number`),
  KEY `idx_wallet_cards_company` (`company_id`, `client_id`),
  CONSTRAINT `fk_wallet_cards_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wallet_cards_entreprise` FOREIGN KEY (`company_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Appareils Apple inscrits pour recevoir les mises à jour d'une carte. Un même iPhone (même jeton push)
-- peut porter plusieurs cartes : le jeton n'est donc PAS unique.
CREATE TABLE IF NOT EXISTS `apple_pass_registrations` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `pass_serial_number` VARCHAR(100) NOT NULL,
  `device_library_identifier` VARCHAR(255) NOT NULL,
  `push_token` VARCHAR(255) NOT NULL,
  `pass_type_identifier` VARCHAR(255) NULL,
  `registered_at` DATETIME NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_device_pass` (`pass_serial_number`, `device_library_identifier`),
  KEY `idx_apr_device` (`device_library_identifier`),
  KEY `idx_apr_push_token` (`push_token`),
  CONSTRAINT `fk_apr_wallet_card` FOREIGN KEY (`pass_serial_number`) REFERENCES `wallet_cards` (`pass_serial_number`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `google_wallet_message_log` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `object_id` VARCHAR(255) NOT NULL,
  `sent_at` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_object_sent` (`object_id`, `sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- L'historique est conservé après la suppression d'un client (statistiques) : pas de clé étrangère sur client_id.
CREATE TABLE IF NOT EXISTS `transaction_history` (
  `id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `establishment_id` VARCHAR(36) NULL,
  `type` VARCHAR(50) NOT NULL,
  `points_change` INT NOT NULL DEFAULT 0,
  `stamps_change` INT NOT NULL DEFAULT 0,
  `description` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_th_client_created` (`client_id`, `created_at`),
  KEY `idx_th_entreprise_created` (`entreprise_id`, `created_at`),
  CONSTRAINT `fk_th_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── Campagnes de notifications ─────────────

CREATE TABLE IF NOT EXISTS `push_notifications_sent` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(100) NOT NULL,
  `message` TEXT NOT NULL,
  `target_type` VARCHAR(20) NOT NULL DEFAULT 'all',
  `target_segment` VARCHAR(50) NULL,
  `recipients_count` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(20) NOT NULL DEFAULT 'sent',
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pns_entreprise_created` (`entreprise_id`, `created_at`),
  CONSTRAINT `fk_pns_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `client_push_notifications` (
  `id` VARCHAR(36) NOT NULL,
  `client_id` VARCHAR(36) NOT NULL,
  `notification_id` VARCHAR(36) NOT NULL,
  `push_token` VARCHAR(255) NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `sent_at` DATETIME NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cpn_client` (`client_id`),
  KEY `idx_cpn_notification` (`notification_id`),
  CONSTRAINT `fk_cpn_notification` FOREIGN KEY (`notification_id`) REFERENCES `push_notifications_sent` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ───────────── Facturation (Stripe) ─────────────

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `stripe_invoice_id` VARCHAR(255) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL DEFAULT 'EUR',
  `status` ENUM('draft','open','paid','uncollectible','void') NOT NULL DEFAULT 'draft',
  `date` DATETIME NOT NULL,
  `pdf_url` VARCHAR(500) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_invoices_stripe` (`stripe_invoice_id`),
  KEY `idx_invoices_entreprise_date` (`entreprise_id`, `date`),
  CONSTRAINT `fk_invoices_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `recipient` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `type` ENUM('invoice','receipt','payment_failed','subscription_canceled','subscription_started','renewal_reminder','admin_message','price_change','other') NOT NULL DEFAULT 'other',
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('sent','bounced','failed','opened') NOT NULL DEFAULT 'sent',
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_logs_entreprise` (`entreprise_id`),
  KEY `idx_email_logs_recipient` (`recipient`),
  CONSTRAINT `fk_email_logs_entreprise` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stripe_events` (
  `event_id` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `processed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- plan : monthly / yearly (Pro) et business_monthly / business_yearly.
CREATE TABLE IF NOT EXISTS `pricing_config` (
  `plan` VARCHAR(32) NOT NULL,
  `stripe_product_id` VARCHAR(255) NULL,
  `stripe_price_id` VARCHAR(255) NOT NULL,
  `unit_amount` INT NOT NULL COMMENT 'centimes TTC',
  `currency` VARCHAR(3) NOT NULL DEFAULT 'eur',
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`plan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `price_changes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `plan` VARCHAR(32) NOT NULL,
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

-- ───────────── Réglages du site ─────────────

CREATE TABLE IF NOT EXISTS `site_settings` (
  `setting_key` VARCHAR(100) NOT NULL,
  `setting_value` LONGTEXT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
