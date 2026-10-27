-- Migration: Add Stripe subscription fields to entreprises table
-- Date: 2026-10-27
-- Description: Add Stripe customer and subscription tracking fields

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Add Stripe fields to entreprises table
ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `stripe_customer_id` VARCHAR(255) UNIQUE COMMENT 'Stripe customer ID' AFTER `created_at`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `stripe_subscription_id` VARCHAR(255) UNIQUE COMMENT 'Stripe subscription ID' AFTER `stripe_customer_id`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `subscription_status` ENUM('active', 'trialing', 'past_due', 'canceled', 'unpaid') DEFAULT 'unpaid' COMMENT 'Current subscription status' AFTER `stripe_subscription_id`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `subscription_plan` ENUM('monthly', 'yearly') DEFAULT 'monthly' COMMENT 'Subscription billing period' AFTER `subscription_status`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `current_period_end` DATETIME COMMENT 'Current billing period end date' AFTER `subscription_plan`;

ALTER TABLE `entreprises` ADD COLUMN IF NOT EXISTS `cancel_at_period_end` BOOLEAN DEFAULT FALSE COMMENT 'If true, subscription will be canceled at period end' AFTER `current_period_end`;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS `idx_stripe_customer_id` ON `entreprises`(`stripe_customer_id`);
CREATE INDEX IF NOT EXISTS `idx_stripe_subscription_id` ON `entreprises`(`stripe_subscription_id`);
CREATE INDEX IF NOT EXISTS `idx_subscription_status` ON `entreprises`(`subscription_status`);

SET FOREIGN_KEY_CHECKS = 1;
