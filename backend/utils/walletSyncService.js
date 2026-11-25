import db from '../db.js';
import logger from './logger.js';
import apnService from './apnService.js';
import googleWalletGenerator from './googleWalletGenerator.js';

/**
 * Synchronisation des cartes Wallet (Apple et Google) et messages affichés aux clients.
 *
 * Apple Wallet IGNORE le contenu des notifications push : un push sert uniquement à dire « cette carte a
 * changé ». Pour afficher un message sur l'écran verrouillé, on écrit le texte dans
 * wallet_cards.notification_message (champ « notif_msg » de la carte, avec changeMessage = '%@'), on date
 * la carte (last_updated) puis on envoie un push silencieux : l'iPhone télécharge la nouvelle carte et
 * affiche le texte qui a changé.
 *
 * Google Wallet : le message est ajouté à l'objet (TEXT_AND_NOTIFY, 3 par jour maximum par carte).
 */

const plural = (n, word) => `${n} ${word}${Math.abs(n) > 1 ? 's' : ''}`;

/**
 * Texte du message à afficher pour un événement. Retourne null pour une mise à jour silencieuse.
 * event : { type: 'points', delta } | { type: 'remove', delta } | { type: 'redeem', points, title, added }
 *       | { type: 'expiry_warning', points } | { type: 'message', title, body } | { type: 'silent' }
 */
export const describeEvent = (event, balance, tiers = []) => {
  if (!event || event.type === 'silent') return null;
  const nextTier = tiers.find((t) => t.points_required > balance);
  const progress = nextTier
    ? `Encore ${plural(nextTier.points_required - balance, 'point')} pour « ${nextTier.title} »`
    : `Vous avez ${plural(balance, 'point')} : toutes vos récompenses sont débloquées !`;

  switch (event.type) {
    case 'points':
      if (!(event.delta > 0)) return null;
      return { title: `+ ${plural(event.delta, 'point')}`, body: progress };
    case 'remove':
      if (!event.delta) return null;
      return {
        title: `${plural(Math.abs(event.delta), 'point')} retiré${Math.abs(event.delta) > 1 ? 's' : ''}`,
        body: `Nouveau solde : ${plural(balance, 'point')}.`
      };
    case 'redeem': {
      const added = event.added > 0 ? ` (+ ${plural(event.added, 'point')} pour cet achat)` : '';
      return {
        title: 'Récompense utilisée',
        body: `« ${event.title || 'Votre récompense'} » contre ${plural(event.points, 'point')}${added}. Solde : ${plural(balance, 'point')}.`
      };
    }
    case 'expiry_warning':
      return {
        title: 'Vos points expirent bientôt',
        body: `${plural(event.points, 'point')} expire${event.points > 1 ? 'nt' : ''} dans 7 jours. Venez vite les utiliser !`
      };
    case 'message':
      return event.body ? { title: event.title || '', body: event.body } : null;
    default:
      return null;
  }
};

// Texte affiché au dos de la carte Apple (et sur l'écran verrouillé quand il change).
export const appleText = (msg) => (msg ? (msg.title ? `${msg.title} : ${msg.body}` : msg.body).slice(0, 500) : null);

const expirationContext = async (clientId, companyId) => {
  const [lcRows] = await db.query(
    'SELECT points_expiration_months FROM loyalty_config WHERE entreprise_id = ?',
    [companyId]
  );
  const months = lcRows[0]?.points_expiration_months ?? null;
  let soonExpiringPoints = 0;
  if (months) {
    try {
      const { computeClientExpiration } = await import('../controllers/loyaltyController.js');
      ({ soonPoints: soonExpiringPoints } = await computeClientExpiration(clientId, months));
    } catch (err) {
      logger.warn(`[SYNC] computeClientExpiration failed for ${clientId}`, { error: err.message });
    }
  }
  return { points_expiration_months: months, soonExpiringPoints };
};

