import pool from '../db.js';
import logger from '../utils/logger.js';

export const MAX_ESTABLISHMENTS = 10;
export const MAX_STAFF = 20;

// Établissement d'une entreprise (null s'il n'existe pas ou n'appartient pas à cette entreprise).
export const findEstablishment = async (entrepriseId, establishmentId) => {
  if (!establishmentId || typeof establishmentId !== 'string') return null;
  try {
    const [rows] = await pool.query(
      'SELECT id FROM establishments WHERE id = ? AND entreprise_id = ?',
      [establishmentId, entrepriseId]
    );
    return rows[0]?.id || null;
  } catch (err) {
    logger.warn('Lecture établissement impossible', { error: err.message });
    return null;
  }
};

// Établissement auquel rattacher une opération : celui du compte équipe, sinon celui choisi en caisse
// (en-tête X-Establishment-Id, vérifié) ; null si aucun.
export const resolveEstablishmentId = async (req) => {
  if (req.user?.establishmentId) return req.user.establishmentId;
  return findEstablishment(req.user?.id, req.headers['x-establishment-id']);
};
