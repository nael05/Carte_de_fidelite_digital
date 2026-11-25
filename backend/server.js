import 'dotenv/config';

import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/apiRoutes.js';
import { stripeWebhook } from './controllers/webhookController.js';
import logger from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import pool from './db.js';
import passGenerator from './utils/passGenerator.js';
import apnService from './utils/apnService.js';
import { startCronJobs } from './utils/cronJobs.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const isProduction = process.env.NODE_ENV === 'production';

// ───── Configuration obligatoire ─────
const missingEnv = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'].filter((k) => !process.env[k]);
if (process.env.DB_PASSWORD === undefined) missingEnv.push('DB_PASSWORD');
if (missingEnv.length > 0) {
  console.error(`[FATAL] Variables d'environnement manquantes : ${missingEnv.join(', ')}`);
  process.exit(1);
}
if (isProduction) {
  const weak = [];
  if (process.env.JWT_SECRET.length < 32 || /change|secret_key|example/i.test(process.env.JWT_SECRET)) weak.push('JWT_SECRET (32 caractères aléatoires minimum)');
  if (!process.env.FRONTEND_URL || !process.env.FRONTEND_URL.startsWith('https://')) weak.push('FRONTEND_URL (https://...)');
  if (weak.length > 0) {
    console.error(`[FATAL] Configuration de production invalide : ${weak.join(', ')}`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

app.use(helmet({
  hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
  // API JSON uniquement : aucune ressource ne doit être chargée depuis ses réponses.
  contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'cross-origin' } // logos affichés par le site et récupérés par Google Wallet
}));

// ───── CORS ─────
// En production, seules les origines de ALLOWED_ORIGINS (ou le site officiel) sont acceptées.
// Les adresses locales ne sont autorisées qu'en développement.
const DEV_ORIGIN_RE = /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d{2,5}$/;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'https://fidelyzapp.fr,https://www.fidelyzapp.fr')
  .split(',').map((o) => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // appels serveur à serveur (Apple Wallet, Stripe, curl)
    if (allowedOrigins.includes(origin) || (!isProduction && DEV_ORIGIN_RE.test(origin))) return callback(null, true);
    logger.warn('Origine CORS refusée', { origin });
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Id', 'X-Establishment-Id'],
  maxAge: 86400
}));

// Le webhook Stripe a besoin du corps brut (vérification de signature) : déclaré avant express.json().
app.post('/api/stripe/webhook', express.raw({ type: 'application/json', limit: '1mb' }), (req, res, next) => { req.rawBody = req.body; next(); }, stripeWebhook);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// ───── Images téléversées (logos, bannières) ─────
// Uniquement des PNG générés par le serveur ; jamais interprétés comme HTML ou script.
const serveUploads = express.static(uploadsDir, {
  index: false,
  dotfiles: 'deny',
  maxAge: '7d',
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'");
  }
});
const onlyImages = (req, res, next) => (/\.(png|jpe?g|webp)$/i.test(req.path) ? next() : res.status(404).end());
app.use('/uploads', onlyImages, serveUploads);
app.use('/api/uploads', onlyImages, serveUploads);

app.get('/api/wallet', (req, res) => res.json({ status: 'active', service: 'Apple Wallet WebService' }));

app.use('/api', apiRoutes);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'OK', database: 'connected' });
  } catch (err) {
    logger.error('Health check failed - DB connection issue', { error: err.message });
    res.status(503).json({ status: 'ERROR', database: 'disconnected' });
  }
});

app.get('/api/wallet/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    appleWallet: passGenerator.validateConfiguration() ? 'configuré' : 'non configuré',
    applePush: apnService.isConfigured() ? 'configuré' : 'non configuré'
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`✅ Backend démarré sur le port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  passGenerator.validateConfiguration();
  startCronJobs();
});
