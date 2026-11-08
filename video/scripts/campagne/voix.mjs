// Voix off ElevenLabs des vidéos « campagne » (voix d'homme, avec intonation).
// → public/campagne/voix/<id>.mp3 et src/campagne/voix-data.json (durée, silence de tête, instant de chaque mot).
//
// La clé n'est jamais dans le dépôt : dans le cloud, le proxy l'injecte lui-même (secret réseau pour api.elevenlabs.io) ;
// en local, mettre ELEVENLABS_API_KEY dans video/.env.
//
// Usage : NODE_USE_ENV_PROXY=1 node scripts/campagne/voix.mjs <video> [id…] [--force]
//         node scripts/campagne/voix.mjs --toutes            (toutes les vidéos)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = {}
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const KEY = env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || 'proxy-injected'

// Voix d'homme uniquement. Réglages : stabilité basse + style élevé = plus d'intonation.
const VOIX = {
  paul: { id: 'MBIQRZjHPU6xEjGuB3b8', speed: 1.04, stability: 0.4, style: 0.42 }, // Paul K, conteur grave et engageant (vidéo du site)
  corentin: { id: 'IHngRooVccHyPqB4uQkG', speed: 1.06, stability: 0.33, style: 0.55 }, // énergique, réseaux sociaux
  hugo: { id: 'IbbR6Av0dWuQJS0b8JVT', speed: 1.0, stability: 0.38, style: 0.5 }, // chaud, narratif (mises en scène)
  francois: { id: 'UBXZKOKbt62aLQHhc1Jm', speed: 1.0, stability: 0.36, style: 0.55 }, // grave, cinéma
  simon: { id: 'mvhJVdVoTWVUtL4keT7W', speed: 1.07, stability: 0.35, style: 0.5 }, // rapide, dynamique
}
const MODEL = env.ELEVENLABS_MODEL || process.env.ELEVENLABS_MODEL || 'eleven_multilingual_v2'

const TEXTES = JSON.parse(fs.readFileSync(path.join(root, 'src/campagne/textes.json'), 'utf8'))
const dataFile = path.join(root, 'src/campagne/voix-data.json')
const DATA = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
const OUT = path.join(root, 'public/campagne/voix')
fs.mkdirSync(OUT, { recursive: true })

const args = process.argv.slice(2)
const force = args.includes('--force')
const videos = args.includes('--toutes') ? Object.keys(TEXTES) : [args[0]]
const only = args.slice(1).filter(a => !a.startsWith('--'))

for (const video of videos) {
  const v = TEXTES[video]
  if (!v) { console.error('vidéo inconnue :', video, '— au choix :', Object.keys(TEXTES).join(', ')); process.exit(1) }
  const P = VOIX[v.voix]
  const lignes = v.lignes
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i]
    if (only.length && !only.includes(l.id)) continue
    const file = path.join(OUT, `${l.id}.mp3`)
    if (!force && DATA[l.id] && fs.existsSync(file)) continue
    const text = l.say ?? l.text
    const body = {
      text, model_id: MODEL,
      previous_text: lignes.slice(Math.max(0, i - 2), i).map(x => x.say ?? x.text).join(' ') || undefined,
      next_text: lignes[i + 1] ? (lignes[i + 1].say ?? lignes[i + 1].text) : undefined,
      voice_settings: { stability: P.stability, similarity_boost: 0.8, style: P.style, use_speaker_boost: true, speed: P.speed },
    }
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${P.id}/with-timestamps?output_format=mp3_44100_192`, {
      method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const txt = await r.text()
    if (!r.ok) { console.error(`❌ ${l.id} : ${r.status} ${txt.slice(0, 200)}`); process.exit(1) }
    const res = JSON.parse(txt)
    fs.writeFileSync(file, Buffer.from(res.audio_base64, 'base64'))
    const al = res.alignment
    const chars = al.characters, st = al.character_start_times_seconds, en = al.character_end_times_seconds
    // début de chaque mot (premier caractère non blanc après un espace)
    const starts = []
    let inWord = false
    for (let k = 0; k < chars.length; k++) {
      const blank = /\s/.test(chars[k])
      if (!blank && !inWord) starts.push(st[k])
      inWord = !blank
    }
    let last = 0
    for (let k = chars.length - 1; k >= 0; k--) if (!/[\s.,…!?;:]/.test(chars[k])) { last = en[k]; break }
    const lead = starts[0] ?? 0
    DATA[l.id] = { dur: +(last - lead).toFixed(3), lead: +lead.toFixed(3), words: starts.map(s => +(s - lead).toFixed(3)) }
    fs.writeFileSync(dataFile, JSON.stringify(DATA, null, 1))
    console.log(`✓ ${l.id} ${DATA[l.id].dur}s · ${text}`)
  }
}
