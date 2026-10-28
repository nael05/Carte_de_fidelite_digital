// Test de bout en bout : établissements et comptes équipe (offre Business).
// Usage : DOTENV_CONFIG_PATH=.env.test node tests/team-e2e.mjs  (backend lancé sur le port 5000)
import 'dotenv/config';
import pool from '../db.js';

const API = 'http://localhost:5000/api';
const PASSWORD = 'Test-Passw0rd!2026';
const stamp = Date.now();
const ownerEmail = `owner-${stamp}@test.local`;
const cashierEmail = `cashier-${stamp}@test.local`;
const managerEmail = `manager-${stamp}@test.local`;
let fails = 0;

const call = async (session, method, path, body, extraHeaders = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(session ? { Authorization: `Bearer ${session.token}`, 'X-Device-Id': session.deviceId } : {}),
      ...extraHeaders
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  let data = null;
  try { data = await res.json(); } catch { /* corps vide */ }
  return { status: res.status, data };
};
const check = (label, cond, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${cond ? '' : ' ' + extra}`);
};
const login = async (email) => {
  await pool.query('DELETE FROM rate_limit_store').catch(() => {});
  const r = await call(null, 'POST', '/pro/login', { email, mot_de_passe: PASSWORD });
  return { ...r, session: r.data?.token ? { token: r.data.token, deviceId: r.data.deviceId } : null };
};

// Compte propriétaire en offre Business (passage simulé en base : le paiement est testé ailleurs).
await call(null, 'POST', '/pro/signup', { tier: 'free', nom: 'Team Test', raison_sociale: 'Team Test', email: ownerEmail, mot_de_passe: PASSWORD });
await pool.query("UPDATE entreprises SET subscription_status = 'active', tier = 'business' WHERE email = ?", [ownerEmail]);
const [[ent]] = await pool.query('SELECT id FROM entreprises WHERE email = ?', [ownerEmail]);
const owner = (await login(ownerEmail)).session;
check('connexion propriétaire', !!owner);

// Établissements
let r = await call(owner, 'POST', '/pro/establishments', { nom: 'Centre-ville', adresse: '1 rue A' });
const estA = r.data?.id;
check('création établissement A', r.status === 201 && !!estA, JSON.stringify(r));
r = await call(owner, 'POST', '/pro/establishments', { nom: 'Gare' });
const estB = r.data?.id;
check('création établissement B', r.status === 201 && !!estB, JSON.stringify(r));
r = await call(owner, 'POST', '/pro/establishments', { nom: '' });
check('nom vide refusé', r.status === 400);

// Inscription d'un client depuis le lien de l'établissement A
r = await call(null, 'POST', `/join/${ent.id}`, { nom: 'Dupont', prenom: 'Ana', telephone: '0611223344', type_wallet: 'apple', marketing_optin: true, establishment_id: estA });
check('inscription client rattachée à A', r.status === 201, JSON.stringify(r));
const clientId = r.data?.clientId;
r = await call(null, 'POST', `/join/${ent.id}`, { nom: 'Martin', prenom: 'Leo', telephone: '0611223355', type_wallet: 'apple', establishment_id: 'inconnu-id' });
check("établissement inconnu ignoré (client créé sans établissement)", r.status === 201, JSON.stringify(r));
r = await call(owner, 'GET', '/pro/establishments');
const a = r.data?.establishments?.find((e) => e.id === estA);
check('stats : A a 1 client', a?.clients === 1, JSON.stringify(r.data));

// Comptes équipe
r = await call(owner, 'POST', '/pro/staff', { nom: 'Camille', email: cashierEmail, role: 'cashier', establishment_id: estA, mot_de_passe: PASSWORD });
const cashierId = r.data?.id;
check('création caissier (établissement A)', r.status === 201 && !!cashierId, JSON.stringify(r));
r = await call(owner, 'POST', '/pro/staff', { nom: 'Manon', email: managerEmail, role: 'manager', mot_de_passe: PASSWORD });
check('création manager', r.status === 201, JSON.stringify(r));
r = await call(owner, 'POST', '/pro/staff', { nom: 'Doublon', email: cashierEmail, role: 'cashier', mot_de_passe: PASSWORD });
check('e-mail déjà utilisé refusé', r.status === 409, JSON.stringify(r));
r = await call(owner, 'POST', '/pro/staff', { nom: 'Faible', email: `weak-${stamp}@test.local`, role: 'cashier', mot_de_passe: 'abc' });
check('mot de passe faible refusé', r.status === 400, JSON.stringify(r));
r = await call(owner, 'POST', '/pro/staff', { nom: 'Pirate', email: ownerEmail, role: 'manager', mot_de_passe: PASSWORD });
check("e-mail du propriétaire refusé pour un membre", r.status === 409, JSON.stringify(r));

// Caissier
const cashierLogin = await login(cashierEmail);
const cashier = cashierLogin.session;
check('connexion du caissier', !!cashier && cashierLogin.data?.staff?.role === 'cashier', JSON.stringify(cashierLogin.data));
r = await call(cashier, 'GET', '/pro/status');
check('statut caissier : rôle et établissement', r.data?.staff_role === 'cashier' && r.data?.establishment_id === estA, JSON.stringify(r.data));
r = await call(cashier, 'GET', '/pro/clients');
check('caissier : liste des clients', r.status === 200);
r = await call(cashier, 'GET', '/pro/staff');
check('caissier : équipe interdite', r.status === 403 && r.data?.status === 'forbidden_for_staff', JSON.stringify(r));
r = await call(cashier, 'GET', '/pro/subscription');
check('caissier : abonnement interdit', r.status === 403, JSON.stringify(r));
r = await call(cashier, 'GET', '/pro/business/insights');
check('caissier : indicateurs interdits', r.status === 403, JSON.stringify(r));
r = await call(cashier, 'POST', '/pro/scan', { clientId, points_to_add: 10 });
check('caissier : scan accepté', r.status === 200, JSON.stringify(r));
const [[tx]] = await pool.query("SELECT COUNT(*) AS n FROM transaction_history WHERE client_id = ? AND type = 'add_points' AND establishment_id = ?", [clientId, estA]);
check("passage rattaché à l'établissement du caissier", tx.n === 1, JSON.stringify(tx));
r = await call(cashier, 'GET', '/pro/establishments');
check('caissier : ne voit que son établissement', r.status === 200 && r.data.establishments.length === 1 && r.data.establishments[0].id === estA, JSON.stringify(r.data));

// Manager
const manager = (await login(managerEmail)).session;
check('connexion du manager', !!manager);
r = await call(manager, 'GET', '/pro/business/insights');
check('manager : indicateurs autorisés', r.status === 200, JSON.stringify(r));
r = await call(manager, 'POST', '/pro/staff', { nom: 'X', email: `x-${stamp}@test.local`, role: 'cashier', mot_de_passe: PASSWORD });
check('manager : création de compte interdite', r.status === 403, JSON.stringify(r));
r = await call(manager, 'POST', '/pro/establishments', { nom: 'Nouveau' });
check('manager : création d’établissement interdite', r.status === 403, JSON.stringify(r));
r = await call(manager, 'GET', '/pro/account');
check('manager : compte du propriétaire interdit', r.status === 403, JSON.stringify(r));
r = await call(manager, 'POST', '/pro/scan', { clientId, points_to_add: 5 }, { 'X-Establishment-Id': estB });
check('manager : scan accepté', r.status === 200, JSON.stringify(r));
const [[tx2]] = await pool.query("SELECT COUNT(*) AS n FROM transaction_history WHERE client_id = ? AND type = 'add_points' AND establishment_id = ?", [clientId, estB]);
check("passage rattaché à l'établissement choisi en caisse (B)", tx2.n === 1, JSON.stringify(tx2));
r = await call(manager, 'POST', '/pro/scan', { clientId, points_to_add: 5 }, { 'X-Establishment-Id': 'autre-entreprise' });
const [[orphans]] = await pool.query("SELECT COUNT(*) AS n FROM transaction_history WHERE client_id = ? AND type = 'add_points' AND establishment_id IS NULL", [clientId]);
check('établissement invalide en en-tête : ignoré', r.status === 200 && orphans.n === 1, JSON.stringify(orphans));

// Export CSV avec établissement
{
  const res = await fetch(API + '/pro/business/export/clients.csv', { headers: { Authorization: `Bearer ${owner.token}`, 'X-Device-Id': owner.deviceId } });
  const text = await res.text();
  check('export clients : colonne Établissement', res.status === 200 && text.includes('Établissement') && text.includes('Centre-ville'), text.slice(0, 200));
}

// Désactivation et suppression
r = await call(owner, 'PUT', `/pro/staff/${cashierId}`, { actif: false });
check('désactivation du caissier', r.status === 200, JSON.stringify(r));
r = await call(cashier, 'GET', '/pro/clients');
check('caissier désactivé : jeton refusé immédiatement', r.status === 401, JSON.stringify(r));
r = (await login(cashierEmail));
check('caissier désactivé : connexion refusée', r.status === 403, JSON.stringify(r));

// Suppression d'un établissement : les données restent
r = await call(owner, 'DELETE', `/pro/establishments/${estA}`);
check('suppression établissement A', r.status === 200, JSON.stringify(r));
const [[kept]] = await pool.query('SELECT establishment_id FROM clients WHERE id = ?', [clientId]);
check('client conservé, sans établissement', kept && kept.establishment_id === null, JSON.stringify(kept));

// Fin de l'offre Business : l'équipe n'a plus accès
await pool.query("UPDATE entreprises SET subscription_status = 'canceled', tier = 'free' WHERE id = ?", [ent.id]);
r = await call(manager, 'GET', '/pro/clients');
check("offre terminée : le manager est refusé", r.status === 403 && r.data?.status === 'upgrade_required', JSON.stringify(r));
r = (await login(managerEmail));
check("offre terminée : connexion de l'équipe refusée", r.status === 403, JSON.stringify(r));

// Nettoyage
await pool.query('DELETE FROM entreprises WHERE id = ?', [ent.id]);
console.log(fails === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${fails} ÉCHEC(S)`);
process.exit(fails ? 1 : 0);
