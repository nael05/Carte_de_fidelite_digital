import { randomUUID } from 'crypto';
import db from '../db.js';
import passGenerator from './passGenerator.js';
import logger from './logger.js';

/**
 * Construction de la carte Apple Wallet à partir de la base. Utilisé à l'identique par le téléchargement
 * initial (lien client, espace pro) et par le Web Service Apple (mises à jour) : la carte reçue lors
 * d'une mise à jour est exactement celle qu'on aurait téléchargée.
 */

// Numéro de série Apple : dérivé de l'identifiant client (stable).
export const appleSerialFor = (clientId) => String(clientId).replace(/-/g, '').substring(0, 20).toUpperCase();
export const googleSerialFor = (clientId) => `GOOGLE_${clientId}`;

// URL du Web Service inscrite dans la carte (Apple l'appelle en HTTPS uniquement).
export const webServiceUrl = (req) => {
  const configured = (process.env.APPLE_WALLET_WEBSERVICE_URL || '').trim().replace(/\/$/, '');
  if (configured) return configured;
  let base = (process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  if (base.startsWith('http://')) base = base.replace('http://', 'https://');
  return `${base}/api/wallet`;
};

/**
 * Garantit la ligne wallet_cards du client pour la plateforme voulue ('apple' | 'google').
 * Un client n'a qu'une carte : s'il change de Wallet, l'ancienne ligne est remplacée.
 * Retourne { serial, token }.
 */
export const ensureWalletCard = async (client, kind) => {
  const serial = kind === 'google' ? googleSerialFor(client.id) : appleSerialFor(client.id);
  const [rows] = await db.query('SELECT pass_serial_number, authentication_token FROM wallet_cards WHERE client_id = ?', [client.id]);
  if (rows[0]?.pass_serial_number === serial) return { serial, token: rows[0].authentication_token };
  if (rows[0]) await db.query('DELETE FROM wallet_cards WHERE client_id = ?', [client.id]);

  const token = kind === 'google' ? `GOOGLE_${randomUUID()}` : randomUUID().replace(/-/g, '') + randomUUID().replace(/-/g, '');
  await db.query(
    `INSERT INTO wallet_cards (client_id, company_id, pass_serial_number, authentication_token, points_balance, qr_code_value)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [client.id, client.entreprise_id, serial, token, Number(client.points) || 0, String(client.id)]
  );
  return { serial, token };
};

/**
 * Génère le .pkpass d'une carte existante (identifiée par son numéro de série).
 * Retourne null si Apple Wallet n'est pas configuré (certificat absent) ou si la carte n'existe pas.
 */
export const buildApplePass = async (serialNumber, webServiceURL) => {
  const [rows] = await db.query(
    `SELECT wc.pass_serial_number, wc.authentication_token, wc.last_points_change, wc.notification_message,
            c.id AS client_id, c.prenom, c.nom, c.telephone, c.points, c.created_at,
            e.id AS company_id, e.nom AS company_name, e.loyalty_type,
            lc.points_expiration_months
     FROM wallet_cards wc
     JOIN clients c ON wc.client_id = c.id
     JOIN entreprises e ON c.entreprise_id = e.id
     LEFT JOIN loyalty_config lc ON lc.entreprise_id = e.id
     WHERE wc.pass_serial_number = ?`,
    [serialNumber]
  );
  const data = rows[0];
  if (!data) return null;

  const [custRows] = await db.query(
    `SELECT * FROM card_customization WHERE company_id = ?
     ORDER BY (loyalty_type = ?) DESC, updated_at DESC LIMIT 1`,
    [data.company_id, data.loyalty_type || 'points']
  );
  const cc = custRows[0] || {};
  const [tiers] = await db.query(
    'SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC',
    [data.company_id]
  );

  let soonExpiringPoints = 0;
  if (data.points_expiration_months) {
    try {
      const { computeClientExpiration } = await import('../controllers/loyaltyController.js');
      ({ soonPoints: soonExpiringPoints } = await computeClientExpiration(data.client_id, data.points_expiration_months));
    } catch (err) {
      logger.warn(`[APPLE] computeClientExpiration ${data.client_id}`, { error: err.message });
    }
  }

  const passData = {
    clientId: data.client_id,
    firstName: data.prenom,
    lastName: data.nom,
    phoneNumber: data.telephone,
    companyName: data.company_name,
    loyaltyType: data.loyalty_type || 'points',
    balance: Number(data.points) || 0,
    rewardTiers: tiers,
    lastPointsChange: Number(data.last_points_change) || 0,
    notificationMessage: data.notification_message || null,
    createdAt: data.created_at,
    qrCodeValue: String(data.client_id),
    points_expiration_months: data.points_expiration_months ?? null,
    soonExpiringPoints
  };

  // Les champs « apple_* » priment ; sinon les réglages communs de la carte.
  const design = {
    apple_background_color: cc.apple_background_color || cc.primary_color || '#1f2937',
    apple_text_color: cc.apple_text_color || cc.text_color || '#ffffff',
    apple_label_color: cc.apple_label_color || cc.accent_color || '#a8a8a8',
    apple_logo_url: cc.apple_logo_url || cc.logo_url,
    apple_icon_url: cc.apple_icon_url || cc.icon_url,
    apple_strip_image_url: cc.apple_strip_image_url || cc.strip_image_url,
    apple_pass_description: cc.apple_pass_description || cc.card_subtitle || 'Carte de fidélité',
    apple_organization_name: cc.apple_organization_name || data.company_name,
    logo_text: cc.logo_text,
    back_fields_info: cc.back_fields_info,
    back_fields_terms: cc.back_fields_terms,
    back_fields_website: cc.back_fields_website,
    back_fields_phone: cc.back_fields_phone,
    back_fields_address: cc.back_fields_address,
    back_fields_instagram: cc.back_fields_instagram,
    back_fields_facebook: cc.back_fields_facebook,
    back_fields_tiktok: cc.back_fields_tiktok,
    apple_review_url: cc.apple_review_url,
    latitude: cc.latitude,
    longitude: cc.longitude,
    relevant_text: cc.relevant_text,
    locations: cc.locations
  };

  const buffer = await passGenerator.generateLoyaltyPass(passData, design, serialNumber, data.authentication_token, { webServiceURL });
  if (buffer) {
    await db.query('UPDATE wallet_cards SET points_balance = ? WHERE pass_serial_number = ?', [passData.balance, serialNumber]);
  }
  return buffer;
};

// Nom de fichier ASCII sûr pour l'en-tête Content-Disposition.
export const safeFilename = (value) =>
  String(value || 'carte').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60) || 'carte';
