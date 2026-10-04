import db from '../db.js';
import logger from './logger.js';
import apnService from './apnService.js';
import googleWalletGenerator from './googleWalletGenerator.js';

/**
 * Service centralisé pour synchroniser les Wallets (Apple & Google)
 */
class WalletSyncService {
  /**
   * Synchronise la carte d'un client spécifique
   * Appelé après un ajout de points, ajustement ou redemption
   */
  async syncClientWallet(clientId, companyId, lastPointsChange = 0) {
    try {
      logger.info(`🔄 [SYNC] Début synchronisation pour client ${clientId} (Entreprise: ${companyId})`);
      const [clientRows] = await db.query(
        `SELECT c.id, c.points, c.type_wallet, e.nom as company_name, e.loyalty_type
         FROM clients c
         JOIN entreprises e ON c.entreprise_id = e.id
         WHERE c.id = ? AND c.entreprise_id = ?`,
        [clientId, companyId]
      );

      if (!clientRows || clientRows.length === 0) {
        logger.warn(`⚠️ [SYNC] ÉCHEC : Client [${clientId}] non trouvé pour l'entreprise [${companyId}]. Vérifiez s'il s'agit d'un UUID ou d'un Serial Number.`);
        return;
      }

      const client = clientRows[0];
      const newBalance = client.points || 0;
      const [tiers] = await db.query(
        'SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC',
        [companyId]
      );

      const [custRows] = await db.query(
        'SELECT * FROM card_customization WHERE company_id = ? AND loyalty_type = ?',
        [companyId, client.loyalty_type || 'points']
      );
      const [lcRows] = await db.query(
        'SELECT points_expiration_months FROM loyalty_config WHERE entreprise_id = ?',
        [companyId]
      );
      const expirationMonths = lcRows[0]?.points_expiration_months ?? null;
      let soonExpiringPoints = 0;
      if (expirationMonths) {
        try {
          const { computeClientExpiration } = await import('../controllers/loyaltyController.js');
          const { soonPoints } = await computeClientExpiration(clientId, expirationMonths);
          soonExpiringPoints = soonPoints;
        } catch (err) {
          logger.warn(`[SYNC] computeClientExpiration failed for ${clientId}`, { error: err.message });
        }
      }
      const clientCustomization = custRows[0]
        ? { ...custRows[0], points_expiration_months: expirationMonths, soonExpiringPoints }
        : null;
      await db.query(
        'UPDATE wallet_cards SET points_balance = ?, last_points_change = ?, last_updated = NOW(3) WHERE client_id = ? AND company_id = ?',
        [newBalance, lastPointsChange, clientId, companyId]
      );
      const [walletRows] = await db.query(
        'SELECT pass_serial_number FROM wallet_cards WHERE client_id = ? AND company_id = ?',
        [clientId, companyId]
      );

      if (walletRows.length > 0) {
        const syncPromises = walletRows.map(async (wallet) => {
          const serial = wallet.pass_serial_number;
          if (serial && !serial.startsWith('GOOGLE_')) {
            const [registrations] = await db.query(
              'SELECT push_token FROM apple_pass_registrations WHERE pass_serial_number = ?',
              [serial]
            );

            if (registrations.length > 0) {
              const tokens = registrations.map(r => r.push_token);
              return apnService.sendBulkUpdateNotifications(tokens);
            }
          }
          if (serial && serial.startsWith('GOOGLE_')) {
            logger.info(`   🤖 [SYNC] Mise à jour Google Wallet`);
            await googleWalletGenerator.updateLoyaltyObject(clientId, companyId, newBalance, tiers, clientCustomization);

            const delta = lastPointsChange || 0;
            if (delta !== 0) {
              let title, msgBody;
              if (delta < 0) {
                const usedPoints = Math.abs(delta);
                const redeemedTier = tiers.find(t => t.points_required === usedPoints);
                title = 'Récompense utilisée';
                msgBody = `Vous avez utilisé ${usedPoints} points pour cette récompense : "${redeemedTier ? redeemedTier.title : 'votre récompense'}"`;
              } else {
                const nextTier = tiers.find(t => t.points_required > newBalance);
                title = `+ ${delta} points`;
                msgBody = nextTier
                  ? `Encore ${nextTier.points_required - newBalance} pts pour obtenir cette récompense "${nextTier.title}"`
                  : `Bravo, vous avez ${newBalance} points et avez atteint tous vos paliers !`;
              }
              await googleWalletGenerator.addMessageToObject(clientId, title, msgBody);
            }
          }
        });
        await Promise.all(syncPromises).catch(err => logger.error('Parallel sync error', err));
      }

      return { success: true, balance: newBalance };
    } catch (error) {
      logger.error(`❌ Erreur syncClientWallet (${clientId}):`, error);
      throw error;
    }
  }