class WalletSyncService {
  /**
   * Met à jour la carte d'un client après un changement (points, récompense, message...).
   * lastPointsChange : variation de points (sans event, un delta positif affiche « + N points »).
   */
  async syncClientWallet(clientId, companyId, lastPointsChange = 0, event = null) {
    try {
      const [clientRows] = await db.query(
        `SELECT c.id, c.points, e.loyalty_type
         FROM clients c JOIN entreprises e ON c.entreprise_id = e.id
         WHERE c.id = ? AND c.entreprise_id = ?`,
        [clientId, companyId]
      );
      if (clientRows.length === 0) {
        logger.warn(`[SYNC] Client ${clientId} introuvable pour l'entreprise ${companyId}`);
        return null;
      }
      const client = clientRows[0];
      const balance = Number(client.points) || 0;
      const delta = Number(lastPointsChange) || 0;

      const [tiers] = await db.query(
        'SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC',
        [companyId]
      );
      const effectiveEvent = event || (delta > 0 ? { type: 'points', delta } : delta < 0 ? { type: 'remove', delta } : null);
      const msg = describeEvent(effectiveEvent, balance, tiers);

      const [walletRows] = await db.query(
        'SELECT pass_serial_number FROM wallet_cards WHERE client_id = ? AND company_id = ?',
        [clientId, companyId]
      );
      if (walletRows.length === 0) return { success: true, balance, message: msg };

      await db.query(
        `UPDATE wallet_cards
         SET points_balance = ?, last_points_change = ?, notification_message = COALESCE(?, notification_message), last_updated = NOW(3)
         WHERE client_id = ? AND company_id = ?`,
        [balance, delta, appleText(msg), clientId, companyId]
      );

      await Promise.all(walletRows.map(async ({ pass_serial_number: serial }) => {
        if (!serial) return;
        if (serial.startsWith('GOOGLE_')) {
          const [custRows] = await db.query(
            'SELECT * FROM card_customization WHERE company_id = ? AND loyalty_type = ?',
            [companyId, client.loyalty_type || 'points']
          );
          const config = custRows[0] ? { ...custRows[0], ...(await expirationContext(clientId, companyId)) } : null;
          await googleWalletGenerator.updateLoyaltyObject(clientId, companyId, balance, tiers, config);
          if (msg) await googleWalletGenerator.addMessageToObject(clientId, msg.title || 'Message', msg.body);
          return;
        }
        const [registrations] = await db.query(
          'SELECT DISTINCT push_token FROM apple_pass_registrations WHERE pass_serial_number = ?',
          [serial]
        );
        if (registrations.length > 0) {
          await apnService.sendBulkUpdateNotifications(registrations.map((r) => r.push_token));
        }
      })).catch((err) => logger.error('[SYNC] Erreur de synchronisation', { clientId, error: err.message }));

      return { success: true, balance, message: msg };
    } catch (error) {
      logger.error(`❌ Erreur syncClientWallet (${clientId})`, { error: error.message });
      throw error;
    }
  }

