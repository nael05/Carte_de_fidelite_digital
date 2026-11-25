// Applique un fichier SQL (migration ou schéma) sur la base configurée (mêmes variables que db.js).
// Usage : node scripts/run_migration.js migrations/09-mise-en-production.sql
//         node scripts/run_migration.js schema.sql
// Comprend la directive DELIMITER (procédures stockées) comme le client mysql en ligne de commande.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise.js';

const file = process.argv[2];
if (!file) {
  console.error('Usage : node scripts/run_migration.js <fichier.sql>');
  process.exit(1);
}

// Découpe le script en instructions en respectant les changements de délimiteur.
const splitStatements = (sql) => {
  const statements = [];
  let delimiter = ';';
  let buffer = '';
  for (const line of sql.split(/\r?\n/)) {
    const directive = /^\s*DELIMITER\s+(\S+)\s*$/i.exec(line);
    if (directive) {
      delimiter = directive[1];
      continue;
    }
    buffer += line + '\n';
    const trimmed = buffer.trimEnd();
    if (trimmed.endsWith(delimiter)) {
      const statement = trimmed.slice(0, -delimiter.length).trim();
      if (statement.replace(/--.*$/gm, '').trim()) statements.push(statement);
      buffer = '';
    }
  }
  if (buffer.replace(/--.*$/gm, '').trim()) statements.push(buffer.trim());
  return statements;
};

const statements = splitStatements(fs.readFileSync(path.resolve(file), 'utf8'));

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'loyalty_saas',
  socketPath: process.env.DB_SOCKET_PATH || undefined
});

let done = 0;
try {
  for (const statement of statements) {
    await conn.query(statement);
    done++;
  }
  console.log(`✅ ${file} appliqué (${done} instruction(s))`);
} catch (err) {
  console.error(`❌ Échec de ${file} à l'instruction ${done + 1} :`, err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}