  /**
   * Synchronise TOUTES les cartes d'une entreprise
   * Appelé après un changement de design ou de paliers de récompense
   */
  async syncCompanyWallets(companyId) {
    try {
      logger.info(`🔄 Synchronisation GLOBALE pour l'entreprise ${companyId}`);
      const [customRows] = await db.query('SELECT * FROM card_customization WHERE company_id = ?', [companyId]);
      const [companyRows] = await db.query('SELECT nom FROM entreprises WHERE id = ?', [companyId]);
      
      if (customRows.length > 0 && companyRows.length > 0) {
        for (const config of customRows) {
          await googleWalletGenerator.createOrUpdateClass(companyId, config, companyRows[0].nom, config.loyalty_type);
        }
        logger.info(`   🤖 Google Class synchronisée`);
      }
      await db.query(
        'UPDATE wallet_cards SET last_updated = NOW(3) WHERE company_id = ?',
        [companyId]
      );
      logger.info(`   🍎 [SYNC GLOBALE] Recherche de terminaux Apple pour l'entreprise ID: ${companyId}...`);
      
      const [registrations] = await db.query(
        `SELECT DISTINCT r.push_token 
         FROM apple_pass_registrations r
         JOIN wallet_cards w ON r.pass_serial_number = w.pass_serial_number
         WHERE w.company_id = ?`,
        [companyId]
      );
      
      if (registrations.length > 0) {
        const tokens = registrations.map(r => r.push_token);
        logger.info(`   🍎 [SYNC GLOBALE] ${tokens.length} terminal/terminaux trouvé(s). Envoi des notifications...`);
        apnService.sendBulkUpdateNotifications(tokens).catch(err => 
          logger.error(`   🍎 [SYNC GLOBALE] Échec Push arrière-plan:`, err.message)
        );
      } else {
        logger.warn(`   ⚠️ [SYNC GLOBALE] Aucun terminal Apple enregistré trouvé pour l'entreprise ${companyId}.`);
        const [cardCount] = await db.query('SELECT COUNT(*) as count FROM wallet_cards WHERE company_id = ?', [companyId]);
        logger.info(`   📊 Diagnostic : ${cardCount[0].count} carte(s) trouvée(s) en base pour cette entreprise, mais 0 enregistrement Push.`);
      }
      const [googleWallets] = await db.query(
        `SELECT w.client_id, c.points 
         FROM wallet_cards w
         JOIN clients c ON w.client_id = c.id
         WHERE w.company_id = ? AND w.pass_serial_number LIKE "GOOGLE_%"`,
        [companyId]
      );

      if (googleWallets.length > 0) {
        const [rewardTiers] = await db.query(
          'SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC',
          [companyId]
        );

        logger.info(`   🚀 [SUPERCHARGED SYNC] Lancement global pour ${googleWallets.length} objets Google...`);
        const chunkSize = 25;
        const chunks = [];
        for (let i = 0; i < googleWallets.length; i += chunkSize) {
          chunks.push(googleWallets.slice(i, i + chunkSize));
        }
        await Promise.all(chunks.map(async (chunk, index) => {
          try {
            await Promise.all(chunk.map(wallet => 
              googleWalletGenerator.updateLoyaltyObject(wallet.client_id, companyId, wallet.points, rewardTiers, customRows[0] || null)
                .catch(err => logger.error(`      ❌ Erreur sync Google client ${wallet.client_id}:`, err.message))
            ));
            logger.debug(`   🤖 [SYNC V8.6] Paquet ${index + 1}/${chunks.length} terminé`);
          } catch (err) {
            logger.error(`   ❌ Échec partiel dans le paquet ${index + 1}:`, err.message);
          }
        }));

        logger.info(`   ✅ [SUPERCHARGED SYNC] Terminé avec succès !`);
      }
      
      return { success: true, recipients: registrations.length };
    } catch (error) {
      logger.error(`❌ Erreur syncCompanyWallets (${companyId}):`, error);
      throw error;
    }
  }
}

export default new WalletSyncService();
