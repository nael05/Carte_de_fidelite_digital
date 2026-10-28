import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');
import * as apiController from '../controllers/apiController.js';
import * as statsController from '../controllers/statsController.js';
import * as loyaltyController from '../controllers/loyaltyController.js';
import * as migrationController from '../controllers/migrationController.js';
import * as pushController from '../controllers/pushController.js';
import * as siteSettingsController from '../controllers/siteSettingsController.js';
import * as proSignupController from '../controllers/proSignupController.js';
import * as accountController from '../controllers/accountController.js';
import * as subscriptionController from '../controllers/subscriptionController.js';
import * as businessController from '../controllers/businessController.js';
import * as teamController from '../controllers/teamController.js';
import * as plansController from '../controllers/plansController.js';
import * as billingController from '../controllers/billingController.js';
import * as adminPricingController from '../controllers/adminPricingController.js';
import * as adminPromoController from '../controllers/adminPromoController.js';
import * as adminMailController from '../controllers/adminMailController.js';
import walletRoutes from './walletRoutes.js';
import { verifyToken, isAdmin, isPro } from '../middlewares/auth.js';
import { requireActiveSubscription, requireAccountAccess, requireTier, checkSubscriptionStatus } from '../middlewares/subscriptionStatus.js';
import { loginLimiter, apiLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.user?.id + '-' + Date.now() + ext)
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Seules les images sont autorisées'));
  }
});
router.use(apiLimiter);

// Pro Signup (public endpoints)
router.get('/plans', plansController.getPublicPlans);
router.post('/pro/signup', proSignupController.proSignup);
router.post('/pro/validate-promo', proSignupController.validatePromoCode);
router.post('/pro/checkout/success', proSignupController.checkoutSuccess);
router.get('/pro/stripe-key', proSignupController.getStripeKey);

// Admin routes
router.post('/admin/login', loginLimiter, apiController.adminLogin);
router.post('/admin/migrations/run', verifyToken, isAdmin, migrationController.runMigrations);
router.get('/admin/enterprises', verifyToken, isAdmin, apiController.getEnterprises);
router.post('/admin/create-company', verifyToken, isAdmin, (req, res) => res.status(410).json({ error: "La création manuelle est désactivée : les entreprises s'inscrivent via /api/pro/signup (paiement Stripe obligatoire)" }));
router.put('/admin/suspend-company/:companyId', verifyToken, isAdmin, apiController.suspendCompany);
router.put('/admin/reactivate-company/:companyId', verifyToken, isAdmin, apiController.reactivateCompany);
router.delete('/admin/delete-company/:companyId', verifyToken, isAdmin, apiController.deleteCompany);
router.put('/admin/update-company/:companyId', verifyToken, isAdmin, apiController.updateCompany);

// Admin : tarifs Stripe, codes promo, e-mails, préavis de changement de tarif
router.get('/admin/pricing', verifyToken, isAdmin, adminPricingController.getPricing);
router.put('/admin/pricing', verifyToken, isAdmin, adminPricingController.updatePricing);
router.post('/admin/pricing/notify', verifyToken, isAdmin, adminPricingController.notifyPriceChange);
router.get('/admin/promos', verifyToken, isAdmin, adminPromoController.listPromos);
router.post('/admin/promos', verifyToken, isAdmin, adminPromoController.createPromo);
router.delete('/admin/promos/:id', verifyToken, isAdmin, adminPromoController.deactivatePromo);
router.get('/admin/email/recipients', verifyToken, isAdmin, adminMailController.listRecipients);
router.post('/admin/email/single', verifyToken, isAdmin, adminMailController.sendSingle);
router.post('/admin/email/broadcast', verifyToken, isAdmin, adminMailController.sendBroadcast);
router.post('/pro/login', loginLimiter, apiController.proLogin);
router.get('/pro/status', verifyToken, isPro, checkSubscriptionStatus, apiController.getProStatus);

