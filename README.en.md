# Loyalty Cards SaaS (Digital Loyalty Card)

**Project developed for a client**

## Description
B2B SaaS platform allowing merchants to manage digital loyalty cards compatible with Apple Wallet and Google Wallet. The system includes a global administration interface (Master Admin), a merchant area (to scan QR codes and manage points), and a public interface for customer registration and card downloading.

## Tech Stack
- **Backend**: Node.js, Express
- **Database**: MySQL 8+
- **Frontend**: React, Vite
- **Security & Auth**: JWT, bcryptjs, RBAC (Role-Based Access Control)
- **Key Features**: REST API, HTML5 QR code scanner (html5-qrcode), pass generation (pkpass) for Apple Wallet.

## Installation Prerequisites
- **Node.js** (v18 or higher)
- **MySQL** (v8 or higher)
- **npm** (or yarn)

## Installation and Launch
To set up and run the project in a local development environment:

### 1. Database
```bash
# Import the database schema from the project root
mysql -u root -p < schema.sql
```

### 2. Backend
```bash
cd backend
npm install
# Copy .env.example to .env and configure your MySQL accesses, JWT_SECRET, etc.
npm run dev
# The backend starts on http://localhost:5000
```

### 3. Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
# The frontend starts on http://localhost:3000
```

## Project Structure
```text
Carte_de_fidelite_digital/
├── backend/            # Node.js/Express server, API, controllers, and middlewares
│   ├── controllers/    # Endpoint business logic
│   ├── middlewares/    # JWT verification and role management (Admin/Pro)
│   ├── routes/         # API routes definition
│   └── server.js       # Backend server entry point
├── frontend/           # React application (Vite)
│   ├── public/         # Static files and assets
│   └── src/            # React components, pages, and styles
│       ├── pages/      # Application pages (Admin, Pro, Public)
│       └── api.js      # Axios instance for API calls
├── schema.sql          # SQL database creation script (if present)
└── README.md           # Project documentation
```
