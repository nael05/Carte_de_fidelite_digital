import pool from '../db.js';
import logger from '../utils/logger.js';
import { sendCampaign } from '../utils/campaignService.js';

/**
 * GET /api/pro/push/history — historique des campagnes.
 */
export const getHistory = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM push_notifications_sent WHERE entreprise_id = ? ORDER BY created_at DESC LIMIT 200',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    logger.error('Error fetching push history', { error: err.message });
    res.status(500).json({ error: "Erreur lors de la récupération de l'historique" });
  }
};

/**
 * POST /api/pro/push/send { clientIds, title, message } — campagne à des clients choisis.
 * Mêmes règles que /pro/notifications/send (voir utils/campaignService.js).
 */
export const sendNotification = async (req, res) => {
  const { clientIds, title, message } = req.body;
  if (!Array.isArray(clientIds) || clientIds.length === 0) {
    return res.status(400).json({ error: 'Veuillez sélectionner au moins un client' });
  }
  try {
    const result = await sendCampaign(req.user.id, { title, message, clientIds });
    res.status(result.status).json(result.body);
  } catch (err) {
    logger.error('Error sending push notification', { error: err.message });
    res.status(500).json({ error: "Erreur lors de l'envoi des notifications" });
  }
};
