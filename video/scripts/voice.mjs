// Génère la voix off à partir de src/voix.json → public/voix/<id>.wav
// Voix neuronale fr-FR « Rémy » (service de lecture de Microsoft Edge), puis traitement studio :
// coupe-bas, chaleur dans les graves, présence, compression et niveau identique pour toutes les répliques.
// Le champ `say` est le texte prononcé (« Fidéliz » pour la bonne prononciation), `text` celui affiché.
// Le script écrit aussi dans voix.json la durée de chaque réplique et l'instant de chaque mot (`words`),
// qui servent à caler la typographie animée sur la voix.
//
// Usage : node scripts/voice.mjs [id…]
//   VOICE=fr-FR-HenriNeural RATE=+4% PITCH=-4% node scripts/voice.mjs   (autre réglage)
//   node scripts/voice.mjs --traiter --estimer   (idem, mots répartis par estimation quand la voix n'a pas d'horodatage)
//   node scripts/voice.mjs --traiter   (retraite les fichiers bruts déjà présents dans public/voix/brut/,
//                                       par exemple une voix enregistrée en studio déposée sous vNN.mp3)
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
// --set=tiktok : répliques de la version verticale (src/voix-tiktok.json), mêmes dossiers audio
const SET = process.argv.find(a => a.startsWith('--set='))?.slice(6)
const cuesFile = path.join(root, SET ? `src/voix-${SET}.json` : 'src/voix.json')
const cues = JSON.parse(fs.readFileSync(cuesFile, 'utf8'))
const outDir = path.join(root, 'public/voix')
const rawDir = path.join(outDir, 'brut')
fs.mkdirSync(rawDir, { recursive: true })

const VOICE = process.env.VOICE ?? 'fr-FR-RemyMultilingualNeural'
const RATE = process.env.RATE ?? '+6%'
const PITCH = process.env.PITCH ?? '-6%'
const SR = 44100

const args = process.argv.slice(2)
const processOnly = args.includes('--traiter')
const estimate = args.includes('--estimer')
const only = args.filter(a => !a.startsWith('--'))
const todo = cues.filter(c => !only.length || only.includes(c.id))

// ffmpeg fourni par Remotion (ou celui du système)
const ffmpeg = (() => {
  try {
    const require = createRequire(import.meta.url)
    const dir = path.dirname(require.resolve(`@remotion/compositor-${process.platform}-${process.arch}${process.platform === 'win32' ? '-msvc' : ''}/package.json`))
    const exe = path.join(dir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
    if (fs.existsSync(exe)) return exe
  } catch {}
  return 'ffmpeg'
})()

// ─── Synthèse ────────────────────────────────────────────────
if (!processOnly) {
  const tts = new MsEdgeTTS()
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, { wordBoundaryEnabled: true })
  for (const cue of todo) {
    const file = path.join(rawDir, `${cue.id}.mp3`)
    const { audioStream, metadataStream } = tts.toStream(cue.say ?? cue.text, { rate: RATE, pitch: PITCH })
    const words = []
    metadataStream?.on('data', chunk => {
      for (const m of JSON.parse(chunk.toString()).Metadata ?? []) {
        if (m.Type === 'WordBoundary') words.push({ w: m.Data.text.Text, t: m.Data.Offset / 1e7, d: m.Data.Duration / 1e7 })
      }
    })
    await new Promise((resolve, reject) => {
      const out = fs.createWriteStream(file)
      audioStream.on('error', reject)
      audioStream.pipe(out)
      out.on('finish', resolve)
    })
    cue.rawWords = words
    console.log(cue.id, cue.say ?? cue.text)
  }
  tts.close()
}

// ─── Traitement ──────────────────────────────────────────────
const decode = file => {
  const r = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'wav', '-c:a', 'pcm_s16le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error(r.stderr.toString())
  const b = r.stdout.subarray(r.stdout.indexOf('data') + 8)
  const x = new Float32Array(Math.floor(b.length / 2))
  for (let i = 0; i < x.length; i++) x[i] = b.readInt16LE(i * 2) / 32768
  return x
}

// Filtres biquadratiques (RBJ)
const biquad = (x, type, f0, q, gainDb = 0) => {
  const A = Math.pow(10, gainDb / 40)
  const w = (2 * Math.PI * f0) / SR
  const cs = Math.cos(w)
  const sn = Math.sin(w)
  const al = sn / (2 * q)
  let b0, b1, b2, a0, a1, a2
  if (type === 'hp') {
    b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = (1 + cs) / 2; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al
  } else if (type === 'peak') {
    b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A
  } else if (type === 'lowshelf') {
    const s = 2 * Math.sqrt(A) * al
    b0 = A * (A + 1 - (A - 1) * cs + s); b1 = 2 * A * (A - 1 - (A + 1) * cs); b2 = A * (A + 1 - (A - 1) * cs - s)
    a0 = A + 1 + (A - 1) * cs + s; a1 = -2 * (A - 1 + (A + 1) * cs); a2 = A + 1 + (A - 1) * cs - s
  } else {
    const s = 2 * Math.sqrt(A) * al
    b0 = A * (A + 1 + (A - 1) * cs + s); b1 = -2 * A * (A - 1 + (A + 1) * cs); b2 = A * (A + 1 + (A - 1) * cs - s)
    a0 = A + 1 - (A - 1) * cs + s; a1 = 2 * (A - 1 - (A + 1) * cs); a2 = A + 1 - (A - 1) * cs - s
  }
  const y = new Float32Array(x.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v
  }
  return y
}

