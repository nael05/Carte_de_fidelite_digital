// Enchaîne les répliques d'une vidéo de la série : at(n) = at(n-1) + dur(n-1) + gap(n). Usage : node scripts/serie-temps.mjs <set>
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const file = path.join(root, `src/voix-${process.argv[2]}.json`)
const cues = JSON.parse(fs.readFileSync(file, 'utf8'))
for (let i = 1; i < cues.length; i++) cues[i].at = Math.round((cues[i - 1].at + cues[i - 1].dur + (cues[i].gap ?? 0.4)) * 100) / 100
fs.writeFileSync(file, JSON.stringify(cues, null, 2) + '\n')
for (const c of cues) console.log(c.id, c.at.toFixed(2), '→', (c.at + c.dur).toFixed(2), c.text)
