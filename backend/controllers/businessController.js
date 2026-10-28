import pool from '../db.js';
import logger from '../utils/logger.js';

// Fonctionnalités de l'offre Business : clients à relancer, indicateurs avancés, exports CSV.
// Respect du RGPD : les coordonnées d'un client ne sont exposées que s'il a donné son accord marketing.

const clampDays = (value, fallback = 30) => Math.min(365, Math.max(7, parseInt(value, 10) || fallback));

// GET /api/pro/business/relaunch?days=30
// Clients sans visite depuis N jours, et clients proches d'une récompense.
export const getRelaunchList = async (req, res) => {
  const entrepriseId = req.user.id;
  const days = clampDays(req.query.days);

  try {
    const [inactive] = await pool.query(
      `SELECT c.id, c.prenom, c.nom, c.points, c.marketing_optin,
              IF(c.marketing_optin = 1, c.telephone, NULL) AS telephone,
              IF(c.marketing_optin = 1, c.email, NULL) AS email,
              MAX(th.created_at) AS last_visit,
              COUNT(th.id) AS visits
       FROM clients c
       LEFT JOIN transaction_history th ON th.client_id = c.id AND th.type = 'add_points'
       WHERE c.entreprise_id = ?
       GROUP BY c.id
       HAVING last_visit IS NULL OR last_visit < DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY c.points DESC, last_visit ASC
       LIMIT 200`,
      [entrepriseId, days]
    );

    const [configRows] = await pool.query(
      'SELECT points_for_reward FROM loyalty_config WHERE entreprise_id = ?',
      [entrepriseId]
    );
    const target = Number(configRows[0]?.points_for_reward) || 0;

    let nearReward = [];
    if (target > 0) {
      [nearReward] = await pool.query(
        `SELECT c.id, c.prenom, c.nom, c.points, c.marketing_optin,
                IF(c.marketing_optin = 1, c.telephone, NULL) AS telephone,
                IF(c.marketing_optin = 1, c.email, NULL) AS email
         FROM clients c
         WHERE c.entreprise_id = ? AND c.points >= ? AND c.points < ?
         ORDER BY c.points DESC
         LIMIT 100`,
        [entrepriseId, Math.ceil(target * 0.8), target]
      );
    }

    res.json({ days, reward_target: target || null, inactive, near_reward: nearReward });
  } catch (err) {
    logger.error('Business relaunch error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors du chargement des clients à relancer' });
  }
};

// GET /api/pro/business/insights
export const getInsights = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [[totals]] = await pool.query(
      `SELECT COUNT(*) AS total_clients,
              SUM(visits >= 1) AS visited,
              SUM(visits >= 2) AS returning_clients,
              COALESCE(AVG(visits), 0) AS avg_visits
       FROM (
         SELECT c.id, COUNT(th.id) AS visits
         FROM clients c
         LEFT JOIN transaction_history th ON th.client_id = c.id AND th.type = 'add_points'
         WHERE c.entreprise_id = ?
         GROUP BY c.id
       ) v`,
      [entrepriseId]
    );

    const [topClients] = await pool.query(
      `SELECT c.id, c.prenom, c.nom, c.points, COUNT(th.id) AS visits, MAX(th.created_at) AS last_visit
       FROM clients c
       JOIN transaction_history th ON th.client_id = c.id AND th.type = 'add_points'
       WHERE c.entreprise_id = ?
       GROUP BY c.id
       ORDER BY visits DESC, c.points DESC
       LIMIT 10`,
      [entrepriseId]
    );

    const [signups] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS clients
       FROM clients
       WHERE entreprise_id = ? AND created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 5 MONTH)
       GROUP BY month
       ORDER BY month`,
      [entrepriseId]
    );

    const [[rewards]] = await pool.query(
      `SELECT COUNT(*) AS redeemed
       FROM transaction_history
       WHERE entreprise_id = ? AND type = 'redeem_reward' AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`,
      [entrepriseId]
    );

    const visited = Number(totals.visited) || 0;
    res.json({
      total_clients: Number(totals.total_clients) || 0,
      visited_clients: visited,
      returning_clients: Number(totals.returning_clients) || 0,
      return_rate: visited ? Math.round((Number(totals.returning_clients) / visited) * 100) : 0,
      avg_visits: Math.round(Number(totals.avg_visits) * 10) / 10,
      rewards_90d: Number(rewards.redeemed) || 0,
      top_clients: topClients,
      signups_by_month: signups
    });
  } catch (err) {
    logger.error('Business insights error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors du calcul des indicateurs' });
  }
};

// Séparateur « ; » et BOM UTF-8 : s'ouvre correctement dans Excel en français.
// Les cellules commençant par = + - @ sont neutralisées (injection de formules).
const cell = (value) => {
  if (value === null || value === undefined) return '';
  let text = value instanceof Date ? value.toISOString().slice(0, 19).replace('T', ' ') : String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const sendCsv = (res, filename, header, rows) => {
  const body = [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('﻿' + body);
};

const today = () => new Date().toISOString().slice(0, 10);

// GET /api/pro/business/export/clients.csv
export const exportClientsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.prenom, c.nom,
              IF(c.marketing_optin = 1, c.telephone, NULL) AS telephone,
              IF(c.marketing_optin = 1, c.email, NULL) AS email,
              c.points, c.type_wallet, c.marketing_optin, c.created_at,
              COUNT(th.id) AS visites, MAX(th.created_at) AS derniere_visite,
              (SELECT nom FROM establishments WHERE id = c.establishment_id) AS etablissement
       FROM clients c
       LEFT JOIN transaction_history th ON th.client_id = c.id AND th.type = 'add_points'
       WHERE c.entreprise_id = ?
       GROUP BY c.id
       ORDER BY c.created_at DESC
       LIMIT 50000`,
      [req.user.id]
    );
    sendCsv(res, `clients-${today()}.csv`,
      ['Prénom', 'Nom', 'Téléphone', 'E-mail', 'Points', 'Wallet', 'Accord marketing', 'Inscrit le', 'Visites', 'Dernière visite', 'Établissement'],
      rows.map((r) => [r.prenom, r.nom, r.telephone, r.email, r.points, r.type_wallet, r.marketing_optin ? 'oui' : 'non', r.created_at, r.visites, r.derniere_visite, r.etablissement])
    );
  } catch (err) {
    logger.error('Export clients CSV error', { error: err.message });
    res.status(500).json({ error: "Erreur lors de l'export" });
  }
};

// GET /api/pro/business/export/transactions.csv
export const exportTransactionsCsv = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT th.created_at, c.prenom, c.nom, th.type, th.points_change, th.description,
              (SELECT nom FROM establishments WHERE id = th.establishment_id) AS etablissement
       FROM transaction_history th
       LEFT JOIN clients c ON c.id = th.client_id
       WHERE th.entreprise_id = ?
       ORDER BY th.created_at DESC
       LIMIT 50000`,
      [req.user.id]
    );
    sendCsv(res, `transactions-${today()}.csv`,
      ['Date', 'Prénom', 'Nom', 'Type', 'Variation de points', 'Description', 'Établissement'],
      rows.map((r) => [r.created_at, r.prenom, r.nom, r.type, r.points_change, r.description, r.etablissement])
    );
  } catch (err) {
    logger.error('Export transactions CSV error', { error: err.message });
    res.status(500).json({ error: "Erreur lors de l'export" });
  }
};

export default { getRelaunchList, getInsights, exportClientsCsv, exportTransactionsCsv };
