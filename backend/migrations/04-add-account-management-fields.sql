-- Migration: Add account management fields to entreprises table
-- Date: 2026-10-27
-- Description: Add fields for email change verification and promo code tracking

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Add email change verification fields
ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `email_change_token` VARCHAR(255) COMMENT 'Hashed token for email change verification' AFTER `email`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `email_change_new_email` VARCHAR(255) COMMENT 'New email pending confirmation' AFTER `email_change_token`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `email_change_expiry` DATETIME COMMENT 'Email change token expiry time' AFTER `email_change_new_email`;

-- Add promo code tracking for next renewal
ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `pending_promo_code` VARCHAR(255) COMMENT 'Promo code to apply at next renewal' AFTER `cancel_at_period_end`;

SET FOREIGN_KEY_CHECKS = 1;
