import pool from '../db.js';
import { PUSH_RULES, effectiveTier } from './plans.js';

// Garde-fous des notifications promotionnelles : l'envoi passe toujours par prepareCampaign().
// Les mises à jour de points (transactionnelles) ne sont pas concernées.

const hourIn = (timeZone, date = new Date()) =>
  Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hour12: false, timeZone }).format(date)) % 24;

export const isQuietHour = (date = new Date()) => {
  const { from, to, timeZone } = PUSH_RULES.quietHours;
  const h = hourIn(timeZone, date);
  return h >= from || h < to;
};

const monthStart = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

export const getQuota = async (entrepriseId) => {
  const [[ent]] = await pool.query(
    'SELECT subscription_status, tier, push_suspended FROM entreprises WHERE id = ?',
    [entrepriseId]
  );
  if (!ent) return null;
  const tier = effectiveTier(ent);
  const limit = PUSH_RULES.monthlyQuota[tier] ?? 0;

  const [[{ used }]] = await pool.query(
    'SELECT COUNT(*) AS used FROM push_notifications_sent WHERE entreprise_id = ? AND created_at >= ?',
    [entrepriseId, monthStart()]
  );
  const [[last]] = await pool.query(
    'SELECT MAX(created_at) AS last_at FROM push_notifications_sent WHERE entreprise_id = ?',
    [entrepriseId]
  );
  const nextAllowed = last.last_at
    ? new Date(new Date(last.last_at).getTime() + PUSH_RULES.minHoursBetween * 3_600_000)
    : null;

  return {
    tier,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    suspended: !!ent.push_suspended,
    min_hours_between: PUSH_RULES.minHoursBetween,
    client_cooldown_days: PUSH_RULES.clientCooldownDays,
    next_allowed_at: nextAllowed && nextAllowed > new Date() ? nextAllowed : null,
    quiet_hours: PUSH_RULES.quietHours,
    quiet_now: isQuietHour()
  };
};

const reject = (status, code, error, extra = {}) => ({ error: { status, body: { error, code, ...extra } } });

// Vérifie les règles et retourne les clients réellement éligibles. { error: { status, body } } si refusé.
//  - offre payante, compte non suspendu, quota mensuel, 48 h entre deux envois, pas d'envoi de nuit ;
//  - destinataires : consentement marketing et aucune campagne reçue depuis 7 jours.
export const prepareCampaign = async (entrepriseId, { clientIds = null, segment = null } = {}) => {
  const quota = await getQuota(entrepriseId);
  if (!quota) return reject(404, 'not_found', 'Entreprise non trouvée');

  if (quota.suspended) {
    return reject(403, 'push_suspended', "L'envoi de notifications est suspendu sur votre compte. Contactez le support.");
  }
  if (quota.limit === 0) {
    return reject(403, 'upgrade_required', "Les notifications promotionnelles sont réservées aux offres Pro et Business.", { required_tier: 'pro' });
  }
  if (quota.remaining === 0) {
    return reject(429, 'quota_reached', `Quota atteint : ${quota.limit} campagne(s) par mois avec votre offre.`, { quota });
  }
  if (quota.next_allowed_at) {
    return reject(429, 'too_soon', `Vous devez attendre ${quota.min_hours_between} h entre deux campagnes (prochain envoi possible à partir du ${quota.next_allowed_at.toLocaleString('fr-FR', { timeZone: PUSH_RULES.quietHours.timeZone })}).`, { quota });
  }
  if (quota.quiet_now) {
    return reject(403, 'quiet_hours', `Pas d'envoi entre ${PUSH_RULES.quietHours.from} h et ${PUSH_RULES.quietHours.to} h (heure de Paris).`, { quota });
  }

  let sql = 'SELECT c.id FROM clients c WHERE c.entreprise_id = ? AND c.marketing_optin = 1';
  const params = [entrepriseId];
  if (Array.isArray(clientIds)) {
    if (clientIds.length === 0) return reject(400, 'no_recipients', 'Veuillez sélectionner au moins un client');
    sql += ' AND c.id IN (?)';
    params.push(clientIds);
  }
  if (segment === 'active') sql += ' AND c.points > 0';
  else if (segment === 'inactive') sql += ' AND (c.points = 0 OR c.points IS NULL)';
  sql += ` AND NOT EXISTS (
      SELECT 1 FROM client_push_notifications cp
      JOIN push_notifications_sent n ON n.id = cp.notification_id
      WHERE cp.client_id = c.id AND n.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    )`;
  params.push(PUSH_RULES.clientCooldownDays);

  const [eligible] = await pool.query(sql, params);
  if (eligible.length === 0) {
    return reject(422, 'no_eligible_recipients',
      `Aucun client éligible : il faut son accord marketing et ne pas avoir reçu de campagne depuis ${PUSH_RULES.clientCooldownDays} jours.`);
  }
  return { clientIds: eligible.map((c) => c.id), quota };
};

export default { prepareCampaign, getQuota, isQuietHour };
