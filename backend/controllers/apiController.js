import bcrypt from 'bcryptjs';
import { randomUUID, randomBytes } from 'crypto';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { generateToken } from '../middlewares/auth.js';
import { createSession, generateDeviceFingerprint } from '../utils/sessionManager.js';
import pool from '../db.js';
import { validatePassword, validatePasswordChange } from '../utils/passwordValidator.js';
import logger from '../utils/logger.js';
import { validateLoginInput } from '../utils/inputValidator.js';
import { sendLoyaltyUpdateNotification } from '../utils/notificationService.js';
import walletSyncService from '../utils/walletSyncService.js';
import emailService from '../utils/emailService.js';
import { withClientQuota, FreeLimitError, FREE_CLIENT_LIMIT, getAccess } from '../utils/plans.js';
import { staffLogin } from './teamController.js';
import { resolveEstablishmentId, findEstablishment } from '../utils/establishments.js';
import crypto from 'crypto';
import { stripe } from '../utils/stripeConfig.js';

// Limites des opérations de caisse (protège contre les fautes de frappe et les requêtes forgées).
const MAX_POINTS_PER_OPERATION = 100000;
const isPointsAmount = (n) => Number.isInteger(n) && n >= 0 && n <= MAX_POINTS_PER_OPERATION;
const normalizePhone = (phone) => String(phone || '').replace(/[\s.\-()]/g, '');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DUMMY_HASH = bcrypt.hashSync('fidelyz-timing-equalizer', 10);
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

const maskPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 2) return '**';
  return digits.slice(0, 2) + ' ** ** ** **';
};

const maskEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return '***@***.***';
  const domainParts = domain.split('.');
  const tld = domainParts.pop();
  return `${local[0]}***@***.${tld}`;
};

