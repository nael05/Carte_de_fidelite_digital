// Planche contact d'une vidéo de la série : node scripts/serie-planche.mjs <Composition> <t1> <t2> … → out/stills/<Composition>-planche.jpg
// Images au tiers de la résolution, 6 par ligne, avec l'instant en surimpression. GL=angle si une carte graphique est disponible.
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const [id, ...times] = process.argv.slice(2)
const dir = path.join(root, 'out/stills', id)
fs.mkdirSync(dir, { recursive: true })
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.js') })
const inputProps = { son: false }
const composition = await selectComposition({ serveUrl, id, inputProps })
const files = []
for (const s of times.map(Number)) {
  const output = path.join(dir, `${s.toFixed(2)}.jpg`)
  await renderStill({ composition, serveUrl, frame: Math.min(composition.durationInFrames - 1, Math.round(s * 30)), output, inputProps, imageFormat: 'jpeg', jpegQuality: 80, scale: 1 / 3, chromiumOptions: { gl: process.env.GL ?? 'swangle' }, timeoutInMilliseconds: 180000, onBrowserLog: process.env.LOGS ? l => console.log('[navigateur]', l.type, l.text) : undefined })
  files.push([s, output])
}
const py = `
import sys
from PIL import Image, ImageDraw
fs = ${JSON.stringify(files)}
w, h = 360, 640
cols = min(6, len(fs))
rows = (len(fs) + cols - 1) // cols
out = Image.new('RGB', (cols * w, rows * h), '#222')
d = ImageDraw.Draw(out)
for i, (s, f) in enumerate(fs):
    im = Image.open(f).convert('RGB').resize((w, h))
    out.paste(im, ((i % cols) * w, (i // cols) * h))
    d.text(((i % cols) * w + 6, (i // cols) * h + 4), str(s), fill='#ff0')
out.save(sys.argv[1], quality=82)
`
spawnSync('python3', ['-c', py, path.join(root, 'out/stills', `${id}-planche.jpg`)], { stdio: 'inherit' })
console.log(path.join(root, 'out/stills', `${id}-planche.jpg`))
