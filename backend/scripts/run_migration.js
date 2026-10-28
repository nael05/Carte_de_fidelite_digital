// Applique un fichier de migration SQL sur la base configurée (mêmes variables que db.js).
// Usage : node scripts/run_migration.js migrations/add-site-settings.sql
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage : node scripts/run_migration.js <fichier.sql>');
  process.exit(1);
}

const sql = fs.readFileSync(path.resolve(file), 'utf8');

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loyalty_saas',
  socketPath: process.env.DB_SOCKET_PATH || undefined,
  multipleStatements: true
});

try {
  await conn.query(sql);
  console.log(`✅ Migration appliquée : ${file}`);
} catch (err) {
  console.error(`❌ Échec de la migration ${file} :`, err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
