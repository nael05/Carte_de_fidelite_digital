import { randomUUID } from 'crypto';
import pool from '../db.js';
import logger from '../utils/logger.js';
import walletSyncService from '../utils/walletSyncService.js';
import { getQuota } from '../utils/pushGuard.js';
import { sendCampaign } from '../utils/campaignService.js';


/**
 * Obtenir la configuration de fidélité et les paliers d'une entreprise
 */
export const getLoyaltyConfig = async (req, res) => {
  const empresaId = req.user.id;

  try {
    const [config] = await pool.query(
      `SELECT * FROM loyalty_config WHERE entreprise_id = ?`,
      [empresaId]
    );

    if (config.length === 0) {
      return res.status(404).json({ error: 'Configuration de fidélité non trouvée' });
    }

    const [tiers] = await pool.query(
      `SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC`,
      [empresaId]
    );

    const row = config[0];
    let points_shortcuts = [];
    if (row.points_shortcuts) {
      try { points_shortcuts = JSON.parse(row.points_shortcuts); } catch (_) {}
    }

    res.json({
      ...row,
      points_shortcuts,
      reward_tiers: tiers
    });
  } catch (err) {
    logger.error('Get loyalty config error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Créer ou mettre à jour la configuration de fidélité
 */
export const updateLoyaltyConfig = async (req, res) => {
  const empresaId = req.user.id;
  const {
    points_adding_mode,
    points_per_purchase,
    max_points_balance,
    apple_wallet_key,
    google_wallet_key,
    push_notifications_enabled,
    points_shortcuts
  } = req.body;

  try {
    const [existing] = await pool.query(
      'SELECT id FROM loyalty_config WHERE entreprise_id = ?',
      [empresaId]
    );

    if (existing.length > 0) {

      const updates = [];
      const params = [];

      if (points_adding_mode !== undefined) {
        if (!['automatic', 'manual'].includes(points_adding_mode)) {
          return res.status(400).json({ error: "Mode d'ajout des points invalide (automatic ou manual)" });
        }
        updates.push('points_adding_mode = ?');
        params.push(points_adding_mode);
      }
      if (points_per_purchase !== undefined) {
        const n = Number(points_per_purchase);
        if (!Number.isInteger(n) || n < 1 || n > 100000) {
          return res.status(400).json({ error: 'Points par achat : entier entre 1 et 100 000' });
        }
        updates.push('points_per_purchase = ?');
        params.push(n);
      }
      if (apple_wallet_key !== undefined) {
        updates.push('apple_wallet_key = ?');
        params.push(apple_wallet_key);
      }
      if (google_wallet_key !== undefined) {
        updates.push('google_wallet_key = ?');
        params.push(google_wallet_key);
      }
      if (push_notifications_enabled !== undefined) {
        updates.push('push_notifications_enabled = ?');
        params.push(push_notifications_enabled ? 1 : 0);
      }
      if (max_points_balance !== undefined) {
        updates.push('max_points_balance = ?');

        params.push(max_points_balance === null || max_points_balance === '' ? null : Math.min(10_000_000, Math.max(1, parseInt(max_points_balance) || 1)));
      }
      if (points_shortcuts !== undefined) {
        updates.push('points_shortcuts = ?');

        const arr = Array.isArray(points_shortcuts) ? points_shortcuts.filter(n => Number.isInteger(n) && n > 0 && n <= 100000).slice(0, 12) : [];
        params.push(arr.length > 0 ? JSON.stringify(arr) : null);
      }

      if (updates.length > 0) {
        updates.push('updated_at = NOW()');
        params.push(empresaId);
        const sql = `UPDATE loyalty_config SET ${updates.join(', ')} WHERE entreprise_id = ?`;
        await pool.query(sql, params);
      }
    } else {
      const configId = randomUUID();
      await pool.query(
        `INSERT INTO loyalty_config (
          id, entreprise_id, points_adding_mode, points_per_purchase,
          apple_wallet_key, google_wallet_key, push_notifications_enabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          configId, 
          empresaId, 
          points_adding_mode === 'automatic' ? 'automatic' : 'manual',
          Number.isInteger(Number(points_per_purchase)) && Number(points_per_purchase) > 0 ? Number(points_per_purchase) : 10,
          apple_wallet_key || '', 
          google_wallet_key || '',
          push_notifications_enabled !== false ? 1 : 0
        ]
      );
    }

    walletSyncService.syncCompanyWallets(empresaId).catch(err => 
      logger.error('Global synchronization failed after loyalty config update', err)
    );

    res.json({ success: true, message: 'Configuration de fidélité mise à jour' });
  } catch (err) {
    logger.error('Update loyalty config error for enterprise: ' + empresaId, { 
      error: err.message, 
      stack: err.stack 
    });

    res.status(500).json({ error: 'Erreur serveur' });
  }
};


export const getRewardTiers = async (req, res) => {
  const empresaId = req.user.id;
  try {
    const [tiers] = await pool.query(
      `SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC`,
      [empresaId]
    );
    res.json(tiers);
  } catch (err) {
    logger.error('Get reward tiers error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createRewardTier = async (req, res) => {
  const empresaId = req.user.id;
  const { points_required, title, description } = req.body;

  if (!title || typeof title !== 'string' || !Number.isInteger(Number(points_required)) || Number(points_required) <= 0) {
    return res.status(400).json({ error: 'points_required doit être un entier positif et title est obligatoire' });
  }
  if (title.length > 100 || (description && String(description).length > 500)) {
    return res.status(400).json({ error: 'Titre (100 caractères max) ou description (500 max) trop long' });
  }

  try {
    const id = randomUUID();
    await pool.query(
      `INSERT INTO reward_tiers (id, entreprise_id, points_required, title, description) VALUES (?, ?, ?, ?, ?)`,
      [id, empresaId, points_required, title, description || '']
    );

    walletSyncService.syncCompanyWallets(empresaId).catch(err => logger.error('Sync failed tier create', err));

    res.status(201).json({ success: true, id, message: 'Palier ajouté' });
  } catch (err) {
    logger.error('Create reward tier error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateRewardTier = async (req, res) => {
  const empresaId = req.user.id;
  const tierId = req.params.id;
  const { points_required, title, description } = req.body;

  if (points_required !== undefined && (!Number.isInteger(Number(points_required)) || Number(points_required) <= 0)) {
    return res.status(400).json({ error: 'points_required doit être un entier positif' });
  }
  if ((title !== undefined && (typeof title !== 'string' || !title.trim() || title.length > 100)) || (description && String(description).length > 500)) {
    return res.status(400).json({ error: 'Titre (1 à 100 caractères) ou description (500 max) invalide' });
  }

  try {
    await pool.query(
      `UPDATE reward_tiers SET points_required = COALESCE(?, points_required), title = COALESCE(?, title), description = COALESCE(?, description) WHERE id = ? AND entreprise_id = ?`,
      [points_required, title, description, tierId, empresaId]
    );

    walletSyncService.syncCompanyWallets(empresaId).catch(err => logger.error('Sync failed tier update', err));

    res.json({ success: true, message: 'Palier mis à jour' });
  } catch (err) {
    logger.error('Update reward tier error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteRewardTier = async (req, res) => {
  const empresaId = req.user.id;
  const tierId = req.params.id;

  try {
    await pool.query(
      `DELETE FROM reward_tiers WHERE id = ? AND entreprise_id = ?`,
      [tierId, empresaId]
    );

    walletSyncService.syncCompanyWallets(empresaId).catch(err => logger.error('Sync failed tier delete', err));

    res.json({ success: true, message: 'Palier supprimé' });
  } catch (err) {
    logger.error('Delete reward tier error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


export const sendPushNotification = async (req, res) => {
  const { title, message, target_segment = null } = req.body;
  try {
    const result = await sendCampaign(req.user.id, { title, message, segment: target_segment });
    res.status(result.status).json(result.body);
  } catch (err) {
    logger.error('Send push notification error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPushNotificationHistory = async (req, res) => {
  const empresaId = req.user.id;
  const { limit = 20, offset = 0 } = req.query;
  const safeLimit = Math.min(Math.max(1, parseInt(limit) || 20), 200);
  const safeOffset = Math.max(0, parseInt(offset) || 0);

  try {
    const [notifications] = await pool.query(
      `SELECT * FROM push_notifications_sent WHERE entreprise_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [empresaId, safeLimit, safeOffset]
    );

    const [totalCount] = await pool.query(
      'SELECT COUNT(*) as count FROM push_notifications_sent WHERE entreprise_id = ?',
      [empresaId]
    );

    res.json({
      notifications,
      total: totalCount[0].count,
      limit: safeLimit,
      offset: safeOffset
    });
  } catch (err) {
    logger.error('Get push notification history error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPushNotificationDetails = async (req, res) => {
  const empresaId = req.user.id;
  const { notificationId } = req.params;

  try {
    const [notification] = await pool.query(
      `SELECT * FROM push_notifications_sent WHERE id = ? AND entreprise_id = ?`,
      [notificationId, empresaId]
    );

    if (notification.length === 0) {
      return res.status(404).json({ error: 'Notification non trouvée' });
    }

    const [recipients] = await pool.query(
      `SELECT status, COUNT(*) as count FROM client_push_notifications WHERE notification_id = ? GROUP BY status`,
      [notificationId]
    );

    res.json({
      notification: notification[0],
      recipientStats: recipients
    });
  } catch (err) {
    logger.error('Get push notification details error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


/**
 * Points d'un client par date d'acquisition (FIFO : les points utilisés consomment les plus anciens).
 * Retourne :
 *  - toExpire   : points arrivés à échéance (non encore retirés) ;
 *  - soonPoints : points qui expirent dans les 7 prochains jours ;
 *  - warnPoints : points qui expirent dans exactement 6 à 7 jours (alerte envoyée une seule fois,
 *                 par le passage quotidien de 10 h).
 */
export const computeClientExpiration = async (clientId, expirationMonths) => {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setMonth(cutoff.getMonth() - expirationMonths);
  const day = 24 * 60 * 60 * 1000;
  const soonCutoff = new Date(cutoff.getTime() + 7 * day);
  const warnStart = new Date(cutoff.getTime() + 6 * day);

  const [txns] = await pool.query(
    `SELECT points_change, created_at FROM transaction_history
     WHERE client_id = ? AND points_change <> 0 ORDER BY created_at ASC, id ASC`,
    [clientId]
  );
  const batches = [];
  for (const t of txns) {
    if (t.points_change > 0) {
      batches.push({ amount: t.points_change, date: new Date(t.created_at) });
    } else {
      let consume = Math.abs(t.points_change);
      while (consume > 0 && batches.length > 0) {
        if (batches[0].amount <= consume) {
          consume -= batches[0].amount;
          batches.shift();
        } else {
          batches[0].amount -= consume;
          consume = 0;
        }
      }
    }
  }

  let toExpire = 0;
  let soonPoints = 0;
  let warnPoints = 0;
  for (const b of batches) {
    if (b.date <= cutoff) toExpire += b.amount;
    else if (b.date <= soonCutoff) {
      soonPoints += b.amount;
      if (b.date > warnStart) warnPoints += b.amount;
    }
  }
  return { toExpire, soonPoints, warnPoints };
};

/**
 * Retire les points arrivés à échéance d'un client (mise à jour atomique) et met sa carte à jour
 * sans notification. Retourne le nombre de points retirés.
 */
const expireClientPoints = async (client, expirationMonths) => {
  const { toExpire } = await computeClientExpiration(client.id, expirationMonths);
  if (toExpire <= 0) return 0;

  const conn = await pool.getConnection();
  let removed = 0;
  try {
    await conn.beginTransaction();
    const [[fresh]] = await conn.query('SELECT points FROM clients WHERE id = ? FOR UPDATE', [client.id]);
    removed = Math.min(Number(fresh?.points) || 0, toExpire);
    if (removed > 0) {
      await conn.query('UPDATE clients SET points = points - ? WHERE id = ?', [removed, client.id]);
    }
    // L'opération est toujours tracée pour que les points échus ne soient pas recomptés.
    await conn.query(
      `INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, stamps_change, description)
       VALUES (?, ?, ?, 'points_expired', ?, 0, ?)`,
      [randomUUID(), client.id, client.entreprise_id, -toExpire, `Expiration automatique — ${toExpire} point(s) arrivé(s) à échéance`]
    );
    await conn.query('UPDATE wallet_cards SET points_expired_up_to = CURDATE() WHERE client_id = ?', [client.id]);
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  walletSyncService.syncClientWallet(client.id, client.entreprise_id, -removed, { type: 'silent' })
    .catch((err) => logger.warn(`[EXPIRATION] Carte non synchronisée ${client.id}`, { error: err.message }));
  logger.info(`⏰ Expiration: ${toExpire} pts échus pour le client ${client.id}`);
  return toExpire;
};

/**
 * Expiration pour toute une entreprise : appelée par la tâche de nuit et quand le pro change la durée.
 */
export const runExpirationForEnterprise = async (entrepriseId, expirationMonths) => {
  const [clients] = await pool.query(
    'SELECT id, entreprise_id FROM clients WHERE entreprise_id = ? AND points > 0',
    [entrepriseId]
  );
  let totalExpired = 0;
  for (const client of clients) {
    try {
      totalExpired += await expireClientPoints(client, expirationMonths);
    } catch (err) {
      logger.error(`[EXPIRATION] Échec pour le client ${client.id}`, { error: err.message });
    }
  }
  return totalExpired;
};

/**
 * Alerte « vos points expirent dans 7 jours » : une seule fois par lot de points (tâche quotidienne de 10 h).
 */
export const sendExpiryWarningsForEnterprise = async (entrepriseId, expirationMonths) => {
  const [clients] = await pool.query(
    `SELECT c.id FROM clients c
     WHERE c.entreprise_id = ? AND c.points > 0
       AND EXISTS (SELECT 1 FROM wallet_cards w WHERE w.client_id = c.id)`,
    [entrepriseId]
  );
  let warned = 0;
  for (const client of clients) {
    try {
      const { warnPoints } = await computeClientExpiration(client.id, expirationMonths);
      if (warnPoints > 0) {
        await walletSyncService.syncClientWallet(client.id, entrepriseId, 0, { type: 'expiry_warning', points: warnPoints });
        warned++;
      }
    } catch (err) {
      logger.warn(`[EXPIRATION] Alerte J-7 non envoyée au client ${client.id}`, { error: err.message });
    }
  }
  return warned;
};

export const getExpirationConfig = async (req, res) => {
  const empresaId = req.user.id;
  try {
    const [[row]] = await pool.query(
      `SELECT points_expiration_months FROM loyalty_config WHERE entreprise_id = ?`,
      [empresaId]
    );
    res.json({ points_expiration_months: row?.points_expiration_months ?? null });
  } catch (err) {
    logger.error('Get expiration config error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateExpirationConfig = async (req, res) => {
  const empresaId = req.user.id;
  const { points_expiration_months } = req.body;

  if (points_expiration_months !== null &&
      (!Number.isInteger(points_expiration_months) ||
       points_expiration_months < 1 || points_expiration_months > 36)) {
    return res.status(400).json({ error: 'Valeur invalide (1–36 mois ou null)' });
  }

  try {
    await pool.query(
      `UPDATE loyalty_config SET points_expiration_months = ? WHERE entreprise_id = ?`,
      [points_expiration_months, empresaId]
    );

    let expired = 0;
    if (points_expiration_months !== null) {
      expired = await runExpirationForEnterprise(empresaId, points_expiration_months);
    }

    logger.info(`⚙️ Expiration config mise à jour: ${points_expiration_months} mois pour ${empresaId}, ${expired} pts expirés`);
    res.json({ success: true, points_expiration_months, pointsExpiredNow: expired });
  } catch (err) {
    logger.error('Update expiration config error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getLoyaltyStats = async (req, res) => {
  const empresaId = req.user.id;

  try {
    const [pointsStats] = await pool.query(
      `SELECT 
        COUNT(*) as totalClients,
        AVG(points) as avgPoints,
        MAX(points) as maxPoints,
        SUM(points) as totalPoints
        FROM clients WHERE entreprise_id = ?`,
      [empresaId]
    );

    const stats = {
      loyaltyType: 'points',
      ...pointsStats[0]
    };

    res.json(stats);
  } catch (err) {
    logger.error('Get loyalty stats error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPushQuota = async (req, res) => {
  try {
    const quota = await getQuota(req.user.id);
    if (!quota) return res.status(404).json({ error: 'Entreprise non trouvée' });
    res.json(quota);
  } catch (err) {
    logger.error('Get push quota error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
