-- Journal des e-mails transactionnels + événements Stripe traités (idempotence) — MySQL 8
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `recipient` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `type` ENUM('invoice','receipt','payment_failed','subscription_canceled','subscription_started','renewal_reminder','other') NOT NULL DEFAULT 'other',
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('sent','bounced','failed','opened') NOT NULL DEFAULT 'sent',
  `metadata` JSON NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email_logs_entreprise` (`entreprise_id`),
  KEY `idx_email_logs_recipient` (`recipient`),
  CONSTRAINT `email_logs_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stripe_events` (
  `event_id` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `processed_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
