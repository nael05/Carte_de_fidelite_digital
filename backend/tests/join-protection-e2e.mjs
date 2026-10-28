// Test de la protection de l'inscription publique des clients (/join).
// Usage : DOTENV_CONFIG_PATH=.env.test node tests/join-protection-e2e.mjs  (backend lancé sur le port 5000)
import 'dotenv/config';
import pool from '../db.js';

const API = 'http://localhost:5000/api';
const email = `join-${Date.now()}@test.local`;
let fails = 0;
const check = (label, cond, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${cond ? '' : ' ' + extra}`);
};
const join = async (id, body) => {
  const res = await fetch(`${API}/join/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data = null;
  try { data = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, data };
};

await pool.query('DELETE FROM rate_limit_store').catch(() => {});
await fetch(`${API}/pro/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: 'free', nom: 'Join Test', raison_sociale: 'Join Test', email, mot_de_passe: 'Test-Passw0rd!2026' }) });
await pool.query("UPDATE entreprises SET subscription_status = 'active', tier = 'business' WHERE email = ?", [email]);
const [[ent]] = await pool.query('SELECT id FROM entreprises WHERE email = ?', [email]);

let n = 0;
const valid = (extra = {}) => ({
  nom: 'Dupont', prenom: 'Ana', telephone: `06${String(10000000 + ++n).padStart(8, '0')}`,
  type_wallet: 'apple', started_at: Date.now() - 10000, ...extra
});

let r = await join(ent.id, valid({ website: 'http://spam.example' }));
check('champ piège rempli : refusé', r.status === 400, JSON.stringify(r));
r = await join(ent.id, valid({ started_at: Date.now() }));
check('formulaire envoyé en moins de 3 s : refusé', r.status === 400, JSON.stringify(r));
r = await join(ent.id, valid({ telephone: 'abc' }));
check('téléphone invalide : refusé', r.status === 400, JSON.stringify(r));
r = await join(ent.id, valid({ nom: 'x'.repeat(80) }));
check('nom trop long : refusé', r.status === 400, JSON.stringify(r));
r = await join(ent.id, valid());
check('inscription valide : acceptée', r.status === 201, JSON.stringify(r));
r = await join(ent.id, { nom: 'Ancien', prenom: 'Client', telephone: '0611112222', type_wallet: 'apple' });
check('ancien formulaire sans champs anti-robot : accepté', r.status === 201, JSON.stringify(r));

// Plafond par IP : 30 requêtes par heure (5 déjà comptées plus haut sans compter les refus de validation ci-dessus)
let accepted = 0;
let blockedAt = null;
for (let i = 1; i <= 40; i++) {
  const res = await join(ent.id, valid());
  if (res.status === 429) { blockedAt = i; check('429 avec code explicite', res.data?.code === 'too_many_registrations', JSON.stringify(res)); break; }
  if (res.status === 201) accepted++;
}
check('plafond par IP atteint avant 40 requêtes', blockedAt !== null, `acceptées : ${accepted}`);
check('au plus 30 requêtes passent par heure et par IP', accepted + 6 <= 30, `acceptées : ${accepted + 6}`);

await pool.query('DELETE FROM entreprises WHERE id = ?', [ent.id]);
await pool.query('DELETE FROM rate_limit_store').catch(() => {});
console.log(fails === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${fails} ÉCHEC(S)`);
process.exit(fails ? 1 : 0);
