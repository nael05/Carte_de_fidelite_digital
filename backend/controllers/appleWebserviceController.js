/**
 * AppleWebserviceController.js
 * Web Service appelé par Apple Wallet (https://developer.apple.com/documentation/walletpasses) :
 * - POST   /v1/devices/:device/registrations/:passType/:serial   inscription d'un appareil
 * - GET    /v1/devices/:device/registrations/:passType           cartes modifiées depuis un tag
 * - GET    /v1/passes/:passType/:serial                           dernière version de la carte
 * - DELETE /v1/devices/:device/registrations/:passType/:serial    désinscription
 * - POST   /v1/log                                                journaux de l'appareil
 */

import db from '../db.js';
import logger from '../utils/logger.js';
import { buildApplePass, webServiceUrl } from '../utils/applePass.js';

const passTypeOk = (passTypeIdentifier) => passTypeIdentifier === process.env.APPLE_PASS_TYPE_ID;
const applePassToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('ApplePass ') ? header.substring('ApplePass '.length).trim() : null;
};

/**
 * Vérifie l'en-tête « Authorization: ApplePass <authenticationToken> » pour la carte demandée.
 */
export const authenticateApplePass = async (req, res, next) => {
  try {
    const token = applePassToken(req);
    const { serialNumber } = req.params;
    if (!token || !serialNumber) return res.status(401).json({ error: 'Unauthorized' });

    const [rows] = await db.query(
      'SELECT id, client_id, last_updated FROM wallet_cards WHERE pass_serial_number = ? AND authentication_token = ?',
      [serialNumber, token]
    );
    if (rows.length === 0) {
      logger.warn(`⚠️ Authentification ApplePass refusée pour la carte ${serialNumber}`);
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.authPass = { ...rows[0], serialNumber };
    next();
  } catch (error) {
    logger.error(`❌ Erreur authentification ApplePass: ${error.message}`);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// POST — 201 si l'appareil est nouveau pour cette carte, 200 s'il était déjà inscrit.
export const registerDevice = async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    const pushToken = req.body?.pushToken;
    if (!passTypeOk(passTypeIdentifier)) return res.status(404).json({ error: 'Incorrect pass type' });
    if (!deviceLibraryIdentifier || !serialNumber || typeof pushToken !== 'string' || !pushToken) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const token = applePassToken(req);
    if (!token) return res.status(401).json({ error: 'Authorization required' });

    const [passRows] = await db.query(
      'SELECT id FROM wallet_cards WHERE pass_serial_number = ? AND authentication_token = ?',
      [serialNumber, token]
    );
    if (passRows.length === 0) return res.status(401).json({ error: 'Invalid authentication token' });

    const [existing] = await db.query(
      'SELECT id FROM apple_pass_registrations WHERE pass_serial_number = ? AND device_library_identifier = ?',
      [serialNumber, deviceLibraryIdentifier]
    );
    await db.query(
      `INSERT INTO apple_pass_registrations (pass_serial_number, device_library_identifier, push_token, pass_type_identifier)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE push_token = VALUES(push_token), pass_type_identifier = VALUES(pass_type_identifier)`,
      [serialNumber, deviceLibraryIdentifier, pushToken.slice(0, 255), passTypeIdentifier]
    );
    await db.query('UPDATE wallet_cards SET wallet_added_at = COALESCE(wallet_added_at, NOW()) WHERE pass_serial_number = ?', [serialNumber]);

    logger.info(`✅ Appareil inscrit pour la carte ${serialNumber}`);
    res.status(existing.length > 0 ? 200 : 201).json({ status: 'success' });
  } catch (error) {
    logger.error(`❌ Erreur enregistrement device: ${error.message}`);
    res.status(500).json({ error: 'Device registration error' });
  }
};

// GET — liste des cartes de l'appareil modifiées depuis le tag (horodatage en millisecondes).
export const getUpdatedPasses = async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier } = req.params;
    if (!passTypeOk(passTypeIdentifier)) return res.status(404).json({ error: 'Incorrect pass type' });

    const [registrations] = await db.query(
      `SELECT DISTINCT apr.pass_serial_number, wc.last_updated
       FROM apple_pass_registrations apr
       JOIN wallet_cards wc ON apr.pass_serial_number = wc.pass_serial_number
       WHERE apr.device_library_identifier = ?`,
      [deviceLibraryIdentifier]
    );
    if (registrations.length === 0) return res.status(204).send();

    const since = Number.parseInt(req.query.passesUpdatedSince, 10);
    const updated = Number.isFinite(since)
      ? registrations.filter((p) => new Date(p.last_updated).getTime() >= since)
      : registrations;
    if (updated.length === 0) return res.status(204).send();

    const latest = Math.max(...updated.map((p) => new Date(p.last_updated).getTime()));
    res.json({ serialNumbers: updated.map((p) => p.pass_serial_number), lastUpdated: String(latest) });
  } catch (error) {
    logger.error(`❌ Erreur vérification mises à jour: ${error.message}`);
    res.status(500).json({ error: 'Check updates error' });
  }
};

// GET — dernière version de la carte (authentifiée par authenticateApplePass).
export const getUpdatedPass = async (req, res) => {
  try {
    const { passTypeIdentifier, serialNumber } = req.params;
    if (!passTypeOk(passTypeIdentifier)) return res.status(404).json({ error: 'Incorrect pass type' });

    const lastUpdated = new Date(req.authPass.last_updated);
    const ifModifiedSince = Date.parse(req.headers['if-modified-since'] || '');
    if (Number.isFinite(ifModifiedSince) && Math.floor(lastUpdated.getTime() / 1000) <= Math.floor(ifModifiedSince / 1000)) {
      return res.status(304).send();
    }

    const passBuffer = await buildApplePass(serialNumber, webServiceUrl(req));
    if (!passBuffer) return res.status(503).json({ error: 'Apple Wallet indisponible' });

    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Last-Modified', lastUpdated.toUTCString());
    res.setHeader('Cache-Control', 'no-store');
    res.send(passBuffer);
  } catch (error) {
    logger.error(`❌ Erreur livraison pass: ${error.message}`);
    res.status(500).json({ error: 'Pass delivery error' });
  }
};

// DELETE — la carte a été retirée du Wallet de cet appareil.
export const unregisterDevice = async (req, res) => {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = req.params;
    if (!passTypeOk(passTypeIdentifier)) return res.status(404).json({ error: 'Incorrect pass type' });

    await db.query(
      'DELETE FROM apple_pass_registrations WHERE pass_serial_number = ? AND device_library_identifier = ?',
      [serialNumber, deviceLibraryIdentifier]
    );
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error(`❌ Erreur désenregistrement: ${error.message}`);
    res.status(500).json({ error: 'Unregistration error' });
  }
};

// POST — journaux envoyés par les appareils (utile pour diagnostiquer une carte refusée).
export const logAppleWalletErrors = async (req, res) => {
  const logs = Array.isArray(req.body?.logs) ? req.body.logs : [];
  logs.slice(0, 20).forEach((log) => logger.warn(`🍎 [APPLE WALLET LOG] ${String(log).substring(0, 500)}`));
  res.status(200).json({ success: true });
};

export default {
  authenticateApplePass,
  registerDevice,
  getUpdatedPasses,
  getUpdatedPass,
  unregisterDevice,
  logAppleWalletErrors
};
