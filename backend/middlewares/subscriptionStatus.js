import pool from '../db.js';
import logger from '../utils/logger.js';

// Middleware to check if Pro user has active subscription
export const requireActiveSubscription = async (req, res, next) => {
  const entrepriseId = req.user.id;

  if (req.user.role !== 'pro') {
    return res.status(403).json({ error: 'Accès réservé aux professionnels' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT subscription_status, current_period_end FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (rows.length === 0) {
      logger.warn('Entreprise not found', { entreprise_id: entrepriseId });
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const entreprise = rows[0];
    const status = entreprise.subscription_status;

    // Allow access if subscription is active or trialing
    if (['active', 'trialing'].includes(status)) {
      next();
    } else if (status === 'past_due') {
      // Allow read access but block write operations for past_due
      logger.warn('Accessing with past_due subscription', { entreprise_id: entrepriseId });
      res.status(403).json({
        error: 'Votre abonnement n\'est plus valide. Veuillez mettre à jour votre moyen de paiement.',
        status: 'past_due'
      });
    } else if (status === 'canceled') {
      res.status(403).json({
        error: 'Votre abonnement a été annulé. Accès en lecture seule.',
        status: 'canceled',
        read_only: true
      });
    } else if (status === 'unpaid') {
      res.status(402).json({
        error: 'Paiement requis. Veuillez compléter votre inscription.',
        status: 'unpaid'
      });
    } else {
      res.status(403).json({
        error: 'Accès refusé. Statut d\'abonnement invalide.',
        status: status
      });
    }
  } catch (err) {
    logger.error('Subscription status check error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la vérification de l\'abonnement' });
  }
};

// Middleware to check subscription status (non-blocking, adds to request)
export const checkSubscriptionStatus = async (req, res, next) => {
  if (req.user?.role !== 'pro') {
    return next();
  }

  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT subscription_status, current_period_end, cancel_at_period_end FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (rows.length > 0) {
      req.subscriptionStatus = rows[0].subscription_status;
      req.currentPeriodEnd = rows[0].current_period_end;
      req.cancelAtPeriodEnd = rows[0].cancel_at_period_end;
    }
  } catch (err) {
    logger.error('Subscription status check error', { error: err.message });
  }

  next();
};

// Middleware to allow read-only access for canceled subscriptions
export const allowReadOnlyForCanceled = (req, res, next) => {
  if (req.subscriptionStatus === 'canceled' && ['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  if (req.subscriptionStatus === 'canceled') {
    return res.status(403).json({
      error: 'Votre abonnement a été annulé. Accès en lecture seule.',
      status: 'canceled'
    });
  }

  next();
};

export default {
  requireActiveSubscription,
  checkSubscriptionStatus,
  allowReadOnlyForCanceled
};
