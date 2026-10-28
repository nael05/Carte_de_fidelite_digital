import rateLimit from 'express-rate-limit';
import pool from '../db.js';

class MySQLRateLimitStore {
  // prefix : chaque limiteur a son propre compteur (sinon les appels d'API consomment le quota de connexion).
  constructor(windowMs, prefix) {
    this.windowMs = windowMs;
    this.prefix = prefix;
    pool.query(`
      CREATE TABLE IF NOT EXISTS rate_limit_store (
        key_id VARCHAR(255) NOT NULL,
        hits INT UNSIGNED NOT NULL DEFAULT 1,
        reset_time BIGINT UNSIGNED NOT NULL,
        PRIMARY KEY (key_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `).catch(() => {});
  }

  async increment(rawKey) {
    const key = `${this.prefix}:${rawKey}`;
    const now = Date.now();
    const resetTime = now + this.windowMs;
    await pool.query(
      `INSERT INTO rate_limit_store (key_id, hits, reset_time)
       VALUES (?, 1, ?)
       ON DUPLICATE KEY UPDATE
         hits = IF(reset_time <= ?, 1, hits + 1),
         reset_time = IF(reset_time <= ?, ?, reset_time)`,
      [key, resetTime, now, now, resetTime]
    );
    const [[row]] = await pool.query(
      'SELECT hits, reset_time FROM rate_limit_store WHERE key_id = ?',
      [key]
    );
    return { totalHits: row.hits, resetTime: new Date(Number(row.reset_time)) };
  }

  async decrement(rawKey) {
    const key = `${this.prefix}:${rawKey}`;
    await pool.query(
      'UPDATE rate_limit_store SET hits = GREATEST(0, hits - 1) WHERE key_id = ?',
      [key]
    );
  }

  async resetKey(rawKey) {
    const key = `${this.prefix}:${rawKey}`;
    await pool.query('DELETE FROM rate_limit_store WHERE key_id = ?', [key]);
  }
}

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  store: new MySQLRateLimitStore(15 * 60 * 1000, 'login'),
  message: 'Trop de tentatives de connexion, réessayez plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  store: new MySQLRateLimitStore(1 * 60 * 1000, 'api'),
  skip: (req) => process.env.NODE_ENV === 'development',
});

export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: new MySQLRateLimitStore(60 * 60 * 1000, 'strict'),
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Inscription publique des clients (/join) : deux plafonds pour empêcher qu'un robot remplisse un programme.
//  - par adresse IP : 30 par heure (un magasin partage souvent une seule IP pour tous ses clients) ;
//  - par commerce, toutes IP confondues : 120 par heure.
const tooManyJoins = (req, res) =>
  res.status(429).json({ error: "Trop d'inscriptions en peu de temps. Réessayez dans un moment.", code: 'too_many_registrations' });

export const joinIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  store: new MySQLRateLimitStore(60 * 60 * 1000, 'join-ip'),
  handler: tooManyJoins,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

export const joinCompanyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 120,
  store: new MySQLRateLimitStore(60 * 60 * 1000, 'join-company'),
  keyGenerator: (req) => String(req.params.entrepriseId || 'inconnu'),
  handler: tooManyJoins,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development',
});

export default loginLimiter;
