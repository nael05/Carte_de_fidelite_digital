-- Offre Business : plusieurs établissements et comptes équipe (caissiers / managers).
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `establishments` (
  `id` VARCHAR(36) NOT NULL,
  `entreprise_id` VARCHAR(36) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `adresse` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_establishments_entreprise` (`entreprise_id`),
  CONSTRAINT `establishments_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
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
  CONSTRAINT `staff_accounts_ibfk_1` FOREIGN KEY (`entreprise_id`) REFERENCES `entreprises` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rattachement d'un client et d'une transaction à un établissement (NULL = non précisé).
ALTER TABLE `clients` ADD COLUMN `establishment_id` VARCHAR(36) NULL;
ALTER TABLE `transaction_history` ADD COLUMN `establishment_id` VARCHAR(36) NULL;
