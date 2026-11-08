// Voix off ElevenLabs des vidéos « campagne » (voix d'homme, modèle eleven_v3).
// Chaque vidéo est dite D'UNE SEULE TRAITE (intonation continue, pauses naturelles), puis découpée phrase par phrase
// grâce à l'horodatage de chaque caractère :
// → public/campagne/voix/<id>.mp3 (une réplique par fichier, avec ses silences naturels)
// → src/campagne/voix-data.json : { id: { dur, lead, words: [t…], gap } } (gap = pause naturelle après la réplique)
//
// La clé n'est jamais dans le dépôt : dans le cloud, le proxy l'injecte (secret réseau pour api.elevenlabs.io) ;
// en local, mettre ELEVENLABS_API_KEY dans video/.env.
//
// Usage : NODE_USE_ENV_PROXY=1 node scripts/campagne/voix.mjs <video…> | --toutes   [--force]
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
const env = {}
const envFile = path.join(root, '.env')
if (fs.existsSync(envFile)) for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}
const KEY = env.ELEVENLABS_API_KEY || process.env.ELEVENLABS_API_KEY || 'proxy-injected'

// Voix d'homme, choisies parmi les voix françaises les plus utilisées de la bibliothèque ElevenLabs.
// Réglages « naturels » : stabilité moyenne, aucun effet de style, vitesse normale.
const VOIX = {
  anatole: { id: 'Jrq4GqCKqYpigdQsZRkP', stability: 0.5 }, // Anatole, dynamique et clair (TikTok)
  nicolas: { id: 'aQROLel5sQbj1vuIVi6B', stability: 0.5 }, // Nicolas, narrateur (film du site, spot, mise en scène)
}
const MODEL = 'eleven_v3'

const TEXTES = JSON.parse(fs.readFileSync(path.join(root, 'src/campagne/textes.json'), 'utf8'))
const dataFile = path.join(root, 'src/campagne/voix-data.json')
const DATA = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
const OUT = path.join(root, 'public/campagne/voix')
const TMP = '/tmp/claude-0/voix'
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(TMP, { recursive: true })

/* Ce que la voix prononce : la marque, et une ponctuation d'oral (pas de « … » ni de « : » qui hachent la phrase) */
const parle = l => (l.say ?? l.text)
  .replace(/\bFidelyz\b/g, 'Fidéliz')
  .replace(/\s*…\s*/g, ', ')
  .replace(/\s+:\s+/g, ', ')
  .replace(/\s+/g, ' ')
  .trim()

const args = process.argv.slice(2)
const force = args.includes('--force')
const videos = args.includes('--toutes') ? Object.keys(TEXTES) : args.filter(a => !a.startsWith('--'))

for (const video of videos) {
  const v = TEXTES[video]
  if (!v) { console.error('vidéo inconnue :', video, '— au choix :', Object.keys(TEXTES).join(', ')); process.exit(1) }
  const lignes = v.lignes
  if (!force && lignes.every(l => DATA[l.id]?.v3 && fs.existsSync(path.join(OUT, `${l.id}.mp3`)))) continue
  const P = VOIX[v.voix] ?? VOIX.anatole
  const says = lignes.map(parle)
  const full = says.join(' ')
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${P.id}/with-timestamps?output_format=mp3_44100_192`, {
    method: 'POST', headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: full, model_id: MODEL, language_code: 'fr', voice_settings: { stability: P.stability, similarity_boost: 0.8, use_speaker_boost: true } }),
  })
  const txt = await r.text()
  if (!r.ok) { console.error(`❌ ${video} : ${r.status} ${txt.slice(0, 300)}`); process.exit(1) }
  const res = JSON.parse(txt)
  const whole = path.join(TMP, `${video}.mp3`)
  fs.writeFileSync(whole, Buffer.from(res.audio_base64, 'base64'))
  const { characters: ch, character_start_times_seconds: st, character_end_times_seconds: en } = res.alignment
  if (ch.join('') !== full) console.warn(`⚠ ${video} : alignement différent du texte (${ch.length} / ${full.length} caractères)`)

  // bornes de chaque réplique dans le texte complet
  let off = 0
  const spans = says.map(s => { const a = off; off += s.length + 1; return [a, a + s.length] })
  const info = spans.map(([a, b]) => {
    let i0 = a; while (i0 < b && /\s/.test(ch[i0])) i0++
    let i1 = b - 1; while (i1 > i0 && /[\s.,…!?;:]/.test(ch[i1])) i1--
    const starts = []
    let inWord = false
    for (let k = a; k < b; k++) {
      const blank = /\s/.test(ch[k])
      if (!blank && !inWord) starts.push(st[k])
      inWord = !blank
    }
    return { start: st[i0], end: en[i1], starts }
  })
  const total = Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', whole]).toString())
  for (let i = 0; i < lignes.length; i++) {
    const l = lignes[i], f = info[i]
    const cutA = i === 0 ? 0 : (info[i - 1].end + f.start) / 2
    const cutB = i === lignes.length - 1 ? total : (f.end + info[i + 1].start) / 2
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', whole, '-ss', cutA.toFixed(3), '-to', cutB.toFixed(3), '-af', 'afade=t=in:d=0.02,areverse,afade=t=in:d=0.04,areverse', '-c:a', 'libmp3lame', '-b:a', '192k', path.join(OUT, `${l.id}.mp3`)])
    // mots affichés (sous-titres) : les signes isolés (« : », « ? »…) prennent l'instant du mot précédent
    const shown = l.text.split(' ')
    const spoken = f.starts.map(s => +(s - f.start).toFixed(3))
    const words = []
    let k = 0
    for (const w of shown) {
      if (!/[\p{L}\p{N}]/u.test(w)) words.push(words.length ? words[words.length - 1] : 0)
      else words.push(spoken[Math.min(k++, spoken.length - 1)] ?? 0)
    }
    DATA[l.id] = {
      v3: true, dur: +(f.end - f.start).toFixed(3), lead: +(f.start - cutA).toFixed(3), words,
      gap: i < lignes.length - 1 ? +(info[i + 1].start - f.end).toFixed(3) : 0,
    }
  }
  fs.writeFileSync(dataFile, JSON.stringify(DATA, null, 1))
  console.log(`✓ ${video} (${v.voix}) ${total.toFixed(1)} s · ${full.slice(0, 70)}…`)
}
