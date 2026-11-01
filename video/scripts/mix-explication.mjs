// Bande-son de la vidéo explicative : musique de fond, quelques bruitages, voix → public/explication/mix.wav
// Sources : public/sons_tiktok/*.mp3 (voir SOURCES.md) et public/voix/eNN.wav (voice-elevenlabs.mjs --set=explication).
//
// La musique (150 BPM, une mesure = 1,6 s) est recoupée sur ses temps de mesure : la fin du breakdown sous le problème,
// le drop pile sur « Fidelyz », puis des passages pleins et la fin du morceau sous le logo. Elle reste très en retrait
// (environ 15 dB sous la voix). Six bruitages seulement, tous différents. Le tout vers −14 LUFS sans saturer.
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SONS = path.join(root, 'public/sons_tiktok')
const VOIX = JSON.parse(fs.readFileSync(path.join(root, 'src/voix-explication.json'), 'utf8'))
const word = (id, n) => {
  const c = VOIX.find(v => v.id === id)
  return c.at + Math.max(0, c.words[n].t)
}

const SR = 44100
const DUR = 53.5
const N = SR * DUR

const ffmpeg = (() => {
  const require = createRequire(import.meta.url)
  const dir = path.dirname(require.resolve(`@remotion/compositor-${process.platform}-${process.arch}${process.platform === 'win32' ? '-msvc' : ''}/package.json`))
  return path.join(dir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
})()

const decode = file => {
  const r = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'wav', '-c:a', 'pcm_s16le', '-ac', '2', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 })
  if (r.status !== 0) throw new Error(file + ' : ' + r.stderr.toString())
  const b = r.stdout.subarray(r.stdout.indexOf('data') + 8)
  const n = Math.floor(b.length / 4)
  const L = new Float32Array(n)
  const R = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    L[i] = b.readInt16LE(i * 4) / 32768
    R[i] = b.readInt16LE(i * 4 + 2) / 32768
  }
  return [L, R]
}
const peakOf = ([L, R]) => {
  let p = 0
  for (let i = 0; i < L.length; i++) p = Math.max(p, Math.abs(L[i]), Math.abs(R[i]))
  return p
}
const db = g => Math.pow(10, g / 20)

const bus = () => [new Float32Array(N), new Float32Array(N)]
const music = bus()
const fx = bus()
const voice = bus()

// ─── 1. Musique ──────────────────────────────────────────────
// Grille du morceau : premier temps de mesure à 0,232 s, mesure de 1,6 s ; drop principal au début de la mesure 33.
const M = decode(path.join(SONS, 'musique.mp3'))
const bar = m => 0.232 + 1.6 * m
const R = word('e04', 2) // « Fidelyz » : le drop tombe ici, toute la grille de l'image en découle (src/explication/rythme.js)
// [début dans la vidéo, fin dans la vidéo, début dans le morceau]
const SEGMENTS = [
  [0, R, bar(33) - R], // fin du breakdown, en tension sous le problème
  [R, R + 14 * 1.6, bar(33)], // le drop et les 14 mesures pleines qui suivent
  [R + 14 * 1.6, R + 23 * 1.6, bar(5)], // passage plein du début du morceau
  [R + 23 * 1.6, DUR, bar(47)], // dernières mesures et note finale, sous le logo
]
const XF = Math.round(0.012 * SR)
for (const [v0, v1, m0] of SEGMENTS) {
  const i0 = Math.round(v0 * SR)
  const i1 = Math.round(v1 * SR)
  const j0 = Math.round(m0 * SR)
  for (let i = i0 - XF; i < i1 + XF; i++) {
    if (i < 0 || i >= N) continue
    const j = j0 + (i - i0)
    if (j < 0 || j >= M[0].length) continue
    const g = i < i0 ? (i - (i0 - XF)) / XF : i >= i1 ? 1 - (i - i1) / XF : 1
    music[0][i] += M[0][j] * g
    music[1][i] += M[1][j] * g
  }
}
// Entrée en fondu sur 0,6 s, sortie sur la dernière seconde
for (let i = 0; i < N; i++) {
  const t = i / SR
  const g = Math.min(1, t / 0.6, Math.max(0, (DUR - t) / 1))
  music[0][i] *= g
  music[1][i] *= g
}

