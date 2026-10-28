import pool from '../db.js';
import logger from '../utils/logger.js';
import { sanitizeLegalHtml, MAX_LEGAL_LENGTH } from '../utils/sanitizeLegalHtml.js';

/**
 * GET /api/settings/mentions-legales  (public)
 */
export const getMentionsLegales = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT setting_value FROM site_settings WHERE setting_key = ?',
      ['mentions_legales']
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contenu non trouvé' });
    }

    // Nettoyé aussi à la lecture : protège contre un contenu enregistré avant l'ajout du filtre.
    res.json({ content: sanitizeLegalHtml(rows[0].setting_value) });
  } catch (err) {
    logger.error('getMentionsLegales error', { error: err.message });
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

/**
 * PUT /api/admin/settings/mentions-legales  (admin only)
 */
export const updateMentionsLegales = async (req, res) => {
  const { content } = req.body;

  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Le champ "content" (string) est requis' });
  }

  if (content.length > MAX_LEGAL_LENGTH) {
    return res.status(413).json({ error: 'Contenu trop long' });
  }

  try {
    const clean = sanitizeLegalHtml(content);
    await pool.query(
      `INSERT INTO site_settings (setting_key, setting_value)
       VALUES ('mentions_legales', ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [clean]
    );

    // Un contenu modifié par le filtre signale du code retiré (script, style, formulaire…).
    const stripped = clean.replace(/\s+/g, '') !== content.replace(/\s+/g, '');
    logger.info(`✏️ Mentions légales mises à jour par admin ${req.user?.id}`, { sanitized: stripped });
    res.json({
      success: true,
      content: clean,
      sanitized: stripped,
      message: stripped
        ? 'Mentions légales enregistrées. Certains éléments non autorisés (scripts, styles, formulaires…) ont été retirés.'
        : 'Mentions légales mises à jour'
    });
  } catch (err) {
    logger.error('updateMentionsLegales error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
};