  /**
   * Affiche un message sur les cartes de plusieurs clients d'une entreprise (campagne).
   * Retourne { apple, google } : nombre de cartes touchées par plateforme.
   */
  async notifyClients(companyId, clientIds, title, body) {
    if (!Array.isArray(clientIds) || clientIds.length === 0) return { apple: 0, google: 0 };
    const text = appleText({ title, body });

    await db.query(
      // Texte identique au précédent : un caractère invisible le rend différent, sinon iOS n'afficherait pas l'alerte.
      `UPDATE wallet_cards
       SET notification_message = IF(notification_message = ?, CONCAT(?, '\u200B'), ?), last_updated = NOW(3)
       WHERE company_id = ? AND client_id IN (?) AND pass_serial_number NOT LIKE 'GOOGLE\\_%'`,
      [text, text, text, companyId, clientIds]
    );
    const [appleRegs] = await db.query(
      `SELECT DISTINCT r.push_token
       FROM apple_pass_registrations r
       JOIN wallet_cards w ON r.pass_serial_number = w.pass_serial_number
       WHERE w.company_id = ? AND w.client_id IN (?)`,
      [companyId, clientIds]
    );
    const [googleCards] = await db.query(
      `SELECT client_id FROM wallet_cards
       WHERE company_id = ? AND client_id IN (?) AND pass_serial_number LIKE 'GOOGLE\\_%'`,
      [companyId, clientIds]
    );

    if (appleRegs.length > 0) {
      apnService.sendBulkUpdateNotifications(appleRegs.map((r) => r.push_token))
        .catch((err) => logger.error('[CAMPAGNE] Push Apple en échec', { error: err.message }));
    }
    // Envoi Google par paquets de 10 pour ne pas saturer l'API.
    (async () => {
      for (let i = 0; i < googleCards.length; i += 10) {
        await Promise.allSettled(googleCards.slice(i, i + 10).map((c) =>
          googleWalletGenerator.addMessageToObject(c.client_id, title, body)
        ));
      }
    })().catch((err) => logger.error('[CAMPAGNE] Messages Google en échec', { error: err.message }));

    return { apple: appleRegs.length, google: googleCards.length };
  }

  /**
   * Synchronise toutes les cartes d'une entreprise après un changement de design ou de paliers.
   * Mise à jour SILENCIEUSE : aucun message n'est ajouté, aucune notification n'est affichée.
   */
  async syncCompanyWallets(companyId) {
    try {
      const [customRows] = await db.query('SELECT * FROM card_customization WHERE company_id = ?', [companyId]);
      const [companyRows] = await db.query('SELECT nom FROM entreprises WHERE id = ?', [companyId]);

      if (customRows.length > 0 && companyRows.length > 0) {
        for (const config of customRows) {
          await googleWalletGenerator.createOrUpdateClass(companyId, config, companyRows[0].nom, config.loyalty_type)
            .catch((err) => logger.error('[SYNC GLOBALE] Classe Google non mise à jour', { error: err.message }));
        }
      }
      await db.query('UPDATE wallet_cards SET last_updated = NOW(3) WHERE company_id = ?', [companyId]);

      const [registrations] = await db.query(
        `SELECT DISTINCT r.push_token
         FROM apple_pass_registrations r
         JOIN wallet_cards w ON r.pass_serial_number = w.pass_serial_number
         WHERE w.company_id = ?`,
        [companyId]
      );
      if (registrations.length > 0) {
        apnService.sendBulkUpdateNotifications(registrations.map((r) => r.push_token)).catch((err) =>
          logger.error('[SYNC GLOBALE] Échec push Apple', { error: err.message })
        );
      }

      const [googleWallets] = await db.query(
        `SELECT w.client_id, c.points
         FROM wallet_cards w JOIN clients c ON w.client_id = c.id
         WHERE w.company_id = ? AND w.pass_serial_number LIKE 'GOOGLE\\_%'`,
        [companyId]
      );
      if (googleWallets.length > 0) {
        const [rewardTiers] = await db.query(
          'SELECT * FROM reward_tiers WHERE entreprise_id = ? ORDER BY points_required ASC',
          [companyId]
        );
        for (let i = 0; i < googleWallets.length; i += 25) {
          await Promise.all(googleWallets.slice(i, i + 25).map(async (wallet) => {
            const config = customRows[0] ? { ...customRows[0], ...(await expirationContext(wallet.client_id, companyId)) } : null;
            return googleWalletGenerator.updateLoyaltyObject(wallet.client_id, companyId, wallet.points, rewardTiers, config)
              .catch((err) => logger.error(`[SYNC GLOBALE] Objet Google ${wallet.client_id}`, { error: err.message }));
          }));
        }
      }
      return { success: true, recipients: registrations.length };
    } catch (error) {
      logger.error(`❌ Erreur syncCompanyWallets (${companyId})`, { error: error.message });
      throw error;
    }
  }
}

export default new WalletSyncService();
