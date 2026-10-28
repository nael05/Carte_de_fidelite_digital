// Comptes de TEST pour essayer les trois offres en local (base de développement uniquement).
// Usage : DOTENV_CONFIG_PATH=.env.test node scripts/seed-test-accounts.mjs   (backend lancé sur le port 5000)
// Rejouable : les comptes sont recréés à chaque exécution.
import 'dotenv/config';
import pool from '../db.js';

if (process.env.NODE_ENV === 'production') {
  console.error('Refusé : ce script ne doit pas tourner en production.');
  process.exit(1);
}

const API = process.env.SEED_API_URL || 'http://localhost:5000/api';
export const TEST_PASSWORD = 'Test-Compte2026!';

const ACCOUNTS = [
  { email: 'gratuit@fidelyz.test', nom: 'Test Gratuit', tier: 'free', clients: 12 },
  { email: 'pro@fidelyz.test', nom: 'Test Pro', tier: 'pro', clients: 20 },
  { email: 'business@fidelyz.test', nom: 'Test Business', tier: 'business', clients: 20 }
];
const STAFF = [
  { email: 'caissier@fidelyz.test', nom: 'Camille (caissier)', role: 'cashier', establishment: 'Centre-ville' },
  { email: 'manager@fidelyz.test', nom: 'Manon (manager)', role: 'manager', establishment: null }
];

await pool.query('DELETE FROM rate_limit_store').catch(() => {});
await pool.query('DELETE FROM entreprises WHERE email IN (?)', [ACCOUNTS.map((a) => a.email)]);

for (const account of ACCOUNTS) {
  const res = await fetch(`${API}/pro/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tier: 'free', nom: account.nom, raison_sociale: account.nom, email: account.email, mot_de_passe: TEST_PASSWORD })
  });
  if (!res.ok) throw new Error(`Inscription ${account.email} : ${res.status} ${await res.text()}`);

  const [[row]] = await pool.query('SELECT id FROM entreprises WHERE email = ?', [account.email]);
  if (account.tier !== 'free') {
    await pool.query("UPDATE entreprises SET subscription_status = 'active', tier = ? WHERE id = ?", [account.tier, row.id]);
  }
  for (let i = 1; i <= account.clients; i++) {
    await pool.query(
      `INSERT INTO clients (id, entreprise_id, nom, prenom, telephone, email, points, type_wallet, marketing_optin)
       VALUES (UUID(), ?, ?, 'Client', ?, ?, ?, 'apple', ?)`,
      [row.id, `Test${i}`, `06${String(row.id.charCodeAt(0)).padStart(2, '0')}${String(i).padStart(6, '0')}`.slice(0, 10), `client${i}@exemple.test`, (i * 7) % 90, i % 3 === 0 ? 0 : 1]
    );
  }
  account.id = row.id;
}

// Établissements et équipe du compte Business
const business = ACCOUNTS.find((a) => a.tier === 'business');
const login = await fetch(`${API}/pro/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: business.email, mot_de_passe: TEST_PASSWORD })
}).then((r) => r.json());
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}`, 'X-Device-Id': login.deviceId };
const post = async (path, body) => {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} : ${r.status} ${await r.text()}`);
  return r.json();
};
const establishments = {};
for (const nom of ['Centre-ville', 'Gare']) establishments[nom] = (await post('/pro/establishments', { nom })).id;
for (const member of STAFF) {
  await post('/pro/staff', {
    nom: member.nom, email: member.email, role: member.role, mot_de_passe: TEST_PASSWORD,
    establishment_id: member.establishment ? establishments[member.establishment] : null
  });
}

console.log('Comptes de test créés (mot de passe commun : constante TEST_PASSWORD de ce fichier) :');
for (const a of ACCOUNTS) console.log(`  ${a.tier.padEnd(9)} ${a.email}  (${a.clients} clients)`);
for (const s of STAFF) console.log(`  ${s.role.padEnd(9)} ${s.email}  (équipe du compte Business)`);
process.exit(0);
