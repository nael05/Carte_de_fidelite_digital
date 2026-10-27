-- Migration: Create email_logs table for audit trail
-- Date: 2026-10-27
-- Description: Log all transactional emails sent to enterprises (invoices, receipts, etc.)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` INT(11) NOT NULL,
  `recipient` VARCHAR(255) NOT NULL COMMENT 'Email recipient address',
  `subject` VARCHAR(255) NOT NULL COMMENT 'Email subject',
  `type` ENUM('invoice', 'receipt', 'payment_failed', 'subscription_canceled', 'subscription_started', 'renewal_reminder', 'other') DEFAULT 'other' COMMENT 'Email category',
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When email was sent',
  `status` ENUM('sent', 'bounced', 'failed', 'opened') DEFAULT 'sent' COMMENT 'Email delivery status',
  `metadata` JSON COMMENT 'Additional data (invoice_id, stripe_id, etc.)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `entreprise_id` (`entreprise_id`),
  KEY `sent_at` (`sent_at`),
  KEY `type` (`type`),
  CONSTRAINT `email_logs_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit trail for transactional emails';

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS `idx_email_logs_recipient` ON `email_logs`(`recipient`);
CREATE INDEX IF NOT EXISTS `idx_email_logs_status` ON `email_logs`(`status`);
CREATE INDEX IF NOT EXISTS `idx_email_logs_created_at` ON `email_logs`(`created_at`);

SET FOREIGN_KEY_CHECKS = 1;
