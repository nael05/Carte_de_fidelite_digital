// Génère la voix off témoin (voix neuronale fr-FR « Henri » du service de lecture de Microsoft Edge)
// à partir de src/voix.json → public/voix/<id>.mp3.
// Pour la version diffusée, remplacer ces fichiers par une voix professionnelle aux mêmes noms.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const cues = JSON.parse(fs.readFileSync(path.join(root, 'src/voix.json'), 'utf8'))
const outDir = path.join(root, 'public/voix')
fs.mkdirSync(outDir, { recursive: true })

// Usage : node scripts/voice.mjs [id…]   (sans id : toutes les répliques ; --durees : durées seulement)
const args = process.argv.slice(2)
const durationsOnly = args.includes('--durees')
const only = args.filter(a => !a.startsWith('--'))
const tts = new MsEdgeTTS()
if (!durationsOnly) await tts.setMetadata('fr-FR-HenriNeural', OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3)

for (const cue of cues) {
  if (durationsOnly || (only.length && !only.includes(cue.id))) continue
  const file = path.join(outDir, `${cue.id}.mp3`)
  const { audioStream } = tts.toStream(cue.text, { rate: '-8%', pitch: '-4Hz' })
  await new Promise((resolve, reject) => {
    const out = fs.createWriteStream(file)
    audioStream.on('error', reject)
    audioStream.pipe(out)
    out.on('finish', resolve)
  })
  console.log(cue.id, cue.text)
}
tts.close()

// Durée de chaque réplique (MP3 à débit constant de 96 kbit/s), utilisée pour baisser la musique sous la voix
for (const cue of cues) {
  const file = path.join(outDir, `${cue.id}.mp3`)
  if (fs.existsSync(file)) cue.dur = Math.round(((fs.statSync(file).size * 8) / 96000) * 100) / 100
}
fs.writeFileSync(path.join(root, 'src/voix.json'), JSON.stringify(cues, null, 2) + '\n')