// Compresseur : détection RMS, attaque 4 ms, relâche 90 ms
const compress = (x, thrDb = -22, ratio = 3.2) => {
  const y = new Float32Array(x.length)
  const at = Math.exp(-1 / (0.004 * SR))
  const rl = Math.exp(-1 / (0.09 * SR))
  let env = 0
  for (let i = 0; i < x.length; i++) {
    const p = x[i] * x[i]
    env = p > env ? at * env + (1 - at) * p : rl * env + (1 - rl) * p
    const db = 10 * Math.log10(env + 1e-12)
    const over = db - thrDb
    const g = over > 0 ? Math.pow(10, (-over * (1 - 1 / ratio)) / 20) : 1
    y[i] = x[i] * g
  }
  return y
}

const rmsDb = x => {
  let s = 0, n = 0
  for (let i = 0; i < x.length; i++) if (Math.abs(x[i]) > 0.01) { s += x[i] * x[i]; n++ }
  return 10 * Math.log10(s / Math.max(1, n) + 1e-12)
}

const writeWav = (file, x) => {
  const b = Buffer.alloc(44 + x.length * 2)
  b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVE', 8)
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22)
  b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34)
  b.write('data', 36); b.writeUInt32LE(x.length * 2, 40)
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2)
  fs.writeFileSync(file, b)
}

for (const cue of todo) {
  const src = ['mp3', 'wav'].map(e => path.join(rawDir, `${cue.id}.${e}`)).find(fs.existsSync)
  if (!src) continue
  let x = decode(src)

  // Silence de tête et de queue retiré (les mots sont recalés d'autant)
  let a = 0
  while (a < x.length && Math.abs(x[a]) < 0.004) a++
  let b = x.length - 1
  while (b > a && Math.abs(x[b]) < 0.004) b--
  a = Math.max(0, a - Math.round(0.01 * SR))
  b = Math.min(x.length, b + Math.round(0.12 * SR))
  x = x.slice(a, b)
  const lead = a / SR

  x = biquad(x, 'hp', 75, 0.7)
  x = biquad(x, 'lowshelf', 170, 0.7, 3)    // chaleur
  x = biquad(x, 'peak', 420, 1.1, -2.5)     // moins de carton
  x = biquad(x, 'peak', 3200, 0.9, 2.5)     // présence, intelligibilité
  x = biquad(x, 'highshelf', 9000, 0.7, 1.5) // air
  x = compress(x)
  const g = Math.pow(10, (-17 - rmsDb(x)) / 20)
  let peak = 0
  for (let i = 0; i < x.length; i++) peak = Math.max(peak, Math.abs(x[i] * g))
  const k = g * Math.min(1, 0.89 / peak)
  for (let i = 0; i < x.length; i++) x[i] *= k

  // Fondu de 8 ms aux bords
  const fade = Math.round(0.008 * SR)
  for (let i = 0; i < fade; i++) { x[i] *= i / fade; x[x.length - 1 - i] *= i / fade }

  writeWav(path.join(outDir, `${cue.id}.wav`), x)
  cue.dur = Math.round((x.length / SR) * 100) / 100
  if (cue.rawWords) {
    cue.words = cue.rawWords.map(w => ({ w: w.w, t: Math.round((w.t - lead) * 1000) / 1000, d: Math.round(w.d * 1000) / 1000 }))
    delete cue.rawWords
  } else if (estimate) {
    // Pas d'horodatage fourni (voix déposée à la main) : répartition des mots selon leur longueur
    const speech = x.length / SR - 0.12
    const toks = (cue.say ?? cue.text).split(/\s+/).filter(w => w && !/^[:;!?…]+$/.test(w))
    const wts = toks.map(w => w.replace(/[^\p{L}\p{N}]/gu, '').length + 1.5 + (/[.,:;!?…]$/.test(w) ? 1.5 : 0))
    const total = wts.reduce((a, b) => a + b, 0)
    let acc = 0
    cue.words = toks.map((w, i) => {
      const t = (acc / total) * speech
      acc += wts[i]
      return { w: w.replace(/[.,:;!?…]+$/g, ''), t: Math.round(t * 1000) / 1000, d: Math.round((wts[i] / total) * speech * 1000) / 1000 }
    })
  }
}

fs.writeFileSync(cuesFile, JSON.stringify(cues, null, 2) + '\n')
console.log('ok', VOICE, RATE, PITCH)
