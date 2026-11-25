/**
 * APNService.js
 * Push Apple Wallet : signal « une carte a changé ».
 *
 * Apple Wallet ignore le contenu des notifications : la charge utile doit être vide ({ aps: {} }).
 * À réception, l'iPhone interroge le Web Service (/api/wallet/v1/...) et télécharge la carte à jour.
 * Les messages visibles passent par le champ de la carte qui change (voir walletSyncService.js).
 */

import 'dotenv/config';
import apn from '@parse/node-apn';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import db from '../db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Réponses APNs qui signifient que le jeton n'est plus valable (carte supprimée, appareil réinitialisé...).
const DEAD_TOKEN_REASONS = new Set(['BadDeviceToken', 'Unregistered', 'DeviceTokenNotForTopic']);

export class APNService {
  constructor() {
    const rawPath = (process.env.APPLE_APN_KEY_PATH || '').trim();
    this.apnKeyPath = rawPath ? (path.isAbsolute(rawPath) ? rawPath : path.resolve(__dirname, '..', rawPath)) : null;
    this.apnKeyId = (process.env.APPLE_APN_KEY_ID || '').trim();
    this.apnTeamId = (process.env.APPLE_APN_TEAM_ID || process.env.APPLE_TEAM_ID || '').trim();
    this.topic = (process.env.APPLE_PASS_TYPE_ID || '').trim();
    this.provider = null;
    this.initializeProvider();
  }

  initializeProvider() {
    try {
      if (!this.apnKeyPath || !this.apnKeyId || !this.apnTeamId || !this.topic) {
        logger.warn('⚠️ Configuration APNs incomplète (APPLE_APN_KEY_PATH, APPLE_APN_KEY_ID, APPLE_APN_TEAM_ID, APPLE_PASS_TYPE_ID) : mises à jour Apple Wallet désactivées');
        return;
      }
      if (!fs.existsSync(this.apnKeyPath)) {
        logger.error(`❌ Clé APNs (.p8) introuvable : ${this.apnKeyPath}`);
        return;
      }
      // Les push Wallet passent toujours par la passerelle de production d'Apple.
      this.provider = new apn.Provider({
        token: { key: this.apnKeyPath, keyId: this.apnKeyId, teamId: this.apnTeamId },
        production: true
      });
      logger.info('✅ Provider APNs initialisé');
    } catch (error) {
      logger.error(`❌ Échec initialisation APNs: ${error.message}`);
      this.provider = null;
    }
  }

  isConfigured() {
    return !!this.provider;
  }

  /**
   * Envoie le signal de mise à jour à une liste de jetons. Les jetons morts sont supprimés de la base.
   * @returns {Promise<{ sent: number, failed: number }>}
   */
  async sendBulkUpdateNotifications(pushTokens) {
    const tokens = [...new Set((pushTokens || []).filter(Boolean))];
    if (tokens.length === 0) return { sent: 0, failed: 0 };
    if (!this.provider) {
      logger.warn(`⚠️ APNs non configuré : ${tokens.length} mise(s) à jour Apple non envoyée(s)`);
      return { sent: 0, failed: tokens.length };
    }

    const notification = new apn.Notification();
    notification.rawPayload = { aps: {} };
    // Push Wallet : charge vide, type « background », priorité 5 (seule combinaison documentée pour un push sans alerte).
    notification.pushType = 'background';
    notification.priority = 5;
    notification.topic = this.topic;

    try {
      const result = await this.provider.send(notification, tokens);
      const dead = (result.failed || [])
        .filter((f) => DEAD_TOKEN_REASONS.has(f.response?.reason) || f.status === 410 || f.status === '410')
        .map((f) => f.device);
      for (const f of result.failed || []) {
        logger.warn(`⚠️ Push Apple refusé [${String(f.device).slice(0, 10)}…] : ${f.response?.reason || f.error?.message || f.status}`);
      }
      if (dead.length > 0) {
        await db.query('DELETE FROM apple_pass_registrations WHERE push_token IN (?)', [dead])
          .catch((err) => logger.warn('Nettoyage des jetons APNs impossible', { error: err.message }));
      }
      return { sent: (result.sent || []).length, failed: (result.failed || []).length };
    } catch (error) {
      logger.error(`❌ Erreur envoi APNs: ${error.message}`);
      return { sent: 0, failed: tokens.length };
    }
  }

  async close() {
    if (this.provider) await this.provider.shutdown();
  }
}

export const apnService = new APNService();
export default apnService;
