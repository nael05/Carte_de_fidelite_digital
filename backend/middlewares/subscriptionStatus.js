import pool from '../db.js';
import logger from '../utils/logger.js';
import { getAccess, FREE_CLIENT_LIMIT } from '../utils/plans.js';

const TIER_RANK = { free: 0, pro: 1, business: 2 };

const refuse = (res, access) => {
  if (access.blocked === 'unpaid') {
    return res.status(402).json({ error: 'Paiement requis. Veuillez compléter votre inscription.', status: 'unpaid' });
  }
  if (access.blocked === 'past_due') {
    return res.status(403).json({
      error: "Votre abonnement n'est plus valide. Veuillez mettre à jour votre moyen de paiement.",
      status: 'past_due'
    });
  }
  return res.status(403).json({
    error: `Votre compte gratuit est limité à ${FREE_CLIENT_LIMIT} clients : supprimez des clients ou passez à une offre payante pour continuer.`,
    status: 'limit_exceeded',
    locked: true,
    client_count: access.client_count,
    limit: access.limit
  });
};

// allowLocked : un compte gratuit verrouillé (plus de 15 clients) garde l'accès à ses données pour pouvoir
// supprimer des clients ou passer à une offre payante. Les problèmes de paiement restent bloquants.
const guard = (allowLocked) => async (req, res, next) => {
  if (req.user?.role !== 'pro') {
    return res.status(403).json({ error: 'Accès réservé aux professionnels' });
  }

  try {
    const access = await getAccess(req.user.id);
    if (!access) {
      logger.warn('Entreprise not found', { entreprise_id: req.user.id });
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    req.access = access;
    if (access.blocked || (access.locked && !allowLocked)) return refuse(res, access);
    next();
  } catch (err) {
    logger.error('Subscription status check error', { error: err.message });
    res.status(500).json({ error: "Erreur lors de la vérification de l'abonnement" });
  }
};

// Opérations qui modifient les données ou font vivre la carte : refusées si le compte est verrouillé.
export const requireActiveSubscription = guard(false);
// Lecture et suppression de clients : autorisées même quand le compte gratuit est verrouillé.
export const requireAccountAccess = guard(true);

// À placer après requireActiveSubscription : fonctionnalité réservée à une offre minimale.
export const requireTier = (minimum) => (req, res, next) => {
  if (TIER_RANK[req.access?.tier] >= TIER_RANK[minimum]) return next();
  res.status(403).json({
    error: `Cette fonctionnalité est réservée à l'offre ${minimum === 'business' ? 'Business' : 'Pro'}.`,
    status: 'upgrade_required',
    required_tier: minimum,
    tier: req.access?.tier
  });
};

// Middleware non bloquant : expose l'état d'abonnement sur la requête.
export const checkSubscriptionStatus = async (req, res, next) => {
  if (req.user?.role !== 'pro') {
    return next();
  }

  try {
    const [rows] = await pool.query(
      'SELECT subscription_status, current_period_end, cancel_at_period_end FROM entreprises WHERE id = ?',
      [req.user.id]
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

export default {
  requireActiveSubscription,
  requireAccountAccess,
  requireTier,
  checkSubscriptionStatus
};
