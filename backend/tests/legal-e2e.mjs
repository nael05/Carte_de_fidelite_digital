// Test : filtrage des mentions légales (admin) et recherche publique de commerces.
// Usage : DOTENV_CONFIG_PATH=.env.test node tests/legal-e2e.mjs  (backend lancé sur le port 5000)
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import pool from '../db.js';

const API = 'http://localhost:5000/api';
let fails = 0;
const check = (label, cond, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${cond ? '' : ' ' + extra}`);
};
const json = async (res) => { try { return await res.json(); } catch { return null; } };

// ---- recherche publique de commerces
let r = await fetch(`${API}/public/enterprises`);
check('sans recherche : aucune liste', r.status === 200 && (await json(r)).length === 0);
r = await fetch(`${API}/public/enterprises?q=a`);
check('1 lettre : aucune liste', (await json(r)).length === 0);
r = await fetch(`${API}/public/enterprises?q=Test`);
const found = await json(r);
check('recherche « Test » : résultats limités à 8 avec id et nom', Array.isArray(found) && found.length > 0 && found.length <= 8 && found.every((e) => e.id && e.nom && Object.keys(e).length === 2), JSON.stringify(found).slice(0, 200));
r = await fetch(`${API}/public/enterprises?q=${encodeURIComponent('%')}`);
check('« % » traité comme un caractère, pas comme un joker', (await json(r)).length === 0);
r = await fetch(`${API}/public/enterprises?q=${encodeURIComponent("' OR 1=1 --")}`);
check('tentative d’injection SQL : aucun résultat', (await json(r)).length === 0);

// ---- mentions légales : administrateur temporaire
await pool.query('DELETE FROM rate_limit_store').catch(() => {});
const identifiant = `tmp-admin-${Date.now()}`;
const password = 'Admin-Temp-Test-2026!';
const adminId = randomUUID();
await pool.query('INSERT INTO super_admins (id, identifiant, mot_de_passe) VALUES (?, ?, ?)', [adminId, identifiant, await bcrypt.hash(password, 10)]);
const [[before]] = await pool.query("SELECT setting_value FROM site_settings WHERE setting_key = 'mentions_legales'").then(([rows]) => [rows]);

try {
  r = await fetch(`${API}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifiant, mot_de_passe: password }) });
  const token = (await json(r))?.token;
  check('connexion administrateur temporaire', !!token);
  const auth = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const evil = '<h1>Mentions</h1><p onclick="alert(1)">Texte <b>gras</b></p><script>alert(1)</script><a href="javascript:alert(1)">x</a><iframe src="https://evil.example"></iframe>';
  r = await fetch(`${API}/admin/settings/mentions-legales`, { method: 'PUT', headers: auth, body: JSON.stringify({ content: evil }) });
  const saved = await json(r);
  check('contenu piégé enregistré mais nettoyé', r.status === 200 && saved.sanitized === true && !/script|onclick|javascript:|iframe/i.test(saved.content), JSON.stringify(saved));
  check('la mise en forme est conservée', saved.content.includes('<h1>Mentions</h1>') && saved.content.includes('<b>gras</b>'), saved.content);

  r = await fetch(`${API}/settings/mentions-legales`);
  const publicContent = (await json(r)).content;
  check('page publique : contenu propre', !/script|onclick|javascript:|iframe/i.test(publicContent), publicContent);

  // un contenu déjà piégé en base (avant le filtre) est aussi nettoyé à la lecture
  await pool.query("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'mentions_legales'", ['<p>ok</p><script>steal()</script>']);
  r = await fetch(`${API}/settings/mentions-legales`);
  check('contenu piégé déjà en base : nettoyé à la lecture', (await json(r)).content === '<p>ok</p>');

  r = await fetch(`${API}/admin/settings/mentions-legales`, { method: 'PUT', headers: auth, body: JSON.stringify({ content: '<p>propre</p>' }) });
  check('contenu propre : pas d’avertissement', (await json(r)).sanitized === false);

  r = await fetch(`${API}/admin/settings/mentions-legales`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: 'x' }) });
  check('sans jeton : refusé', r.status === 401);
} finally {
  if (before) await pool.query("UPDATE site_settings SET setting_value = ? WHERE setting_key = 'mentions_legales'", [before.setting_value]);
  await pool.query('DELETE FROM super_admins WHERE id = ?', [adminId]);
  await pool.query('DELETE FROM rate_limit_store').catch(() => {});
}

console.log(fails === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${fails} ÉCHEC(S)`);
process.exit(fails ? 1 : 0);
