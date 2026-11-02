-- Migration: points expiration feature
-- 1. Add expiration config to loyalty_config
ALTER TABLE loyalty_config
  ADD COLUMN IF NOT EXISTS points_expiration_months INT NULL DEFAULT NULL
  COMMENT 'Null = jamais, sinon nombre de mois avant expiration';

-- 2. Track last expiration run date per wallet card (idempotency)
ALTER TABLE wallet_cards
  ADD COLUMN IF NOT EXISTS points_expired_up_to DATE NULL DEFAULT NULL
  COMMENT 'Date jusqu à laquelle l expiration a été calculée pour cette carte';

-- 3. Synthetic seed: treat all existing points as earned today
--    One INSERT per client who has points > 0 and no existing add_points entry today
INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, stamps_change, description)
SELECT
  UUID(),
  c.id,
  c.entreprise_id,
  'add_points',
  wc.points_balance,
  0,
  'Solde initial — points existants au moment de l activation de l expiration'
FROM clients c
JOIN wallet_cards wc ON wc.client_id = c.id
WHERE wc.points_balance > 0
  AND NOT EXISTS (
    SELECT 1 FROM transaction_history th
    WHERE th.client_id = c.id
      AND th.type = 'add_points'
      AND DATE(th.created_at) = CURDATE()
      AND th.description LIKE 'Solde initial%'
  );
