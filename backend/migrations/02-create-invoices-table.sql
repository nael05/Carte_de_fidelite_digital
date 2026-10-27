-- Migration: Create invoices table for Stripe invoice tracking
-- Date: 2026-10-27
-- Description: Store invoice records linked to Stripe

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `invoices` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `entreprise_id` INT(11) NOT NULL,
  `stripe_invoice_id` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Stripe invoice ID',
  `amount` DECIMAL(10, 2) NOT NULL COMMENT 'Invoice amount in cents',
  `currency` VARCHAR(3) DEFAULT 'EUR' COMMENT 'Currency code',
  `status` ENUM('draft', 'open', 'paid', 'uncollectible', 'void') DEFAULT 'draft' COMMENT 'Stripe invoice status',
  `date` DATETIME NOT NULL COMMENT 'Invoice date',
  `pdf_url` VARCHAR(500) COMMENT 'URL to PDF invoice from Stripe',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `entreprise_id` (`entreprise_id`),
  KEY `stripe_invoice_id` (`stripe_invoice_id`),
  KEY `date` (`date`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Stripe invoices for subscription billing';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS `idx_invoices_status` ON `invoices`(`status`);
CREATE INDEX IF NOT EXISTS `idx_invoices_created_at` ON `invoices`(`created_at`);

SET FOREIGN_KEY_CHECKS = 1;
