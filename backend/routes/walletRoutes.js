/**
 * Routes Wallet
 * 1. Application : /app/wallet/*  (espace pro + lien public de téléchargement)
 * 2. Web Service Apple Wallet : /wallet/v1/*  (appelé par les iPhone, authentification « ApplePass »)
 */

import express from 'express';
import * as walletAppController from '../controllers/walletAppController.js';
import * as appleWebserviceController from '../controllers/appleWebserviceController.js';
import { verifyToken, isPro, isAdmin } from '../middlewares/auth.js';
import db from '../db.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Espace pro : générer la carte d'un client et consulter son état.
router.post('/app/wallet/create', verifyToken, isPro, walletAppController.createWalletPass);
router.get('/app/wallet/status/:clientId', verifyToken, isPro, walletAppController.getWalletStatus);

// Lien envoyé au client après son inscription.
router.get('/app/wallet/client-download/:clientId', walletAppController.downloadClientPass);

// Web Service Apple Wallet
router.post(
  '/wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  appleWebserviceController.registerDevice
);
router.get(
  '/wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier',
  appleWebserviceController.getUpdatedPasses
);
router.get(
  '/wallet/v1/passes/:passTypeIdentifier/:serialNumber',
  appleWebserviceController.authenticateApplePass,
  appleWebserviceController.getUpdatedPass
);
router.delete(
  '/wallet/v1/devices/:deviceLibraryIdentifier/registrations/:passTypeIdentifier/:serialNumber',
  appleWebserviceController.authenticateApplePass,
  appleWebserviceController.unregisterDevice
);
router.post('/wallet/v1/log', appleWebserviceController.logAppleWalletErrors);

// Admin : cartes d'une entreprise.
router.get('/app/wallet/admin/cards/:companyId', verifyToken, isAdmin, async (req, res) => {
  try {
    const [cards] = await db.query(
      `SELECT wc.id, wc.pass_serial_number, c.prenom, c.nom, wc.points_balance, wc.wallet_added_at,
              COUNT(apr.id) AS device_count
       FROM wallet_cards wc
       JOIN clients c ON wc.client_id = c.id
       LEFT JOIN apple_pass_registrations apr ON wc.pass_serial_number = apr.pass_serial_number
       WHERE wc.company_id = ?
       GROUP BY wc.id`,
      [req.params.companyId]
    );
    res.json({ success: true, cards });
  } catch (error) {
    logger.error(`Erreur fetch admin cards: ${error.message}`);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