// Account Management
router.get('/pro/account', verifyToken, isPro, checkSubscriptionStatus, accountController.getAccountInfo);
router.put('/pro/account/email', verifyToken, isPro, accountController.requestEmailChange);
router.post('/pro/account/confirm-email', verifyToken, isPro, accountController.confirmEmailChange);
router.put('/pro/account/password', verifyToken, isPro, accountController.changePassword);
router.delete('/pro/account', verifyToken, isPro, accountController.deleteAccount);

// Subscription Management
router.get('/pro/subscription', verifyToken, isPro, checkSubscriptionStatus, subscriptionController.getSubscription);
router.post('/pro/subscription/checkout', verifyToken, isPro, subscriptionController.createUpgradeCheckout);
router.post('/pro/subscription/switch-plan', verifyToken, isPro, requireActiveSubscription, subscriptionController.switchPlan);
router.post('/pro/subscription/apply-promo', verifyToken, isPro, requireActiveSubscription, subscriptionController.applyPromoCode);
router.post('/pro/subscription/cancel', verifyToken, isPro, checkSubscriptionStatus, subscriptionController.cancelSubscription);
router.post('/pro/subscription/reactivate', verifyToken, isPro, checkSubscriptionStatus, subscriptionController.reactivateSubscription);
router.get('/pro/subscription/portal-link', verifyToken, isPro, checkSubscriptionStatus, subscriptionController.getPortalLink);

// Billing & Invoices
router.get('/pro/billing/invoices', verifyToken, isPro, checkSubscriptionStatus, billingController.getInvoices);
router.get('/pro/billing/invoices/:invoiceId', verifyToken, isPro, checkSubscriptionStatus, billingController.getInvoiceDetails);
router.get('/pro/billing/invoices/:invoiceId/pdf', verifyToken, isPro, checkSubscriptionStatus, billingController.downloadInvoicePdf);
router.get('/pro/billing/summary', verifyToken, isPro, checkSubscriptionStatus, billingController.getBillingSummary);
router.get('/pro/sessions', verifyToken, isPro, checkSubscriptionStatus, apiController.getProSessions);
router.post('/pro/logout-device', verifyToken, isPro, checkSubscriptionStatus, apiController.logoutProDevice);
router.post('/pro/logout-all', verifyToken, isPro, checkSubscriptionStatus, apiController.logoutProAll);
router.put('/pro/change-password', verifyToken, isPro, checkSubscriptionStatus, apiController.changePassword);
router.post('/pro/forgot-password', loginLimiter, apiController.forgotPassword);
router.post('/pro/reset-password', loginLimiter, apiController.resetPassword);
router.get('/pro/clients', verifyToken, isPro, requireAccountAccess, apiController.getClients);
router.post('/pro/scan', verifyToken, isPro, requireActiveSubscription, apiController.handleScan);
router.get('/pro/scan-lookup/:clientId', verifyToken, isPro, checkSubscriptionStatus, apiController.getScanInfo);
router.post('/pro/scan/finalize', verifyToken, isPro, requireActiveSubscription, apiController.finalizeFullTransaction);
router.put('/pro/adjust-points/:clientId', verifyToken, isPro, requireActiveSubscription, apiController.adjustPoints);
router.get('/pro/history', verifyToken, isPro, apiController.getTransactionHistory);
router.delete('/pro/history', verifyToken, isPro, apiController.deleteTransactionHistory);

