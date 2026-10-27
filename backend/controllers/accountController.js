import pool from '../db.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as randomUUID } from 'uuid';
import logger from '../utils/logger.js';
import emailService from '../utils/emailService.js';

// GET /api/pro/account - Get current account info
export const getAccountInfo = async (req, res) => {
  const entrepriseId = req.user.id;

  try {
    const [rows] = await pool.query(
      `SELECT id, nom, raison_sociale, email, created_at, subscription_status, subscription_plan, current_period_end
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const entreprise = rows[0];
    res.json({
      id: entreprise.id,
      nom: entreprise.nom,
      raison_sociale: entreprise.raison_sociale,
      email: entreprise.email,
      created_at: entreprise.created_at,
      subscription_status: entreprise.subscription_status,
      subscription_plan: entreprise.subscription_plan,
      current_period_end: entreprise.current_period_end
    });
  } catch (err) {
    logger.error('Get account info error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/pro/account/email - Request email change (sends confirmation link)
export const requestEmailChange = async (req, res) => {
  const { new_email } = req.body;
  const entrepriseId = req.user.id;

  if (!new_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(new_email)) {
    return res.status(400).json({ error: 'Email invalide' });
  }

  try {
    // Check if new email already exists
    const [existing] = await pool.query(
      'SELECT id FROM entreprises WHERE email = ? AND id != ?',
      [new_email, entrepriseId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    await pool.query(
      `UPDATE entreprises
       SET email_change_token = ?, email_change_new_email = ?, email_change_expiry = ?
       WHERE id = ?`,
      [tokenHash, new_email, tokenExpiry, entrepriseId]
    );

    // Send confirmation email
    const confirmUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pro/confirm-email?token=${token}`;
    emailService.sendEmailConfirmationLink({
      current_email: req.user.email,
      new_email: new_email,
      confirm_url: confirmUrl
    }).catch(err => {
      logger.error('Failed to send email confirmation', { error: err.message });
    });

    res.json({
      success: true,
      message: 'Email de confirmation envoyé à votre nouvelle adresse'
    });
  } catch (err) {
    logger.error('Email change request error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/pro/account/confirm-email - Confirm email change with token
export const confirmEmailChange = async (req, res) => {
  const { token } = req.body;
  const entrepriseId = req.user.id;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT email_change_token, email_change_new_email, email_change_expiry
       FROM entreprises WHERE id = ?`,
      [entrepriseId]
    );

    if (rows.length === 0 || !rows[0].email_change_token) {
      return res.status(400).json({ error: 'Aucune demande de changement d\'email' });
    }

    const { email_change_token, email_change_new_email, email_change_expiry } = rows[0];

    // Check token expiry
    if (new Date() > new Date(email_change_expiry)) {
      return res.status(400).json({ error: 'Lien expiré. Demandez un nouveau changement d\'email.' });
    }

    // Verify token
    const isValid = await bcrypt.compare(token, email_change_token);
    if (!isValid) {
      return res.status(400).json({ error: 'Token invalide' });
    }

    // Update email
    await pool.query(
      `UPDATE entreprises
       SET email = ?, email_change_token = NULL, email_change_new_email = NULL, email_change_expiry = NULL
       WHERE id = ?`,
      [email_change_new_email, entrepriseId]
    );

    logger.info('Email changed successfully', { entreprise_id: entrepriseId });
    res.json({
      success: true,
      new_email: email_change_new_email,
      message: 'Email changé avec succès'
    });
  } catch (err) {
    logger.error('Email confirmation error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// PUT /api/pro/account/password - Change password
export const changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;
  const entrepriseId = req.user.id;

  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit faire minimum 8 caractères' });
  }

  if (old_password === new_password) {
    return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT mot_de_passe FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    // Verify old password
    const isValid = await bcrypt.compare(old_password, rows[0].mot_de_passe);
    if (!isValid) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await pool.query(
      'UPDATE entreprises SET mot_de_passe = ? WHERE id = ?',
      [hashedPassword, entrepriseId]
    );

    logger.info('Password changed successfully', { entreprise_id: entrepriseId });
    res.json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  } catch (err) {
    logger.error('Password change error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// DELETE /api/pro/account - Delete account (GDPR compliance)
export const deleteAccount = async (req, res) => {
  const { password } = req.body;
  const entrepriseId = req.user.id;

  if (!password) {
    return res.status(400).json({ error: 'Mot de passe requis pour la suppression' });
  }

  const connection = await pool.getConnection();
  try {
    // Verify password
    const [rows] = await pool.query(
      'SELECT mot_de_passe, stripe_subscription_id FROM entreprises WHERE id = ?',
      [entrepriseId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    const isValid = await bcrypt.compare(password, rows[0].mot_de_passe);
    if (!isValid) {
      return res.status(401).json({ error: 'Mot de passe incorrect' });
    }

    await connection.beginTransaction();

    // Cancel Stripe subscription immediately if exists
    if (rows[0].stripe_subscription_id) {
      try {
        const { stripe } = await import('../utils/stripeConfig.js');
        await stripe.subscriptions.del(rows[0].stripe_subscription_id);
        logger.info('Stripe subscription deleted', { entreprise_id: entrepriseId });
      } catch (stripeErr) {
        logger.warn('Failed to delete Stripe subscription', { error: stripeErr.message });
      }
    }

    // Anonymize entreprise data (GDPR)
    const anonymizedData = {
      nom: `[SUPPRIMÉ-${randomUUID()}]`,
      raison_sociale: '[SUPPRIMÉ]',
      email: `deleted-${randomUUID()}@deleted.local`,
      mot_de_passe: '[SUPPRIMÉ]',
      siret_tva: null,
      adresse: null
    };

    await connection.query(
      `UPDATE entreprises
       SET nom = ?, raison_sociale = ?, email = ?, mot_de_passe = ?, siret_tva = ?, adresse = ?
       WHERE id = ?`,
      [anonymizedData.nom, anonymizedData.raison_sociale, anonymizedData.email, anonymizedData.mot_de_passe, anonymizedData.siret_tva, anonymizedData.adresse, entrepriseId]
    );

    // Soft-delete clients (anonymize)
    await connection.query(
      `UPDATE clients SET
       prenom = '[SUPPRIMÉ]', nom = '[SUPPRIMÉ]', email = NULL, telephone = NULL
       WHERE entreprise_id = ?`,
      [entrepriseId]
    );

    // Clear sensitive transaction history
    await connection.query(
      'DELETE FROM transaction_history WHERE client_id IN (SELECT id FROM clients WHERE entreprise_id = ?)',
      [entrepriseId]
    );

    await connection.commit();

    logger.info('Account deleted (GDPR anonymization)', { entreprise_id: entrepriseId });
    res.json({
      success: true,
      message: 'Compte supprimé et données anonymisées'
    });
  } catch (err) {
    await connection.rollback();
    logger.error('Account deletion error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  } finally {
    connection.release();
  }
};

export default {
  getAccountInfo,
  requestEmailChange,
  confirmEmailChange,
  changePassword,
  deleteAccount
};
