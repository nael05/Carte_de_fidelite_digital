import { C } from '../kit'
import { W } from '../voix'
import { Express, dureeExpress } from './Express'

/* Saison 2 : vidéos décrites plan par plan pour le moteur Express */
const notif = (body, at, extra = {}) => ({ body, at, ...extra })

export const PLANS = {
  'rep-android': [
    { cue: 'ra1', type: 'commentaire', user: '@boulangerie.du.coin', text: 'Et pour mes clients sur Android ? 🤔' },
    { cue: 'ra2', type: 'android', accent: { 0: C.green } },
    { cue: 'ra3', type: 'duo' },
    { cue: 'ra4', type: 'iphone', ecran: 'page', page: 'm-carte-google' },
    { cue: 'ra5', type: 'fin' },
  ],
  'rep-ages': [
    { cue: 'rb1', type: 'commentaire', user: '@salon.sylvie', text: 'Mes clientes ont 70 ans 😅 elles vont savoir faire ?' },
    { cue: 'rb2', type: 'iphone', ecran: 'home', noStore: true, accent: { 0: C.green } },
    { cue: 'rb3', type: 'iphone', ecran: 'camera' },
    { cue: 'rb4', type: 'iphone', ecran: 'ajout', accent: { 3: C.blue }, son: 'sons_tt/clic.mp3', sonAt: 0.9 },
    { cue: 'rb5', type: 'iphone', ecran: 'page', page: 'm-recruter', scroll: 391 },
    { cue: 'rb6', type: 'fin' },
  ],
  'rep-telephone': [
    { cue: 'rc1', type: 'commentaire', user: '@le.comptoir.lyon', text: "Et s'il change de téléphone, il perd ses points ? 🤔" },
    { cue: 'rc2', type: 'iphone', ecran: 'page', page: 'm-clients', accent: { 0: C.green } },
    { cue: 'rc3', type: 'iphone', ecran: 'wallet', slide: true },
    { cue: 'rc4', type: 'iphone', ecran: 'page', page: 'm-recruter', scroll: 391 },
    { cue: 'rc5', type: 'fin' },
  ],
  'pov-client': [
    { cue: 'rd1', type: 'gros', text: 'POV', sub: "t'es le client", color: C.blue },
    { cue: 'rd2', type: 'iphone', ecran: 'lock', heure: '11:00', notifs: [notif('Le croissant du mois est là 🥐 Venez le goûter avant midi.', Q => W(Q, 'rd2', 4), { title: 'Fournil Doré', mark: 'F' })], zoomNotif: Q => W(Q, 'rd2', 4) + 0.5, son: 'sons_tt/notif.mp3', sonAt: Q => W(Q, 'rd2', 4) },
    { cue: 'rd4', type: 'iphone', ecran: 'lock', heure: '12:04', notifs: [notif('Fournil Doré est à 50 m 🥐 Plus que 20 points avant votre café.', Q => W(Q, 'rd4', 7), { title: 'Fournil Doré', mark: 'F', time: 'à proximité' })], zoomNotif: Q => W(Q, 'rd4', 7) + 0.4, son: 'sons_tt/notif_douce.mp3', sonAt: Q => W(Q, 'rd4', 7) },
    { cue: 'rd5', type: 'carte', points: [460, 480], ptsAt: Q => W(Q, 'rd5', 4), son: 'sons_tiktok/bip-caisse.mp3', sonAt: Q => W(Q, 'rd5', 4) },
    { cue: 'rd6', type: 'iphone', ecran: 'lock', heure: '8:30', notifs: [notif('Votre café est offert ☕ Présentez votre carte en caisse.', Q => W(Q, 'rd6', 5), { title: 'Fournil Doré', mark: 'F' })], zoomNotif: Q => W(Q, 'rd6', 5) + 0.4, accent: { 7: C.champagne }, son: 'sons_tt/notif.mp3', sonAt: Q => W(Q, 'rd6', 5) },
    { cue: 'rd7', type: 'fin', sub: "L'expérience Fidelyz" },
  ],
  erreurs: [
    { cue: 're1', type: 'gros', text: '3', sub: 'erreurs qui font fuir tes clients', color: C.red, size: 400 },
    { cue: 're2', type: 'gros', text: '20 tampons', sub: 'pour un café ? Personne ne tient.', color: C.red, size: 150, accent: { 0: C.red } },
    { cue: 're3', type: 'iphone', ecran: 'lock', heure: '18:30', notifs: [], accent: { 0: C.red } },
    { cue: 're4', type: 'papier', efface: Q => W(Q, 're4', 5), accent: { 0: C.red } },
    { cue: 're5', type: 'liste', items: [['Une récompense atteignable', Q => W(Q, 're5', 1)], ['Des messages au bon moment', Q => W(Q, 're5', 2)], ['Une carte impossible à perdre', Q => W(Q, 're5', 3)]], logo: Q => W(Q, 're5', 5) },
  ],
  paliers: [
    { cue: 'rf1', type: 'carte' },
    { cue: 'rf2', type: 'jauge', max: 1000, paliers: [[500, 'Café offert', '☕'], [1000, 'Pâtisserie offerte', '🥐']] },
    { cue: 'rf4', type: 'carte', points: [420, 480], skin: 'champagne', accent: { 4: C.blue, 5: C.blue } },
    { cue: 'rf5', type: 'iphone', ecran: 'page', page: 'm-reglages-programme', scroll: 491 },
    { cue: 'rf6', type: 'fin' },
  ],
  stats: [
    { cue: 'rg1', type: 'gros', text: '?', sub: 'clients revenus ce mois-ci', color: C.blue, size: 420 },
    { cue: 'rg2', type: 'papier', stamps: 5, accent: { 5: C.red } },
    { cue: 'rg3', type: 'iphone', ecran: 'page', page: 'm-stats' },
    { cue: 'rg4', type: 'iphone', ecran: 'page', page: 'm-stats-activite', scroll: 300 },
    { cue: 'rg5', type: 'fin' },
  ],
  // ── Saison 3 ──
  'rep-prix': [
    { cue: 'rh1', type: 'commentaire', user: '@patisserie.margaux', text: "C'est combien ton truc ? 💸" },
    { cue: 'rh2', type: 'gros', text: '0 €', sub: "pour toujours, jusqu'à 15 clients", color: C.green, size: 360, accent: { 3: C.green, 4: C.green } },
    { cue: 'rh3', type: 'liste', items: [['Ta carte dans Apple & Google Wallet', Q => W(Q, 'rh3', 4)], ['Les points', Q => W(Q, 'rh3', 9)], ['Les récompenses', Q => W(Q, 'rh3', 12)]] },
    { cue: 'rh4', type: 'gros', text: 'Sans engagement', sub: "tu changes d'offre en deux clics", color: C.blue, size: 130, accent: { 11: C.blue, 12: C.blue } },
    { cue: 'rh5', type: 'fin' },
  ],
  relance: [
    { cue: 'ri1', type: 'gros', text: '17', sub: 'clients pas revenus depuis 3 mois', color: C.red, size: 420, accent: { 0: C.red } },
    { cue: 'ri2', type: 'iphone', ecran: 'page', page: 'm-stats-clients', scroll: 60, accent: { 14: C.red } },
    { cue: 'ri3', type: 'iphone', ecran: 'page', page: 'm-campagnes-filled' },
    { cue: 'ri4', type: 'iphone', ecran: 'lock', heure: '17:45', notifs: [notif('Ça fait longtemps ! ☕ Votre 2e boisson est offerte cette semaine.', Q => W(Q, 'ri4', 2), { title: 'Maison Lumière', mark: 'M' })], zoomNotif: Q => W(Q, 'ri4', 2) + 0.4, son: 'sons_tt/notif.mp3', sonAt: Q => W(Q, 'ri4', 2) },
    { cue: 'ri5', type: 'fin' },
  ],
  'pov-commercant': [
    { cue: 'rj1', type: 'gros', text: 'POV', sub: "t'es le commerçant", color: C.champagne },
    { cue: 'rj2', type: 'iphone', ecran: 'page', page: 'm-caisse-search' },
    { cue: 'rj3', type: 'iphone', ecran: 'page', page: 'm-caisse-done', accent: { 2: C.green }, son: 'sons_tiktok/bip-caisse.mp3', sonAt: Q => W(Q, 'rj3', 2) },
    { cue: 'rj4', type: 'iphone', ecran: 'page', page: 'm-campagnes-filled' },
    { cue: 'rj5', type: 'iphone', ecran: 'page', page: 'm-stats' },
    { cue: 'rj6', type: 'fin' },
  ],
  'mythe-wallet': [
    { cue: 'rk1', type: 'gros', text: 'Wallet', sub: "pas que pour les billets d'avion ✈️", size: 260 },
    { cue: 'rk2', type: 'iphone', ecran: 'wallet', slide: true, accent: { 1: C.blue, 2: C.blue, 3: C.blue } },
    { cue: 'rk3', type: 'iphone', ecran: 'lock', heure: '12:04', notifs: [notif('Maison Lumière est à 50 m ☕ Votre carte est prête.', Q => W(Q, 'rk3', 2), { title: 'Maison Lumière', mark: 'M', time: 'à proximité' })], zoomNotif: Q => W(Q, 'rk3', 2) + 0.4, son: 'sons_tt/notif_douce.mp3', sonAt: Q => W(Q, 'rk3', 2) },
    { cue: 'rk4', type: 'duo', accent: { 7: C.green } },
    { cue: 'rk5', type: 'fin' },
  ],
  'rep-donnees': [
    { cue: 'rl1', type: 'commentaire', user: '@opticien.martin', text: 'Et les données de mes clients, elles vont où ? 🔒' },
    { cue: 'rl2', type: 'gros', text: '🔒', sub: 'Données chiffrées, espace sécurisé', size: 300 },
    { cue: 'rl3', type: 'liste', items: [['Conforme RGPD', Q => W(Q, 'rl3', 1)], ['Export à la demande', Q => W(Q, 'rl3', 9)], ['Suppression à la demande', Q => W(Q, 'rl3', 12)]] },
    { cue: 'rl4', type: 'iphone', ecran: 'page', page: 'm-clients' },
    { cue: 'rl5', type: 'fin' },
  ],
  'rep-caisse': [
    { cue: 'rm1', type: 'commentaire', user: '@cafe.des.arts', text: 'Ça va pas ralentir ma caisse le midi ? ⏱️' },
    { cue: 'rm2', type: 'iphone', ecran: 'page', page: 'm-caisse' },
    { cue: 'rm3', type: 'iphone', ecran: 'page', page: 'm-caisse-points20' },
    { cue: 'rm4', type: 'gros', text: '3 gestes', sub: 'scanner · choisir · valider', color: C.green, size: 190, accent: { 0: C.green, 1: C.green }, son: 'sons_tiktok/bip-caisse.mp3', sonAt: Q => W(Q, 'rm4', 4) },
    { cue: 'rm5', type: 'fin' },
  ],
}

export const ExpressVideo = ({ voix = true, son = true, video }) => <Express voix={voix} son={son} video={video} plans={PLANS[video]} />
export { dureeExpress }
