-- Factures Stripe (MySQL 8) — montant en unité monétaire (euros)
SET NAMES utf8mb4;

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
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
