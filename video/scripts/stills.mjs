// Rend quelques images fixes de la vidéo pour vérifier le cadrage sans tout encoder.
// Usage : node scripts/stills.mjs 90 300 600 ...   (numéros d'image, 30 images/s)
import path from 'path'
import { fileURLToPath } from 'url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const frames = process.argv.slice(2).map(Number)

const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js') })
const composition = await selectComposition({ serveUrl, id: 'Fidelyz' })

for (const frame of frames) {
  const output = path.join(root, 'out/stills', `f${String(frame).padStart(4, '0')}.jpg`)
  await renderStill({ composition, serveUrl, frame, output, imageFormat: 'jpeg', jpegQuality: 80, scale: 0.5 })
  console.log(output)
}
