import pool from '../db.js';
import emailService from '../utils/emailService.js';
import { logEmail } from '../utils/stripeService.js';
import logger from '../utils/logger.js';

const MAX_SUBJECT = 200;
const MAX_MESSAGE = 10_000;
const MAX_BROADCAST = 500;

// Filtres de segment → statuts d'abonnement
const SEGMENTS = {
  all: ['active', 'trialing', 'past_due'],
  active: ['active'],
  trialing: ['trialing'],
  past_due: ['past_due'],
  unpaid: ['unpaid'],
  canceled: ['canceled']
};

const recipientsFor = async (segment) => {
  const statuses = SEGMENTS[segment];
  if (!statuses) return null;
  const [rows] = await pool.query(
    `SELECT id, nom, email, subscription_status FROM entreprises
     WHERE subscription_status IN (?) AND statut = 'actif' AND email NOT LIKE '%@deleted.local'
     ORDER BY nom ASC`,
    [statuses]
  );
  return rows;
};

const validateContent = (subject, message) => {
  const s = String(subject || '').trim();
  const m = String(message || '').trim();
  if (!s || !m) return { error: "L'objet et le message sont requis" };
  if (s.length > MAX_SUBJECT) return { error: `Objet trop long (${MAX_SUBJECT} caractères max)` };
  if (m.length > MAX_MESSAGE) return { error: `Message trop long (${MAX_MESSAGE} caractères max)` };
  return { subject: s, message: m };
};

const deliver = async (company, subject, message, adminId, kind) => {
  const meta = { source: 'admin', kind, admin_id: adminId };
  try {
    await emailService.sendAdminMessageEmail({ email: company.email, nom: company.nom, subject, message });
    await logEmail(company.id, company.email, subject, 'admin_message', meta);
    return { ok: true };
  } catch (err) {
    await logEmail(company.id, company.email, subject, 'admin_message', { ...meta, error: err.message }).catch(() => {});
    return { ok: false, error: err.message };
  }
};

// GET /api/admin/email/recipients?segment=all
export const listRecipients = async (req, res) => {
  try {
    const segment = req.query.segment || 'all';
    const rows = await recipientsFor(segment);
    if (!rows) return res.status(400).json({ error: 'Segment invalide' });
    res.json({ segment, count: rows.length, recipients: rows });
  } catch (err) {
    logger.error('List recipients error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/admin/email/single  { entreprise_id, subject, message }
export const sendSingle = async (req, res) => {
  const content = validateContent(req.body?.subject, req.body?.message);
  if (content.error) return res.status(400).json({ error: content.error });
  try {
    const [[company]] = await pool.query(
      "SELECT id, nom, email FROM entreprises WHERE id = ? AND email NOT LIKE '%@deleted.local'",
      [req.body?.entreprise_id]
    );
    if (!company) return res.status(404).json({ error: 'Entreprise introuvable' });

    const result = await deliver(company, content.subject, content.message, req.user.id, 'single');
    if (!result.ok) return res.status(502).json({ error: `Envoi impossible : ${result.error}` });
    res.json({ success: true, message: `E-mail envoyé à ${company.email}` });
  } catch (err) {
    logger.error('Send single email error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// POST /api/admin/email/broadcast  { segment, subject, message }
export const sendBroadcast = async (req, res) => {
  const content = validateContent(req.body?.subject, req.body?.message);
  if (content.error) return res.status(400).json({ error: content.error });
  try {
    const recipients = await recipientsFor(req.body?.segment || 'all');
    if (!recipients) return res.status(400).json({ error: 'Segment invalide' });
    if (recipients.length === 0) return res.status(400).json({ error: 'Aucun destinataire pour ce segment' });
    if (recipients.length > MAX_BROADCAST) {
      return res.status(400).json({ error: `Trop de destinataires (${recipients.length}, maximum ${MAX_BROADCAST}) : affinez le segment` });
    }

    let sent = 0;
    const failed = [];
    for (const company of recipients) {
      const result = await deliver(company, content.subject, content.message, req.user.id, 'broadcast');
      if (result.ok) sent++;
      else failed.push({ id: company.id, email: company.email, error: result.error });
    }
    logger.info('Email groupé', { admin: req.user.id, segment: req.body?.segment || 'all', sent, failed: failed.length });
    res.json({
      success: failed.length === 0, sent, failed,
      message: `${sent} e-mail(s) envoyé(s)${failed.length ? `, ${failed.length} échec(s)` : ''}`
    });
  } catch (err) {
    logger.error('Broadcast error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

export default { listRecipients, sendSingle, sendBroadcast };
