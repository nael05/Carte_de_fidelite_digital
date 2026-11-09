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
    { cue: 're5', type: 'liste', items: [['Une récompense atteignable', Q => W(Q, 're5', 1)], ['Des messages au bon moment', Q => W(Q, 're5', 3)], ['Une carte impossible à perdre', Q => W(Q, 're5', 5)]], logo: Q => W(Q, 're5', 7) },
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
}

export const ExpressVideo = ({ voix = true, son = true, video }) => <Express voix={voix} son={son} video={video} plans={PLANS[video]} />
export { dureeExpress }
