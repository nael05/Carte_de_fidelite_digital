import axios from 'axios';
import logger from './logger.js';

const escHtml = (str) => String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.sender = {
      name: 'Fidelyz Support',
      email: process.env.MAIL_USER || 'nael80393@gmail.com'
    };
    
    if (!this.apiKey) {
      logger.error('❌ BREVO_API_KEY manquante dans le .env');
    } else {
      logger.info('✅ Service d\'email initialisé (Brevo API)');
    }
  }

  async sendPasswordResetEmail(email, resetUrl) {
    if (!this.apiKey) {
      throw new Error('Service d\'email non configuré');
    }

    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: 'Réinitialisation de votre mot de passe Pro - Fidelyz',
        htmlContent: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #6366F1; text-align: center;">Récupération de mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe commerçant Fidelyz.</p>
            <p>Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien est valable pendant 60 minutes.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #6366F1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
            </div>
            <p>Si vous n'avez pas demandé ce changement, vous pouvez ignorer cet e-mail en toute sécurité.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666; text-align: center;">Cet email a été envoyé automatiquement par Fidelyz.</p>
          </div>
        `
      }, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`✅ Email de réinitialisation envoyé à ${email} via API Brevo`);
      return response.data;
    } catch (err) {
      logger.error(`❌ Échec de l'envoi de l'email à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }
  async sendWelcomeEmail({ email, nom, prenom, telephone, tempPassword, loyaltyType, frontendUrl }) {
    if (!this.apiKey) {
      throw new Error('Service d\'email non configuré');
    }

    const loginUrl = `${frontendUrl}/pro/login`;
    const loyaltyLabel = loyaltyType === 'stamps' ? 'Tampons' : 'Points';
    const prenomDisplay = prenom ? ` ${prenom}` : '';

    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Bienvenue sur Fidelyz – Vos accès commerçant`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">

      <!-- Header -->
      <tr>
        <td style="background:#6366F1;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Fidelyz</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);font-weight:400;">Plateforme de fidélité digitale</p>
        </td>
      </tr>

      <!-- Intro -->
      <tr>
        <td style="padding:36px 40px 0;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Bienvenue${prenomDisplay},</p>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
            Votre espace commerçant <strong style="color:#111827;">${nom}</strong> vient d'être créé sur Fidelyz.<br>
            Retrouvez ci-dessous vos informations de connexion et les premières étapes pour démarrer.
          </p>
        </td>
      </tr>

      <!-- Credentials -->
      <tr>
        <td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e2e4e9;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e4e9;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Identifiants de connexion</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#9ca3af;width:130px;">Entreprise</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${nom}</td>
                  </tr>
                  ${telephone ? `<tr>
                    <td style="padding:6px 0;font-size:13px;color:#9ca3af;">Telephone</td>
                    <td style="padding:6px 0;font-size:13px;color:#374151;">${telephone}</td>
                  </tr>` : ''}
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#9ca3af;">Email</td>
                    <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;">${email}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#9ca3af;">Fidelite</td>
                    <td style="padding:6px 0;font-size:13px;color:#374151;">${loyaltyLabel}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Password -->
      <tr>
        <td style="padding:16px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef9ec;border:1px solid #f0c858;border-radius:8px;">
            <tr>
              <td style="padding:18px 24px;">
                <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;letter-spacing:0.8px;">Mot de passe temporaire</p>
                <p style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:3px;font-family:'Courier New',Courier,monospace;">${tempPassword}</p>
                <p style="margin:0;font-size:12px;color:#92400e;">A modifier obligatoirement lors de votre premiere connexion.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Steps -->
      <tr>
        <td style="padding:24px 40px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e2e4e9;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:12px 20px;border-bottom:1px solid #e2e4e9;">
                <p style="margin:0;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;">Premiers pas</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:1px;">
                      <div style="width:24px;height:24px;background:#6366F1;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff;">1</div>
                    </td>
                    <td style="padding-left:12px;">
                      <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Connectez-vous a votre espace</p>
                      <p style="margin:0;font-size:13px;color:#6b7280;">Rendez-vous sur <a href="${loginUrl}" style="color:#6366F1;text-decoration:none;">${loginUrl}</a> avec votre email et le mot de passe temporaire.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:1px;">
                      <div style="width:24px;height:24px;background:#6366F1;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff;">2</div>
                    </td>
                    <td style="padding-left:12px;">
                      <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Definissez un mot de passe personnel</p>
                      <p style="margin:0;font-size:13px;color:#6b7280;">Une invite s'affiche automatiquement a la premiere connexion pour securiser votre compte.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:1px;">
                      <div style="width:24px;height:24px;background:#6366F1;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff;">3</div>
                    </td>
                    <td style="padding-left:12px;">
                      <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Personnalisez votre carte</p>
                      <p style="margin:0;font-size:13px;color:#6b7280;">Onglet <strong>Carte</strong> — ajoutez votre logo, vos couleurs et le nom affiche sur la carte client.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:1px;">
                      <div style="width:24px;height:24px;background:#6366F1;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff;">4</div>
                    </td>
                    <td style="padding-left:12px;">
                      <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Configurez vos recompenses</p>
                      <p style="margin:0;font-size:13px;color:#6b7280;">Onglet <strong>Fidelite</strong> — fixez le seuil de ${loyaltyLabel.toLowerCase()} et les avantages offerts a vos clients.</p>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width:32px;vertical-align:top;padding-top:1px;">
                      <div style="width:24px;height:24px;background:#6366F1;border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#ffffff;">5</div>
                    </td>
                    <td style="padding-left:12px;">
                      <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Invitez vos clients</p>
                      <p style="margin:0;font-size:13px;color:#6b7280;">Onglet <strong>Recruter</strong> — partagez votre QR code ou lien d'inscription pour que vos clients ajoutent la carte a leur Wallet.</p>
                    </td>
                  </tr>
                </table>

              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td style="padding:28px 40px 36px;text-align:center;">
          <a href="${loginUrl}" style="display:inline-block;background:#6366F1;color:#ffffff;padding:13px 32px;text-decoration:none;border-radius:7px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
            Acceder a mon espace
          </a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">Email genere automatiquement par Fidelyz — merci de ne pas repondre.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
      }, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`✅ Email de bienvenue envoyé à ${email} (${nom})`);
    } catch (err) {
      logger.error(`❌ Échec de l'envoi de l'email de bienvenue à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'email de bienvenue');
    }
  }

  async sendClientInviteEmail({ email, prenom, downloadUrl, companyName }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const prenomDisplay = escHtml(prenom || '');
    const safeCompany = escHtml(companyName);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Votre carte de fidélité ${companyName} est prête !`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr>
        <td style="background:#6366F1;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Fidelyz</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Plateforme de fidélité digitale</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px 0;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Bonjour ${prenomDisplay},</p>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
            <strong style="color:#111827;">${safeCompany}</strong> vous a créé une carte de fidélité digitale.<br>
            Ajoutez-la à votre Wallet en un clic, elle se met à jour automatiquement.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 40px 36px;text-align:center;">
          <a href="${downloadUrl}" style="display:inline-block;background:#6366F1;color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:7px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
            Télécharger ma carte
          </a>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Fonctionne avec Apple Wallet et Google Wallet</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">Email envoyé automatiquement par Fidelyz — merci de ne pas répondre.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Email d'invitation carte envoyé à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi email invitation carte à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'email d\'invitation');
    }
  }

  async sendCardDownloadLinkEmail({ email, prenom, downloadUrl, companyName }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const prenomDisplay = escHtml(prenom || '');
    const safeCompany = escHtml(companyName);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Retrouvez votre carte ${companyName}`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr>
        <td style="background:#6366F1;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:26px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Fidelyz</p>
          <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Plateforme de fidélité digitale</p>
        </td>
      </tr>
      <tr>
        <td style="padding:36px 40px 0;">
          <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Bonjour ${prenomDisplay},</p>
          <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
            Voici votre lien pour retrouver votre carte de fidélité <strong style="color:#111827;">${safeCompany}</strong>.<br>
            Vos points et tampons sont conservés — rien n'est perdu.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 40px 36px;text-align:center;">
          <a href="${downloadUrl}" style="display:inline-block;background:#6366F1;color:#ffffff;padding:14px 36px;text-decoration:none;border-radius:7px;font-size:15px;font-weight:600;letter-spacing:0.2px;">
            Récupérer ma carte
          </a>
          <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">Vos points sont intacts. Compatible Apple Wallet et Google Wallet.</p>
        </td>
      </tr>
      <tr>
        <td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
          <p style="margin:0;font-size:11px;color:#9ca3af;">Email envoyé automatiquement par Fidelyz — merci de ne pas répondre.</p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Email lien de re-téléchargement envoyé à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi email lien téléchargement à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'email');
    }
  }
  async sendInvoiceEmail({ email, nom, invoice_number, amount, currency, date, pdf_url }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Votre facture Fidelyz #${invoice_number}`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#10b981;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Facture reçue</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Votre paiement a été bien reçu. Retrouvez les détails de votre facture ci-dessous.
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e2e4e9;border-radius:8px;">
          <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e4e9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Numéro de facture</td>
                <td style="padding:6px 0;font-size:13px;font-weight:600;color:#111827;text-align:right;">#${invoice_number}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Date</td>
                <td style="padding:6px 0;font-size:13px;color:#111827;text-align:right;">${date}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;">Montant</td>
                <td style="padding:6px 0;font-size:16px;font-weight:700;color:#10b981;text-align:right;">${amount} ${currency}</td>
              </tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:28px 40px 36px;text-align:center;">
        ${pdf_url ? `<a href="${pdf_url}" style="display:inline-block;background:#6366F1;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:7px;font-size:14px;font-weight:600;">Télécharger la facture PDF</a>` : ''}
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Facture envoyée à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi facture à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de la facture');
    }
  }

  async sendPaymentFailedEmail({ email, nom, amount, currency, retry_date }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Paiement échoué - Action requise`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#ef4444;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Paiement échoué</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Le paiement de votre abonnement Fidelyz a échoué. Votre accès Pro est temporairement suspendu.
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:16px 20px;">
          <tr><td>
            <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#991b1b;">Montant à payer</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#111827;">${amount} ${currency}</p>
            <p style="margin:8px 0 0;font-size:12px;color:#6b7280;">Nouvelle tentative prévue le ${retry_date}</p>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:28px 40px 36px;text-align:center;">
        <a href="${process.env.FRONTEND_URL || 'https://fidelyzapp.fr'}/pro/billing" style="display:inline-block;background:#ef4444;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:7px;font-size:14px;font-weight:600;">Mettre à jour mon moyen de paiement</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Alerte paiement échoué envoyée à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi alerte paiement à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'alerte paiement');
    }
  }

  async sendSubscriptionCanceledEmail({ email, nom, canceled_at }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Votre abonnement Fidelyz a été annulé`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#8b5cf6;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Abonnement annulé</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Votre abonnement Fidelyz a été annulé le ${canceled_at}. Vos données client restent accessibles en lecture seule.
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px 0;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Si vous souhaitez réactiver votre abonnement, n'hésitez pas à nous contacter au support Fidelyz.</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Notification annulation envoyée à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi annulation à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de la notification d\'annulation');
    }
  }

  async sendEmailConfirmationLink({ current_email, new_email, confirm_url }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeNewEmail = escHtml(new_email);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email: new_email }],
        subject: `Confirmez votre changement d'email Fidelyz`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#6366F1;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Confirmation d'email</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Confirmez votre nouvelle adresse</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Vous avez demandé de changer votre adresse email Fidelyz vers <strong>${safeNewEmail}</strong>.<br>
          Cliquez sur le bouton ci-dessous pour confirmer ce changement. Ce lien est valable 24 heures.
        </p>
      </td></tr>
      <tr><td style="padding:28px 40px 36px;text-align:center;">
        <a href="${confirm_url}" style="display:inline-block;background:#6366F1;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:7px;font-size:14px;font-weight:600;">Confirmer mon email</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Email de confirmation envoyé à ${new_email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi confirmation à ${new_email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de la confirmation');
    }
  }

  async sendPlanChangeEmail({ email, nom, new_plan, effective_date }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Changement de plan Fidelyz - ${new_plan}`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#10b981;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Changement de plan confirmé</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Votre passage au plan <strong>${new_plan}</strong> a été confirmé et sera effectif à partir du ${effective_date}.
        </p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Notification changement de plan envoyée à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi changement plan à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de la notification');
    }
  }

  async sendSubscriptionCancellationNoticeEmail({ email, nom, period_end }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Votre abonnement Fidelyz sera annulé le ${period_end}`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#f59e0b;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Annulation programmée</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Votre abonnement Fidelyz sera annulé le <strong>${period_end}</strong>. Vous aurez accès à votre compte jusqu'à cette date.
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px 0;">
        <p style="margin:0;font-size:13px;color:#6b7280;">Si vous changez d'avis, vous pouvez réactiver votre abonnement à tout moment depuis votre Espace Pro.</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Avis d'annulation envoyé à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi avis d'annulation à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'avis d\'annulation');
    }
  }

  async sendSubscriptionReactivatedEmail({ email, nom }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Votre abonnement Fidelyz a été réactivé`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#10b981;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Abonnement réactivé</p>
      </td></tr>
      <tr><td style="padding:36px 40px 0;">
        <p style="margin:0 0 6px;font-size:18px;font-weight:700;color:#111827;">Bienvenue de retour, ${safeName}!</p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.7;">
          Votre abonnement Fidelyz a été réactivé avec succès. Vous avez accès à l'intégralité de vos fonctionnalités Pro.
        </p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique — merci de ne pas répondre.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Confirmation de réactivation envoyée à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi confirmation réactivation à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de la confirmation');
    }
  }
  async sendAdminMessageEmail({ email, nom, subject, message }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    const body = escHtml(message).replace(/\r?\n/g, '<br>');
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#6366F1;padding:28px 40px;text-align:center;">
        <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Fidelyz</p>
      </td></tr>
      <tr><td style="padding:32px 40px 8px;">
        <p style="margin:0 0 16px;font-size:16px;font-weight:600;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${body}</p>
      </td></tr>
      <tr><td style="padding:24px 40px 32px;">
        <p style="margin:0;font-size:14px;color:#374151;">L'équipe Fidelyz</p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Message envoyé par l'équipe Fidelyz à votre adresse professionnelle.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Message admin envoyé à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi message admin à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi de l\'e-mail');
    }
  }

  async sendPriceChangeNoticeEmail({ email, nom, plan_label, old_price, new_price, effective_date, account_url }) {
    if (!this.apiKey) throw new Error('Service d\'email non configuré');
    const safeName = escHtml(nom);
    try {
      await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: this.sender,
        to: [{ email }],
        subject: `Évolution du tarif de votre abonnement Fidelyz au ${effective_date}`,
        htmlContent: `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;border:1px solid #e2e4e9;">
      <tr><td style="background:#6366F1;padding:28px 40px;text-align:center;">
        <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">Modification de votre tarif</p>
      </td></tr>
      <tr><td style="padding:32px 40px 0;">
        <p style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827;">Bonjour ${safeName},</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
          Nous vous informons que le tarif de votre abonnement Fidelyz (formule <strong>${plan_label}</strong>) évolue.
        </p>
      </td></tr>
      <tr><td style="padding:20px 40px 0;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e2e4e9;border-radius:8px;">
          <tr><td style="padding:16px 20px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">Tarif actuel</td><td style="padding:5px 0;font-size:14px;color:#111827;text-align:right;">${old_price}</td></tr>
              <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">Nouveau tarif</td><td style="padding:5px 0;font-size:16px;font-weight:700;color:#111827;text-align:right;">${new_price}</td></tr>
              <tr><td style="padding:5px 0;font-size:13px;color:#6b7280;">Applicable à partir du</td><td style="padding:5px 0;font-size:14px;font-weight:600;color:#111827;text-align:right;">${effective_date}</td></tr>
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:20px 40px 0;">
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">
          Le nouveau tarif s'appliquera à votre première échéance de facturation suivant cette date. Jusque-là, votre abonnement reste inchangé.
        </p>
        <p style="margin:12px 0 0;font-size:14px;color:#374151;line-height:1.7;">
          <strong>Vous pouvez résilier votre abonnement sans frais avant le ${effective_date}</strong>, en quelques clics depuis votre espace (onglet Abonnement) : vous conservez alors l'accès jusqu'à la fin de la période déjà payée. Sans action de votre part, l'abonnement se poursuit au nouveau tarif.
        </p>
      </td></tr>
      <tr><td style="padding:24px 40px 32px;text-align:center;">
        <a href="${account_url}" style="display:inline-block;background:#6366F1;color:#ffffff;padding:12px 30px;text-decoration:none;border-radius:7px;font-size:14px;font-weight:600;">Gérer mon abonnement</a>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #e2e4e9;text-align:center;">
        <p style="margin:0;font-size:11px;color:#9ca3af;">Email automatique envoyé en application de l'obligation d'information préalable de 30 jours.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
      }, { headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' } });
      logger.info(`✅ Préavis tarifaire envoyé à ${email}`);
    } catch (err) {
      logger.error(`❌ Échec envoi préavis tarifaire à ${email}:`, err.response?.data || err.message);
      throw new Error('Erreur lors de l\'envoi du préavis');
    }
  }
}

export default new EmailService();