// ─── 2. Voix ─────────────────────────────────────────────────
for (const c of VOIX) {
  const [L] = decode(path.join(root, 'public/voix', `${c.id}.wav`))
  const i0 = Math.round(c.at * SR)
  for (let k = 0; k < L.length && i0 + k < N; k++) {
    voice[0][i0 + k] += L[k]
    voice[1][i0 + k] += L[k]
  }
}

// Musique de fond : discrète seule, nettement plus bas sous la voix
const OPEN = db(-15)
const DUCK = db(-27)
const spans = VOIX.map(c => [c.at - 0.05, c.at + c.dur]).sort((a, b) => a[0] - b[0])
const merged = []
for (const s of spans) {
  const last = merged[merged.length - 1]
  if (last && s[0] - last[1] < 0.6) last[1] = Math.max(last[1], s[1])
  else merged.push([...s])
}
const duckAt = t => {
  let k = 0
  for (const [a, b] of merged) {
    if (t >= a - 0.15 && t <= b + 0.5) {
      const v = t < a ? (t - (a - 0.15)) / 0.15 : t > b ? 1 - (t - b) / 0.5 : 1
      k = Math.max(k, v)
    }
  }
  return k
}
for (let i = 0; i < N; i++) {
  const k = duckAt(i / SR)
  const g = OPEN + (DUCK - OPEN) * k
  music[0][i] *= g
  music[1][i] *= g
}

// ─── 3. Bruitages : six, chacun différent ───────────────────
const SFX = {
  whoosh: { file: 'whoosh.mp3', peak: -16 },
  impact: { file: 'impact.mp3', peak: -12 },
  notif: { file: 'notification.mp3', peak: -16 },
  bip: { file: 'bip-caisse.mp3', peak: -17 },
  rip: { file: 'dechirure.mp3', peak: -14 },
}
for (const s of Object.values(SFX)) {
  s.data = decode(path.join(SONS, s.file))
  let a = 0
  while (a < s.data[0].length && Math.abs(s.data[0][a]) < 0.01 && Math.abs(s.data[1][a]) < 0.01) a++
  s.lead = a
  s.norm = db(s.peak) / peakOf(s.data)
}
const crest = ([L]) => {
  let m = 0, k = 0
  for (let i = 0; i < L.length; i++) if (Math.abs(L[i]) > m) { m = Math.abs(L[i]); k = i }
  return k
}
SFX.whoosh.crest = crest(SFX.whoosh.data)
const play = (name, t, gain = 1, rate = 1, { onCrest = false } = {}) => {
  const s = SFX[name]
  const [L, Rr] = s.data
  const start = onCrest ? (s.crest - s.lead) / rate : 0
  const i0 = Math.round((t - start / SR) * SR)
  const g = s.norm * db(gain)
  for (let k = 0; ; k++) {
    const p = s.lead + k * rate
    const j = Math.floor(p)
    if (j + 1 >= L.length) break
    const i = i0 + k
    if (i < 0) continue
    if (i >= N) break
    const f = p - j
    fx[0][i] += (L[j] + (L[j + 1] - L[j]) * f) * g
    fx[1][i] += (Rr[j] + (Rr[j + 1] - Rr[j]) * f) * g
  }
}
play('rip', word('e01', 8) - 0.05, 0) // la carte se déchire sur « perdre »
play('impact', R, -2, 0.9) // « Fidelyz », sur le drop
play('whoosh', R + 0.8, -4, 1, { onCrest: true }) // le logo devient la carte
play('bip', word('e10', 10) - 0.02, 0) // « Valider » en caisse
play('notif', word('e11', 13) - 0.05, 0) // la campagne arrive sur l'écran verrouillé
play('whoosh', word('e13', 0) - 0.05, -6, 0.8, { onCrest: true }) // retour au logo