export const adminLogin = async (req, res) => {
  const { identifiant, mot_de_passe } = req.body;
  if (typeof identifiant !== 'string' || typeof mot_de_passe !== 'string' || !identifiant || !mot_de_passe) {
    return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM super_admins WHERE identifiant = ?',
      [identifiant]
    );

    if (rows.length === 0) {
      logger.warn('Failed admin login attempt - invalid identifiant');
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const admin = rows[0];
    const isPasswordValid = await bcrypt.compare(mot_de_passe, admin.mot_de_passe);

    if (!isPasswordValid) {
      logger.warn('Failed admin login attempt - invalid password');
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const token = generateToken(admin.id, 'admin');
    logger.info('Admin login successful');
    res.json({ token, message: 'Connecté' });
  } catch (err) {
    logger.error('Admin login error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getEnterprises = async (req, res) => {
  try {
    const [enterprises] = await pool.query(
      'SELECT id, nom, email, prenom, telephone, statut, loyalty_type, must_change_password, created_at FROM entreprises ORDER BY created_at DESC'
    );

    res.json(enterprises);
  } catch (err) {
    logger.error('Get enterprises error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getPublicEnterprises = async (req, res) => {
  // Recherche par nom uniquement (2 lettres minimum, 8 résultats) : la liste complète des commerces
  // clients de la plateforme n'est pas publique.
  const term = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 60) : '';
  if (term.length < 2) return res.json([]);

  try {
    const like = `%${term.replace(/[\\%_]/g, '\\$&')}%`;
    const [enterprises] = await pool.query(
      'SELECT id, nom FROM entreprises WHERE statut = "actif" AND nom LIKE ? ORDER BY nom ASC LIMIT 8',
      [like]
    );

    res.json(enterprises);
  } catch (err) {
    logger.error('Get public enterprises error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const suspendCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    logger.info('Company suspension request received');

    const [result] = await pool.query(
      'UPDATE entreprises SET statut = "suspendu" WHERE id = ?',
      [companyId]
    );

    if (result.affectedRows === 0) {
      logger.warn('Company not found for suspension');
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    logger.info('Company suspended successfully');
    res.json({ success: true, message: 'Entreprise suspendue' });
  } catch (err) {
    logger.error('Company suspension error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const reactivateCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    const [result] = await pool.query(
      'UPDATE entreprises SET statut = "actif" WHERE id = ?',
      [companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    logger.info('Company reactivated successfully');
    res.json({ success: true, message: 'Entreprise réactivée' });
  } catch (err) {
    logger.error('Reactivate company error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteCompany = async (req, res) => {
  const { companyId } = req.params;

  try {
    const [[company]] = await pool.query('SELECT stripe_subscription_id FROM entreprises WHERE id = ?', [companyId]);
    if (!company) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    // Un abonnement encore actif continuerait d'être prélevé : il est résilié avant la suppression.
    if (company.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(company.stripe_subscription_id);
      } catch (stripeErr) {
        if (stripeErr.code !== 'resource_missing') {
          logger.error('Résiliation Stripe impossible avant suppression', { error: stripeErr.message });
          return res.status(502).json({ error: "Impossible de résilier l'abonnement Stripe : suppression annulée." });
        }
      }
    }
    const [result] = await pool.query(
      'DELETE FROM entreprises WHERE id = ?',
      [companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    logger.info('Company deleted successfully');
    res.json({ success: true, message: 'Entreprise supprimée' });
  } catch (err) {
    logger.error('Delete company error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateCompany = async (req, res) => {
  const { companyId } = req.params;
  const { nom, email, prenom, telephone } = req.body;
  if (typeof nom !== 'string' || !nom.trim() || nom.length > 255 || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Nom et adresse e-mail valides requis' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE entreprises SET nom = ?, email = ?, prenom = ?, telephone = ? WHERE id = ?',
      [nom.trim(), email.trim().toLowerCase(), prenom || null, telephone || null, companyId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    logger.info('Company updated successfully');
    res.json({ success: true, message: 'Entreprise mise à jour' });
  } catch (err) {
    logger.error('Update company error', { error: err.message });
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Cet email est déjà utilisé par un autre compte' });
    }
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const proLogin = async (req, res) => {
  const { mot_de_passe } = req.body;
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!email || typeof mot_de_passe !== 'string' || !mot_de_passe) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  req.body.email = email;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM entreprises WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      if (await staffLogin(req, res)) return;
      // Même durée de réponse qu'avec un compte existant : l'e-mail ne peut pas être deviné au chronomètre.
      await bcrypt.compare(mot_de_passe, DUMMY_HASH);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const company = rows[0];

    const isPasswordValid = await bcrypt.compare(mot_de_passe, company.mot_de_passe);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    if (company.statut === 'suspendu') {
      return res.status(403).json({ error: 'Votre compte est suspendu' });
    }

    const token = generateToken(company.id, 'pro');
    const deviceFingerprint = generateDeviceFingerprint(req);
    const deviceName = req.headers['user-agent']?.substring(0, 100) || 'Unknown Device';
    const mustChangePassword = Boolean(company.must_change_password);
    if (mustChangePassword) {
      logger.info('First login - password change required');
    }
    try {
      await createSession(company.id, deviceFingerprint, deviceName, token, '24h');
      await pool.query('UPDATE entreprises SET last_login = NOW() WHERE id = ?', [company.id]).catch(() => {});
    } catch (sessionErr) {
      logger.error('Session creation failed', { error: sessionErr.message });
      return res.status(500).json({ error: 'Unable to create session' });
    }
    res.json({
      token,
      deviceId: deviceFingerprint,
      mustChangePassword,  // ← TOUJOURS boolean
      companyId: company.id,
      nom: company.nom,
      email: company.email,
      statut: company.statut,
      loyaltyType: company.loyalty_type || 'points'
    });
  } catch (err) {
    logger.error('Pro login error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const changePassword = async (req, res) => {
  const { newPassword } = req.body;
  const empresaId = req.user.id;

  try {
    if (!newPassword) {
      return res.status(400).json({ error: 'Le nouveau mot de passe est requis' });
    }
    const [rows] = await pool.query(
      'SELECT mot_de_passe, must_change_password FROM entreprises WHERE id = ?',
      [empresaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const company = rows[0];
    const complexityCheck = validatePassword(newPassword);
    if (!complexityCheck.isValid) {
      return res.status(400).json({
        error: 'Exigences du mot de passe non respectées',
        details: complexityCheck.errors
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, company.mot_de_passe);
    if (isSamePassword) {
      return res.status(400).json({
        error: 'Le nouveau mot de passe doit être différent de l\'ancien mot de passe'
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const [updateResult] = await pool.query(
      'UPDATE entreprises SET mot_de_passe = ?, must_change_password = FALSE, temporary_password = NULL WHERE id = ?',
      [hashedPassword, empresaId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ error: 'Impossible de mettre à jour le mot de passe' });
    }

    await pool.query(
      'DELETE FROM sessions WHERE entreprise_id = ? AND device_id != ?',
      [empresaId, req.user.deviceId]
    );

    logger.info('Password changed successfully');

    res.json({
      success: true,
      message: 'Mot de passe changé avec succès',
      mustChangePassword: false
    });
  } catch (err) {
    logger.error('Password change error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};


export const getProInfo = async (req, res) => {
  const empresaId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.nom, e.email, e.recompense_definition,
              lc.points_per_purchase, lc.points_for_reward,
              lc.reward_title, lc.reward_description,
              lc.push_notifications_enabled
       FROM entreprises e
       LEFT JOIN loyalty_config lc ON e.id = lc.entreprise_id
       WHERE e.id = ?`,
      [empresaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const proInfo = rows[0];
    const safeProInfo = {
      ...proInfo,
      points_per_purchase: Number(proInfo.points_per_purchase || 0),
      points_for_reward: Number(proInfo.points_for_reward || 0),
      push_notifications_enabled: Boolean(proInfo.push_notifications_enabled)
    };

    res.json(safeProInfo);
  } catch (err) {
    logger.error('Get pro info error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getProStatus = async (req, res) => {
  const empresaId = req.user.id;

  try {
    const [rows] = await pool.query(
      'SELECT id, nom, email, statut, recompense_definition FROM entreprises WHERE id = ?',
      [empresaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const access = await getAccess(empresaId);
    res.json({
      ...rows[0],
      tier: access.tier,
      client_count: access.client_count,
      client_limit: access.limit,
      locked: access.locked,
      blocked: access.blocked,
      staff_role: req.user.staffRole || null,
      staff_name: req.user.staffName || null,
      establishment_id: req.user.establishmentId || null
    });
  } catch (err) {
    logger.error('Get pro status error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
export const getProSessions = async (req, res) => {
  const empresaId = req.user.id;

  try {
    const [sessions] = await pool.query(
      `SELECT id, device_id, device_name, last_activity, expires_at, created_at
       FROM sessions 
       WHERE entreprise_id = ? AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [empresaId]
    );

    res.json(sessions.map(s => ({
      ...s,
      isCurrentDevice: s.device_id === req.user.deviceId,
      expiresIn: s.expires_at
    })));
  } catch (err) {
    logger.error('Register client error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
export const logoutProDevice = async (req, res) => {
  const empresaId = req.user.id;
  const { deviceId } = req.body;

  if (!deviceId) {
    return res.status(400).json({ error: 'deviceId requis' });
  }

  try {
    const [result] = await pool.query(
      'DELETE FROM sessions WHERE entreprise_id = ? AND device_id = ?',
      [empresaId, deviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Session non trouvée' });
    }

    res.json({ success: true, message: 'Déconnexion de l\'appareil réussie' });
  } catch (err) {
    logger.error('Logout pro device error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
export const logoutProAll = async (req, res) => {
  const empresaId = req.user.id;
  const { keepCurrent } = req.body; // Optional: keep current device connected

  try {
    let query = 'DELETE FROM sessions WHERE entreprise_id = ?';
    let params = [empresaId];

    if (keepCurrent && req.user.deviceId) {
      query += ' AND device_id != ?';
      params.push(req.user.deviceId);
    }

    const [result] = await pool.query(query, params);

    res.json({
      success: true,
      message: keepCurrent ? 'Déconnexion de tous les autres appareils' : 'Déconnexion complète',
      devicesRemoved: result.affectedRows
    });
  } catch (err) {
    logger.error('Logout pro all error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getClients = async (req, res) => {
  const empresaId = req.user.id;

  try {
    const [configRows] = await pool.query(
      'SELECT loyalty_type FROM loyalty_config WHERE entreprise_id = ?',
      [empresaId]
    );

    const loyaltyType = configRows.length > 0 ? configRows[0].loyalty_type : 'points';

    const [rows] = await pool.query(
      `SELECT c.id, c.nom, c.prenom, c.telephone, c.email, c.type_wallet,
              c.marketing_optin,
              c.points as points,
              (SELECT COUNT(*) FROM apple_pass_registrations r
               JOIN wallet_cards w ON r.pass_serial_number = w.pass_serial_number
               WHERE w.client_id = c.id) as device_count
       FROM clients c
       WHERE c.entreprise_id = ?
       ORDER BY c.created_at DESC`,
      [empresaId]
    );

    const maskedRows = rows.map(client => {
      if (client.marketing_optin) return client;
      return {
        ...client,
        telephone: maskPhone(client.telephone),
        email: maskEmail(client.email),
      };
    });

    logger.info(`📋 Fetching ${rows.length} clients for enterprise ${empresaId}.`);
    res.json(maskedRows);
  } catch (err) {
    logger.error('Get clients error for enterprise: ' + empresaId, {
      error: err.message,
      stack: err.stack
    });
    res.status(500).json({ error: 'Erreur lors du chargement de la liste des clients' });
  }
};

export const getTransactionHistory = async (req, res) => {
  const empresaId = req.user.id;
  const { dateFrom, dateTo, clientName, type } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = 100;
  const offset = (page - 1) * limit;

  try {
    let where = 'WHERE th.entreprise_id = ?';
    const params = [empresaId];

    if (dateFrom) { where += ' AND DATE(th.created_at) >= ?'; params.push(dateFrom); }
    if (dateTo)   { where += ' AND DATE(th.created_at) <= ?'; params.push(dateTo); }
    if (type)     { where += ' AND th.type = ?'; params.push(type); }
    if (clientName) {
      where += " AND CONCAT(c.prenom, ' ', c.nom) LIKE ?";
      params.push(`%${String(clientName).slice(0, 100).replace(/[\\%_]/g, '\\$&')}%`);
    }

    const [rows] = await pool.query(
      `SELECT th.id, th.type, th.points_change, th.description, th.created_at,
              c.nom, c.prenom, c.telephone
       FROM transaction_history th
       LEFT JOIN clients c ON c.id = th.client_id
       ${where}
       ORDER BY th.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM transaction_history th LEFT JOIN clients c ON c.id = th.client_id ${where}`,
      params
    );

    res.json({ transactions: rows, total: countRows[0].total, page, limit });
  } catch (err) {
    logger.error('getTransactionHistory error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteTransactionHistory = async (req, res) => {
  const empresaId = req.user.id;
  try {
    await pool.query('DELETE FROM transaction_history WHERE entreprise_id = ?', [empresaId]);
    res.json({ success: true });
  } catch (err) {
    logger.error('deleteTransactionHistory error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteClient = async (req, res) => {
  const { clientId } = req.params;
  const empresaId = req.user.id;

  try {
    const [clientRows] = await pool.query(
      'SELECT id FROM clients WHERE id = ? AND entreprise_id = ?',
      [clientId, empresaId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
    }
    await pool.query(
      'DELETE FROM clients WHERE id = ? AND entreprise_id = ?',
      [clientId, empresaId]
    );

    logger.info(`🗑️ Client supprimé par le pro ${empresaId}: ${clientId}`);
    res.json({ success: true, message: 'Client supprimé avec succès' });
  } catch (err) {
    logger.error('Delete client error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur lors de la suppression' });
  }
};

export const handleScan = async (req, res) => {
  const { clientId, points_to_add } = req.body;
  const bodyPoints = typeof points_to_add === 'number' ? points_to_add : Number(points_to_add);
  const empresaId = req.user.id;
  const establishmentId = await resolveEstablishmentId(req);

  if (!clientId) {
    return res.status(400).json({ error: 'clientId requis' });
  }
  if (points_to_add !== undefined && points_to_add !== null && points_to_add !== '' && !isPointsAmount(bodyPoints)) {
    return res.status(400).json({ error: `Nombre de points invalide (entier entre 0 et ${MAX_POINTS_PER_OPERATION})` });
  }

  try {
    const [clientRows] = await pool.query(
      'SELECT nom, prenom, points FROM clients WHERE id = ? AND entreprise_id = ?',
      [clientId, empresaId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
    }

    const [config] = await pool.query(
      'SELECT points_adding_mode, points_per_purchase, max_points_balance, reward_title FROM loyalty_config WHERE entreprise_id = ?',
      [empresaId]
    );

    if (config.length === 0) {
      return res.status(400).json({ error: 'Configuration de fidélité non trouvée' });
    }

    const loyaltyConfig = config[0];
    let pointsToAdd = Number(points_to_add);
    if ((isNaN(pointsToAdd) || pointsToAdd <= 0) && loyaltyConfig.points_adding_mode === 'automatic') {
      pointsToAdd = Number(loyaltyConfig.points_per_purchase) || 10;
    } else if (isNaN(pointsToAdd) || pointsToAdd < 0) {
      pointsToAdd = 0; // Sécurité pour le mode manuel
    }

    const maxBalance = loyaltyConfig.max_points_balance;
    let newPoints;
    const scanConn = await pool.getConnection();
    try {
      await scanConn.beginTransaction();
      const [[freshClient]] = await scanConn.query(
        'SELECT points FROM clients WHERE id = ? AND entreprise_id = ? FOR UPDATE',
        [clientId, empresaId]
      );
      if (!freshClient) throw Object.assign(new Error('Client supprimé'), { statusCode: 404 });
      const currentPoints = Number(freshClient.points) || 0;
      newPoints = currentPoints + pointsToAdd;
      if (maxBalance !== null && maxBalance !== undefined && newPoints > maxBalance) {
        newPoints = maxBalance;
        pointsToAdd = Math.max(0, maxBalance - currentPoints);
      }
      await scanConn.query(
        'UPDATE clients SET points = ? WHERE id = ? AND entreprise_id = ?',
        [newPoints, clientId, empresaId]
      );
      if (pointsToAdd > 0) {
        await scanConn.query(
          "INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, description, establishment_id) VALUES (?, ?, ?, 'add_points', ?, ?, ?)",
          [randomUUID(), clientId, empresaId, pointsToAdd, pointsToAdd + ' point(s) ajouté(s)', establishmentId]
        );
      }
      await scanConn.commit();
    } catch (txErr) {
      await scanConn.rollback();
      throw txErr;
    } finally {
      scanConn.release();
    }

    if (pointsToAdd > 0) {
      sendLoyaltyUpdateNotification(clientId, empresaId, pointsToAdd).catch(e =>
        logger.warn('Push scan notification failed', { error: e.message })
      );
    }
    res.json({
      success: true,
      clientId,
      clientName: clientRows[0].prenom + ' ' + clientRows[0].nom,
      pointsAdded: pointsToAdd,
      newPoints: newPoints
    });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Client non trouvé' });
    logger.error('Handle scan error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Recherche les infos d'un client lors d'un scan (Sans modification)
 */
export const getScanInfo = async (req, res) => {
  const { clientId } = req.params;
  const empresaId = req.user.id;

  try {
    const [clientRows] = await pool.query(
      'SELECT nom, prenom, points FROM clients WHERE id = ? AND entreprise_id = ?',
      [clientId, empresaId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const client = clientRows[0];
    const [allTiers] = await pool.query(
      'SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC',
      [empresaId]
    );
    const [nextTiers] = await pool.query(
      'SELECT * FROM reward_tiers WHERE entreprise_id = ? AND points_required > ? ORDER BY points_required ASC LIMIT 1',
      [empresaId, client.points]
    );

    res.json({
      success: true,
      clientName: `${client.prenom} ${client.nom}`,
      currentPoints: client.points || 0,
      allRewards: allTiers,
      nextTier: nextTiers.length > 0 ? nextTiers[0] : null
    });

  } catch (err) {
    logger.error('Error in getScanInfo', err);
    res.status(500).json({ error: 'Erreur serveur lors de la lecture des infos client' });
  }
};

/**
 * Finalise une transaction complète (Cadeau + Points)
 */
export const finalizeFullTransaction = async (req, res) => {
  const { clientId, pointsToAdd, rewardTierId } = req.body;
  const empresaId = req.user.id;
  const establishmentId = await resolveEstablishmentId(req);
  const requestedPoints = pointsToAdd === undefined || pointsToAdd === null || pointsToAdd === '' ? 0 : Number(pointsToAdd);
  if (!isPointsAmount(requestedPoints)) {
    return res.status(400).json({ error: `Nombre de points invalide (entier entre 0 et ${MAX_POINTS_PER_OPERATION})` });
  }

  try {
    const [clientCheck] = await pool.query(
      'SELECT id FROM clients WHERE id = ? AND entreprise_id = ?',
      [clientId, empresaId]
    );
    if (clientCheck.length === 0) return res.status(404).json({ error: 'Client non trouvé' });

    const [cfgRows] = await pool.query(
      'SELECT max_points_balance FROM loyalty_config WHERE entreprise_id = ?',
      [empresaId]
    );
    const maxBalance = cfgRows.length > 0 ? cfgRows[0].max_points_balance : null;

    let tier = null;
    if (rewardTierId) {
      const [tierRows] = await pool.query(
        'SELECT id, title, points_required FROM reward_tiers WHERE id = ? AND entreprise_id = ?',
        [rewardTierId, empresaId]
      );
      if (tierRows.length === 0) return res.status(404).json({ error: 'Récompense invalide' });
      tier = tierRows[0];
    }

    let currentPoints;
    let totalChange = 0;
    const descriptionParts = [];
    const pendingWrites = [];

    const ftConn = await pool.getConnection();
    try {
      await ftConn.beginTransaction();

      const [[freshClient]] = await ftConn.query(
        'SELECT points FROM clients WHERE id = ? AND entreprise_id = ? FOR UPDATE',
        [clientId, empresaId]
      );
      if (!freshClient) throw Object.assign(new Error('Client supprimé'), { statusCode: 404 });
      currentPoints = Number(freshClient.points) || 0;

      if (tier) {
        if (currentPoints >= tier.points_required) {
          currentPoints -= tier.points_required;
          totalChange -= tier.points_required;
          descriptionParts.push(`Cadeau "${tier.title}" utilisé (-${tier.points_required} pts)`);
          pendingWrites.push([
            "INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, description, establishment_id) VALUES (?, ?, ?, 'redeem_reward', ?, ?, ?)",
            [randomUUID(), clientId, empresaId, -tier.points_required, `Utilisation : ${tier.title}`, establishmentId]
          ]);
        } else {
          await ftConn.rollback();
          return res.status(400).json({ error: 'Points insuffisants pour ce cadeau' });
        }
      }

      let ptsToAdd = requestedPoints;
      if (maxBalance !== null && maxBalance !== undefined && ptsToAdd > 0) {
        const roomLeft = Math.max(0, maxBalance - currentPoints);
        ptsToAdd = Math.min(ptsToAdd, roomLeft);
      }
      if (ptsToAdd > 0) {
        currentPoints += ptsToAdd;
        totalChange += ptsToAdd;
        descriptionParts.push(`${ptsToAdd} points ajoutés pour l'achat`);
        pendingWrites.push([
          "INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, description, establishment_id) VALUES (?, ?, ?, 'add_points', ?, ?, ?)",
          [randomUUID(), clientId, empresaId, ptsToAdd, `${ptsToAdd} points ajoutés`, establishmentId]
        ]);
      }

      pendingWrites.push([
        'UPDATE clients SET points = ? WHERE id = ? AND entreprise_id = ?',
        [currentPoints, clientId, empresaId]
      ]);

      for (const [sql, params] of pendingWrites) {
        await ftConn.query(sql, params);
      }
      await ftConn.commit();
    } catch (txErr) {
      await ftConn.rollback();
      throw txErr;
    } finally {
      ftConn.release();
    }

    const added = totalChange + (tier ? tier.points_required : 0);
    if (tier || added > 0) {
      sendLoyaltyUpdateNotification(clientId, empresaId, totalChange,
        tier ? { type: 'redeem', points: tier.points_required, title: tier.title, added } : null
      ).catch(e => logger.warn('Push transaction notification failed', { error: e.message }));
    }

    res.json({
      success: true,
      newPoints: currentPoints,
      message: descriptionParts.join(' | ') || 'Transaction effectuée'
    });

  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Client non trouvé' });
    logger.error('Error in finalizeFullTransaction', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la finalisation de la transaction' });
  }
};

export const adjustPoints = async (req, res) => {
  const { clientId } = req.params;
  const { adjustment } = req.body;
  const empresaId = req.user.id;
  const establishmentId = await resolveEstablishmentId(req);

  const adj = Number(adjustment);
  if (!Number.isInteger(adj) || adj === 0 || Math.abs(adj) > MAX_POINTS_PER_OPERATION) {
    return res.status(400).json({ error: `Ajustement invalide (entier non nul, ${MAX_POINTS_PER_OPERATION} maximum)` });
  }

  try {
    const [clientRows] = await pool.query(
      'SELECT points, nom FROM clients WHERE id = ? AND entreprise_id = ?',
      [clientId, empresaId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé ou non autorisé' });
    }

    let newPoints;
    let applied = 0;
    const adjConn = await pool.getConnection();
    try {
      await adjConn.beginTransaction();
      const [[freshClient]] = await adjConn.query(
        'SELECT points FROM clients WHERE id = ? AND entreprise_id = ? FOR UPDATE',
        [clientId, empresaId]
      );
      if (!freshClient) throw Object.assign(new Error('Client supprimé'), { statusCode: 404 });
      newPoints = Math.max(0, Number(freshClient.points || 0) + adj);
      applied = newPoints - Number(freshClient.points || 0);
      await adjConn.query(
        'UPDATE clients SET points = ? WHERE id = ? AND entreprise_id = ?',
        [newPoints, clientId, empresaId]
      );
      await adjConn.query(
        "INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, description, establishment_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [randomUUID(), clientId, empresaId,
         applied >= 0 ? 'add_points' : 'remove_points',
         applied,
         applied >= 0 ? `${applied} point(s) ajouté(s) manuellement` : `${Math.abs(applied)} point(s) retiré(s)`, establishmentId
        ]
      );
      await adjConn.commit();
    } catch (txErr) {
      await adjConn.rollback();
      throw txErr;
    } finally {
      adjConn.release();
    }

    if (applied !== 0) {
      sendLoyaltyUpdateNotification(clientId, empresaId, applied).catch(e =>
        logger.warn('Push adjust notification failed', { error: e.message })
      );
    }

    res.json({ success: true, newPoints });
  } catch (err) {
    if (err.statusCode === 404) return res.status(404).json({ error: 'Client non trouvé' });
    logger.error('Adjust points error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};



export const getCompanyInfo = async (req, res) => {
  const { companyId } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT e.id, e.nom, e.statut,
              (SELECT COALESCE(NULLIF(cc.apple_logo_url, ''), NULLIF(cc.logo_url, ''), NULLIF(cc.google_logo_url, ''))
               FROM card_customization cc WHERE cc.company_id = e.id ORDER BY cc.updated_at DESC LIMIT 1) AS logo_url
       FROM entreprises e WHERE e.id = ?`,
      [companyId]
    );

    if (rows.length === 0 || rows[0].statut !== 'actif') {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const { logo_url, ...company } = rows[0];
    const file = logo_url && logo_url.includes('uploads/') ? logo_url.substring(logo_url.indexOf('uploads/')) : null;
    res.json({ ...company, logo: file ? `/api/${file}` : null });
  } catch (err) {
    logger.error('Get company info error', { error: err.message, stack: err.stack });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const registerClientAndGeneratePass = async (req, res) => {
  const { entrepriseId } = req.params;
  const { nom, prenom, telephone, email, type_wallet, marketing_optin, website, started_at } = req.body;

  // Anti-robot : champ piège (invisible pour un humain) et délai minimal depuis l'affichage du formulaire.
  if (website) {
    return res.status(400).json({ error: 'Inscription impossible' });
  }
  const startedAt = Number(started_at);
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 3000) {
    return res.status(400).json({ error: 'Veuillez prendre un instant pour remplir le formulaire, puis réessayez.' });
  }

  if (!nom || !prenom || !telephone || !type_wallet) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }
  if (typeof nom !== 'string' || nom.length > 50 || typeof prenom !== 'string' || prenom.length > 50 ||
      (email && (typeof email !== 'string' || email.length > 100))) {
    return res.status(400).json({ error: 'Données invalides (longueur maximale dépassée)' });
  }
  const phone = normalizePhone(telephone);
  if (!/^\+?[0-9]{8,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Numéro de téléphone invalide' });
  }

  if (email && !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }

  if (!['apple', 'google'].includes(type_wallet)) {
    return res.status(400).json({ error: 'Type de wallet invalide' });
  }

  try {
    const [companyRows] = await pool.query(
      'SELECT id, nom FROM entreprises WHERE id = ? AND statut = "actif"',
      [entrepriseId]
    );

    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée ou inactive' });
    }

    const [dupRows] = await pool.query(
      'SELECT id FROM clients WHERE telephone = ? AND entreprise_id = ?',
      [phone, entrepriseId]
    );
    if (dupRows.length > 0) {
      return res.status(409).json({ error: 'Ce numéro est déjà inscrit dans ce programme de fidélité.' });
    }

    const clientId = randomUUID();
    const clientEstablishment = await findEstablishment(entrepriseId, req.body.establishment_id);
    const marketingOptinValue = marketing_optin === true || marketing_optin === 'true' ? 1 : 0;
    await withClientQuota(entrepriseId, (conn) => conn.query(
      'INSERT INTO clients (id, entreprise_id, nom, prenom, telephone, email, points, type_wallet, marketing_optin, establishment_id) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      [clientId, entrepriseId, nom.trim(), prenom.trim(), phone, email ? email.trim().toLowerCase() : null, type_wallet, marketingOptinValue, clientEstablishment]
    ));

    logger.info(`✅ Client inscrit: ${clientId}, marketing_optin=${marketingOptinValue}`);
    return res.status(201).json({
      success: true,
      clientId: clientId,
      message: 'Client créé avec succès'
    });
  } catch (err) {
    if (err instanceof FreeLimitError) {
      return res.status(403).json({ error: "Les inscriptions sont momentanément fermées pour ce commerce.", code: 'registrations_closed' });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ce numéro est déjà inscrit dans ce programme de fidélité.' });
    }
    logger.error('Erreur lors de la création du client (SQL/Logic):', { error: err.message });
    return res.status(500).json({ error: 'Erreur lors de la création de la carte' });
  }
};

export const createClientAndInvite = async (req, res) => {
  const entrepriseId = req.user.id; // always from JWT, never from body
  const { nom, prenom, telephone, email, type_wallet } = req.body;
  // Le consentement marketing doit être recueilli auprès du client : jamais coché par défaut.
  const marketingOptin = req.body.marketing_optin === true || req.body.marketing_optin === 'true' ? 1 : 0;

  if (!nom || !prenom || !telephone || !email || !type_wallet) {
    return res.status(400).json({ error: 'Tous les champs sont requis (nom, prénom, téléphone, email, type_wallet)' });
  }
  const phone = normalizePhone(telephone);
  if (typeof nom !== 'string' || nom.length > 50 ||
      typeof prenom !== 'string' || prenom.length > 50 ||
      !/^\+?[0-9]{8,15}$/.test(phone)) {
    return res.status(400).json({ error: 'Données invalides (nom, prénom ou téléphone)' });
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email) || email.length > 100) {
    return res.status(400).json({ error: 'Adresse email invalide' });
  }
  if (!['apple', 'google'].includes(type_wallet)) {
    return res.status(400).json({ error: 'Type de wallet invalide' });
  }

  try {
    const [companyRows] = await pool.query(
      'SELECT id, nom FROM entreprises WHERE id = ? AND statut = "actif"',
      [entrepriseId]
    );
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée ou inactive' });
    }
    const companyName = companyRows[0].nom;

    const [dupPhone] = await pool.query(
      'SELECT id FROM clients WHERE telephone = ? AND entreprise_id = ?',
      [phone, entrepriseId]
    );
    if (dupPhone.length > 0) {
      return res.status(409).json({ error: 'Ce numéro de téléphone est déjà inscrit.' });
    }

    const [dupEmail] = await pool.query(
      'SELECT id FROM clients WHERE email = ? AND entreprise_id = ?',
      [email, entrepriseId]
    );
    if (dupEmail.length > 0) {
      return res.status(409).json({ error: 'Cette adresse email est déjà inscrite.' });
    }

    const clientId = randomUUID();
    await withClientQuota(entrepriseId, async (conn) => conn.query(
      'INSERT INTO clients (id, entreprise_id, nom, prenom, telephone, email, points, type_wallet, marketing_optin, establishment_id) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)',
      [clientId, entrepriseId, nom.trim(), prenom.trim(), phone, email.trim().toLowerCase(), type_wallet, marketingOptin, await resolveEstablishmentId(req)]
    ));

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;
    const downloadUrl = `${apiBase}/api/app/wallet/client-download/${clientId}`;

    try {
      await emailService.sendClientInviteEmail({ email, prenom, downloadUrl, companyName });
    } catch (mailErr) {
      logger.error('Échec envoi email invitation client (non bloquant):', { error: mailErr.message });
    }

    logger.info(`✅ Client créé et invité par pro: ${clientId} (${prenom} ${nom})`);
    return res.status(201).json({ success: true, clientId, message: 'Client créé et email d\'invitation envoyé' });
  } catch (err) {
    if (err instanceof FreeLimitError) {
      return res.status(403).json({ error: `Limite de ${FREE_CLIENT_LIMIT} clients atteinte avec l'offre gratuite : passez à Pro ou supprimez des clients.`, code: 'free_limit_reached', status: 'limit_exceeded' });
    }
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ce numéro de téléphone est déjà inscrit.' });
    }
    logger.error('Erreur createClientAndInvite:', { error: err.message });
    return res.status(500).json({ error: 'Erreur lors de la création du client' });
  }
};

export const sendClientDownloadLinks = async (req, res) => {
  const entrepriseId = req.user.id; // always from JWT
  const { clientIds } = req.body;

  if (!Array.isArray(clientIds) || clientIds.length === 0) {
    return res.status(400).json({ error: 'clientIds doit être un tableau non vide' });
  }
  if (clientIds.length > 100) {
    return res.status(400).json({ error: 'Maximum 100 clients par envoi' });
  }
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!clientIds.every(id => typeof id === 'string' && uuidRegex.test(id))) {
    return res.status(400).json({ error: 'Format de clientId invalide' });
  }

  try {
    const [companyRows] = await pool.query(
      'SELECT id, nom FROM entreprises WHERE id = ? AND statut = "actif"',
      [entrepriseId]
    );
    if (companyRows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }
    const companyName = companyRows[0].nom;
    const placeholders = clientIds.map(() => '?').join(',');
    const [clients] = await pool.query(
      `SELECT id, prenom, nom, email FROM clients WHERE id IN (${placeholders}) AND entreprise_id = ?`,
      [...clientIds, entrepriseId]
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const apiBase = frontendUrl.endsWith('/') ? frontendUrl.slice(0, -1) : frontendUrl;

    let sent = 0;
    let skipped = 0;
    for (const client of clients) {
      if (!client.email) { skipped++; continue; }
      const downloadUrl = `${apiBase}/api/app/wallet/client-download/${client.id}`;
      try {
        await emailService.sendCardDownloadLinkEmail({ email: client.email, prenom: client.prenom, downloadUrl, companyName });
        sent++;
      } catch (mailErr) {
        logger.error(`Échec envoi lien re-téléchargement à ${client.id}:`, { error: mailErr.message });
        skipped++;
      }
    }

    logger.info(`✅ Liens re-téléchargement envoyés: ${sent} succès, ${skipped} ignorés (entreprise ${entrepriseId})`);
    return res.json({ success: true, sent, skipped });
  } catch (err) {
    logger.error('Erreur sendClientDownloadLinks:', { error: err.message });
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getCardCustomization = async (req, res) => {
  const companyId = req.params.companyId ?? req.params.empresaId;
  const { loyaltyType } = req.query;

  try {
    if (!loyaltyType || !['points', 'stamps'].includes(loyaltyType)) {
      return res.status(400).json({ error: 'loyaltyType invalide' });
    }

    const [customization] = await pool.query(
      'SELECT * FROM card_customization WHERE company_id = ? AND loyalty_type = ?',
      [companyId, loyaltyType]
    );

    if (customization.length === 0) {
      return res.json({
        primary_color: '#1f2937',
        text_color: '#ffffff',
        accent_color: '#3b82f6',
        secondary_color: '#374151',
        logo_url: null,
        background_pattern: 'solid',
        card_title: '',
        card_subtitle: '',
        footer_text: '',
        back_fields_info: '',
        back_fields_terms: '',
        back_fields_website: '',
        back_fields_phone: '',
        back_fields_address: '',
        back_fields_instagram: '',
        back_fields_facebook: '',
        back_fields_tiktok: '',
        apple_organization_name: '',
        apple_pass_description: 'Votre carte de fidélité numérique',
        google_primary_color: '#1f2937',
        google_text_color: '#ffffff',
        google_logo_url: null,
        google_hero_image_url: null,
        google_card_title: '',
        google_card_subtitle: '',
        apple_review_url: '',
        google_review_url: '',
        locations: []
      });
    }

    let parsedResult = { ...customization[0] };
    if (typeof parsedResult.locations === 'string') {
      try {
        parsedResult.locations = JSON.parse(parsedResult.locations);
      } catch (e) {
        logger.warn('locations JSON parse error in getCardCustomization', { raw: parsedResult.locations, error: e.message });
        parsedResult.locations = [];
      }
    }

    res.json(parsedResult);
  } catch (err) {
    logger.error('Load card customization error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Champs de personnalisation acceptés : [nom, type, longueur max]. Les autres sont ignorés.
// color : #RRGGBB ou rgb(...) ; image : fichier téléversé (uploads/...) ; url : lien http(s) ; text : texte libre.
const CUSTOMIZATION_FIELDS = [
  ['primary_color', 'color'], ['text_color', 'color'], ['accent_color', 'color'], ['secondary_color', 'color'],
  ['logo_url', 'image'], ['icon_url', 'image'], ['strip_image_url', 'image'],
  ['logo_text', 'text', 40], ['card_subtitle', 'text', 255], ['card_title', 'text', 255],
  ['back_fields_info', 'text', 2000], ['back_fields_terms', 'text', 2000], ['back_fields_website', 'text', 255],
  ['back_fields_phone', 'text', 30], ['back_fields_address', 'text', 255],
  ['back_fields_instagram', 'text', 255], ['back_fields_facebook', 'text', 255], ['back_fields_tiktok', 'text', 255],
  ['apple_organization_name', 'text', 100], ['apple_pass_description', 'text', 255],
  ['apple_background_color', 'color'], ['apple_text_color', 'color'], ['apple_label_color', 'color'],
  ['apple_logo_url', 'image'], ['apple_icon_url', 'image'], ['apple_strip_image_url', 'image'],
  ['latitude', 'lat'], ['longitude', 'lng'], ['relevant_text', 'text', 100],
  ['google_primary_color', 'color'], ['google_text_color', 'color'],
  ['google_logo_url', 'image'], ['google_hero_image_url', 'image'],
  ['google_card_title', 'text', 255], ['google_card_subtitle', 'text', 255],
  ['google_back_phone', 'text', 30], ['google_back_website', 'text', 255], ['google_back_address', 'text', 255],
  ['google_back_instagram', 'text', 255], ['google_back_facebook', 'text', 255], ['google_back_tiktok', 'text', 255],
  ['apple_review_url', 'url', 500], ['google_review_url', 'url', 500]
];
const DEFAULT_COLORS = { primary_color: '#1f2937', text_color: '#ffffff', accent_color: '#3b82f6', secondary_color: '#374151', google_primary_color: '#1f2937', google_text_color: '#ffffff' };
const COLOR_RE = /^(#[0-9a-f]{6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))$/i;
const IMAGE_RE = /^(api\/)?uploads\/[\w.-]+\.(png|jpe?g|webp)$/i;

const cleanField = (name, type, max, value) => {
  if (value === undefined || value === null) return { value: DEFAULT_COLORS[name] ?? null };
  const v = String(value).trim();
  if (v === '') return { value: DEFAULT_COLORS[name] ?? (type === 'text' && ['card_title', 'card_subtitle', 'google_card_title', 'google_card_subtitle'].includes(name) ? '' : null) };
  switch (type) {
    case 'color':
      return COLOR_RE.test(v) ? { value: v } : { error: `Couleur invalide (${name})` };
    case 'image': {
      const local = v.includes('uploads/') ? v.substring(v.indexOf('uploads/')) : v;
      return IMAGE_RE.test(local) ? { value: local } : { error: `Image invalide (${name}) : utilisez le bouton de téléversement` };
    }
    case 'url': {
      const link = /^https?:\/\//i.test(v) ? v : `https://${v}`;
      return /^https?:\/\/[^\s<>"']+\.[^\s<>"']+$/i.test(link) && link.length <= max ? { value: link } : { error: 'Lien invalide (exemple : https://g.page/r/...)' };
    }
    case 'lat':
    case 'lng': {
      const n = Number(v);
      const limit = type === 'lat' ? 90 : 180;
      return Number.isFinite(n) && Math.abs(n) <= limit ? { value: n } : { error: 'Coordonnées GPS invalides' };
    }
    default:
      return { value: v.slice(0, max) };
  }
};

// Emplacements GPS (10 au maximum pour Apple Wallet) : { latitude, longitude, relevantText }.
const cleanLocations = (locations) => {
  if (!Array.isArray(locations)) return null;
  const list = locations.slice(0, 10).map((l) => ({
    latitude: Number(l?.latitude),
    longitude: Number(l?.longitude),
    relevantText: typeof l?.relevantText === 'string' ? l.relevantText.trim().slice(0, 100) : '',
    ...(typeof l?.name === 'string' && { name: l.name.trim().slice(0, 100) }),
    ...(typeof l?.address === 'string' && { address: l.address.trim().slice(0, 255) })
  })).filter((l) => Number.isFinite(l.latitude) && Number.isFinite(l.longitude) && Math.abs(l.latitude) <= 90 && Math.abs(l.longitude) <= 180);
  return JSON.stringify(list);
};

/**
 * PUT /api/pro/card-customization/:empresaId?loyaltyType=points
 * La mise à jour des cartes déjà installées est silencieuse : les messages aux clients passent par les campagnes.
 */
export const updateCardCustomization = async (req, res) => {
  const { empresaId } = req.params;
  const { loyaltyType } = req.query;

  try {
    if (empresaId !== req.user.id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    if (!loyaltyType || !['points', 'stamps'].includes(loyaltyType)) {
      return res.status(400).json({ error: 'loyaltyType invalide' });
    }

    const values = {};
    for (const [name, type, max] of CUSTOMIZATION_FIELDS) {
      const { value, error } = cleanField(name, type, max, req.body[name]);
      if (error) return res.status(400).json({ error });
      values[name] = value;
    }
    values.locations = cleanLocations(req.body.locations);

    const columns = Object.keys(values);
    const [existing] = await pool.query(
      'SELECT id FROM card_customization WHERE company_id = ? AND loyalty_type = ?',
      [empresaId, loyaltyType]
    );

    if (existing.length === 0) {
      await pool.query(
        `INSERT INTO card_customization (id, company_id, loyalty_type, ${columns.join(', ')})
         VALUES (?, ?, ?, ${columns.map(() => '?').join(', ')})`,
        [randomUUID(), empresaId, loyaltyType, ...columns.map((c) => values[c])]
      );
    } else {
      await pool.query(
        `UPDATE card_customization SET ${columns.map((c) => `${c} = ?`).join(', ')}, updated_at = NOW()
         WHERE company_id = ? AND loyalty_type = ?`,
        [...columns.map((c) => values[c]), empresaId, loyaltyType]
      );
    }

    walletSyncService.syncCompanyWallets(empresaId).catch(err =>
      logger.error('Global synchronization failed after customization update', { error: err.message })
    );

    res.json({
      success: true,
      message: `Personnalisation ${loyaltyType} mise à jour avec succès`
    });
  } catch (err) {
    logger.error('Update card customization error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/pro/card-customization/:empresaId/gps — emplacements et texte de proximité (écran verrouillé).
 */
export const updateCardCustomizationGPS = async (req, res) => {
  const empresaId = req.params.empresaId;
  const loyaltyType = ['points', 'stamps'].includes(req.query.loyaltyType) ? req.query.loyaltyType : 'points';

  if (empresaId !== req.user.id) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  const relevant = cleanField('relevant_text', 'text', 100, req.body.relevant_text).value;

  try {
    await pool.query(
      'UPDATE card_customization SET relevant_text = ?, locations = ?, updated_at = NOW() WHERE company_id = ? AND loyalty_type = ?',
      [relevant, cleanLocations(req.body.locations), empresaId, loyaltyType]
    );

    walletSyncService.syncCompanyWallets(empresaId).catch(err =>
      logger.error('Sync failed after GPS update', { error: err.message })
    );

    res.json({ success: true });
  } catch (err) {
    logger.error('Update GPS customization error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const uploadLogo = async (req, res) => {
  const { imageType, platform } = req.query; // 'logo', 'icon', 'strip', 'hero', 'notification_icon' + 'apple'/'google'
  const tempPath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier envoyé' });
    }

    let resizeOpts = { height: 150, width: 480, fit: 'inside' }; // logo Apple (@3x)
    if (platform === 'google') {
      if (imageType === 'logo') {
        resizeOpts = { width: 660, height: 660, fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } };
      } else if (imageType === 'hero') {
        resizeOpts = { width: 1032, height: 336, fit: 'cover' };
      }
    } else if (imageType === 'icon' || imageType === 'notification_icon') {
      resizeOpts = { width: 87, height: 87, fit: 'cover' };
    } else if (imageType === 'strip') {
      resizeOpts = { width: 1125, height: 369, fit: 'cover' };
    }

    // Le fichier final est toujours un PNG ré-encodé par sharp (un fichier qui n'est pas une image est refusé).
    const finalFilename = `${req.user.id}-${Date.now()}-${randomBytes(4).toString('hex')}.png`;
    const finalPath = path.join(req.file.destination, finalFilename);
    await sharp(tempPath, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize(resizeOpts)
      .png()
      .toFile(finalPath);

    await fs.promises.unlink(tempPath).catch(() => {});
    res.json({ success: true, url: `uploads/${finalFilename}` });
  } catch (err) {
    if (tempPath) await fs.promises.unlink(tempPath).catch(() => {});
    logger.warn('Upload image refusé', { error: err.message });
    res.status(400).json({ error: "Ce fichier n'est pas une image valide (PNG, JPEG ou WebP)." });
  }
};

export const redeemReward = async (req, res) => {
  const { clientId, rewardTierId } = req.body;
  const empresaId = req.user.id;
  const establishmentId = await resolveEstablishmentId(req);
  if (!clientId || !rewardTierId) {
    return res.status(400).json({ error: 'clientId et rewardTierId requis' });
  }
  try {
    const [tiers] = await pool.query('SELECT * FROM reward_tiers WHERE id = ? AND entreprise_id = ?', [rewardTierId, empresaId]);
    if (tiers.length === 0) return res.status(404).json({ error: 'Récompense invalide' });
    const tier = tiers[0];
    let newPoints;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[clientRow]] = await conn.query(
        'SELECT points FROM clients WHERE id = ? AND entreprise_id = ? FOR UPDATE',
        [clientId, empresaId]
      );
      if (!clientRow) {
        await conn.rollback();
        return res.status(404).json({ error: 'Client introuvable' });
      }
      const currentPoints = clientRow.points || 0;
      if (currentPoints < tier.points_required) {
        await conn.rollback();
        return res.status(400).json({ error: 'Points insuffisants' });
      }
      newPoints = currentPoints - tier.points_required;
      await conn.query('UPDATE clients SET points = ? WHERE id = ? AND entreprise_id = ?', [newPoints, clientId, empresaId]);
      await conn.query(
        "INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, description, establishment_id) VALUES (?, ?, ?, 'redeem_reward', ?, ?, ?)",
        [randomUUID(), clientId, empresaId, -tier.points_required, `Utilisation : ${tier.title}`, establishmentId]
      );
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    sendLoyaltyUpdateNotification(clientId, empresaId, -tier.points_required,
      { type: 'redeem', points: tier.points_required, title: tier.title }
    ).catch(pushErr => logger.warn('Push redeem notification failed', { error: pushErr.message }));

    res.json({ success: true, message: 'Cadeau validé ! (-' + tier.points_required + ' pts)', newPoints });
  } catch (err) {
    logger.error('Redeem reward error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * Demande de réinitialisation de mot de passe (propriétaire du compte).
 * Réponse identique que l'adresse existe ou non ; seul le hachage du jeton est stocké.
 */
export const forgotPassword = async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const genericResponse = {
    success: true,
    message: 'Si cet email est enregistré, vous recevrez un lien de réinitialisation sous peu.'
  };
  if (!email) {
    return res.status(400).json({ error: 'Email requis' });
  }

  try {
    const [rows] = await pool.query("SELECT id FROM entreprises WHERE email = ? AND statut = 'actif'", [email]);
    if (rows.length === 0) return res.json(genericResponse);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 heure
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
    await pool.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)', [email, sha256(token), expiresAt]);

    const frontendUrl = (process.env.FRONTEND_URL || 'https://fidelyzapp.fr').replace(/\/$/, '');
    emailService.sendPasswordResetEmail(email, `${frontendUrl}/password-recovery?token=${token}`)
      .catch((err) => logger.error('Envoi e-mail de réinitialisation échoué', { error: err.message }));

    res.json(genericResponse);
  } catch (err) {
    logger.error('Forgot password error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la demande de réinitialisation' });
  }
};

/**
 * Exécution de la réinitialisation de mot de passe.
 */
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token) || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Lien invalide ou expiré' });
  }

  // Le mot de passe est vérifié AVANT de consommer le jeton : une erreur de saisie ne grille pas le lien.
  const complexityCheck = validatePassword(newPassword);
  if (!complexityCheck.isValid) {
    return res.status(400).json({ error: 'Exigences du mot de passe non respectées', details: complexityCheck.errors });
  }

  try {
    const tokenHash = sha256(token);
    const [resetRows] = await pool.query(
      'SELECT email FROM password_resets WHERE token = ? AND expires_at > NOW()',
      [tokenHash]
    );
    if (resetRows.length === 0) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }
    const email = resetRows[0].email;

    const [deleteResult] = await pool.query('DELETE FROM password_resets WHERE token = ?', [tokenHash]);
    if (deleteResult.affectedRows === 0) {
      return res.status(400).json({ error: 'Lien invalide ou expiré' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE entreprises SET mot_de_passe = ?, must_change_password = 0, temporary_password = NULL, updated_at = NOW() WHERE email = ?',
      [hashedPassword, email]
    );
    await pool.query('DELETE FROM sessions WHERE entreprise_id = (SELECT id FROM entreprises WHERE email = ?)', [email]);

    logger.info('Mot de passe réinitialisé');
    res.json({ success: true, message: 'Votre mot de passe a été mis à jour avec succès.' });
  } catch (err) {
    logger.error('Reset password error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
};
