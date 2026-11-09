// Rend les textures des scènes 3D (composition « Tex », src/tt/Textures.jsx) dans public/tt/tex/.
// Usage : node scripts/textures-tt.mjs [nom…]
import fs from 'fs'
import path from 'path'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dir = path.join(root, 'public/tt/tex')
fs.mkdirSync(dir, { recursive: true })

const ML = { title: 'Maison Lumière', time: 'maintenant' }
const TEX = {
  'pass-graphite': { kind: 'pass', skin: 'graphite', points: 480 },
  'pass-graphite-500': { kind: 'pass', skin: 'graphite', points: 500 },
  'pass-azur': { kind: 'pass', skin: 'azur', points: 480 },
  'pass-champagne': { kind: 'pass', skin: 'champagne', points: 480 },
  'pass-ivory': { kind: 'pass', skin: 'ivory', points: 480 },
  'pass-back': { kind: 'pass', skin: 'graphite', points: 480, back: true },
  'couche-fond': { kind: 'pass', skin: 'graphite', layer: 'body' },
  'couche-logo': { kind: 'pass', skin: 'graphite', layer: 'logo' },
  'couche-points': { kind: 'pass', skin: 'graphite', layer: 'points' },
  'couche-details': { kind: 'pass', skin: 'graphite', layer: 'details' },
  'couche-fond-azur': { kind: 'pass', skin: 'azur', layer: 'body' },
  'couche-fond-champagne': { kind: 'pass', skin: 'champagne', layer: 'body' },
  'couche-fond-ivory': { kind: 'pass', skin: 'ivory', layer: 'body' },
  'couche-points-500': { kind: 'pass', skin: 'graphite', layer: 'points', points: 500 },
  'notif-retour': { kind: 'notif', body: 'Ça fait longtemps ! Ton café t’attend : passe cette semaine, on t’offre le prochain.' },
  'notif-offre': { kind: 'notif', body: 'Ce week-end : −20 % sur toutes les pâtisseries. Montre ta carte en caisse.' },
  'notif-concurrent': { kind: 'notif', title: 'Le Fournil d’en face', body: 'Croissant offert avec ton café avant 10 h. Montre ta carte !' },
  'notif-toi': { kind: 'notif', title: 'Ton commerce', body: 'Ton offre, ici, sur l’écran de tes clients. Gratuitement.' },
  toast: { kind: 'toast' },
  'lock-toi': { kind: 'lock', notifs: [{ title: 'Ton commerce', time: 'maintenant', body: 'Ton offre, ici, sur l’écran de tes clients. Gratuitement.' }] },
  'lock-vide': { kind: 'lock', notifs: [] },
  wallet: { kind: 'wallet' },
  'wallet-noir': { kind: 'wallet', last: 'noir' },
  'pass-noir': { kind: 'pass', skin: 'noir' },
  'pass-noir-500': { kind: 'pass', skin: 'noir', points: 500 },
  'pass-noir-vide': { kind: 'pass', skin: 'noir', vide: true },
  'pass-noir-azur': { kind: 'pass', skin: 'noirazur' },
  'pass-noir-or': { kind: 'pass', skin: 'noiror' },
  'pass-noir-back': { kind: 'pass', skin: 'noir', back: true },
  // Série « Studio » : la campagne de la page « Campagnes » (public/explication/ecrans/campaigns-filled.png)
  'lock-campagne': { kind: 'lock', notifs: [{ ...ML, body: 'Le croissant du mois est là. −20 % sur les viennoiseries ce week-end. À tout de suite !' }] },
  'notif-campagne': { kind: 'notif', body: 'Le croissant du mois est là. −20 % sur les viennoiseries ce week-end. À tout de suite !' },
  'notif-proche': { kind: 'notif', title: 'Wallet', body: 'Maison Lumière est à 50 m. Ta carte : 480 points.' },
  'pass-graphite-0': { kind: 'pass', skin: 'graphite', points: 0, name: 'Maison Lumière' },
  // ─── Vague 2 (vidéos par métier, histoire de Camille, relance) ───
  'pass-pain': { kind: 'pass', skin: 'champagne', points: 120, name: 'Le Fournil', mark: 'F', photo: 'pain' },
  'pass-pain-130': { kind: 'pass', skin: 'champagne', points: 130, name: 'Le Fournil', mark: 'F', photo: 'pain' },
  'pass-coupe': { kind: 'pass', skin: 'graphite', points: 60, name: 'Studio Coupe', mark: 'S', photo: 'coupe' },
  'pass-coupe-80': { kind: 'pass', skin: 'graphite', points: 80, name: 'Studio Coupe', mark: 'S', photo: 'coupe' },
  'pass-resto': { kind: 'pass', skin: 'azur', points: 240, name: 'La Table d’Hugo', mark: 'H', photo: 'resto' },
  'pass-resto-270': { kind: 'pass', skin: 'azur', points: 270, name: 'La Table d’Hugo', mark: 'H', photo: 'resto' },
  'notif-pain': { kind: 'notif', title: 'Le Fournil', body: 'Les croissants sortent du four. −20 % jusqu’à 10 h avec ta carte !' },
  'notif-coupe': { kind: 'notif', title: 'Studio Coupe', body: 'Ça fait 6 semaines ! Ta prochaine coupe : −15 % cette semaine.' },
  'notif-resto': { kind: 'notif', title: 'La Table d’Hugo', body: 'Ce jeudi soir, le dessert est offert avec ta carte. On t’attend !' },
  'lock-pain': { kind: 'lock', notifs: [{ title: 'Le Fournil', time: 'maintenant', body: 'Les croissants sortent du four. −20 % jusqu’à 10 h avec ta carte !' }] },
  'lock-coupe': { kind: 'lock', notifs: [{ title: 'Studio Coupe', time: 'maintenant', body: 'Ça fait 6 semaines ! Ta prochaine coupe : −15 % cette semaine.' }] },
  'lock-resto': { kind: 'lock', notifs: [{ title: 'La Table d’Hugo', time: 'maintenant', body: 'Ce jeudi soir, le dessert est offert avec ta carte. On t’attend !' }] },
  'pass-graphite-100': { kind: 'pass', skin: 'graphite', points: 100 },
  'pass-graphite-250': { kind: 'pass', skin: 'graphite', points: 250 },
  'lock-cafe-offert': { kind: 'lock', notifs: [{ ...ML, body: 'Bravo Camille ! 500 points : ton prochain café est offert.' }] },
  'notif-cafe-offert': { kind: 'notif', body: 'Bravo Camille ! 500 points : ton prochain café est offert.' },
  qr: { kind: 'qr' },
  papier: { kind: 'paper', stamps: 9 },
  'lock-retour': { kind: 'lock', notifs: [{ ...ML, body: 'Ça fait longtemps ! Ton café t’attend : passe cette semaine, on t’offre le prochain.' }] },
  'lock-offre': { kind: 'lock', notifs: [{ ...ML, body: 'Ce week-end : −20 % sur toutes les pâtisseries. Montre ta carte en caisse.' }] },
  'lock-proche': { kind: 'lock', notifs: [{ ...ML, title: 'Wallet', body: 'Maison Lumière est à 50 m. Ta carte : 480 points.' }] },
  'lock-concurrent': {
    kind: 'lock',
    notifs: [
      { title: 'Le Fournil d’en face', time: 'maintenant', body: 'Croissant offert avec ton café avant 10 h. Montre ta carte !' },
      { title: 'Le Fournil d’en face', time: 'hier', body: 'Plus que 2 passages avant ta baguette offerte.', dim: true },
    ],
  },
}

const only = process.argv.slice(2)
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js') })
for (const [name, inputProps] of Object.entries(TEX)) {
  if (only.length && !only.includes(name)) continue
  const output = path.join(dir, `${name}.png`)
  const composition = await selectComposition({ serveUrl, id: 'Tex', inputProps })
  await renderStill({ composition, serveUrl, frame: 0, output, inputProps, imageFormat: 'png' })
  console.log(name)
}
