// Images de contrôle des TikToks 3D, sans le son : node scripts/stills-tt.mjs <Composition> <t1> <t2> … (secondes)
// Sortie : out/stills/<composition>-<t>.jpg en demi-résolution
import path from 'path'
import { fileURLToPath } from 'url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const [id, ...times] = process.argv.slice(2)
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js') })
const inputProps = { son: false }
const composition = await selectComposition({ serveUrl, id, inputProps })
for (const s of times.map(Number)) {
  const output = path.join(root, 'out/stills', `${id}-${s.toFixed(2)}.jpg`)
  await renderStill({ composition, serveUrl, frame: Math.round(s * 30), output, inputProps, imageFormat: 'jpeg', jpegQuality: 85, scale: 0.5, chromiumOptions: { gl: process.env.GL ?? 'angle' }, timeoutInMilliseconds: 120000, onBrowserLog: process.env.LOGS ? l => console.log('[navigateur]', l.type, l.text, JSON.stringify(l.stackTrace?.[0] ?? '')) : undefined })
  console.log(output)
}
