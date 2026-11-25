import { randomUUID } from 'crypto';
import pool from '../db.js';
import logger from './logger.js';
import { prepareCampaign } from './pushGuard.js';
import walletSyncService from './walletSyncService.js';

export const TITLE_MAX = 60;
export const MESSAGE_MAX = 200;

/**
 * Envoi d'une campagne (notification promotionnelle) : point d'entrée unique.
 * Applique les garde-fous (offre payante, une campagne par jour et par entreprise, heures calmes,
 * accord marketing, carte au Wallet) puis affiche le message sur les cartes Apple et Google.
 *
 * Retourne { status, body } prêt à être renvoyé au client HTTP.
 */
export const sendCampaign = async (entrepriseId, { title, message, clientIds = null, segment = null }) => {
  title = typeof title === 'string' ? title.trim() : '';
  message = typeof message === 'string' ? message.trim() : '';
  if (!title || !message) return { status: 400, body: { error: 'Titre et message requis' } };
  if (title.length > TITLE_MAX || message.length > MESSAGE_MAX) {
    return { status: 400, body: { error: `Titre (${TITLE_MAX} caractères max) ou message (${MESSAGE_MAX} caractères max) trop long` } };
  }
  if (segment !== null && !['active', 'inactive', 'all'].includes(segment)) {
    return { status: 400, body: { error: 'Segment invalide' } };
  }
  if (clientIds !== null && (!Array.isArray(clientIds) || clientIds.length > 5000 || !clientIds.every((id) => typeof id === 'string'))) {
    return { status: 400, body: { error: 'Liste de clients invalide' } };
  }

  const notificationId = randomUUID();
  let recipients;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Verrou par commerce : deux envois simultanés ne peuvent pas dépasser la limite d'une par jour.
    await conn.query('SELECT id FROM entreprises WHERE id = ? FOR UPDATE', [entrepriseId]);
    const campaign = await prepareCampaign(entrepriseId, { clientIds, segment: segment === 'all' ? null : segment });
    if (campaign.error) {
      await conn.rollback();
      return { status: campaign.error.status, body: campaign.error.body };
    }
    recipients = campaign.clientIds;

    await conn.query(
      `INSERT INTO push_notifications_sent
       (id, entreprise_id, title, message, target_type, target_segment, recipients_count, status, sent_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', NOW())`,
      [notificationId, entrepriseId, title, message, clientIds ? 'specific' : 'all', segment, recipients.length]
    );
    await conn.query(
      'INSERT INTO client_push_notifications (id, client_id, notification_id, status, sent_at) VALUES ?',
      [recipients.map((cid) => [randomUUID(), cid, notificationId, 'sent', new Date()])]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }

  const reach = await walletSyncService.notifyClients(entrepriseId, recipients, title, message)
    .catch((err) => {
      logger.error('[CAMPAGNE] Diffusion en échec', { error: err.message });
      return { apple: 0, google: 0 };
    });
  logger.info('[CAMPAGNE] Envoyée', { entrepriseId, notificationId, recipients: recipients.length, ...reach });

  return {
    status: 200,
    body: {
      success: true,
      notificationId,
      recipientsCount: recipients.length,
      appleDevices: reach.apple,
      googleCards: reach.google,
      status: 'sent',
      message: `Campagne envoyée à ${recipients.length} client${recipients.length > 1 ? 's' : ''}`
    }
  };
};

export default { sendCampaign };
