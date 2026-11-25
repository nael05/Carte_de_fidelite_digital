// Test de bout en bout des corrections de l'audit de mise en production :
// caisse (validation des points), campagnes (règles, message sur la carte Apple), expiration des points,
// réinitialisation du mot de passe, téléversement d'image, sessions.
// Usage : DOTENV_CONFIG_PATH=.env.test node tests/audit-e2e.mjs  (backend lancé sur le port 5000, sans Stripe)
import 'dotenv/config';
import crypto, { randomUUID } from 'crypto';
import pool from '../db.js';
import { computeClientExpiration, runExpirationForEnterprise } from '../controllers/loyaltyController.js';

const API = 'http://localhost:5000/api';
const PASSWORD = 'Test-Passw0rd!2026';
const stamp = Date.now();
const email = `audit-${stamp}@test.local`;
let fails = 0;

const call = async (session, method, path, body, extraHeaders = {}) => {
  const res = await fetch(API + path, {
    method,
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(session ? { Authorization: `Bearer ${session.token}`, 'X-Device-Id': session.deviceId } : {}),
      ...extraHeaders
    },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {})
  });
  let data = null;
  try { data = await res.json(); } catch { /* vide */ }
  return { status: res.status, data };
};
const check = (label, cond, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${cond ? '' : ' ' + extra}`);
};
const login = async (mail, password = PASSWORD, ua = 'audit-test') => {
  await pool.query('DELETE FROM rate_limit_store').catch(() => {});
  const res = await fetch(API + '/pro/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
    body: JSON.stringify({ email: mail, mot_de_passe: password })
  });
  const data = await res.json();
  return data.token ? { token: data.token, deviceId: data.deviceId } : null;
};

await pool.query('DELETE FROM rate_limit_store').catch(() => {});

// ── Tarifs publics (sans Stripe : valeurs de lancement TTC)
let r = await call(null, 'GET', '/plans');
check('tarifs : Pro 19 € et Business 39 € TTC', r.data?.prices?.pro?.monthly?.amount === 19 && r.data?.prices?.business?.monthly?.amount === 39 && r.data?.tax_included === true, JSON.stringify(r.data));
check('tarifs annuels -20 % : 182,40 € et 374,40 €', r.data?.prices?.pro?.yearly?.amount === 182.4 && r.data?.prices?.business?.yearly?.amount === 374.4);

// ── Inscription payante sans Stripe : refus clair
r = await call(null, 'POST', '/pro/signup', { tier: 'pro', plan: 'monthly', nom: 'X', raison_sociale: 'X', email: `paid-${stamp}@test.local`, mot_de_passe: PASSWORD, siret_tva: '1', adresse: 'a' });
check('offre payante sans Stripe : 503 explicite', r.status === 503 && r.data?.code === 'stripe_not_configured', JSON.stringify(r));

// ── Compte Pro (passage simulé en base)
r = await call(null, 'POST', '/pro/signup', { tier: 'free', nom: 'Audit', raison_sociale: 'Audit SARL', email: email.toUpperCase(), mot_de_passe: PASSWORD });
check('inscription gratuite (e-mail normalisé)', r.status === 200, JSON.stringify(r));
await pool.query("UPDATE entreprises SET subscription_status = 'active', tier = 'pro' WHERE email = ?", [email]);
const [[ent]] = await pool.query('SELECT id FROM entreprises WHERE email = ?', [email]);
check('e-mail stocké en minuscules', !!ent);
let pro = await login(email);
check('connexion', !!pro);

// ── Sessions : un jeton n'est valable que sur sa session
const other = await login(email, PASSWORD, 'autre-navigateur');
r = await call({ token: pro.token, deviceId: other.deviceId }, 'GET', '/pro/info');
check("jeton refusé avec l'identifiant d'un autre appareil", r.status === 401, JSON.stringify(r));
r = await call(other, 'POST', '/pro/logout-device', { deviceId: other.deviceId });
r = await call(other, 'GET', '/pro/info');
check('appareil déconnecté : jeton refusé', r.status === 401);

// ── Clients (dont un téléphone formaté différemment)
r = await call(null, 'POST', `/join/${ent.id}`, { nom: 'Martin', prenom: 'Léa', telephone: '06 12 34 56 78', type_wallet: 'apple', marketing_optin: true, started_at: Date.now() - 10000 });
check('inscription client', r.status === 201, JSON.stringify(r));
const clientA = r.data?.clientId;
r = await call(null, 'POST', `/join/${ent.id}`, { nom: 'Martin', prenom: 'Léa', telephone: '0612345678', type_wallet: 'apple', started_at: Date.now() - 10000 });
check('doublon de téléphone détecté malgré les espaces', r.status === 409, JSON.stringify(r));
r = await call(null, 'POST', `/join/${ent.id}`, { nom: 'Petit', prenom: 'Tom', telephone: '0699887766', type_wallet: 'google', marketing_optin: false, started_at: Date.now() - 10000 });
const clientB = r.data?.clientId;
r = await call(pro, 'POST', '/pro/clients/create-invite', { nom: 'Roux', prenom: 'Zoé', telephone: '0655443322', email: `zoe-${stamp}@test.local`, type_wallet: 'apple' });
check('client créé en caisse', r.status === 201, JSON.stringify(r));
const [[zoe]] = await pool.query('SELECT marketing_optin FROM clients WHERE id = ?', [r.data?.clientId]);
check("client créé en caisse : pas d'accord marketing coché d'office", zoe?.marketing_optin === 0, JSON.stringify(zoe));

r = await call(null, 'GET', `/companies/${ent.id}/info`);
check("infos publiques du commerce sans e-mail", r.status === 200 && r.data?.nom === 'Audit' && !('email' in r.data), JSON.stringify(r.data));

// ── Caisse : validation des points
r = await call(pro, 'POST', '/pro/scan', { clientId: clientA, points_to_add: 'abc' });
check('scan : points non numériques refusés', r.status === 400, JSON.stringify(r));
r = await call(pro, 'POST', '/pro/scan', { clientId: clientA, points_to_add: 1.5 });
check('scan : points décimaux refusés', r.status === 400);
r = await call(pro, 'POST', '/pro/scan', { clientId: clientA, points_to_add: 1e9 });
check('scan : montant démesuré refusé', r.status === 400);
r = await call(pro, 'POST', '/pro/scan', { clientId: clientA, points_to_add: 40 });
check('scan : +40 points', r.status === 200 && r.data?.newPoints === 40, JSON.stringify(r));
r = await call(pro, 'PUT', `/pro/adjust-points/${clientA}`, { adjustment: '-1000' });
check('ajustement : solde jamais négatif', r.status === 200 && r.data?.newPoints === 0, JSON.stringify(r));
const [[adj]] = await pool.query("SELECT points_change FROM transaction_history WHERE client_id = ? AND type = 'remove_points'", [clientA]);
check("ajustement : l'historique enregistre le retrait réel (-40)", adj?.points_change === -40, JSON.stringify(adj));
r = await call(pro, 'PUT', `/pro/adjust-points/${clientA}`, { adjustment: 120 });
r = await call(pro, 'POST', '/pro/reward-tiers', { points_required: 100, title: 'Café offert' });
const tierId = r.data?.id;
r = await call(pro, 'POST', '/pro/scan/finalize', { clientId: clientA, rewardTierId: randomUUID(), pointsToAdd: 5 });
check('transaction : récompense inconnue refusée', r.status === 404, JSON.stringify(r));
r = await call(pro, 'POST', '/pro/redeem-reward', { clientId: clientA, rewardTierId: tierId });
check('récompense utilisée', r.status === 200 && r.data?.newPoints === 20, JSON.stringify(r));

// ── Message persistant sur la carte Apple (notification écran verrouillé)
await pool.query(
  "INSERT INTO wallet_cards (client_id, company_id, pass_serial_number, authentication_token, points_balance) VALUES (?, ?, ?, ?, 0)",
  [clientA, ent.id, `AUDIT${stamp}`.slice(0, 20), crypto.randomBytes(16).toString('hex')]
);
r = await call(pro, 'POST', '/pro/scan', { clientId: clientA, points_to_add: 10 });
await new Promise((ok) => setTimeout(ok, 500));
let [[card]] = await pool.query('SELECT notification_message, points_balance FROM wallet_cards WHERE client_id = ?', [clientA]);
check('carte : message « + 10 points » et solde à jour', /^\+ 10 points : Encore 70 points pour « Café offert »/.test(card?.notification_message || '') && card.points_balance === 30, JSON.stringify(card));

// ── Campagnes
r = await call(pro, 'GET', '/pro/notifications/quota');
check('quota Pro : 4 campagnes par mois', r.data?.limit === 4, JSON.stringify(r.data));
const quiet = r.data?.quiet_now;
r = await call(pro, 'POST', '/pro/notifications/send', { title: 'x'.repeat(61), message: 'test' });
check('campagne : titre trop long refusé', r.status === 400);
r = await call(pro, 'POST', '/pro/notifications/send', { title: 'Soldes', message: '-20 % ce week-end' });
if (quiet) {
  check('campagne : refusée pendant les heures calmes', r.status === 403 && r.data?.code === 'quiet_hours', JSON.stringify(r));
} else {
  check('campagne envoyée aux seuls clients consentants avec une carte', r.status === 200 && r.data?.recipientsCount === 1, JSON.stringify(r));
  [[card]] = await pool.query('SELECT notification_message FROM wallet_cards WHERE client_id = ?', [clientA]);
  check('campagne : message écrit sur la carte Apple', card?.notification_message === 'Soldes : -20 % ce week-end', JSON.stringify(card));
  r = await call(pro, 'POST', '/pro/notifications/send', { title: 'Encore', message: 'Deuxième envoi' });
  check('campagne : 48 h minimum entre deux envois', r.status === 429 && r.data?.code === 'too_soon', JSON.stringify(r));
  await pool.query('UPDATE push_notifications_sent SET created_at = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE entreprise_id = ?', [ent.id]);
  await pool.query('UPDATE push_notifications_sent SET created_at = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE entreprise_id = ?', [ent.id]);
  r = await call(pro, 'POST', '/pro/push/send', { clientIds: [clientA, clientB], title: 'Encore', message: 'Deuxième envoi' });
  check('campagne : client déjà sollicité < 7 jours exclu', r.status === 422 || r.data?.recipientsCount === 0, JSON.stringify(r));
}
r = await call(pro, 'PUT', `/pro/card-customization/${ent.id}?loyaltyType=points`, { relevant_text: 'Happy hour 17 h', primary_color: '#112233' });
check('personnalisation enregistrée', r.status === 200, JSON.stringify(r));
r = await call(pro, 'PUT', `/pro/card-customization/${ent.id}?loyaltyType=points`, { logo_url: 'http://169.254.169.254/latest/meta-data' });
check('personnalisation : image externe refusée (SSRF)', r.status === 400, JSON.stringify(r));
r = await call(pro, 'PUT', `/pro/card-customization/${ent.id}?loyaltyType=points`, { apple_review_url: "javascript:alert(1)'" });
check('personnalisation : lien dangereux refusé', r.status === 400, JSON.stringify(r));
const [[{ n: campaigns }]] = await pool.query('SELECT COUNT(*) AS n FROM push_notifications_sent WHERE entreprise_id = ?', [ent.id]);
check("changer l'offre en cours n'envoie pas de campagne cachée", campaigns <= 1, String(campaigns));

// ── Expiration : alerte J-7 une seule fois, points échus retirés
const months = 6;
// Lot de 15 points acquis il y a « months » mois, décalé de « hours » heures.
const batch = async (hours) => {
  await pool.query(
    "INSERT INTO transaction_history (id, client_id, entreprise_id, type, points_change, description, created_at) VALUES (?, ?, ?, 'add_points', 15, 'test', DATE_ADD(DATE_SUB(NOW(), INTERVAL ? MONTH), INTERVAL ? HOUR))",
    [randomUUID(), clientB, ent.id, months, hours]
  );
};
await pool.query('UPDATE clients SET points = 30 WHERE id = ?', [clientB]);
await batch(-24);  // échu depuis 1 jour
await batch(156);  // expire dans 6,5 jours : alerte J-7 aujourd'hui
let exp = await computeClientExpiration(clientB, months);
check('expiration : points échus et alerte J-7 détectés', exp.toExpire === 15 && exp.warnPoints === 15 && exp.soonPoints === 15, JSON.stringify(exp));
const removed = await runExpirationForEnterprise(ent.id, months);
const [[b]] = await pool.query('SELECT points FROM clients WHERE id = ?', [clientB]);
check('expiration : points échus retirés', removed >= 15 && b.points === 15, JSON.stringify({ removed, b }));
exp = await computeClientExpiration(clientB, months);
check('expiration : rien à retirer au second passage', exp.toExpire === 0 && exp.warnPoints === 15, JSON.stringify(exp));

// ── Mot de passe oublié : jeton haché, lien non grillé par un mot de passe faible
r = await call(null, 'POST', '/pro/forgot-password', { email });
check('mot de passe oublié : réponse générique', r.status === 200);
const token = crypto.randomBytes(32).toString('hex');
await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
await pool.query('INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 1 HOUR))',
  [email, crypto.createHash('sha256').update(token).digest('hex')]);
r = await call(null, 'POST', '/pro/reset-password', { token, newPassword: 'faible' });
check('réinitialisation : mot de passe faible refusé', r.status === 400);
r = await call(null, 'POST', '/pro/reset-password', { token, newPassword: 'Nouveau-Passw0rd!2026' });
check('réinitialisation : le lien reste utilisable après une erreur de saisie', r.status === 200, JSON.stringify(r));
r = await call(null, 'POST', '/pro/reset-password', { token, newPassword: 'Autre-Passw0rd!2026' });
check('réinitialisation : lien à usage unique', r.status === 400);
r = await call(pro, 'GET', '/pro/info');
check('réinitialisation : anciennes sessions fermées', r.status === 401);
pro = await login(email, 'Nouveau-Passw0rd!2026');
check('connexion avec le nouveau mot de passe', !!pro);

// ── Téléversement
const fd = new FormData();
fd.append('logo', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.html');
r = await call(pro, 'POST', '/pro/upload-logo?imageType=logo&platform=apple', fd);
check('upload : faux PNG refusé', r.status === 400, JSON.stringify(r));
const fs = await import('fs');
const leftovers = fs.readdirSync(new URL('../uploads/', import.meta.url)).filter((f) => f.startsWith('tmp-') || f.endsWith('.html'));
check('upload : aucun fichier temporaire laissé sur le disque', leftovers.length === 0, JSON.stringify(leftovers));
const sharp = (await import('sharp')).default;
const png = await sharp({ create: { width: 300, height: 120, channels: 3, background: '#336699' } }).png().toBuffer();
const fd2 = new FormData();
fd2.append('logo', new Blob([png], { type: 'image/png' }), 'logo.png');
r = await call(pro, 'POST', '/pro/upload-logo?imageType=logo&platform=apple', fd2);
check('upload : vrai PNG accepté', r.status === 200 && /^uploads\/[\w-]+\.png$/.test(r.data?.url || ''), JSON.stringify(r));
const img = await fetch(`http://localhost:5000/api/${r.data?.url}`);
check('upload : image servie en PNG avec nosniff', img.status === 200 && img.headers.get('x-content-type-options') === 'nosniff');
if (r.data?.url) fs.unlinkSync(new URL(`../${r.data.url}`, import.meta.url));

// ── Lien public de carte
r = await fetch(`${API}/app/wallet/client-download/not-a-uuid`);
check('lien de carte invalide : 404', r.status === 404);
r = await fetch(`${API}/app/wallet/client-download/${clientA}?type=apple`);
check('lien de carte sans certificat Apple : 503 propre', r.status === 503);

// ── Nettoyage
await pool.query('DELETE FROM entreprises WHERE id = ?', [ent.id]);
await pool.end();
console.log(fails === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${fails} ÉCHEC(S)`);
process.exit(fails === 0 ? 0 : 1);
