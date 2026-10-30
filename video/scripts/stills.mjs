// Images fixes de contrôle, sans tout encoder.
// Ajouter --vertical pour la version TikTok (planches de 24 vignettes).
// Usage : node scripts/stills.mjs 90 300 600 ...        (numéros d'image, 30 images/s, demi-résolution)
//         node scripts/stills.mjs --planche 0.5 1.2 ...  (planches de 20 vignettes, temps en secondes)
import path from 'path'
import { fileURLToPath } from 'url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const args = process.argv.slice(2)
const planche = args.includes('--planche')
const vertical = args.includes('--vertical')
const values = args.filter(a => !a.startsWith('--')).map(Number)

const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js') })

if (planche) {
  const per = vertical ? 24 : 20
  for (let k = 0; k < values.length; k += per) {
    const times = values.slice(k, k + per)
    const composition = await selectComposition({ serveUrl, id: vertical ? 'PlancheV' : 'Planche', inputProps: { times } })
    const output = path.join(root, 'out/stills', `planche${vertical ? 'V' : ''}${k / per + 1}.jpg`)
    await renderStill({ composition, serveUrl, frame: 0, output, inputProps: { times }, imageFormat: 'jpeg', jpegQuality: 85, timeoutInMilliseconds: 120000 })
    console.log(output)
  }
} else {
  const composition = await selectComposition({ serveUrl, id: vertical ? 'Tiktok' : 'Fidelyz' })
  for (const frame of values) {
    const output = path.join(root, 'out/stills', `${vertical ? 'v' : 'f'}${String(frame).padStart(4, '0')}.jpg`)
    await renderStill({ composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5 })
    console.log(output)
  }
}