// ─── 4. Mixage ───────────────────────────────────────────────
const mix = bus()
for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) mix[c][i] = music[c][i] + fx[c][i] + voice[c][i]

// Niveau : on vise −14 LUFS, puis limiteur doux pour garder la crête sous −1 dBFS
const writeWav = (file, [L, R]) => {
  const data = Buffer.alloc(N * 4)
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), i * 4)
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), i * 4 + 2)
  }
  const h = Buffer.alloc(44)
  h.write('RIFF', 0)
  h.writeUInt32LE(36 + data.length, 4)
  h.write('WAVEfmt ', 8)
  h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20)
  h.writeUInt16LE(2, 22)
  h.writeUInt32LE(SR, 24)
  h.writeUInt32LE(SR * 4, 28)
  h.writeUInt16LE(4, 32)
  h.writeUInt16LE(16, 34)
  h.write('data', 36)
  h.writeUInt32LE(data.length, 40)
  fs.writeFileSync(file, Buffer.concat([h, data]))
}
const lufs = file => {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' })
  const m = r.stderr.match(/"input_i"\s*:\s*"(-?[\d.]+)"/)
  return m ? Number(m[1]) : null
}
const limit = (B, gain) => {
  // limiteur à anticipation simple : gain réduit en douceur quand la crête dépasse −1 dBFS
  const ceil = db(-1)
  const look = Math.round(0.005 * SR)
  const rel = Math.exp(-1 / (0.08 * SR))
  const env = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    let p = 0
    for (let k = 0; k < look && i + k < N; k += 4) p = Math.max(p, Math.abs(B[0][i + k] * gain), Math.abs(B[1][i + k] * gain))
    env[i] = p > ceil ? ceil / p : 1
  }
  let g = 1
  const out = bus()
  for (let i = 0; i < N; i++) {
    g = env[i] < g ? env[i] : rel * g + (1 - rel) * env[i]
    out[0][i] = B[0][i] * gain * g
    out[1][i] = B[1][i] * gain * g
  }
  return out
}

const tmp = path.join(root, 'public/explication/mix.wav')
writeWav(tmp, limit(mix, 1))
const measured = lufs(tmp)
const makeup = measured == null ? 1 : db(Math.min(6, -14 - measured))
const final = limit(mix, makeup)
writeWav(tmp, final)
console.log(`mix : ${measured?.toFixed(1)} LUFS avant réglage, gain ${(20 * Math.log10(makeup)).toFixed(1)} dB → ${lufs(tmp)?.toFixed(1)} LUFS`)

// Contrôle de l'équilibre : niveau RMS de chaque piste pendant la voix et hors voix
const rms = (B, pred) => {
  let s = 0, c = 0
  for (let i = 0; i < N; i += 4) if (pred(i / SR)) { s += B[0][i] * B[0][i]; c++ }
  return (10 * Math.log10(s / Math.max(1, c) + 1e-12)).toFixed(1)
}
const speaking = t => merged.some(([a, b]) => t >= a + 0.1 && t <= b - 0.1)
console.log(`voix pendant la parole : ${rms(voice, speaking)} dB · musique sous la voix : ${rms(music, speaking)} dB · musique seule : ${rms(music, t => !speaking(t) && t < 50)} dB`)
console.log(`drop sur « Fidelyz » : ${R.toFixed(2)} s`)
// Bruitages comparés à la voix : niveau RMS maximal sur 50 ms (avant réglage final du niveau)
const shortMax = B => {
  const w = Math.round(0.05 * SR)
  let best = 0
  for (let i = 0; i + w < N; i += w) {
    let s = 0
    for (let k = i; k < i + w; k++) s += B[0][k] * B[0][k]
    best = Math.max(best, s / w)
  }
  return (10 * Math.log10(best + 1e-12)).toFixed(1)
}
console.log(`RMS max sur 50 ms : voix ${shortMax(voice)} dB · bruitages ${shortMax(fx)} dB · musique ${shortMax(music)} dB`)
