import pool from '../db.js';
import { stripe } from '../utils/stripeConfig.js';
import logger from '../utils/logger.js';

const DISCOUNT_TYPES = ['percent', 'amount', 'free_period'];
const DURATIONS = ['once', 'repeating', 'forever'];
const TARGETS = ['signup', 'renewal'];

const parseInput = (body) => {
  const code = String(body.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return { error: 'Code invalide : 3 à 32 caractères (lettres, chiffres, - et _)' };
  if (!DISCOUNT_TYPES.includes(body.discount_type)) return { error: 'Type de remise invalide' };
  if (!TARGETS.includes(body.target)) return { error: 'Cible invalide (inscription ou renouvellement)' };

  const spec = { code, discount_type: body.discount_type, target: body.target };

  if (body.discount_type === 'free_period') {
    const months = Number(body.duration_in_months || 1);
    if (!Number.isInteger(months) || months < 1 || months > 12) return { error: 'Période offerte : 1 à 12 mois' };
    Object.assign(spec, { percent_off: 100, duration: months === 1 ? 'once' : 'repeating', duration_in_months: months === 1 ? null : months });
  } else {
    if (!DURATIONS.includes(body.duration)) return { error: 'Durée invalide' };
    spec.duration = body.duration;
    if (body.duration === 'repeating') {
      const months = Number(body.duration_in_months);
      if (!Number.isInteger(months) || months < 1 || months > 36) return { error: 'Durée répétée : 1 à 36 mois' };
      spec.duration_in_months = months;
    } else {
      spec.duration_in_months = null;
    }
    if (body.discount_type === 'percent') {
      const pct = Number(body.percent_off);
      if (!(pct > 0 && pct <= 100)) return { error: 'Pourcentage entre 1 et 100' };
      spec.percent_off = pct;
    } else {
      const cents = Math.round(Number(body.amount_off) * 100);
      if (!(cents >= 1 && cents <= 1_000_000)) return { error: 'Montant invalide (entre 0,01 € et 10 000 €)' };
      spec.amount_off = cents;
    }
  }

  if (body.expires_at) {
    const ts = Date.parse(body.expires_at);
    if (Number.isNaN(ts) || ts <= Date.now()) return { error: "La date d'expiration doit être dans le futur" };
    spec.expires_at = new Date(ts);
  }
  if (body.max_redemptions !== undefined && body.max_redemptions !== '' && body.max_redemptions !== null) {
    const max = Number(body.max_redemptions);
    if (!Number.isInteger(max) || max < 1) return { error: "Nombre maximum d'utilisations invalide" };
    spec.max_redemptions = max;
  }
  return { spec };
};

// POST /api/admin/promos
export const createPromo = async (req, res) => {
  const { spec, error } = parseInput(req.body || {});
  if (error) return res.status(400).json({ error });

  let coupon;
  try {
    coupon = await stripe.coupons.create({
      name: spec.code,
      duration: spec.duration,
      ...(spec.duration_in_months && { duration_in_months: spec.duration_in_months }),
      ...(spec.percent_off ? { percent_off: spec.percent_off } : { amount_off: spec.amount_off, currency: 'eur' }),
      metadata: { source: 'admin', target: spec.target, discount_type: spec.discount_type }
    });

    const promotion = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: spec.code,
      ...(spec.expires_at && { expires_at: Math.floor(spec.expires_at.getTime() / 1000) }),
      ...(spec.max_redemptions && { max_redemptions: spec.max_redemptions }),
      restrictions: { first_time_transaction: spec.target === 'signup' },
      metadata: { source: 'admin', target: spec.target }
    });

    await pool.query(
      `INSERT INTO promo_codes (code, stripe_coupon_id, stripe_promotion_code_id, discount_type, percent_off, amount_off,
         duration, duration_in_months, target, expires_at, max_redemptions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [spec.code, coupon.id, promotion.id, spec.discount_type, spec.percent_off ?? null, spec.amount_off ?? null,
        spec.duration, spec.duration_in_months ?? null, spec.target, spec.expires_at ?? null, spec.max_redemptions ?? null]
    );

    logger.info('Code promo créé', { admin: req.user.id, code: spec.code });
    res.status(201).json({ success: true, code: spec.code, message: `Code ${spec.code} créé` });
  } catch (err) {
    if (coupon) await stripe.coupons.del(coupon.id).catch(() => {});
    logger.error('Create promo error', { error: err.message });
    if (err.code === 'ER_DUP_ENTRY' || /already exists/i.test(err.message)) {
      return res.status(409).json({ error: 'Ce code existe déjà' });
    }
    res.status(400).json({ error: `Erreur Stripe : ${err.message}` });
  }
};

// GET /api/admin/promos
export const listPromos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM promo_codes ORDER BY id DESC');
    const live = new Map();
    if (rows.length) {
      const list = await stripe.promotionCodes.list({ limit: 100 });
      list.data.forEach((p) => live.set(p.id, p));
    }
    const promos = rows.map((r) => {
      const s = live.get(r.stripe_promotion_code_id);
      return {
        id: r.id,
        code: r.code,
        discount_type: r.discount_type,
        percent_off: r.percent_off !== null ? Number(r.percent_off) : null,
        amount_off: r.amount_off !== null ? r.amount_off / 100 : null,
        duration: r.duration,
        duration_in_months: r.duration_in_months,
        target: r.target,
        expires_at: r.expires_at,
        max_redemptions: r.max_redemptions,
        times_redeemed: s ? s.times_redeemed : null,
        active: !!r.active && (s ? s.active : true),
        created_at: r.created_at
      };
    });
    res.json({ promos });
  } catch (err) {
    logger.error('List promos error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la lecture des codes promo' });
  }
};

// DELETE /api/admin/promos/:id  (désactive le code, ne le supprime pas)
export const deactivatePromo = async (req, res) => {
  try {
    const [[row]] = await pool.query('SELECT stripe_promotion_code_id FROM promo_codes WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Code introuvable' });
    await stripe.promotionCodes.update(row.stripe_promotion_code_id, { active: false });
    await pool.query('UPDATE promo_codes SET active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Code désactivé' });
  } catch (err) {
    logger.error('Deactivate promo error', { error: err.message });
    res.status(500).json({ error: 'Erreur lors de la désactivation' });
  }
};

export default { createPromo, listPromos, deactivatePromo };
