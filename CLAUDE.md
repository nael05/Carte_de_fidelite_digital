# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fidelyz is a B2B SaaS loyalty card platform. Merchants customize and distribute digital loyalty cards via Apple Wallet and Google Wallet. The platform is multi-tenant — each `entreprise` (merchant company) is an isolated tenant identified by `entreprise_id`.

Three user roles: **master admin** (platform owner), **pro** (merchant staff), and **client** (end customers who receive wallet passes).

## Commands

### Backend (Node.js/Express)
```bash
cd backend
npm run dev      # Development with nodemon (auto-restart)
npm start        # Production
```

### Frontend (React/Vite)
```bash
cd frontend
npm run dev      # Dev server on port 3000
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

### Database
```bash
cd backend
node scripts/run_migration.js schema.sql                            # Fresh install (complete schema)
node scripts/run_migration.js migrations/09-mise-en-production.sql  # Upgrade an existing database
node scripts/init-admin.mjs                                         # Create the Master Admin
```

### Tests (backend running on port 5000, test database)
```bash
cd backend
DOTENV_CONFIG_PATH=.env.test node tests/audit-e2e.mjs   # cash desk, campaigns, expiration, passwords, uploads
DOTENV_CONFIG_PATH=.env.test node tests/team-e2e.mjs    # Business plan: establishments and staff
```

## Architecture

### Monorepo Structure
- `backend/` — Express API server (port 5000), ES modules
- `frontend/` — React 18 + Vite SPA (port 3000 in dev)
- `backend/schema.sql` — complete database schema; `backend/migrations/` — historical and upgrade scripts

### Backend

**Entry:** `backend/server.js` → routes in `backend/routes/apiRoutes.js` and `backend/routes/walletRoutes.js`

**Route namespaces:**
- `/api/admin/` — master admin (company management, migrations)
- `/api/pro/` — merchant operations (clients, loyalty config, notifications)
- `/api/app/wallet/` — wallet pass creation/update (called by frontend)
- `/api/wallet/v1/` — Apple Wallet Web Service protocol (called by Apple servers for sync)
- `/api/` public — `/join/:entrepriseId`, `/companies/:id/info`, etc.

**Controllers** in `backend/controllers/`:
- `apiController.js` — admin + pro staff operations
- `walletAppController.js` — pass creation and point balance updates
- `appleWebserviceController.js` — Apple's device registration/sync protocol
- `loyaltyController.js` — loyalty config, reward tiers, push notifications

**Key services** in `backend/utils/`:
- `passGenerator.js` — generates `.pkpass` files for Apple Wallet
- `googleWalletGenerator.js` — creates/updates Google Wallet passes via API
- `apnService.js` — sends Apple Push Notifications to trigger pass refresh
- `walletSyncService.js` — orchestrates wallet state sync across devices
- `sessionManager.js` — device fingerprinting and multi-device session tracking
- `emailService.js` — password reset and transactional emails (Brevo API)

**Auth** (`backend/middlewares/auth.js`): JWT (7-day expiry) with role middleware `isAdmin` / `isPro`. Apple Wallet endpoints use a separate `ApplePass <token>` header matched against `wallet_cards.authentication_token`.

**Database** (`backend/db.js`): MySQL 8+ connection pool (10 connections). Key tables: `entreprises`, `clients`, `loyalty_config`, `reward_tiers`, `wallet_cards`, `apple_pass_registrations`, `card_customization`, `sessions`, `transaction_history`.

**Migrations** in `backend/migrations/` — run with `node scripts/run_migration.js <file>` (supports `DELIMITER`).

**Scheduled jobs** (`backend/utils/cronJobs.js`, Europe/Paris): points expiration 02:00 (silent card update), cleanup 03:00, price changes 04:00, 7-day expiry warning 10:00. They run in the single process (or PM2 instance 0); `DISABLE_CRON=true` turns them off.

**Stripe is optional**: without `STRIPE_SECRET_KEY` the server starts, only the free plan is offered and payment routes answer 503 `stripe_not_configured`. Prices are TTC (`tax_behavior: inclusive`); launch prices live in `DEFAULT_PRICES_CENTS` (`backend/utils/plans.js`): Pro 19 €, Business 39 € per month, yearly −20 %.

### Frontend

**Entry:** `frontend/src/main.jsx` → `frontend/src/App.jsx` (React Router)

**Route sections:**
- `/master-admin-secret` — master admin dashboard
- `/pro/` — merchant dashboard and settings
- `/join/:entrepriseId` — public customer registration page

**Auth state:** `frontend/src/context/AuthContext.jsx` — manages JWT token, role, `mustChangePassword` flag, and suspension status via localStorage.

**API client:** `frontend/src/api.js` — Axios instance with request interceptor (injects `Authorization: Bearer` + `X-Device-Id` headers) and response interceptor (redirects on 401 by role).

**Key components:**
- `CardCustomizer.jsx` — full card design studio (colors, logo, GPS locations, push notification text) for both Apple and Google Wallet
- `WalletAddModal.jsx` — guides customers through adding to Apple/Google Wallet
- `PrivateRoute.jsx` / `PrivateAdminRoute` / `PrivateProRoute` — RBAC route guards (redirects to `/pro/secure-password` if `mustChangePassword`)

**Styling:** Custom CSS with design tokens in `src/styles/colors.css` and `src/components/Common.css`. Dark mode applied via class on `document.documentElement`, persisted in localStorage.

## Key Environment Variables

**Backend** (`backend/.env`):
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — MySQL credentials
- `JWT_SECRET` — signing key for auth tokens
- `APPLE_CERT_PATH`, `APPLE_CERT_PASSWORD`, `APPLE_TEAM_ID`, `APPLE_PASS_TYPE_ID` — Apple Wallet certificate
- `APPLE_APN_KEY_PATH`, `APPLE_APN_KEY_ID`, `APPLE_APN_ENVIRONMENT` — APNs push
- `APPLE_WALLET_WEBSERVICE_URL` — public URL Apple calls for pass sync
- `GOOGLE_WALLET_KEY_PATH` — Google service account JSON
- `FRONTEND_URL`, `ALLOWED_ORIGINS` — CORS

**Frontend** (`frontend/.env`):
- `VITE_API_URL` — backend API base URL (defaults to `/api` in production)

## Apple Wallet Sync Flow and notifications

Apple Wallet ignores the content of push notifications: a push only means "this pass changed".
1. Device registers via `POST /wallet/v1/devices/.../registrations/...`
2. To show a message, the server writes it to `wallet_cards.notification_message`, bumps `last_updated` and sends an empty push (`apnService.sendBulkUpdateNotifications`)
3. Apple calls `GET /wallet/v1/devices/...` then `GET /wallet/v1/passes/:passTypeIdentifier/:serialNumber`
4. `utils/applePass.js` (`buildApplePass`) regenerates the `.pkpass`; the `notif_msg` back field has `changeMessage: '%@'`, so iOS shows the new text on the lock screen

Rules: only `notif_msg` may carry a `changeMessage` (other fields update silently), and its value must be stable between regenerations. Point changes go through `walletSyncService.syncClientWallet(clientId, companyId, delta, event)`; promotional campaigns only through `utils/campaignService.js` (`sendCampaign`: plan quota, 48 h between campaigns, quiet hours 21 h–8 h, marketing opt-in, 7-day cooldown per client). Google Wallet uses `addMessageToObject` (max 3 per card per 24 h).
