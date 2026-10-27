-- Changement d'e-mail sécurisé + code promo du prochain renouvellement (MySQL 8)
SET NAMES utf8mb4;

ALTER TABLE `entreprises`
  ADD COLUMN `email_change_token` VARCHAR(255) NULL,
  ADD COLUMN `email_change_new_email` VARCHAR(255) NULL,
  ADD COLUMN `email_change_expiry` DATETIME NULL,
  ADD COLUMN `pending_promo_code` VARCHAR(255) NULL;
