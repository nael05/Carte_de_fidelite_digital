-- Colonnes utilisées par le code mais créées par aucune migration du dépôt (ou par une migration
-- incompatible MySQL 8). Chaque ajout est conditionnel : le script est rejouable sans erreur.

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'loyalty_config' AND COLUMN_NAME = 'points_expiration_months') = 0,
  'ALTER TABLE loyalty_config ADD COLUMN points_expiration_months INT NULL DEFAULT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF((SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'marketing_optin') = 0,
  'ALTER TABLE clients ADD COLUMN marketing_optin BOOLEAN NOT NULL DEFAULT FALSE',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
