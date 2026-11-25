# Loyalty Cards SaaS (Carte de Fidélité Digitale)

**Projet développé pour un client**

## Description
Plateforme B2B SaaS permettant aux commerçants de gérer des cartes de fidélité dématérialisées compatibles avec Apple Wallet et Google Wallet. Le système inclut une interface d'administration globale (Master Admin), un espace commerçant (pour scanner les QR codes et gérer les points) et une interface publique pour l'inscription des clients et le téléchargement des cartes.

## Stack Technique
- **Backend** : Node.js, Express
- **Base de données** : MySQL 8+
- **Frontend** : React, Vite
- **Sécurité & Auth** : JWT, bcryptjs, RBAC (Role-Based Access Control)
- **Fonctionnalités clés** : API REST, Scanner de QR codes en HTML5 (html5-qrcode), génération de passes (pkpass) pour Apple Wallet.

## Prérequis d'installation
- **Node.js** (v18 ou supérieur)
- **MySQL** (v8 ou supérieur)
- **npm** (ou yarn)

## Installation et Lancement
Pour configurer et lancer le projet en environnement de développement local :

### 1. Base de données
```bash
cd backend
cp .env.example .env          # puis renseigner l'accès MySQL et JWT_SECRET
npm install
node scripts/run_migration.js schema.sql   # schéma complet (installation neuve)
node scripts/init-admin.mjs                # compte Master Admin
```
Base existante : `node scripts/run_migration.js migrations/09-mise-en-production.sql`.

### 2. Backend
```bash
cd backend
npm run dev
# Le backend démarre sur http://localhost:5000
# Sans clé Stripe, seule l'offre Gratuite est proposée (les paiements répondent « pas encore activé »).
```

### 3. Frontend
Dans un nouveau terminal :
```bash
cd frontend
npm install
npm run dev
# Le frontend démarre sur http://localhost:3000 (/api est relayé vers le port 5000)
```

## Mise en production
Voir `deploy_setup.sh` (Nginx, HTTPS, PM2) et `backend/.env.production.example` (toutes les variables).
Tarifs : Pro 19 € TTC / mois, Business 39 € TTC / mois, annuel -20 % (prix Stripe créés depuis l'admin, onglet Tarifs).

## Arborescence du Projet
```
Carte_de_fidelite_digital/
├── backend/            # Serveur Node.js/Express, API, contrôleurs et middlewares
│   ├── controllers/    # Logique métier des endpoints
│   ├── middlewares/    # Vérification JWT et gestion des rôles (Admin/Pro)
│   ├── routes/         # Définition des routes API
│   └── server.js       # Point d'entrée du serveur backend
├── frontend/           # Application React (Vite)
│   ├── public/         # Fichiers statiques et assets
│   └── src/            # Composants React, pages, et styles
│       ├── pages/      # Pages de l'application (Admin, Pro, Public)
│       └── api.js      # Instance Axios pour les appels API
├── backend/schema.sql  # Schéma SQL complet (installation neuve)
└── README.md           # Documentation du projet
```