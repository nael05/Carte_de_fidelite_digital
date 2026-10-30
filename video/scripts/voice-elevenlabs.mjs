// Voix off ElevenLabs → public/voix/brut/<id>.mp3, puis traitement par scripts/voice.mjs --traiter.
// La clé d'API est lue dans video/.env (ELEVENLABS_API_KEY), jamais affichée.
//
// Usage :
//   node scripts/voice-elevenlabs.mjs --chercher "Paul K"     liste les voix de la bibliothèque qui correspondent
//   node scripts/voice-elevenlabs.mjs --ajouter <voice_id>    ajoute une voix de la bibliothèque à ton compte
//   node scripts/voice-elevenlabs.mjs [id…]                   génère les répliques (voix : ELEVENLABS_VOICE_ID dans .env)
//
// Réglages facultatifs dans .env : ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL (défaut eleven_multilingual_v2),
// ELEVENLABS_SPEED (défaut 1.08), ELEVENLABS_STABILITY (défaut 0.45), ELEVENLABS_STYLE (défaut 0.3).
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const env = {}
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const KEY = env.ELEVENLABS_API_KEY ?? process.env.ELEVENLABS_API_KEY
if (!KEY) {
  console.error('ELEVENLABS_API_KEY manquante (video/.env)')
  process.exit(1)
}
const API = 'https://api.elevenlabs.io/v1'
const headers = { 'xi-api-key': KEY, 'Content-Type': 'application/json' }
const num = (k, d) => (env[k] != null ? Number(env[k]) : d)

const call = async (url, init) => {
  const r = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } })
  const text = await r.text()
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 300)}`)
  return JSON.parse(text)
}

const args = process.argv.slice(2)

// ─── Recherche / ajout d'une voix de la bibliothèque ─────────
if (args[0] === '--chercher') {
  const q = encodeURIComponent(args[1] ?? '')
  const res = await call(`${API}/shared-voices?search=${q}&page_size=10`)
  for (const v of res.voices ?? []) {
    console.log(`${v.name} | voice_id=${v.voice_id} | public_owner_id=${v.public_owner_id} | ${v.language ?? ''} ${v.gender ?? ''} | ${v.category ?? ''}`)
  }
  if (!res.voices?.length) console.log('aucune voix trouvée')
  await new Promise(r => setTimeout(r, 200))
  process.exit(0)
}
if (args[0] === '--ajouter') {
  const voiceId = args[1]
  const found = await call(`${API}/shared-voices?search=&page_size=100`).catch(() => null)
  const owner = args[2] ?? found?.voices?.find(v => v.voice_id === voiceId)?.public_owner_id
  if (!owner) {
    console.error('public_owner_id introuvable : relance avec --ajouter <voice_id> <public_owner_id> (voir --chercher)')
    process.exit(1)
  }
  const res = await call(`${API}/voices/add/${owner}/${voiceId}`, { method: 'POST', body: JSON.stringify({ new_name: 'Fidelyz voix off' }) })
  console.log('voix ajoutée au compte :', res.voice_id ?? voiceId)
  await new Promise(r => setTimeout(r, 200))
  process.exit(0)
}

// ─── Génération ──────────────────────────────────────────────
const VOICE = env.ELEVENLABS_VOICE_ID ?? process.env.ELEVENLABS_VOICE_ID
if (!VOICE) {
  console.error('ELEVENLABS_VOICE_ID manquant : trouve la voix avec --chercher puis ajoute-la dans video/.env')
  process.exit(1)
}
// --set=tiktok : répliques de la version verticale (src/voix-tiktok.json), mêmes dossiers audio
const SET = process.argv.find(a => a.startsWith('--set='))?.slice(6)
const cuesFile = path.join(root, SET ? `src/voix-${SET}.json` : 'src/voix.json')
const cues = JSON.parse(fs.readFileSync(cuesFile, 'utf8'))
const rawDir = path.join(root, 'public/voix/brut')
fs.mkdirSync(rawDir, { recursive: true })
const only = args.filter(a => !a.startsWith('--'))

// Instants de chaque mot (texte prononcé) à partir de l'alignement caractère par caractère
const wordsFrom = (text, al) => {
  const out = []
  const re = /\S+/g
  let m
  while ((m = re.exec(text))) {
    const a = m.index
    const b = a + m[0].length - 1
    const t = al.character_start_times_seconds[a]
    const e = al.character_end_times_seconds[b]
    out.push({ w: m[0].replace(/[.,:;!?…]+$/g, ''), t, d: e - t })
  }
  return out
}

for (const cue of cues) {
  if (only.length && !only.includes(cue.id)) continue
  const text = cue.say ?? cue.text
  const res = await call(`${API}/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: 'POST',
    body: JSON.stringify({
      text,
      model_id: env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2',
      voice_settings: {
        stability: num('ELEVENLABS_STABILITY', 0.45),
        similarity_boost: 0.8,
        style: num('ELEVENLABS_STYLE', 0.3),
        use_speaker_boost: true,
        speed: num('ELEVENLABS_SPEED', 1.08),
      },
    }),
  })
  fs.writeFileSync(path.join(rawDir, `${cue.id}.mp3`), Buffer.from(res.audio_base64, 'base64'))
  fs.rmSync(path.join(rawDir, `${cue.id}.wav`), { force: true })
  cue.rawWords = wordsFrom(text, res.alignment)
  console.log(cue.id, text)
}
fs.writeFileSync(cuesFile, JSON.stringify(cues, null, 2) + '\n')

// Même traitement que la voix témoin (coupe-bas, chaleur, présence, compression, niveau commun)
const r = spawnSync(process.execPath, [path.join(root, 'scripts/voice.mjs'), '--traiter', ...only], { stdio: 'inherit' })
await new Promise(r => setTimeout(r, 200))
process.exit(r.status ?? 0)
