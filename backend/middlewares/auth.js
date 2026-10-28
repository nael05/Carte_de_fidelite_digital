import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verifySessionValidity } from '../utils/sessionManager.js';
import { effectiveTier } from '../utils/plans.js';
import logger from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_change_in_production';

// extra : revendications supplémentaires (compte équipe : staffId, staffRole).
export const generateToken = (userId, role, extra = {}) => {
  return jwt.sign({ id: userId, role, ...extra }, JWT_SECRET, { expiresIn: '7d' });
};
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Droits des comptes équipe (le propriétaire n'a aucune restriction).
//  - caissier : caisse et consultation des clients ;
//  - manager : tout sauf compte, abonnement, facturation, équipe, établissements (écriture) et actions destructrices.
const inPrefix = (path, prefix) => path === prefix || path.startsWith(prefix + '/');
const MANAGER_BLOCKED = ['/pro/account', '/pro/subscription', '/pro/billing', '/pro/staff', '/pro/sessions', '/pro/logout-all', '/pro/change-password'];
const CASHIER_GET = [/^\/pro\/(status|info|clients|reward-tiers|establishments)$/, /^\/pro\/loyalty\/(config|expiration)$/, /^\/pro\/card-customization\/[^/]+$/, /^\/pro\/scan-lookup\/[^/]+$/];
const CASHIER_POST = ['/pro/scan', '/pro/scan/finalize', '/pro/redeem-reward', '/pro/logout-device'];

export const staffMayAccess = (role, method, path) => {
  if (role === 'cashier') {
    if (method === 'GET') return CASHIER_GET.some((re) => re.test(path));
    return method === 'POST' && CASHIER_POST.includes(path);
  }
  if (MANAGER_BLOCKED.some((p) => inPrefix(path, p))) return false;
  if (inPrefix(path, '/pro/establishments') && method !== 'GET') return false;
  if (method === 'DELETE' && path === '/pro/history') return false;
  return true;
};

export const verifyToken = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    req.user = decoded;

    if (decoded.role === 'pro') {
      const deviceId = req.headers['x-device-id'];
      if (!deviceId) {
        return res.status(401).json({ error: 'Session expirée' });
      }
      const sessionValid = await verifySessionValidity(decoded.id, deviceId);
      if (!sessionValid) {
        logger.warn('Session expired or invalid for pro', { userId: decoded.id, deviceId });
        return res.status(401).json({ error: 'Session expirée' });
      }
      req.user.deviceId = deviceId;

      if (decoded.staffId) {
        // Compte équipe : rechargé à chaque requête pour qu'une désactivation, un changement de rôle
        // ou la fin de l'offre Business prennent effet immédiatement.
        const [staffRows] = await pool.query(
          `SELECT s.nom, s.role, s.actif, s.establishment_id, e.statut, e.tier, e.subscription_status
           FROM staff_accounts s JOIN entreprises e ON e.id = s.entreprise_id
           WHERE s.id = ? AND s.entreprise_id = ?`,
          [decoded.staffId, decoded.id]
        );
        const staff = staffRows[0];
        if (!staff || !staff.actif) return res.status(401).json({ error: 'Session expirée' });
        if (staff.statut === 'suspendu') return res.status(403).json({ error: 'Compte suspendu' });
        if (effectiveTier(staff) !== 'business') {
          return res.status(403).json({ error: "L'offre Business de ce commerce n'est plus active.", status: 'upgrade_required' });
        }
        if (!staffMayAccess(staff.role, req.method, req.path)) {
          return res.status(403).json({ error: "Vous n'avez pas accès à cette fonction.", status: 'forbidden_for_staff' });
        }
        req.user.staffRole = staff.role;
        req.user.staffName = staff.nom;
        req.user.establishmentId = staff.establishment_id || null;
      }
    }

    next();
  } catch (err) {
    logger.warn('Invalid token attempt', { error: err.message });
    return res.status(401).json({ error: 'Session invalide ou expirée' });
  }
});

export const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized admin access attempt', { userId: req.user?.id });
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
};

export const isPro = (req, res, next) => {
  if (req.user.role !== 'pro') {
    logger.warn('Unauthorized pro access attempt', { userId: req.user?.id });
    return res.status(403).json({ error: 'Accès réservé aux professionnels' });
  }
  next();
};
