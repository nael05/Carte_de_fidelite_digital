/**
 * PassGenerator.js
 * Génère les fichiers .pkpass Apple Wallet à partir des données du client
 * Utilise @walletpass/pass-js (supporte P12 nativement)
 */

import 'dotenv/config';
import { Template } from '@walletpass/pass-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import sharp from 'sharp';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Échappement des valeurs insérées dans les liens HTML (attributedValue) du dos de la carte.
const escHtml = (v) => String(v).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export class PassGenerator {
  constructor() {
    this.configLoaded = false;
  }

  /**
   * Charge la configuration une seule fois de manière paresseuse
   */
  _loadConfig() {
    try {
      if (this.configLoaded) return true;

      this.certPath = process.env.APPLE_CERT_PATH;
      this.keyPath = process.env.APPLE_KEY_PATH || this.certPath;

      if (this.certPath && !path.isAbsolute(this.certPath)) {
        this.certPath = path.resolve(__dirname, '..', this.certPath);
      }
      if (this.keyPath && !path.isAbsolute(this.keyPath)) {
        this.keyPath = path.resolve(__dirname, '..', this.keyPath);
      }

      this.certPassword = process.env.APPLE_CERT_PASSWORD || '';
      this.teamId = process.env.APPLE_TEAM_ID;
      this.passTypeId = process.env.APPLE_PASS_TYPE_ID;
      this.webserviceUrl = process.env.APPLE_WALLET_WEBSERVICE_URL;

      if (typeof this.webserviceUrl === 'string' && this.webserviceUrl.endsWith('/')) {
        this.webserviceUrl = this.webserviceUrl.slice(0, -1);
      }

      if (!this.certPath) {
        logger.warn('⚠️ APPLE_CERT_PATH est manquant. Apple Wallet sera désactivé.');
        return false;
      }

      this.configLoaded = true;
      return true;
    } catch (err) {
      logger.error('❌ Erreur chargement config PassGenerator:', err.message);
      return false;
    }
  }

  /**
   * Jours avant l'expiration du certificat Apple (null si illisible). Expiré = plus aucune carte générée.
   */
  certificateDaysLeft() {
    try {
      this._loadConfig();
      if (!this.certPath || !fs.existsSync(this.certPath)) return null;
      const cert = new crypto.X509Certificate(this.extractPEM(fs.readFileSync(this.certPath)));
      return Math.floor((new Date(cert.validTo).getTime() - Date.now()) / 86_400_000);
    } catch {
      return null;
    }
  }

  /**
   * Valide que tous les certificats et configs sont disponibles
   */
  validateConfiguration() {
    this._loadConfig();
    if (!this.certPath || !this.keyPath) {
      logger.warn('⚠️ Configuration Apple Wallet incomplète (APPLE_CERT_PATH manquant).');
      return false;
    }

    if (!fs.existsSync(this.certPath)) {
      logger.warn(`⚠️ CERTIFICAT APPLE MANQUANT: ${this.certPath}.`);
      return false;
    }

    if (!fs.existsSync(this.keyPath)) {
      logger.warn(`⚠️ CLÉ APPLE MANQUANTE: ${this.keyPath}.`);
      return false;
    }

    const requiredEnvs = ['APPLE_TEAM_ID', 'APPLE_PASS_TYPE_ID', 'APPLE_WALLET_WEBSERVICE_URL'];
    for (const env of requiredEnvs) {
      if (!process.env[env]) {
        logger.warn(`⚠️ VARIABLE ENV APPLE MANQUANTE: ${env}.`);
        return false;
      }
    }

    return true;
  }

  /**
   * Helper pour obtenir le buffer d'une image (URL ou disque local)
   */
  async fetchImageBuffer(urlOrPath) {
    // Seuls les fichiers téléversés sur ce serveur sont acceptés : aucune requête vers une URL
    // arbitraire (une URL saisie par un commerçant ne doit pas faire appeler le réseau interne).
    if (!urlOrPath || typeof urlOrPath !== 'string' || !urlOrPath.includes('uploads/')) return null;
    try {
      const cleanPath = urlOrPath.substring(urlOrPath.indexOf('uploads/'));
      const fullPath = path.resolve(__dirname, '..', cleanPath);
      const uploadsDir = path.resolve(__dirname, '..', 'uploads');
      if (!fullPath.startsWith(uploadsDir + path.sep) || !fs.existsSync(fullPath)) {
        if (fullPath.startsWith(uploadsDir + path.sep)) logger.warn(`⚠️ Image Apple Wallet introuvable : ${cleanPath}`);
        return null;
      }
      return fs.readFileSync(fullPath);
    } catch (e) {
      logger.error(`❌ Erreur lecture image [${urlOrPath}]: ${e.message}`);
      return null;
    }
  }

  /**
   * Icône par défaut (obligatoire pour Apple) : carré de la couleur de la carte, généré localement.
   */
  async defaultIcon(color) {
    const match = /^#?([0-9a-f]{6})$/i.exec(String(color || '').trim());
    const hex = match ? match[1] : '1f2937';
    const background = { r: parseInt(hex.slice(0, 2), 16), g: parseInt(hex.slice(2, 4), 16), b: parseInt(hex.slice(4, 6), 16), alpha: 1 };
    return sharp({ create: { width: 87, height: 87, channels: 4, background } }).png().toBuffer();
  }

  /**
   * Helper pour extraire le PEM pur
   */
  extractPEM(buffer) {
    const str = buffer.toString('utf8');
    const match = str.match(/-----BEGIN [\s\S]+?-----END [\s\S]+?-----/);
    return match ? match[0] : str;
  }

  /**
   * Ajoute une image de manière sécurisée (évite le crash undefined 'add')
   */
  async safeAddImage(target, type, buffer) {
    try {
      if (!buffer) return false;
      if (target && target.images && typeof target.images.add === 'function') {
        await target.images.add(type, buffer);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Ajoute un champ à une collection de manière sécurisée
   */
  safeAddField(collection, data) {
    try {
      if (collection && typeof collection.add === 'function') {
        collection.add(data);
        return true;
      }
      return false;
    } catch (e) {
      logger.error(`❌ Erreur safeAddField: ${e.message}`);
      return false;
    }
  }

  /**
   * Ajoute une localisation de manière sécurisée
   */
  safeAddLocation(pass, locData) {
    try {
      if (pass) {
        if (typeof pass.addLocation === 'function') {
          pass.addLocation(locData);
          return true;
        }

        const currentLocations = Array.isArray(pass.locations) ? pass.locations : [];
        currentLocations.push(locData);
        pass.locations = currentLocations;
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  /**
   * Génère un passe Apple Wallet complet
   */
  async generateLoyaltyPass(clientData, customization, serialNumber, authToken, options = {}) {
    try {
      if (!this._loadConfig()) {
        logger.warn('⚠️ PassGenerator non configuré (certificat absent). Génération annulée.');
        return null;
      }

      if (!this.certPath || !this.keyPath) {
        logger.warn('⚠️ Chemins des certificats Apple non configurés (APPLE_CERT_PATH).');
        return null;
      }

      if (!fs.existsSync(this.certPath)) {
        logger.warn(`⚠️ Certificat Apple absent du disque: ${this.certPath}`);
        return null;
      }

      if (!fs.existsSync(this.keyPath)) {
        logger.warn(`⚠️ Clé Apple absente du disque: ${this.keyPath}`);
        return null;
      }

      logger.info(`🎫 Génération pass pour client: ${clientData.clientId}`);

      const certificateBuffer = fs.readFileSync(this.certPath);
      const keyBuffer = fs.readFileSync(this.keyPath);

      const template = new Template("storeCard", {
        passTypeIdentifier: this.passTypeId,
        teamIdentifier: this.teamId,
        organizationName: customization?.apple_organization_name || clientData.companyName || 'Organisation',
        description: customization?.apple_pass_description || 'Carte de Fidélité',
        backgroundColor: customization?.apple_background_color || 'rgb(31,41,55)',
        labelColor: customization?.apple_label_color || 'rgb(168,168,168)',
        foregroundColor: customization?.apple_text_color || 'rgb(255,255,255)',
        logoText: customization?.logo_text || clientData.companyName || '',
        webServiceURL: options.webServiceURL || this.webserviceUrl,
        authenticationToken: authToken,
      });

      const cleanCert = this.extractPEM(certificateBuffer);
      const cleanKey = this.extractPEM(keyBuffer);

      template.setCertificate(cleanCert);
      template.setPrivateKey(cleanKey, this.certPassword || undefined);


      const finalLogoUrl = customization?.apple_logo_url || customization?.logo_url;
      const finalIconUrl = customization?.apple_icon_url || customization?.icon_url;
      const finalStripUrl = customization?.apple_strip_image_url || customization?.strip_image_url;

      const [logoBuffer, iconBuffer, stripBuffer] = await Promise.all([
        this.fetchImageBuffer(finalLogoUrl),
        this.fetchImageBuffer(finalIconUrl),
        this.fetchImageBuffer(finalStripUrl)
      ]);

      await this.safeAddImage(template, "logo", logoBuffer);
      await this.safeAddImage(template, "icon", iconBuffer);
      if (stripBuffer) {
        await this.safeAddImage(template, "strip", stripBuffer);
      }

      if (!iconBuffer) {
        try {
          await this.safeAddImage(template, "icon", await this.defaultIcon(customization?.apple_background_color));
        } catch (e) {
          logger.warn(`⚠️ Icône par défaut non générée: ${e.message}`);
        }
      }
      if (!logoBuffer) {
        // Logo obligatoire : image transparente, seul le nom du commerce (logoText) apparaît.
        const transparent = await sharp({ create: { width: 3, height: 3, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
        await this.safeAddImage(template, "logo", transparent);
      }

      const pass = template.createPass({
        serialNumber: String(serialNumber),
        description: customization?.apple_pass_description || 'Carte de fidélité numérique'
      });
      
      logger.info(`📋 [APPLE PASS INFO] Org: "${customization?.apple_organization_name || clientData.companyName}", Desc: "${customization?.apple_pass_description || 'Carte de fidélité numérique'}"`);

      let locationsArray = [];
      if (customization?.locations) {
        try {
          locationsArray = typeof customization.locations === 'string'
            ? JSON.parse(customization.locations)
            : customization.locations;
        } catch (e) {

        }
      }


      const validLocations = [];

      if (Array.isArray(locationsArray) && locationsArray.length > 0) {
        locationsArray.slice(0, 10).forEach(loc => {
          if (loc.latitude === '' || loc.latitude === null || loc.latitude === undefined) return;
          if (loc.longitude === '' || loc.longitude === null || loc.longitude === undefined) return;
          const lat = Number(loc.latitude);
          const lng = Number(loc.longitude);
          if (isNaN(lat) || isNaN(lng)) return;
          if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return;

          const rawText = (loc.relevantText || '').replace(/Bientot/gi, '').replace(/Soon/gi, '').trim();
          const cleanText = rawText || `Bienvenue chez ${clientData.companyName || 'nous'}`;

          validLocations.push({ latitude: lat, longitude: lng, relevantText: cleanText.substring(0, 255) });
          logger.info(`📍 [APPLE LOC ADD] Lat: ${lat}, Lng: ${lng}, Text: "${cleanText}"`);
        });
      } else {
        const fbLat = Number(customization?.latitude);
        const fbLng = Number(customization?.longitude);
        const fbLatValid = customization?.latitude !== '' && customization?.latitude != null && !isNaN(fbLat) && fbLat >= -90 && fbLat <= 90;
        const fbLngValid = customization?.longitude !== '' && customization?.longitude != null && !isNaN(fbLng) && fbLng >= -180 && fbLng <= 180;
        if (fbLatValid && fbLngValid) {

          const rawFallbackText = (customization.relevant_text || customization.relevantText || '').replace(/Bientot/gi, '').replace(/Soon/gi, '').trim();
          const cleanFallbackText = rawFallbackText || `Bienvenue chez ${clientData.companyName || 'nous'}`;
          validLocations.push({ latitude: fbLat, longitude: fbLng, relevantText: cleanFallbackText.substring(0, 255) });
          logger.info(`📍 [APPLE FALLBACK ADD] Lat: ${fbLat}, Lng: ${fbLng}, Text: "${cleanFallbackText}"`);
        }
      }


      if (validLocations.length > 0) {
        try {
          if (typeof pass.setLocations === 'function') {
            pass.setLocations(...validLocations);
          } else {
            pass.locations = validLocations;
          }
        } catch (locErr) {
          logger.warn('setLocations failed, using direct assignment', { error: locErr.message });
          pass.locations = validLocations;
        }
      } else {
        try {
          if (typeof pass.setLocations === 'function') {
            pass.setLocations(null);
          }
        } catch (_) { /* ignore */ }
        pass.locations = [];
      }


      const currentBalance = clientData.balance || 0;
      const pointsDelta = clientData.lastPointsChange || 0;
      const rewardTiers = Array.isArray(clientData.rewardTiers) ? clientData.rewardTiers : [];

      // Message affiché au dos ; quand il change, Apple Wallet l'affiche sur l'écran verrouillé.
      // Il doit être identique d'une génération à l'autre tant qu'aucun nouvel événement n'a eu lieu.
      let appleNotifMessage = clientData.notificationMessage || null;
      if (!appleNotifMessage && pointsDelta !== 0) {
        // Cartes générées avant l'ajout de notification_message : même texte qu'avant.
        if (pointsDelta < 0) {
          appleNotifMessage = `${Math.abs(pointsDelta)} point(s) utilisé(s). Solde : ${currentBalance} point(s).`;
        } else {
          const nextTier = rewardTiers.find(t => t.points_required > currentBalance);
          appleNotifMessage = nextTier
            ? `+ ${pointsDelta} points : Encore ${nextTier.points_required - currentBalance} pts pour « ${nextTier.title} »`
            : `+ ${pointsDelta} points : vous avez ${currentBalance} points.`;
        }
      }

      this.safeAddField(pass.headerFields, {
        key: 'points_header',
        label: 'POINTS',
        value: `${currentBalance}`
      });

      this.safeAddField(pass.secondaryFields, {
        key: 'greeting',
        label: 'BONJOUR',
        value: (clientData.firstName || 'Client').toUpperCase()
      });

      this.safeAddField(pass.secondaryFields, {
        key: 'reward_hint',
        label: 'DÉTAILS DES RÉCOMPENSES',
        value: 'Au dos'
      });

      const shortId = clientData.clientId ? String(clientData.clientId).slice(-6).toUpperCase() : 'N/A';
      pass.barcodes = [
        {
          format: "PKBarcodeFormatQR",
          message: String(clientData.clientId),
          messageEncoding: "iso-8859-1",
          altText: `N° Carte : ${shortId}`
        }
      ];

      if (appleNotifMessage) {
        this.safeAddField(pass.backFields, {
          key: 'notif_msg',
          label: 'DERNIER MESSAGE',
          value: appleNotifMessage,
          changeMessage: '%@'
        });
      }

      if (customization?.unsubscribe_url) {
        this.safeAddField(pass.backFields, {
          key: 'unsubscribe',
          label: 'OFFRES ET NOTIFICATIONS',
          value: customization.unsubscribe_url,
          attributedValue: `<a href='${escHtml(customization.unsubscribe_url)}'>Ne plus recevoir les offres</a>`
        });
      }

      this.safeAddField(pass.backFields, {
        key: 'company_info',
        label: 'ENTREPRISE',
        value: customization?.apple_organization_name || clientData.companyName || 'Boutique',
      });

      if (customization?.back_fields_website) {
        this.safeAddField(pass.backFields, {
          key: 'website',
          label: 'SITE WEB',
          value: customization.back_fields_website
        });
      }

      if (customization?.apple_review_url) {
        this.safeAddField(pass.backFields, {
          key: 'review_google',
          label: 'LAISSEZ-NOUS UN AVIS GOOGLE',
          value: customization.apple_review_url,
          attributedValue: `<a href='${escHtml(customization.apple_review_url)}'>Cliquez ici</a>`,
          dataDetectorTypes: ['PKDataDetectorTypeLink']
        });
      }

      if (customization?.back_fields_phone) {
        this.safeAddField(pass.backFields, {
          key: 'phone',
          label: 'TÉLÉPHONE',
          value: customization.back_fields_phone,
          dataDetectorTypes: ['PKDataDetectorTypePhoneNumber']
        });
      }

      if (customization?.back_fields_address) {
        this.safeAddField(pass.backFields, {
          key: 'address',
          label: 'ADRESSE',
          value: customization.back_fields_address,
          dataDetectorTypes: ['PKDataDetectorTypeAddress']
        });
      }

      const formatSocialField = (input, platform) => {
        let cleanValue = input.trim();
        if (!cleanValue) return null;

        let url = '';
        let displayHandle = '';

        if (cleanValue.startsWith('http://') || cleanValue.startsWith('https://')) {
          url = cleanValue;
          try {
            const urlObj = new URL(url);
            let paths = urlObj.pathname.split('/').filter(Boolean);
            displayHandle = paths.length > 0 ? `@${paths[paths.length - 1].replace(/^@/, '')}` : url;
          } catch (e) {
            displayHandle = url;
          }
        } else {
          let handle = cleanValue.startsWith('@') ? cleanValue.substring(1) : cleanValue;
          displayHandle = `@${handle}`;
          if (platform === 'instagram') url = `https://instagram.com/${handle}`;
          else if (platform === 'tiktok') url = `https://tiktok.com/@${handle}`;
          else if (platform === 'facebook') url = `https://facebook.com/${handle}`;
        }


        return { url, displayHandle };
      };

      if (customization?.back_fields_instagram) {
        const social = formatSocialField(customization.back_fields_instagram, 'instagram');
        if (social) {
          this.safeAddField(pass.backFields, {
            key: 'instagram',
            label: 'INSTAGRAM',
            value: social.url,
            attributedValue: `<a href='${escHtml(social.url)}'>${escHtml(social.displayHandle)}</a>`,
            dataDetectorTypes: ['PKDataDetectorTypeLink']
          });
        }
      }

      if (customization?.back_fields_facebook) {
        const social = formatSocialField(customization.back_fields_facebook, 'facebook');
        if (social) {
          this.safeAddField(pass.backFields, {
            key: 'facebook',
            label: 'FACEBOOK',
            value: social.url,
            attributedValue: `<a href='${escHtml(social.url)}'>${escHtml(social.displayHandle)}</a>`,
            dataDetectorTypes: ['PKDataDetectorTypeLink']
          });
        }
      }

      if (customization?.back_fields_tiktok) {
        const social = formatSocialField(customization.back_fields_tiktok, 'tiktok');
        if (social) {
          this.safeAddField(pass.backFields, {
            key: 'tiktok',
            label: 'TIKTOK',
            value: social.url,
            attributedValue: `<a href='${escHtml(social.url)}'>${escHtml(social.displayHandle)}</a>`,
            dataDetectorTypes: ['PKDataDetectorTypeLink']
          });
        }
      }

      {
        const baseTerms = customization?.back_fields_terms || '';
        const expMonths = clientData.points_expiration_months ?? null;
        let expirationLine = '';

        if (expMonths !== null) {
          expirationLine = clientData.soonExpiringPoints > 0
            ? `⚠️ ${clientData.soonExpiringPoints} point(s) expirent dans moins de 7 jours. Vos points sont valables ${expMonths} mois à compter de leur date d'acquisition.`
            : `Vos points sont valables ${expMonths} mois à compter de leur date d'acquisition.`;
        }

        const finalTerms = [baseTerms, expirationLine].filter(Boolean).join('\n\n');
        if (finalTerms) {
          this.safeAddField(pass.backFields, {
            key: 'terms',
            label: 'CONDITIONS',
            value: finalTerms
          });
        }
      }

      if (clientData.rewardTiers && clientData.rewardTiers.length > 0) {
        const tiersList = clientData.rewardTiers.map(t => `- ${t.points_required} pts : ${t.title}`).join('\n');
        this.safeAddField(pass.backFields, {
          key: 'rewards_tiers',
          label: 'PALIERS DE RÉCOMPENSES',
          value: tiersList
        });
      }

      if (customization?.back_fields_info) {
        this.safeAddField(pass.backFields, {
          key: 'extra_info',
          label: 'INFOS COMPLÉMENTAIRES',
          value: customization.back_fields_info
        });
      }

      if (customization?.relevant_text) {
        this.safeAddField(pass.backFields, {
          key: 'promotion',
          label: 'OFFRE EN COURS',
          value: customization.relevant_text
        });
      }


      return await pass.asBuffer();
    } catch (error) {
      logger.error('❌ Erreur lors de la génération Apple Wallet Pass', {
        clientId: clientData.clientId,
        errorMessage: error.message
      });
      throw error;
    }
  }

  /**
   * Alias pour generateLoyaltyPass, utilisé par le Webservice Apple
   */
  async generateUpdatedPass(clientData, customization, serialNumber, authToken) {
    return this.generateLoyaltyPass(clientData, customization, serialNumber, authToken);
  }

  /**
   * Recharge un buffer avec d'anciennes données pour les mises à jour push
   */
  async updatePassFields(passBuffer, updates) {
    try {
      if (!this._loadConfig()) {
        logger.warn('⚠️ Mission impossible: config passGenerator manquante pour updatePassFields');
        return passBuffer;
      }

      if (!fs.existsSync(this.certPath) || !fs.existsSync(this.keyPath)) {
        logger.warn('⚠️ Certificats manquants pour updatePassFields');
        return passBuffer;
      }

      const certificateBuffer = fs.readFileSync(this.certPath);
      const keyBuffer = fs.readFileSync(this.keyPath);

      const cleanCert = this.extractPEM(certificateBuffer);
      const cleanKey = this.extractPEM(keyBuffer);

      if (!cleanCert || !cleanKey) {
        logger.error('❌ PEM extraction failed');
        return passBuffer;
      }

      const pass = await Template.load(passBuffer);
      pass.setCertificate(cleanCert);
      pass.setPrivateKey(cleanKey, this.certPassword || undefined);

      pass.primaryFields.forEach(field => {
        if (field.key === 'balance' && updates.balance !== undefined) {
          field.value = `${updates.balance} pts`;
        }
      });
      pass.headerFields.forEach(field => {
        if (field.key === 'points_header' && updates.balance !== undefined) {
          field.value = `${updates.balance}`;
        }
      });

      return await pass.asBuffer();
    } catch (error) {
      logger.error('Failed to update pass fields:', error.message);
      throw error;
    }
  }
}

export default new PassGenerator();
