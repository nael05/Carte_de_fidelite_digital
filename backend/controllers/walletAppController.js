/**
 * WalletAppController.js
 * Création / téléchargement des cartes Apple Wallet (.pkpass) et Google Wallet (lien d'ajout).
 * Les points ne se modifient PAS ici : passer par la caisse (/pro/scan, /pro/redeem-reward, /pro/adjust-points)
 * qui gère l'historique, les plafonds et les notifications.
 */

import googleWalletGenerator from '../utils/googleWalletGenerator.js';
import db from '../db.js';
import logger from '../utils/logger.js';
import { ensureWalletCard, buildApplePass, webServiceUrl, safeFilename, checkDownloadToken } from '../utils/applePass.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const loadClient = async (clientId, entrepriseId = null) => {
  const [rows] = await db.query(
    `SELECT c.id, c.entreprise_id, c.prenom, c.nom, c.points, c.type_wallet, e.nom AS company_name, e.statut
     FROM clients c JOIN entreprises e ON c.entreprise_id = e.id
     WHERE c.id = ? ${entrepriseId ? 'AND c.entreprise_id = ?' : ''}`,
    entrepriseId ? [clientId, entrepriseId] : [clientId]
  );
  return rows[0] || null;
};

// Lien « Ajouter à Google Wallet » : classe (design du commerce) + objet (carte du client).
const googleSaveUrl = async (client) => {
  const [[cust]] = await db.query(
    'SELECT * FROM card_customization WHERE company_id = ? ORDER BY updated_at DESC LIMIT 1',
    [client.entreprise_id]
  );
  const [[lc]] = await db.query('SELECT points_expiration_months FROM loyalty_config WHERE entreprise_id = ?', [client.entreprise_id]);
  const [tiers] = await db.query('SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC', [client.entreprise_id]);
  const config = { ...(cust || {}), points_expiration_months: lc?.points_expiration_months ?? null };

  await googleWalletGenerator.createOrUpdateClass(client.entreprise_id, config, client.company_name, 'points');
  const saveUrl = await googleWalletGenerator.createLoyaltyObject(
    client.id, client.entreprise_id, `${client.prenom} ${client.nom}`, Number(client.points) || 0, config, tiers
  );
  if (saveUrl) await ensureWalletCard(client, 'google');
  return saveUrl;
};

const sendPkpass = (res, buffer, name) => {
  res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename(name)}.pkpass"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send(buffer);
};

/**
 * POST /api/app/wallet/create  { clientId, type_wallet? }  (espace pro)
 */
export const createWalletPass = async (req, res) => {
  try {
    const { clientId, type_wallet: bodyType } = req.body;
    if (!clientId || !UUID_RE.test(String(clientId))) return res.status(400).json({ error: 'clientId invalide' });

    const client = await loadClient(clientId, req.user.id);
    if (!client) return res.status(404).json({ error: 'Client non trouvé' });

    const kind = bodyType === 'google' || bodyType === 'apple' ? bodyType : client.type_wallet || 'apple';
    if (kind !== client.type_wallet) {
      await db.query('UPDATE clients SET type_wallet = ? WHERE id = ?', [kind, client.id]);
    }

    if (kind === 'google') {
      const saveUrl = await googleSaveUrl(client);
      if (!saveUrl) return res.status(503).json({ error: 'Google Wallet indisponible (configuration manquante)' });
      return res.json({ success: true, type: 'google', saveUrl });
    }

    const { serial } = await ensureWalletCard(client, 'apple');
    const buffer = await buildApplePass(serial, webServiceUrl(req));
    if (!buffer) return res.status(503).json({ error: 'Apple Wallet indisponible (certificat manquant)' });
    sendPkpass(res, buffer, `${client.prenom}_${client.nom}`);
  } catch (error) {
    logger.error(`❌ Erreur création pass: ${error.message}`);
    res.status(500).json({ error: 'Erreur création pass' });
  }
};

/**
 * GET /api/app/wallet/status/:clientId  (espace pro)
 */
