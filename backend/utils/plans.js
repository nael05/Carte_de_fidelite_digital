import pool from '../db.js';

// Offres : gratuit (15 clients max), Pro et Business. L'intervalle de facturation (monthly/yearly)
// reste dans entreprises.subscription_plan ; l'offre est dans entreprises.tier.
export const FREE_CLIENT_LIMIT = 15;
export const TIERS = ['free', 'pro', 'business'];
export const PAID_STATUSES = ['active', 'trialing', 'past_due'];

// Clés de la table pricing_config : « monthly »/« yearly » (Pro, historiques) et « business_* ».
export const PLAN_KEYS = ['monthly', 'yearly', 'business_monthly', 'business_yearly'];
export const parsePlanKey = (key) => {
  const [tier, interval] = key.startsWith('business_') ? ['business', key.slice(9)] : ['pro', key];
  return { tier, interval };
};
export const planKey = (tier, interval) => (tier === 'business' ? `business_${interval}` : interval);

// Garde-fous des notifications promotionnelles (voir utils/pushGuard.js).
export const PUSH_RULES = {
  monthlyQuota: { free: 0, pro: 4, business: 8 },
  minHoursBetween: 48,
  clientCooldownDays: 7,
  quietHours: { from: 21, to: 8, timeZone: 'Europe/Paris' }
};

// L'offre réellement applicable : un abonnement résilié ou jamais payé retombe sur le gratuit.
export const effectiveTier = (row) => (PAID_STATUSES.includes(row.subscription_status) ? row.tier : 'free');

const countClients = async (entrepriseId, conn = pool) => {
  const [[{ n }]] = await conn.query('SELECT COUNT(*) AS n FROM clients WHERE entreprise_id = ?', [entrepriseId]);
  return n;
};

// État d'accès d'un commerçant. blocked = problème de paiement ; locked = gratuit au-dessus de 15 clients.
export const getAccess = async (entrepriseId) => {
  const [rows] = await pool.query(
    'SELECT subscription_status, tier, push_suspended FROM entreprises WHERE id = ?',
    [entrepriseId]
  );
  if (rows.length === 0) return null;
  const row = rows[0];
  const tier = effectiveTier(row);
  const access = {
    status: row.subscription_status,
    tier,
    limit: tier === 'free' ? FREE_CLIENT_LIMIT : null,
    client_count: null,
    locked: false,
    blocked: null,
    push_suspended: !!row.push_suspended
  };

  if (row.subscription_status === 'unpaid') access.blocked = 'unpaid';
  else if (row.subscription_status === 'past_due') access.blocked = 'past_due';

  if (tier === 'free' && !access.blocked) {
    access.client_count = await countClients(entrepriseId);
    access.locked = access.client_count > FREE_CLIENT_LIMIT;
  }
  return access;
};

export { countClients };

export class FreeLimitError extends Error {
  constructor() {
    super('free_limit_reached');
    this.code = 'free_limit_reached';
  }
}

// Exécute l'ajout d'un client dans une transaction qui verrouille l'entreprise : deux inscriptions
// simultanées ne peuvent pas dépasser la limite du plan gratuit.
export const withClientQuota = async (entrepriseId, work) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[ent]] = await conn.query(
      'SELECT subscription_status, tier FROM entreprises WHERE id = ? FOR UPDATE',
      [entrepriseId]
    );
    if (ent && effectiveTier(ent) === 'free' && (await countClients(entrepriseId, conn)) >= FREE_CLIENT_LIMIT) {
      throw new FreeLimitError();
    }
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
};
