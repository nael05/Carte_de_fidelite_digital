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

// Début du mois civil (heure de Paris), au format DATETIME de MySQL.
// Début du jour / du mois civil à Paris, au format DATETIME (MySQL compare en heure du serveur : on
// convertit l'heure de Paris en heure locale du serveur).
const parisParts = (date = new Date()) => Object.fromEntries(
  new Intl.DateTimeFormat('en-GB', { timeZone: PUSH_RULES.quietHours.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
    .formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, Number(p.value)])
);
const startOfParis = (unit) => {
  const now = new Date();
  const p = parisParts(now);
  const elapsedMs = ((unit === 'month' ? (p.day - 1) * 24 : 0) + p.hour) * 3_600_000 + p.minute * 60_000 + p.second * 1000 + now.getMilliseconds();
  return new Date(now.getTime() - elapsedMs);
};

export const getQuota = async (entrepriseId) => {
  const [[ent]] = await pool.query(
    'SELECT subscription_status, tier, push_suspended FROM entreprises WHERE id = ?',
    [entrepriseId]
  );
  if (!ent) return null;
  const tier = effectiveTier(ent);
  const dailyLimit = PUSH_RULES.dailyLimit[tier] ?? 0;

  const [[{ today }]] = await pool.query(
    'SELECT COUNT(*) AS today FROM push_notifications_sent WHERE entreprise_id = ? AND created_at >= ?',
    [entrepriseId, startOfParis('day')]
  );
  const [[{ month }]] = await pool.query(
    'SELECT COUNT(*) AS month FROM push_notifications_sent WHERE entreprise_id = ? AND created_at >= ?',
    [entrepriseId, startOfParis('month')]
  );

  return {
    tier,
    daily_limit: dailyLimit,
    unlimited: dailyLimit > 0,
    sent_today: Number(today),
    remaining_today: Math.max(0, dailyLimit - Number(today)),
    used_this_month: Number(month),
    suspended: !!ent.push_suspended,
    quiet_hours: PUSH_RULES.quietHours,
    quiet_now: isQuietHour()
  };
};

const reject = (status, code, error, extra = {}) => ({ error: { status, body: { error, code, ...extra } } });

// Vérifie les règles et retourne les clients réellement éligibles. { error: { status, body } } si refusé.
//  - offre payante, compte non suspendu, une campagne par jour (heure de Paris), pas d'envoi de nuit ;
//  - destinataires : consentement marketing et carte ajoutée au Wallet.
export const prepareCampaign = async (entrepriseId, { clientIds = null, segment = null } = {}) => {
  const quota = await getQuota(entrepriseId);
  if (!quota) return reject(404, 'not_found', 'Entreprise non trouvée');

  if (quota.suspended) {
    return reject(403, 'push_suspended', "L'envoi de notifications est suspendu sur votre compte. Contactez le support.");
  }
  if (quota.daily_limit === 0) {
    return reject(403, 'upgrade_required', "Les notifications promotionnelles sont réservées aux offres Pro et Business.", { required_tier: 'pro' });
  }
  if (quota.remaining_today === 0) {
    return reject(429, 'daily_limit', `Une campagne par jour maximum : prochain envoi possible demain à partir de ${PUSH_RULES.quietHours.to} h.`, { quota });
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
  // Seuls les clients qui ont une carte Wallet peuvent recevoir le message.
  sql += ' AND EXISTS (SELECT 1 FROM wallet_cards w WHERE w.client_id = c.id AND w.company_id = c.entreprise_id)';

  const [eligible] = await pool.query(sql, params);
  if (eligible.length === 0) {
    return reject(422, 'no_eligible_recipients',
      'Aucun client éligible : il faut avoir ajouté sa carte au Wallet et avoir donné son accord pour recevoir des offres.');
  }
  return { clientIds: eligible.map((c) => c.id), quota };
};

export default { prepareCampaign, getQuota, isQuietHour };