router.get('/pro/info', verifyToken, isPro, apiController.getProInfo);
router.delete('/pro/clients/:clientId', verifyToken, isPro, requireAccountAccess, apiController.deleteClient);
router.get('/pro/loyalty/config', verifyToken, isPro, loyaltyController.getLoyaltyConfig);
router.put('/pro/loyalty/config', verifyToken, isPro, loyaltyController.updateLoyaltyConfig);
router.get('/pro/reward-tiers', verifyToken, isPro, loyaltyController.getRewardTiers);
router.post('/pro/reward-tiers', verifyToken, isPro, loyaltyController.createRewardTier);
router.put('/pro/reward-tiers/:id', verifyToken, isPro, loyaltyController.updateRewardTier);
router.delete('/pro/reward-tiers/:id', verifyToken, isPro, loyaltyController.deleteRewardTier);
router.post('/pro/redeem-reward', verifyToken, isPro, requireActiveSubscription, apiController.redeemReward);
router.post('/pro/notifications/send', verifyToken, isPro, requireActiveSubscription, loyaltyController.sendPushNotification);
router.get('/pro/notifications/history', verifyToken, isPro, loyaltyController.getPushNotificationHistory);
router.get('/pro/notifications/quota', verifyToken, isPro, loyaltyController.getPushQuota);
router.get('/pro/notifications/:notificationId', verifyToken, isPro, loyaltyController.getPushNotificationDetails);
router.get('/pro/loyalty/stats', verifyToken, isPro, loyaltyController.getLoyaltyStats);
router.get('/pro/stats/overview', verifyToken, isPro, statsController.getProOverview);
router.get('/pro/stats/activity', verifyToken, isPro, statsController.getProActivity);
router.get('/pro/stats/clients', verifyToken, isPro, statsController.getProClients);
router.get('/pro/stats/rewards', verifyToken, isPro, statsController.getProRewards);
router.get('/admin/stats', verifyToken, isAdmin, statsController.getAdminStats);
router.get('/pro/loyalty/expiration', verifyToken, isPro, loyaltyController.getExpirationConfig);
router.put('/pro/loyalty/expiration', verifyToken, isPro, loyaltyController.updateExpirationConfig);
router.get('/pro/card-customization/:empresaId', verifyToken, isPro, apiController.getCardCustomization);
router.put('/pro/card-customization/:empresaId', verifyToken, isPro, apiController.updateCardCustomization);
router.patch('/pro/card-customization/:empresaId/gps', verifyToken, isPro, apiController.updateCardCustomizationGPS);
router.post('/pro/upload-logo', verifyToken, isPro, (req, res, next) => {
  upload.single('logo')(req, res, (err) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image trop grande (max 20 Mo)' });
    }
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, apiController.uploadLogo);
router.post('/pro/clients/create-invite', verifyToken, isPro, requireActiveSubscription, apiController.createClientAndInvite);
router.post('/pro/clients/resend-links', verifyToken, isPro, requireActiveSubscription, apiController.sendClientDownloadLinks);
router.post('/pro/push/send', verifyToken, isPro, requireActiveSubscription, pushController.sendNotification);
router.get('/pro/push/history', verifyToken, isPro, pushController.getHistory);
// Offre Business
router.get('/pro/establishments', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.listEstablishments);
router.post('/pro/establishments', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.createEstablishment);
router.put('/pro/establishments/:id', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.updateEstablishment);
router.delete('/pro/establishments/:id', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.deleteEstablishment);
router.get('/pro/staff', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.listStaff);
router.post('/pro/staff', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.createStaff);
router.put('/pro/staff/:id', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.updateStaff);
router.delete('/pro/staff/:id', verifyToken, isPro, requireActiveSubscription, requireTier('business'), teamController.deleteStaff);
const business = [verifyToken, isPro, requireActiveSubscription, requireTier('business')];
router.get('/pro/business/relaunch', ...business, businessController.getRelaunchList);
router.get('/pro/business/insights', ...business, businessController.getInsights);
router.get('/pro/business/export/clients.csv', ...business, businessController.exportClientsCsv);
router.get('/pro/business/export/transactions.csv', ...business, businessController.exportTransactionsCsv);
router.use('/', walletRoutes);
router.get('/settings/mentions-legales', siteSettingsController.getMentionsLegales);
router.put('/admin/settings/mentions-legales', verifyToken, isAdmin, siteSettingsController.updateMentionsLegales);
router.get('/public/enterprises', apiController.getPublicEnterprises);
router.get('/companies/:companyId/info', apiController.getCompanyInfo);
router.get('/companies/:companyId/card-customization', apiController.getCardCustomization);
router.post('/join/:entrepriseId', apiController.registerClientAndGeneratePass);

export default router;
