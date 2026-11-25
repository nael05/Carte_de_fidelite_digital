import logger from './logger.js';
import walletSyncService from './walletSyncService.js';

/**
 * Met à jour la carte Wallet d'un client après une opération de caisse, en tâche de fond.
 * event (facultatif) : voir describeEvent() dans walletSyncService.js — par défaut « + N points » / « N points retirés ».
 */
export const sendLoyaltyUpdateNotification = async (clientId, empresaId, pointsChange, event = null) => {
  walletSyncService.syncClientWallet(clientId, empresaId, Number(pointsChange) || 0, event)
    .catch((err) => logger.error('Mise à jour de la carte Wallet échouée', { clientId, error: err.message }));
};

export default { sendLoyaltyUpdateNotification };
