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
# Importer le schéma de base de données depuis la racine du projet
mysql -u root -p < schema.sql
```

### 2. Backend
```bash
cd backend
npm install
# Copiez .env.example vers .env et configurez vos accès MySQL, JWT_SECRET, etc.
npm run dev
# Le backend démarre sur http://localhost:5000
```

### 3. Frontend
Dans un nouveau terminal :
```bash
cd frontend
npm install
npm run dev
# Le frontend démarre sur http://localhost:3000
```

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
├── schema.sql          # Script SQL de création de la base de données (si présent)
└── README.md           # Documentation du projet
```