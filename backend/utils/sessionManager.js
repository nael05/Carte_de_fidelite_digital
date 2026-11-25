import crypto, { randomUUID } from 'crypto';
import pool from '../db.js'

export const hashToken = (token) => crypto.createHash('sha256').update(token + 'salt').digest('hex')

/**
 * Identifiant d'appareil renvoyé au navigateur à la connexion (en-tête X-Device-Id ensuite).
 * account : propriétaire ou compte équipe, pour qu'un caissier et le gérant puissent être connectés
 * en même temps sur le même ordinateur de caisse sans se déconnecter l'un l'autre.
 */
export const generateDeviceFingerprint = (req, account = 'owner') => {
  const userAgent = req.headers['user-agent'] || 'unknown'
  const ip = req.ip || req.socket?.remoteAddress || 'unknown'
  return crypto
    .createHash('sha256')
    .update(`${userAgent}:${ip}:${account}`)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Créer une session pour une entreprise sur un appareil
 */
export const createSession = async (empresaId, deviceId, deviceName, token, expiresIn = '24h') => {
  try {
    const sessionId = randomUUID()

    const expiresMs = expiresIn === '7d' ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    const expiresAt = new Date(Date.now() + expiresMs)

    const tokenHash = hashToken(token)

    await pool.query(
      'DELETE FROM sessions WHERE entreprise_id = ? AND device_id = ?',
      [empresaId, deviceId]
    )

    await pool.query(
      `INSERT INTO sessions (id, entreprise_id, device_id, device_name, token_hash, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, empresaId, deviceId, deviceName, tokenHash, expiresAt]
    )
    
    return sessionId
  } catch (err) {
    console.error('❌ [SESSION] Erreur création session:', err.message)
    throw err
  }
}

/**
 * Vérifier qu'une session est valide et met à jour last_activity
 */
export const verifySessionValidity = async (empresaId, deviceId, token) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, expires_at, last_activity, token_hash FROM sessions 
       WHERE entreprise_id = ? AND device_id = ?`,
      [empresaId, deviceId]
    )
    
    if (rows.length === 0) return null

    const session = rows[0]
    if (!token || session.token_hash !== hashToken(token)) return null

    if (new Date() > new Date(session.expires_at)) {

      await pool.query('DELETE FROM sessions WHERE id = ?', [session.id])
      return null
    }


    const lastActivityTime = new Date(session.last_activity)
    const now = new Date()
    
    if (now - lastActivityTime > 60000) { // 1 minute entre deux MAJ max pour perf
      const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await pool.query(
        'UPDATE sessions SET last_activity = CURRENT_TIMESTAMP, expires_at = ? WHERE id = ?',
        [newExpiresAt, session.id]
      )
    }
    
    return session;
  } catch (err) {
    console.error('❌ [SESSION] Erreur vérification session:', err.message)
    return null
  }
}

/**
 * Récupérer toutes les sessions actives d'une entreprise
 */
export const getActiveSessions = async (empresaId) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, device_id, device_name, last_activity, expires_at, created_at 
       FROM sessions 
       WHERE entreprise_id = ? AND expires_at > NOW()
       ORDER BY last_activity DESC`,
      [empresaId]
    )
    return rows
  } catch (err) {
    console.error('❌ [SESSION] Erreur récupération sessions:', err.message)
    return []
  }
}

/**
 * Déconnecter d'un appareil spécifique
 */
export const logoutDevice = async (empresaId, deviceId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM sessions WHERE entreprise_id = ? AND device_id = ?',
      [empresaId, deviceId]
    )
    console.log(`✅ [SESSION] Déconnexion device: ${deviceId}`)
    return result.affectedRows > 0
  } catch (err) {
    console.error('❌ [SESSION] Erreur déconnexion:', err.message)
    return false
  }
}

/**
 * Déconnecter de tous les appareils
 */
export const logoutAllDevices = async (empresaId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM sessions WHERE entreprise_id = ?',
      [empresaId]
    )
    console.log(`✅ [SESSION] Déconnexion tous appareils: ${empresaId}`)
    return result.affectedRows
  } catch (err) {
    console.error('❌ [SESSION] Erreur déconnexion globale:', err.message)
    return 0
  }
}
