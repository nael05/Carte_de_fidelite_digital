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
