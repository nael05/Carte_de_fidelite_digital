import pool from '../db.js';
import logger from '../utils/logger.js';

export const getProOverview = async (req, res) => {
  const entrepriseId = req.user.id;
  try {
    const [[totals]] = await pool.query(
      `SELECT
        COUNT(*) AS totalClients,
        SUM(CASE WHEN type_wallet = 'apple' THEN 1 ELSE 0 END) AS appleClients,
        SUM(CASE WHEN type_wallet = 'google' THEN 1 ELSE 0 END) AS googleClients,
        SUM(points) AS totalPointsInCirculation
       FROM clients WHERE entreprise_id = ?`,
      [entrepriseId]
    );

    const [[activeClients]] = await pool.query(
      `SELECT COUNT(DISTINCT client_id) AS activeClients
       FROM transaction_history
       WHERE entreprise_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [entrepriseId]
    );

    const [[thisMonth]] = await pool.query(
      `SELECT
        SUM(CASE WHEN type = 'add_points' THEN points_change ELSE 0 END) AS pointsDistributed,
        SUM(CASE WHEN type = 'redeem_reward' THEN ABS(points_change) ELSE 0 END) AS pointsRedeemed,
        SUM(CASE WHEN type = 'points_expired' THEN ABS(points_change) ELSE 0 END) AS pointsExpired,
        COUNT(CASE WHEN type = 'add_points' THEN 1 END) AS scansThisMonth
       FROM transaction_history
       WHERE entreprise_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [entrepriseId]
    );

    const [[lastMonth]] = await pool.query(
      `SELECT COUNT(CASE WHEN type = 'add_points' THEN 1 END) AS scansLastMonth
       FROM transaction_history
       WHERE entreprise_id = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 60 DAY)
         AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [entrepriseId]
    );

    const [[newClientsThisMonth]] = await pool.query(
      `SELECT COUNT(*) AS newClients FROM clients
       WHERE entreprise_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      [entrepriseId]
    );

    res.json({
      totalClients: totals.totalClients || 0,
      appleClients: totals.appleClients || 0,
      googleClients: totals.googleClients || 0,
      totalPointsInCirculation: totals.totalPointsInCirculation || 0,
      activeClientsThisMonth: activeClients.activeClients || 0,
      newClientsThisMonth: newClientsThisMonth.newClients || 0,
      pointsDistributedThisMonth: thisMonth.pointsDistributed || 0,
      pointsRedeemedThisMonth: thisMonth.pointsRedeemed || 0,
      pointsExpiredThisMonth: thisMonth.pointsExpired || 0,
      scansThisMonth: thisMonth.scansThisMonth || 0,
      scansLastMonth: lastMonth.scansLastMonth || 0,
    });
  } catch (err) {
    logger.error('getProOverview error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getProActivity = async (req, res) => {
  const entrepriseId = req.user.id;
  const { period = '30' } = req.query;
  const days = Math.min(parseInt(period) || 30, 90);
  try {
    const [daily] = await pool.query(
      `SELECT
        DATE(created_at) AS date,
        COUNT(CASE WHEN type = 'add_points' THEN 1 END) AS scans,
        SUM(CASE WHEN type = 'add_points' THEN points_change ELSE 0 END) AS pointsAdded,
        COUNT(CASE WHEN type = 'redeem_reward' THEN 1 END) AS redemptions
       FROM transaction_history
       WHERE entreprise_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [entrepriseId, days]
    );

    const [byDayOfWeek] = await pool.query(
      `SELECT
        DAYOFWEEK(created_at) AS dow,
        COUNT(*) AS count
       FROM transaction_history
       WHERE entreprise_id = ? AND type = 'add_points'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       GROUP BY DAYOFWEEK(created_at)
       ORDER BY dow`,
      [entrepriseId]
    );

    const [byHour] = await pool.query(
      `SELECT
        HOUR(created_at) AS hour,
        COUNT(*) AS count
       FROM transaction_history
       WHERE entreprise_id = ? AND type = 'add_points'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY HOUR(created_at)
       ORDER BY hour`,
      [entrepriseId]
    );

    res.json({ daily, byDayOfWeek, byHour });
  } catch (err) {
    logger.error('getProActivity error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getProClients = async (req, res) => {
  const entrepriseId = req.user.id;
  try {
    const [distribution] = await pool.query(
      `SELECT
        CASE
          WHEN points = 0 THEN '0'
          WHEN points BETWEEN 1 AND 10 THEN '1-10'
          WHEN points BETWEEN 11 AND 25 THEN '11-25'
          WHEN points BETWEEN 26 AND 50 THEN '26-50'
          WHEN points BETWEEN 51 AND 100 THEN '51-100'
          ELSE '100+'
        END AS range_label,
        COUNT(*) AS count
       FROM clients WHERE entreprise_id = ?
       GROUP BY range_label
       ORDER BY MIN(points)`,
      [entrepriseId]
    );

    const [retention] = await pool.query(
      `SELECT
        SUM(CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) AS last7days,
        SUM(CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS last30days,
        SUM(CASE WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 1 ELSE 0 END) AS last90days,
        SUM(CASE WHEN last_seen < DATE_SUB(NOW(), INTERVAL 90 DAY) OR last_seen IS NULL THEN 1 ELSE 0 END) AS inactive,
        COUNT(*) AS total
       FROM (
         SELECT c.id,
           MAX(th.created_at) AS last_seen
         FROM clients c
         LEFT JOIN transaction_history th ON th.client_id = c.id
         WHERE c.entreprise_id = ?
         GROUP BY c.id
       ) sub`,
      [entrepriseId]
    );

    const [growth] = await pool.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS newClients
       FROM clients
       WHERE entreprise_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [entrepriseId]
    );

    res.json({ distribution, retention: retention[0], growth });
  } catch (err) {
    logger.error('getProClients error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getProRewards = async (req, res) => {
  const entrepriseId = req.user.id;
  try {
    const [tiers] = await pool.query(
      `SELECT rt.title, rt.points_required,
        COUNT(th.id) AS redemptions,
        COUNT(th.id) * rt.points_required AS totalPointsSpent
       FROM reward_tiers rt
       LEFT JOIN transaction_history th
         ON th.entreprise_id = ? AND th.type = 'redeem_reward'
         AND th.description LIKE CONCAT('%', rt.title, '%')
       WHERE rt.entreprise_id = ?
       GROUP BY rt.id, rt.title, rt.points_required
       ORDER BY redemptions DESC`,
      [entrepriseId, entrepriseId]
    );

    const [[totals]] = await pool.query(
      `SELECT
        COUNT(*) AS totalRedemptions,
        SUM(ABS(points_change)) AS totalPointsSpent
       FROM transaction_history
       WHERE entreprise_id = ? AND type = 'redeem_reward'`,
      [entrepriseId]
    );

    const [monthly] = await pool.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS redemptions
       FROM transaction_history
       WHERE entreprise_id = ? AND type = 'redeem_reward'
         AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`,
      [entrepriseId]
    );

    res.json({ tiers, totals: totals || {}, monthly });
  } catch (err) {
    logger.error('getProRewards error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const [[platform]] = await pool.query(
      `SELECT
        COUNT(*) AS totalEnterprises,
        SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) AS activeEnterprises,
        SUM(CASE WHEN statut = 'suspendu' THEN 1 ELSE 0 END) AS suspendedEnterprises
       FROM entreprises`
    );

    const [[clients]] = await pool.query(
      `SELECT
        COUNT(*) AS totalClients,
        SUM(CASE WHEN type_wallet = 'apple' THEN 1 ELSE 0 END) AS appleClients,
        SUM(CASE WHEN type_wallet = 'google' THEN 1 ELSE 0 END) AS googleClients
       FROM clients`
    );

    const [[activity]] = await pool.query(
      `SELECT
        COUNT(*) AS totalTransactions,
        SUM(CASE WHEN type = 'add_points' THEN points_change ELSE 0 END) AS totalPointsDistributed,
        SUM(CASE WHEN type = 'redeem_reward' THEN ABS(points_change) ELSE 0 END) AS totalPointsRedeemed
       FROM transaction_history
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`
    );

    const [topEnterprises] = await pool.query(
      `SELECT e.nom, e.id,
        COUNT(DISTINCT c.id) AS clientCount,
        COUNT(th.id) AS scanCount
       FROM entreprises e
       LEFT JOIN clients c ON c.entreprise_id = e.id
       LEFT JOIN transaction_history th ON th.entreprise_id = e.id
         AND th.type = 'add_points'
         AND th.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY e.id, e.nom
       ORDER BY scanCount DESC
       LIMIT 10`
    );

    const [growth] = await pool.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS newClients
       FROM clients
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`
    );

    const [enterpriseGrowth] = await pool.query(
      `SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        COUNT(*) AS newEnterprises
       FROM entreprises
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`
    );

    res.json({ platform, clients, activity, topEnterprises, growth, enterpriseGrowth });
  } catch (err) {
    logger.error('getAdminStats error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
