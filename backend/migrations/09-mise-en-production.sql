-- Mise à niveau d'une base EXISTANTE avant la mise en production (rejouable sans erreur).
-- Une installation neuve utilise backend/schema.sql à la place.
--   node scripts/run_migration.js migrations/09-mise-en-production.sql

SET NAMES utf8mb4;

-- Procédure utilitaire : ajoute une colonne si elle n'existe pas.
DROP PROCEDURE IF EXISTS fz_add_column;
DELIMITER //
CREATE PROCEDURE fz_add_column(IN t VARCHAR(64), IN c VARCHAR(64), IN def TEXT)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = t AND COLUMN_NAME = c) = 0 THEN
    SET @fz_sql = CONCAT('ALTER TABLE `', t, '` ADD COLUMN `', c, '` ', def);
    PREPARE fz_stmt FROM @fz_sql;
    EXECUTE fz_stmt;
    DEALLOCATE PREPARE fz_stmt;
  END IF;
END //
DELIMITER ;

-- 1. Message affiché au dos des cartes Apple (notifications sur l'écran verrouillé).
CALL fz_add_column('wallet_cards', 'notification_message', 'VARCHAR(500) NULL');
CALL fz_add_column('wallet_cards', 'last_points_change', 'INT NOT NULL DEFAULT 0');
CALL fz_add_column('wallet_cards', 'points_expired_up_to', 'DATE NULL');
CALL fz_add_column('wallet_cards', 'wallet_added_at', 'DATETIME NULL');
CALL fz_add_column('apple_pass_registrations', 'pass_type_identifier', 'VARCHAR(255) NULL');
CALL fz_add_column('entreprises', 'last_login', 'DATETIME NULL');
CALL fz_add_column('entreprises', 'updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
CALL fz_add_column('loyalty_config', 'max_points_balance', 'INT NULL DEFAULT NULL');
CALL fz_add_column('loyalty_config', 'points_shortcuts', 'TEXT NULL');
CALL fz_add_column('loyalty_config', 'points_expiration_months', 'INT NULL DEFAULT NULL');
CALL fz_add_column('clients', 'marketing_optin', 'TINYINT(1) NOT NULL DEFAULT 0');
CALL fz_add_column('clients', 'establishment_id', 'VARCHAR(36) NULL');
CALL fz_add_column('clients', 'marketing_optin_at', 'DATETIME NULL');
CALL fz_add_column('transaction_history', 'establishment_id', 'VARCHAR(36) NULL');

-- 2. Un même iPhone peut porter les cartes de plusieurs commerces : le jeton push ne doit pas être unique.
SET @fz_idx := (SELECT INDEX_NAME FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'apple_pass_registrations' AND COLUMN_NAME = 'push_token'
    AND NON_UNIQUE = 0 AND SEQ_IN_INDEX = 1 LIMIT 1);
SET @fz_sql := IF(@fz_idx IS NULL, 'SELECT 1', CONCAT('ALTER TABLE apple_pass_registrations DROP INDEX `', @fz_idx, '`, ADD INDEX idx_apr_push_token (push_token)'));
PREPARE fz_stmt FROM @fz_sql;
EXECUTE fz_stmt;
DEALLOCATE PREPARE fz_stmt;

-- 3. Les plans Business (business_monthly / business_yearly) ne tenaient pas dans l'ENUM d'origine.
ALTER TABLE pricing_config MODIFY COLUMN `plan` VARCHAR(32) NOT NULL;
ALTER TABLE price_changes MODIFY COLUMN `plan` VARCHAR(32) NOT NULL;

-- 4. Le mode « automatic » était refusé par l'ENUM('auto','manual') de certaines bases.
ALTER TABLE loyalty_config MODIFY COLUMN points_adding_mode VARCHAR(20) NOT NULL DEFAULT 'manual';
UPDATE loyalty_config SET points_adding_mode = 'automatic' WHERE points_adding_mode = 'auto';

-- 5. Les jetons de réinitialisation sont désormais stockés hachés : les anciens liens sont invalidés.
DELETE FROM password_resets;

-- 6. Le mot de passe temporaire n'est plus conservé en clair.
UPDATE entreprises SET temporary_password = NULL WHERE temporary_password IS NOT NULL;

-- 7. Index utiles aux requêtes fréquentes (ignorés s'ils existent déjà).
SET @fz_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'transaction_history' AND INDEX_NAME = 'idx_th_client_created') = 0,
  'CREATE INDEX idx_th_client_created ON transaction_history (client_id, created_at)', 'SELECT 1');
PREPARE fz_stmt FROM @fz_sql;
EXECUTE fz_stmt;
DEALLOCATE PREPARE fz_stmt;
SET @fz_sql := IF((SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'push_notifications_sent' AND INDEX_NAME = 'idx_pns_entreprise_created') = 0,
  'CREATE INDEX idx_pns_entreprise_created ON push_notifications_sent (entreprise_id, created_at)', 'SELECT 1');
PREPARE fz_stmt FROM @fz_sql;
EXECUTE fz_stmt;
DEALLOCATE PREPARE fz_stmt;

DROP PROCEDURE IF EXISTS fz_add_column;
