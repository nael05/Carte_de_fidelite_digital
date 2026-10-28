import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import pool from '../db.js';
import logger from '../utils/logger.js';
import { generateToken } from '../middlewares/auth.js';
import { createSession, generateDeviceFingerprint } from '../utils/sessionManager.js';
import { validatePassword } from '../utils/passwordValidator.js';
import { effectiveTier } from '../utils/plans.js';
import { MAX_ESTABLISHMENTS, MAX_STAFF, findEstablishment } from '../utils/establishments.js';

// Offre Business : établissements et comptes équipe. Les routes d'écriture sont réservées au propriétaire
// (voir staffMayAccess dans middlewares/auth.js).

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['cashier', 'manager'];
const clean = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

/* ───────────── Établissements ───────────── */

// GET /api/pro/establishments — un caissier ne voit que son établissement, sans statistiques.
export const listEstablishments = async (req, res) => {
  const entrepriseId = req.user.id;
  const isCashier = req.user.staffRole === 'cashier';
  try {
    const params = [entrepriseId];
    let where = 'e.entreprise_id = ?';
    if (isCashier) {
      where += ' AND e.id = ?';
      params.push(req.user.establishmentId || '');
    }
    const [rows] = await pool.query(
      `SELECT e.id, e.nom, e.adresse, e.created_at FROM establishments e WHERE ${where} ORDER BY e.created_at ASC`,
      params
    );
    if (isCashier) return res.json({ establishments: rows });

    const [clients] = await pool.query(
      'SELECT establishment_id AS id, COUNT(*) AS n FROM clients WHERE entreprise_id = ? AND establishment_id IS NOT NULL GROUP BY establishment_id',
      [entrepriseId]
    );
    const [activity] = await pool.query(
      `SELECT establishment_id AS id, COUNT(*) AS passages, COALESCE(SUM(points_change), 0) AS points
       FROM transaction_history
       WHERE entreprise_id = ? AND type = 'add_points' AND establishment_id IS NOT NULL
         AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY establishment_id`,
      [entrepriseId]
    );
    const byId = (list) => Object.fromEntries(list.map((r) => [r.id, r]));
    const c = byId(clients);
    const a = byId(activity);
    res.json({
      max: MAX_ESTABLISHMENTS,
      establishments: rows.map((e) => ({
        ...e,
        clients: Number(c[e.id]?.n) || 0,
        passages_30d: Number(a[e.id]?.passages) || 0,
        points_30d: Number(a[e.id]?.points) || 0
      }))
    });
  } catch (err) {
    logger.error('List establishments error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors du chargement des établissements' });
  }
};

// POST /api/pro/establishments { nom, adresse? }
export const createEstablishment = async (req, res) => {
  const entrepriseId = req.user.id;
  const nom = clean(req.body.nom, 100);
  const adresse = clean(req.body.adresse, 255) || null;
  if (!nom) return res.status(400).json({ error: "Le nom de l'établissement est requis" });

  try {
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM establishments WHERE entreprise_id = ?', [entrepriseId]);
    if (n >= MAX_ESTABLISHMENTS) {
      return res.status(400).json({ error: `Maximum ${MAX_ESTABLISHMENTS} établissements` });
    }
    const id = randomUUID();
    await pool.query('INSERT INTO establishments (id, entreprise_id, nom, adresse) VALUES (?, ?, ?, ?)', [id, entrepriseId, nom, adresse]);
    res.status(201).json({ success: true, id, message: 'Établissement créé' });
  } catch (err) {
    logger.error('Create establishment error', { error: err.message });
    res.status(500).json({ error: "Erreur lors de la création de l'établissement" });
  }
};

