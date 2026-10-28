-- Offres Gratuit / Pro / Business, verrouillage au-delà de 15 clients et garde-fous des notifications.
-- Les comptes existants (abonnés ou « grandfathered ») gardent l'accès complet : ils passent en Pro.

ALTER TABLE entreprises
  MODIFY COLUMN subscription_status ENUM('free','active','trialing','past_due','canceled','unpaid') NOT NULL DEFAULT 'unpaid',
  ADD COLUMN tier ENUM('free','pro','business') NOT NULL DEFAULT 'free' AFTER subscription_status,
  ADD COLUMN push_suspended TINYINT(1) NOT NULL DEFAULT 0;

UPDATE entreprises SET tier = 'pro' WHERE subscription_status IN ('active','trialing','past_due');
