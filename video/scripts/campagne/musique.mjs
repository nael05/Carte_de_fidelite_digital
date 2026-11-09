// Musiques originales des vidéos (ElevenLabs Music) : une par vidéo, à sa durée, normalisée à -16 LUFS.
// → public/campagne/musique/<video>.mp3        Usage : NODE_USE_ENV_PROXY=1 node scripts/campagne/musique.mjs <durees.json> [video…]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const OUT = path.join(root, 'public/campagne/musique')
const KEY = process.env.ELEVENLABS_API_KEY || 'proxy-injected'
const NO = 'instrumental only, no vocals, no voice, polished modern professional mix, steady energy from start to end, ends cleanly'
const STYLE = {
  marque: 'Modern premium tech brand commercial music, minimal melodic house, soft plucked synths, airy pads, warm sub bass, crisp tight percussion, uplifting and confident, 120 BPM',
  energique: 'Modern upbeat electronic pop for a TikTok ad, bouncy synth bass, punchy clean drums, bright catchy plucks, confident and fun, 124 BPM',
  histoire: 'Modern cinematic storytelling music: starts intimate with soft felt piano and gentle pulse, halfway it lifts into an uplifting modern electronic groove with warm bass and light percussion, emotional then hopeful',
  chill: 'Modern chill electronic groove, smooth lofi house, warm Rhodes keys, soft shuffled drums, relaxed but moving, 115 BPM',
  boulangerie: 'Modern feel-good acoustic pop groove, light acoustic guitar, hand claps, warm bass, sunny morning vibe, 110 BPM',
  coiffure: 'Modern stylish chill R&B groove, smooth bass, soft electric keys, elegant finger snaps, 98 BPM',
  restaurant: 'Modern warm upbeat groove with light Italian mandolin plucks over a clean modern beat, cheerful and classy, 112 BPM',
  barbier: 'Modern smooth hip-hop beat, boom bap drums, mellow keys, deep bass, confident and cool, 90 BPM',
  fleuriste: 'Modern light airy indie-pop groove, plucked strings, soft bells, fresh spring feeling, 108 BPM',
  institut: 'Modern elegant chill deep house, silky pads, soft piano chords, luxurious spa atmosphere, 112 BPM',
  signature: 'Elegant minimal product launch film music in the style of a premium tech keynote: a soft felt piano motif, warm airy synth pads, a gentle understated electronic pulse that grows subtly, sophisticated, calm confidence, spacious and refined, 100 BPM',
  signatureBlanc: 'Bright elegant minimal product film music: delicate plucked synth and soft piano, light clean percussion, airy and optimistic, refined premium tech brand feel, 108 BPM',
  site: 'Modern premium tech brand film music, melodic house with evolving soft synths, airy pads, warm sub bass, crisp light percussion, uplifting, builds gently, 118 BPM',
}
const QUEL = { 'rep-prix': 'energique', relance: 'marque', 'pov-commercant': 'chill', 'mythe-wallet': 'energique', 'rep-donnees': 'marque', 'rep-caisse': 'energique', 'rep-android': 'energique', 'rep-ages': 'chill', 'rep-telephone': 'energique', 'pov-client': 'chill', erreurs: 'marque', paliers: 'energique', stats: 'marque', 'sig-carte': 'signature', 'sig-message': 'signature', 'sig-caisse': 'signature', 'sig-client': 'signature', 'sig-film': 'signature', 'sig-design': 'signatureBlanc', tour: 'marque', creer: 'marque', calcul: 'marque', astuces: 'marque', spot: 'marque', site: 'site', tampon: 'histoire', push: 'energique', papier: 'energique', questions: 'energique', portefeuille: 'energique', appli: 'energique', client: 'chill', proximite: 'chill', boulangerie: 'boulangerie', coiffure: 'coiffure', restaurant: 'restaurant', barbier: 'barbier', fleuriste: 'fleuriste', institut: 'institut' }
// ENERGIE=1 : version TikTok, plus entraînante (rythme dès la première seconde)
const ENERGIE = 'high energy TikTok edit, driving punchy rhythm from the very first second, energetic modern drums and bass, catchy hook, 124 to 128 BPM, no slow intro, '
const durees = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const only = process.argv.slice(3)
fs.mkdirSync(OUT, { recursive: true })
for (const [video, d] of Object.entries(durees)) {
  if (only.length && !only.includes(video)) continue
  const ms = Math.max(10000, Math.round((d + 4) * 1000))
  const r = await fetch('https://api.elevenlabs.io/v1/music?output_format=mp3_44100_192', {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: `${STYLE[QUEL[video]]}, ${process.env.ENERGIE ? ENERGIE : ''}${NO}`, music_length_ms: ms }),
  })
  if (!r.ok) { console.error(`❌ ${video} ${r.status} ${(await r.text()).slice(0, 200)}`); continue }
  const raw = `/tmp/claude-0/musique-${video}.mp3`
  fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()))
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-16:TP=-2:LRA=9', '-ar', '44100', '-b:a', '192k', path.join(OUT, `${video}.mp3`)])
  console.log(`✓ ${video} ${QUEL[video]} ${(ms / 1000).toFixed(1)} s`)
}
