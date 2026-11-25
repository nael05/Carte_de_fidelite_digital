import cron from 'node-cron';
import pool from '../db.js';
import logger from './logger.js';

const TZ = 'Europe/Paris';

const enterprisesWithExpiration = async () => {
  const [rows] = await pool.query(
    `SELECT lc.entreprise_id, lc.points_expiration_months
     FROM loyalty_config lc JOIN entreprises e ON e.id = lc.entreprise_id
     WHERE lc.points_expiration_months IS NOT NULL AND e.statut = 'actif'`
  );
  return rows;
};

// 02:00 — retrait des points échus (mise à jour des cartes sans notification).
export const runPointsExpiration = async () => {
  const { runExpirationForEnterprise } = await import('../controllers/loyaltyController.js');
  let total = 0;
  for (const { entreprise_id, points_expiration_months } of await enterprisesWithExpiration()) {
    try {
      total += await runExpirationForEnterprise(entreprise_id, points_expiration_months);
    } catch (err) {
      logger.error(`[CRON] Expiration en échec pour ${entreprise_id}`, { error: err.message });
    }
  }
  logger.info(`[CRON] Expiration des points terminée (${total} point(s) échus)`);
};

// 10:00 — alerte « vos points expirent dans 7 jours » (une seule fois par lot de points, en journée).
export const runExpiryWarnings = async () => {
  const { sendExpiryWarningsForEnterprise } = await import('../controllers/loyaltyController.js');
  let total = 0;
  for (const { entreprise_id, points_expiration_months } of await enterprisesWithExpiration()) {
    try {
      total += await sendExpiryWarningsForEnterprise(entreprise_id, points_expiration_months);
    } catch (err) {
      logger.error(`[CRON] Alertes J-7 en échec pour ${entreprise_id}`, { error: err.message });
    }
  }
  logger.info(`[CRON] Alertes d'expiration envoyées : ${total}`);
};

// 03:00 — purge : historique trop ancien, sessions expirées, jetons et compteurs périmés.
export const runCleanup = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT MAX(points_expiration_months) AS maxMonths FROM loyalty_config WHERE points_expiration_months IS NOT NULL'
    );
    // L'historique sert au calcul de l'expiration (FIFO) et aux statistiques : on garde au moins 24 mois.
    const keepMonths = Math.max(24, (Number(rows[0]?.maxMonths) || 0) + 1);
    await pool.query('DELETE FROM transaction_history WHERE created_at < DATE_SUB(NOW(), INTERVAL ? MONTH)', [keepMonths]);
    await pool.query('DELETE FROM sessions WHERE expires_at < NOW()');
    await pool.query('DELETE FROM password_resets WHERE expires_at < NOW()');
    await pool.query('DELETE FROM rate_limit_store WHERE reset_time < ?', [Date.now()]);
    await pool.query('DELETE FROM google_wallet_message_log WHERE sent_at < ?', [Date.now() - 2 * 24 * 3600 * 1000]);
    logger.info(`[CRON] Purge terminée (historique conservé ${keepMonths} mois)`);
  } catch (err) {
    logger.error('[CRON] Purge en échec', { error: err.message });
  }
};

export const runPriceChanges = async () => {
  try {
    const { applyDuePriceChanges } = await import('../controllers/adminPricingController.js');
    const count = await applyDuePriceChanges();
    if (count > 0) logger.info(`[CRON] Changements de tarif traités : ${count}`);
  } catch (err) {
    logger.error('[CRON] Application des changements de tarif échouée', { error: err.message });
  }
};

/**
 * Démarre les tâches planifiées. Avec PM2 en mode cluster, seule l'instance 0 les exécute ;
 * sans PM2 (node server.js, mode fork), elles tournent dans l'unique processus.
 * DISABLE_CRON=true les désactive (instances supplémentaires, tests).
 */
// 09:00 — alerte si le certificat Apple Wallet expire bientôt (toutes les cartes Apple cesseraient de fonctionner).
export const checkAppleCertificate = async () => {
  const { default: passGenerator } = await import('./passGenerator.js');
  const days = passGenerator.certificateDaysLeft();
  if (days !== null && days < 30) logger.error(`[CRON] Certificat Apple Wallet : expiration dans ${days} jour(s) — à renouveler sur developer.apple.com`);
};

export const startCronJobs = () => {
  const instance = process.env.NODE_APP_INSTANCE;
  if (process.env.DISABLE_CRON === 'true' || (instance !== undefined && instance !== '0')) {
    logger.info('[CRON] Tâches planifiées désactivées sur cette instance');
    return;
  }
  cron.schedule('0 2 * * *', runPointsExpiration, { timezone: TZ });
  cron.schedule('0 3 * * *', runCleanup, { timezone: TZ });
  cron.schedule('0 4 * * *', runPriceChanges, { timezone: TZ });
  cron.schedule('0 10 * * *', runExpiryWarnings, { timezone: TZ });
  cron.schedule('0 9 * * *', checkAppleCertificate, { timezone: TZ });
  logger.info('[CRON] Tâches planifiées actives (expiration 2 h, purge 3 h, tarifs 4 h, alertes J-7 10 h — heure de Paris)');
};
