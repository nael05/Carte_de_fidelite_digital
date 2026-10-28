import 'dotenv/config';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import pool from '../db.js';

const API = 'http://localhost:5000/api';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
const email = `free-${Date.now()}@test.local`;
const PASSWORD = 'Test-Passw0rd!2026';
let token;
let deviceId = 'test';
let fails = 0;

const call = async (method, path, body, auth = true) => {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}`, 'X-Device-Id': deviceId } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  let data = null;
  try { data = await res.json(); } catch { /* vide */ }
  return { status: res.status, data };
};
const check = (label, cond, extra = '') => {
  if (!cond) fails++;
  console.log(`${cond ? 'OK  ' : 'FAIL'} ${label}${cond ? '' : ' ' + extra}`);
};

await pool.query('DELETE FROM rate_limit_store').catch(() => {});

// 1. tarifs publics
let r = await call('GET', '/plans', null, false);
check('GET /plans : Pro 29 €/mois', r.data?.prices?.pro?.monthly?.amount === 29, JSON.stringify(r.data));
check('GET /plans : Pro annuel 278,40 € (-20 %)', r.data?.prices?.pro?.yearly?.amount === 278.4, JSON.stringify(r.data?.prices?.pro));
check('GET /plans : Business 59 € et 566,40 €', r.data?.prices?.business?.monthly?.amount === 59 && r.data?.prices?.business?.yearly?.amount === 566.4, JSON.stringify(r.data?.prices?.business));

// 2. inscription gratuite
r = await call('POST', '/pro/signup', { tier: 'free', nom: 'Free Test', raison_sociale: 'Free Test SARL', email, mot_de_passe: PASSWORD }, false);
check('inscription gratuite (sans Stripe)', r.status === 200 && r.data?.free === true, JSON.stringify(r));
r = await call('POST', '/pro/login', { email, mot_de_passe: PASSWORD }, false);
token = r.data?.token;
deviceId = r.data?.deviceId;
check('connexion', !!token, JSON.stringify(r));
const [[ent]] = await pool.query('SELECT id, subscription_status, tier, stripe_customer_id FROM entreprises WHERE email = ?', [email]);
check('compte gratuit en base (free/free, pas de client Stripe)', ent.subscription_status === 'free' && ent.tier === 'free' && !ent.stripe_customer_id, JSON.stringify(ent));

r = await call('GET', '/pro/status');
check('/pro/status : tier free, 0/15, non verrouillé', r.data?.tier === 'free' && r.data.client_limit === 15 && r.data.locked === false, JSON.stringify(r.data));

// 3. 15 clients via la page publique, le 16e est refusé
let ok = 0;
for (let i = 0; i < 15; i++) {
  const j = await call('POST', `/join/${ent.id}`, { nom: `Client${i}`, prenom: 'T', telephone: `06000000${String(i).padStart(2, '0')}`, type_wallet: 'apple', marketing_optin: true }, false);
  if (j.status === 201) ok++;
}
check('15 inscriptions acceptées', ok === 15, `ok=${ok}`);
r = await call('POST', `/join/${ent.id}`, { nom: 'Client16', prenom: 'T', telephone: '0600000099', type_wallet: 'apple' }, false);
check('16e inscription publique refusée (inscriptions fermées)', r.status === 403 && r.data?.code === 'registrations_closed', JSON.stringify(r));
r = await call('POST', '/pro/clients/create-invite', { nom: 'X', prenom: 'Y', telephone: '0611111111', email: 'x@y.fr', type_wallet: 'apple' });
check('16e client par le pro refusé (limite 15)', r.status === 403 && r.data?.code === 'free_limit_reached', JSON.stringify(r));

// 4. verrouillage au-delà de 15 (ex. retour au gratuit après un Pro)
const [[some]] = await pool.query('SELECT id FROM clients WHERE entreprise_id = ? LIMIT 1', [ent.id]);
await pool.query(
  "INSERT INTO clients (id, entreprise_id, nom, prenom, telephone, email, points, type_wallet, marketing_optin) VALUES (?, ?, 'Extra', 'X', '0699999999', NULL, 0, 'apple', 1)",
  [randomUUID(), ent.id]
);
r = await call('GET', '/pro/status');
check('16 clients : compte verrouillé', r.data?.locked === true && r.data.client_count === 16, JSON.stringify(r.data));
r = await call('POST', '/pro/scan', { clientId: some.id, points_to_add: 10 });
check('scan refusé quand verrouillé', r.status === 403 && r.data?.status === 'limit_exceeded', JSON.stringify(r));
r = await call('GET', '/pro/clients');
check('liste des clients toujours lisible', r.status === 200 && Array.isArray(r.data) && r.data.length === 16, `status ${r.status}`);
r = await call('DELETE', `/pro/clients/${some.id}`);
check('suppression de client possible quand verrouillé', r.status === 200, JSON.stringify(r));
r = await call('GET', '/pro/status');
check('retour à 15 clients : déverrouillé', r.data?.locked === false && r.data.client_count === 15, JSON.stringify(r.data));

// 5. notifications : réservées aux offres payantes
r = await call('POST', '/pro/notifications/send', { title: 'Promo', message: 'Test' });
check('campagne refusée en gratuit', r.status === 403 && r.data?.code === 'upgrade_required', JSON.stringify(r));

r = await call('GET', '/pro/business/insights');
check('fonctions Business refusées en gratuit', r.status === 403 && r.data?.status === 'upgrade_required', JSON.stringify(r));

// 6. passage à Business (checkout puis abonnement simulé + webhook signé)
r = await call('POST', '/pro/subscription/checkout', { tier: 'business', plan: 'yearly' });
check('checkout Business annuel créé', r.status === 200 && /checkout\.stripe\.com/.test(r.data?.checkout_url || ''), JSON.stringify(r));
const [[withCust]] = await pool.query('SELECT stripe_customer_id FROM entreprises WHERE id = ?', [ent.id]);
const customer = withCust.stripe_customer_id;
check('client Stripe créé', !!customer);
const pm = await stripe.paymentMethods.attach('pm_card_visa', { customer });
await stripe.customers.update(customer, { invoice_settings: { default_payment_method: pm.id } });
const sub = await stripe.subscriptions.create({
  customer, items: [{ price: process.env.STRIPE_PRICE_BUSINESS_YEARLY }],
  metadata: { entreprise_id: ent.id, tier: 'business' }
});
const sendEvent = async (type, object) => {
  const payload = JSON.stringify({ id: `evt_${randomUUID()}`, object: 'event', type, data: { object } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: 'whsec_localtest' });
  const res = await fetch(API.replace('/api', '') + '/api/stripe/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'stripe-signature': header }, body: payload });
  return res.status;
};
check('webhook subscription.updated accepté', (await sendEvent('customer.subscription.updated', sub)) === 200);
r = await call('GET', '/pro/status');
check('compte passé en Business', r.data?.tier === 'business' && r.data.locked === false, JSON.stringify(r.data));
const [[row]] = await pool.query('SELECT subscription_status, tier, subscription_plan FROM entreprises WHERE id = ?', [ent.id]);
check('base : active / business / yearly', row.subscription_status === 'active' && row.tier === 'business' && row.subscription_plan === 'yearly', JSON.stringify(row));

// 7. garde-fous des campagnes
r = await call('GET', '/pro/notifications/quota');
check('quota Business : 8 par mois', r.data?.limit === 8 && r.data.tier === 'business', JSON.stringify(r.data));
r = await call('POST', '/pro/notifications/send', { title: 'Promo', message: 'Test' });
if (r.data?.code === 'quiet_hours') {
  check('campagne refusée la nuit (heures calmes)', true);
  console.log('   (heure actuelle dans la plage 21h-8h : test d’envoi sauté)');
} else {
  check('1re campagne acceptée', r.status === 200 && r.data?.recipientsCount === 15, JSON.stringify(r));
  r = await call('POST', '/pro/notifications/send', { title: 'Promo2', message: 'Test' });
  check('2e campagne refusée (48 h minimum)', r.status === 429 && r.data?.code === 'too_soon', JSON.stringify(r));
  await pool.query('UPDATE push_notifications_sent SET created_at = DATE_SUB(NOW(), INTERVAL 3 DAY) WHERE entreprise_id = ?', [ent.id]);
  r = await call('POST', '/pro/notifications/send', { title: 'Promo3', message: 'Test' });
  check('campagne après 3 jours : aucun client éligible (cooldown 7 jours par client)', r.status === 422 && r.data?.code === 'no_eligible_recipients', JSON.stringify(r));
}

// 7b. fonctions Business
r = await call('GET', '/pro/business/insights');
check('insights Business', r.status === 200 && typeof r.data?.return_rate === 'number', JSON.stringify(r));
r = await call('GET', '/pro/business/relaunch?days=30');
check('clients à relancer', r.status === 200 && Array.isArray(r.data?.inactive) && r.data.inactive.length === 15, JSON.stringify(r).slice(0, 300));
{
  const res = await fetch(API + '/pro/business/export/clients.csv', { headers: { Authorization: 'Bearer ' + token, 'X-Device-Id': deviceId } });
  const bytes = new Uint8Array(await res.clone().arrayBuffer());
  const text = await res.text();
  const rowsCount = text.trim().split(String.fromCharCode(10)).length;
  check('export CSV clients (BOM, en-tête, 15 lignes)', res.status === 200 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF && text.startsWith('Pr') && rowsCount === 16, text.slice(0, 120) + ' / lignes ' + rowsCount);
}

// 8. fin d'abonnement : retour au gratuit
await stripe.subscriptions.cancel(sub.id);
check('webhook subscription.deleted accepté', (await sendEvent('customer.subscription.deleted', { ...sub, status: 'canceled' })) === 200);
r = await call('GET', '/pro/status');
check('abonnement terminé : retour au gratuit', r.data?.tier === 'free' && r.data.client_count === 15, JSON.stringify(r.data));

// nettoyage
await stripe.customers.del(customer).catch(() => {});
await pool.query('DELETE FROM entreprises WHERE id = ?', [ent.id]);
console.log(fails === 0 ? '\nTOUS LES TESTS PASSENT' : `\n${fails} ÉCHEC(S)`);
process.exit(fails ? 1 : 0);
