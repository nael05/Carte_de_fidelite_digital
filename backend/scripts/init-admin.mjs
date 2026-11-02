// Script pour créer ou réinitialiser le compte Master Admin de test
// Identifiants lus dans backend/.env : MASTER_ADMIN_PASSWORD (obligatoire), MASTER_ADMIN_IDENTIFIANT (défaut : master_admin)
import 'dotenv/config';
import pool from '../db.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const identifiant = process.env.MASTER_ADMIN_IDENTIFIANT || 'master_admin';
const password = process.env.MASTER_ADMIN_PASSWORD;
if (!password) {
  console.error('❌ MASTER_ADMIN_PASSWORD manquant dans backend/.env');
  process.exit(1);
}

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS super_admins (
      id VARCHAR(36) PRIMARY KEY,
      identifiant VARCHAR(50) UNIQUE NOT NULL,
      mot_de_passe VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const hash = await bcrypt.hash(password, 10);
  const [rows] = await pool.query('SELECT id FROM super_admins WHERE identifiant = ?', [identifiant]);

  if (rows.length > 0) {
    await pool.query('UPDATE super_admins SET mot_de_passe = ? WHERE identifiant = ?', [hash, identifiant]);
    console.log('✅ Mot de passe Master Admin mis à jour.');
  } else {
    await pool.query(
      'INSERT INTO super_admins (id, identifiant, mot_de_passe) VALUES (?, ?, ?)',
      [randomUUID(), identifiant, hash]
    );
    console.log('✅ Compte Master Admin créé.');
  }

  console.log('\n--- IDENTIFIANTS MASTER ADMIN ---');
  console.log('URL         : http://localhost:3000/master-admin-secret');
  console.log(`Identifiant : ${identifiant}`);
  console.log('Mot de passe: celui de MASTER_ADMIN_PASSWORD (backend/.env)\n');
  process.exit(0);
} catch (err) {
  console.error('❌ Erreur lors de l’initialisation de l’admin :', err.message);
  process.exit(1);
}