// PUT /api/pro/establishments/:id { nom, adresse }
export const updateEstablishment = async (req, res) => {
  const nom = clean(req.body.nom, 100);
  const adresse = clean(req.body.adresse, 255) || null;
  if (!nom) return res.status(400).json({ error: "Le nom de l'établissement est requis" });
  try {
    const [r] = await pool.query(
      'UPDATE establishments SET nom = ?, adresse = ? WHERE id = ? AND entreprise_id = ?',
      [nom, adresse, req.params.id, req.user.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Établissement introuvable' });
    res.json({ success: true, message: 'Établissement mis à jour' });
  } catch (err) {
    logger.error('Update establishment error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

// DELETE /api/pro/establishments/:id — les clients, transactions et comptes équipe sont conservés (sans établissement).
export const deleteEstablishment = async (req, res) => {
  const entrepriseId = req.user.id;
  const id = req.params.id;
  try {
    const found = await findEstablishment(entrepriseId, id);
    if (!found) return res.status(404).json({ error: 'Établissement introuvable' });
    await pool.query('UPDATE clients SET establishment_id = NULL WHERE entreprise_id = ? AND establishment_id = ?', [entrepriseId, id]);
    await pool.query('UPDATE transaction_history SET establishment_id = NULL WHERE entreprise_id = ? AND establishment_id = ?', [entrepriseId, id]);
    await pool.query('UPDATE staff_accounts SET establishment_id = NULL WHERE entreprise_id = ? AND establishment_id = ?', [entrepriseId, id]);
    await pool.query('DELETE FROM establishments WHERE id = ? AND entreprise_id = ?', [id, entrepriseId]);
    res.json({ success: true, message: 'Établissement supprimé' });
  } catch (err) {
    logger.error('Delete establishment error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

/* ───────────── Comptes équipe ───────────── */

const emailTaken = async (email, exceptStaffId = null) => {
  const [a] = await pool.query('SELECT id FROM entreprises WHERE email = ?', [email]);
  if (a.length > 0) return true;
  const [b] = await pool.query('SELECT id FROM staff_accounts WHERE email = ? AND id <> ?', [email, exceptStaffId || '']);
  return b.length > 0;
};

// GET /api/pro/staff
export const listStaff = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.id, s.nom, s.email, s.role, s.actif, s.establishment_id, s.last_login, s.created_at, e.nom AS establishment_nom
       FROM staff_accounts s LEFT JOIN establishments e ON e.id = s.establishment_id
       WHERE s.entreprise_id = ? ORDER BY s.created_at ASC`,
      [req.user.id]
    );
    res.json({ max: MAX_STAFF, staff: rows });
  } catch (err) {
    logger.error('List staff error', { error: err.message });
    res.status(500).json({ error: "Erreur lors du chargement de l'équipe" });
  }
};

// POST /api/pro/staff { nom, email, role, establishment_id?, mot_de_passe }
export const createStaff = async (req, res) => {
  const entrepriseId = req.user.id;
  const nom = clean(req.body.nom, 100);
  const email = clean(req.body.email, 255).toLowerCase();
  const { role, mot_de_passe } = req.body;

  if (!nom || !email || !mot_de_passe) return res.status(400).json({ error: 'Nom, e-mail et mot de passe sont requis' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Adresse e-mail invalide' });
  if (!ROLES.includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  const pwd = validatePassword(mot_de_passe);
  if (!pwd.isValid) return res.status(400).json({ error: pwd.errors.join(', ') });

  try {
    let establishmentId = null;
    if (req.body.establishment_id) {
      establishmentId = await findEstablishment(entrepriseId, req.body.establishment_id);
      if (!establishmentId) return res.status(400).json({ error: 'Établissement introuvable' });
    }
    const [[{ n }]] = await pool.query('SELECT COUNT(*) AS n FROM staff_accounts WHERE entreprise_id = ?', [entrepriseId]);
    if (n >= MAX_STAFF) return res.status(400).json({ error: `Maximum ${MAX_STAFF} comptes équipe` });
    if (await emailTaken(email)) return res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée' });

    const hash = await bcrypt.hash(mot_de_passe, 10);
    const id = randomUUID();
    await pool.query(
      'INSERT INTO staff_accounts (id, entreprise_id, establishment_id, nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, entrepriseId, establishmentId, nom, email, hash, role]
    );
    res.status(201).json({ success: true, id, message: 'Compte équipe créé' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette adresse e-mail est déjà utilisée' });
    logger.error('Create staff error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
};

// PUT /api/pro/staff/:id { nom?, role?, establishment_id?, actif?, mot_de_passe? }
export const updateStaff = async (req, res) => {
  const entrepriseId = req.user.id;
  const { id } = req.params;
  const sets = [];
  const params = [];

  try {
    if (req.body.nom !== undefined) {
      const nom = clean(req.body.nom, 100);
      if (!nom) return res.status(400).json({ error: 'Nom invalide' });
      sets.push('nom = ?'); params.push(nom);
    }
    if (req.body.role !== undefined) {
      if (!ROLES.includes(req.body.role)) return res.status(400).json({ error: 'Rôle invalide' });
      sets.push('role = ?'); params.push(req.body.role);
    }
    if (req.body.establishment_id !== undefined) {
      let establishmentId = null;
      if (req.body.establishment_id) {
        establishmentId = await findEstablishment(entrepriseId, req.body.establishment_id);
        if (!establishmentId) return res.status(400).json({ error: 'Établissement introuvable' });
      }
      sets.push('establishment_id = ?'); params.push(establishmentId);
    }
    if (req.body.actif !== undefined) {
      sets.push('actif = ?'); params.push(req.body.actif ? 1 : 0);
    }
    if (req.body.mot_de_passe) {
      const pwd = validatePassword(req.body.mot_de_passe);
      if (!pwd.isValid) return res.status(400).json({ error: pwd.errors.join(', ') });
      sets.push('mot_de_passe = ?'); params.push(await bcrypt.hash(req.body.mot_de_passe, 10));
    }
    if (sets.length === 0) return res.status(400).json({ error: 'Aucune modification' });

    const [r] = await pool.query(
      `UPDATE staff_accounts SET ${sets.join(', ')} WHERE id = ? AND entreprise_id = ?`,
      [...params, id, entrepriseId]
    );
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Compte introuvable' });
    res.json({ success: true, message: 'Compte mis à jour' });
  } catch (err) {
    logger.error('Update staff error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};

// DELETE /api/pro/staff/:id
export const deleteStaff = async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM staff_accounts WHERE id = ? AND entreprise_id = ?', [req.params.id, req.user.id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: 'Compte introuvable' });
    res.json({ success: true, message: 'Compte supprimé' });
  } catch (err) {
    logger.error('Delete staff error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};

/* ───────────── Connexion d'un compte équipe ───────────── */

// Appelée par proLogin quand l'e-mail ne correspond à aucun propriétaire.
// Retourne true si la requête a été traitée (réponse envoyée), false si l'e-mail est inconnu.
export const staffLogin = async (req, res) => {
  const { email, mot_de_passe } = req.body;
  if (typeof email !== 'string' || typeof mot_de_passe !== 'string') return false;

  const [rows] = await pool.query(
    `SELECT s.id, s.entreprise_id, s.establishment_id, s.nom, s.email, s.mot_de_passe, s.role, s.actif,
            e.nom AS entreprise_nom, e.statut, e.tier, e.subscription_status, e.loyalty_type
     FROM staff_accounts s JOIN entreprises e ON e.id = s.entreprise_id
     WHERE s.email = ?`,
    [email.trim().toLowerCase()]
  );
  const staff = rows[0];
  if (!staff) return false;

  const valid = await bcrypt.compare(mot_de_passe, staff.mot_de_passe);
  if (!valid) {
    res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    return true;
  }
  if (!staff.actif) {
    res.status(403).json({ error: 'Ce compte est désactivé' });
    return true;
  }
  if (staff.statut === 'suspendu') {
    res.status(403).json({ error: 'Votre compte est suspendu' });
    return true;
  }
  if (effectiveTier(staff) !== 'business') {
    res.status(403).json({ error: "L'offre Business de ce commerce n'est plus active.", status: 'upgrade_required' });
    return true;
  }

  const token = generateToken(staff.entreprise_id, 'pro', { staffId: staff.id, staffRole: staff.role });
  const deviceFingerprint = generateDeviceFingerprint(req);
  const deviceName = req.headers['user-agent']?.substring(0, 100) || 'Unknown Device';
  try {
    await createSession(staff.entreprise_id, deviceFingerprint, deviceName, token, '24h');
  } catch (err) {
    logger.error('Staff session creation failed', { error: err.message });
    res.status(500).json({ error: 'Unable to create session' });
    return true;
  }
  await pool.query('UPDATE staff_accounts SET last_login = NOW() WHERE id = ?', [staff.id]);

  res.json({
    token,
    deviceId: deviceFingerprint,
    mustChangePassword: false,
    companyId: staff.entreprise_id,
    nom: staff.entreprise_nom,
    email: staff.email,
    statut: staff.statut,
    loyaltyType: staff.loyalty_type || 'points',
    staff: { role: staff.role, nom: staff.nom, establishment_id: staff.establishment_id }
  });
  return true;
};

export default {
  listEstablishments, createEstablishment, updateEstablishment, deleteEstablishment,
  listStaff, createStaff, updateStaff, deleteStaff, staffLogin
};
