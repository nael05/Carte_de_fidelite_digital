// Planches des dix formes futuristes : départ, transformation, arrivée → out/formes/<idée>-<k>.jpg
// Usage : node scripts/formes-tt.mjs [idée…]
import path from 'path'
import { fileURLToPath } from 'url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const only = process.argv.slice(2).map(Number)
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js') })
for (let idee = 1; idee <= 10; idee++) {
  if (only.length && !only.includes(idee)) continue
  for (const k of [0, 0.5, 1]) {
    const inputProps = { idee, k }
    const composition = await selectComposition({ serveUrl, id: 'Formes', inputProps })
    const output = path.join(root, 'out/formes', `${String(idee).padStart(2, '0')}-${k}.jpg`)
    await renderStill({ composition, serveUrl, frame: 0, output, inputProps, imageFormat: 'jpeg', jpegQuality: 90, chromiumOptions: { gl: 'angle' }, timeoutInMilliseconds: 180000, onBrowserLog: l => l.type === 'error' && console.log('[navigateur]', l.text) })
    console.log(output)
  }
}