export const getWalletStatus = async (req, res) => {
  try {
    const { clientId } = req.params;
    const [walletRows] = await db.query(
      `SELECT wc.id, wc.pass_serial_number, wc.points_balance, wc.wallet_added_at, wc.last_updated,
              COUNT(apr.id) AS device_count
       FROM wallet_cards wc
       JOIN clients c ON wc.client_id = c.id
       LEFT JOIN apple_pass_registrations apr ON wc.pass_serial_number = apr.pass_serial_number
       WHERE wc.client_id = ? AND c.entreprise_id = ?
       GROUP BY wc.id`,
      [clientId, req.user.id]
    );
    if (walletRows.length === 0) return res.status(404).json({ error: 'Pas de carte Wallet' });

    const wallet = walletRows[0];
    res.json({
      success: true,
      clientId,
      balance: wallet.points_balance,
      walletAddedAt: wallet.wallet_added_at,
      lastUpdated: wallet.last_updated,
      devicesRegistered: Number(wallet.device_count) || 0,
      type: wallet.pass_serial_number.startsWith('GOOGLE_') ? 'google' : 'apple'
    });
  } catch (error) {
    logger.error(`❌ Erreur statut: ${error.message}`);
    res.status(500).json({ error: 'Erreur récupération statut' });
  }
};

/**
 * GET /api/app/wallet/client-download/:clientId[?type=apple|google]
 * Lien public envoyé au client après son inscription (l'identifiant client est un UUID aléatoire).
 */
export const downloadClientPass = async (req, res) => {
  try {
    const { clientId } = req.params;
    if (!UUID_RE.test(String(clientId)) || !checkDownloadToken(clientId, req.query.t)) return res.status(404).send('Carte introuvable');

    const client = await loadClient(clientId);
    if (!client) return res.status(404).send('Carte introuvable');
    if (client.statut !== 'actif') return res.status(403).send("Ce programme de fidélité n'est plus disponible.");

    const requested = req.query.type;
    const isIOS = /iPhone|iPad|iPod/.test(req.headers['user-agent'] || '');
    const kind = requested === 'apple' || requested === 'google' ? requested : isIOS ? 'apple' : client.type_wallet || 'apple';

    if (kind === 'google') {
      const saveUrl = await googleSaveUrl(client);
      if (!saveUrl) return res.status(503).send('Google Wallet est momentanément indisponible. Réessayez plus tard.');
      return res.redirect(saveUrl);
    }

    const { serial } = await ensureWalletCard(client, 'apple');
    const buffer = await buildApplePass(serial, webServiceUrl(req));
    if (!buffer) return res.status(503).send('Apple Wallet est momentanément indisponible. Réessayez plus tard.');
    sendPkpass(res, buffer, `${client.prenom}_${client.nom}_${client.company_name}`);
  } catch (error) {
    logger.error(`❌ Erreur GET /client-download: ${error.message}`);
    res.status(500).send('Erreur lors de la génération de la carte.');
  }
};

/**
 * GET /api/app/wallet/unsubscribe/:clientId?t=... — page simple : le client ne reçoit plus d'offres.
 */
export const unsubscribeMarketing = async (req, res) => {
  const page = (msg) => `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fidelyz</title></head><body style="font-family:system-ui,sans-serif;max-width:480px;margin:15vh auto;padding:0 20px;text-align:center;color:#111"><h1 style="font-size:22px">${msg}</h1><p style="color:#555">Votre carte de fidélité et vos points restent actifs.</p></body></html>`;
  const { clientId } = req.params;
  if (!UUID_RE.test(String(clientId)) || !checkDownloadToken(clientId, req.query.t)) return res.status(404).send(page('Lien invalide'));
  try {
    await db.query('UPDATE clients SET marketing_optin = 0, marketing_optin_at = NOW() WHERE id = ?', [clientId]);
    res.send(page('Vous ne recevrez plus d’offres de ce commerce.'));
  } catch (error) {
    logger.error('Désinscription marketing', { error: error.message });
    res.status(500).send(page('Erreur, réessayez plus tard.'));
  }
};

export default {
  unsubscribeMarketing,
  createWalletPass,
  getWalletStatus,
  downloadClientPass
};
