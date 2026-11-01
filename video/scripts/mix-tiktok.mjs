// Bande-son de la version verticale : montage de la musique, bruitages, voix, mixage → public/sons_tiktok/mix.wav
// Sources : public/sons_tiktok/*.mp3 (voir SOURCES.md) et public/voix/tNN.wav (scripts/voice.mjs --set=tiktok).
//
// La musique (150 BPM, une mesure = 1,6 s) est recoupée sur ses premiers temps de mesure pour que ses drops
// tombent sur les temps forts de l'image. La musique baisse sous la voix ; les bruitages sont normalisés
// chacun à un niveau cible ; l'ensemble est amené vers −14 LUFS (niveau de lecture TikTok) sans saturer.
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SONS = path.join(root, 'public/sons_tiktok')
const VOIX = JSON.parse(fs.readFileSync(path.join(root, 'src/voix-tiktok.json'), 'utf8'))
const word = (id, n) => {
  const c = VOIX.find(v => v.id === id)
  return c.at + Math.max(0, c.words[n].t)
}

const SR = 44100
const DUR = 34
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

// ─── 1. Montage de la musique ────────────────────────────────
// Grille du morceau : premier temps de mesure à 0,232 s, mesure de 1,6 s ; le drop principal est à 53,032 s.
const M = decode(path.join(SONS, 'musique.mp3'))
const bar = m => 0.232 + 1.6 * m
const PUSH = 16.88 // « push » dans la voix : le drop principal tombe ici
const T = {
  drop1: PUSH - 8 * 1.6, // 4,08 s : la carte arrive dans le téléphone
  build1: PUSH - 1.6, // 15,28 s : une mesure de montée avant « push »
  push: PUSH,
  build2: PUSH + 6 * 1.6, // 26,48 s : montée avant le logo
  logo: PUSH + 7 * 1.6, // 28,08 s
}
// [début dans la vidéo, fin dans la vidéo, début dans le morceau]
const SEGMENTS = [
  [0, T.build1, bar(33) - T.drop1], // fin du breakdown (tension) puis drop, en continu
  [T.build1, T.push, bar(32)], // la dernière mesure du breakdown, qui monte
  [T.push, T.build2, bar(33)], // le drop, à nouveau
  [T.build2, T.logo, bar(32)], // montée
  [T.logo, DUR, bar(47)], // deux mesures pleines puis la fin du morceau
]
const XF = Math.round(0.012 * SR) // fondu de 12 ms à chaque coupe
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
// Fin : on laisse la note finale du morceau s'éteindre, fondu sur la dernière demi-seconde
for (let i = Math.round(33.3 * SR); i < N; i++) {
  const g = Math.max(0, 1 - (i / SR - 33.3) / 0.7)
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

// La musique baisse sous la voix (attaque 0,12 s, relâche 0,35 s ; deux phrases proches restent sous le même creux)
const OPEN = db(-6.5) // musique seule
const DUCK = db(-22.5) // musique sous la voix (environ 10 dB sous la voix)
const spans = VOIX.map(c => [c.at - 0.05, c.at + c.dur]).sort((a, b) => a[0] - b[0])
const merged = []
for (const s of spans) {
  const last = merged[merged.length - 1]
  if (last && s[0] - last[1] < 0.45) last[1] = Math.max(last[1], s[1])
  else merged.push([...s])
}
const duckAt = t => {
  let k = 0
  for (const [a, b] of merged) {
    if (t >= a - 0.12 && t <= b + 0.35) {
      const v = t < a ? (t - (a - 0.12)) / 0.12 : t > b ? 1 - (t - b) / 0.35 : 1
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

// ─── 3. Bruitages ────────────────────────────────────────────
// Chaque son est ramené à une crête cible (dBFS), puis placé ; `rate` < 1 ralentit et grave le son.
const SFX = {
  whoosh: { file: 'whoosh.mp3', peak: -13 },
  impact: { file: 'impact.mp3', peak: -10 },
  pop: { file: 'pop.mp3', peak: -16 },
  notif: { file: 'notification.mp3', peak: -14 },
  bip: { file: 'bip-caisse.mp3', peak: -15 },
  rip: { file: 'dechirure.mp3', peak: -14 },
}
for (const s of Object.values(SFX)) {
  s.data = decode(path.join(SONS, s.file))
  // départ du son : premier échantillon audible (les fichiers ont parfois un blanc en tête)
  let a = 0
  while (a < s.data[0].length && Math.abs(s.data[0][a]) < 0.01 && Math.abs(s.data[1][a]) < 0.01) a++
  s.lead = a
  s.norm = db(s.peak) / peakOf(s.data)
}
// whoosh : on cale le sommet du souffle (pas son début) sur l'instant visé
const crest = ([L]) => {
  let m = 0, k = 0
  for (let i = 0; i < L.length; i++) if (Math.abs(L[i]) > m) { m = Math.abs(L[i]); k = i }
  return k
}
SFX.whoosh.crest = crest(SFX.whoosh.data)

const play = (name, t, gain = 1, rate = 1, { onCrest = false, pan = 0 } = {}) => {
  const s = SFX[name]
  const [L, R] = s.data
  const start = onCrest ? (s.crest - s.lead) / rate : 0
  const i0 = Math.round((t - start / SR) * SR)
  const g = s.norm * db(gain)
  const gl = Math.min(1, 1 - pan)
  const gr = Math.min(1, 1 + pan)
  for (let k = 0; ; k++) {
    const p = s.lead + k * rate
    const j = Math.floor(p)
    if (j + 1 >= L.length) break
    const i = i0 + k
    if (i < 0) continue
    if (i >= N) break
    const f = p - j
    fx[0][i] += (L[j] + (L[j + 1] - L[j]) * f) * g * gl
    fx[1][i] += (R[j] + (R[j + 1] - R[j]) * f) * g * gr
  }
}

const BEAT = 0.4
// Accroche
play('impact', 0.03, -2) // la carte claque à l'écran
play('impact', word('t02', 4), -3, 1.15) // tampon « PERDUE »
play('pop', word('t02', 4) + 0.02, 0)
play('rip', 3.55, -2) // la carte est arrachée vers le haut…
play('whoosh', 3.75, -1, 1, { onCrest: true }) // …et file hors du cadre
// Apparition (drop 1)
play('impact', T.drop1, -6) // « Avec Fidéliz » démarre juste avant : l'impact reste sous la voix
play('whoosh', word('t04', 2) - 0.05, -5, 1.1, { onCrest: true, pan: 0.4 }) // l'Android glisse
play('pop', W2('t04', 4), 0) // autocollant « 0 application »
play('whoosh', 9.2, -3, 0.8, { onCrest: true }) // les téléphones tombent, la carte jaillit
// Personnalisation
play('pop', word('t05', 1), -1) // logo
;[0, 1, 2, 3].forEach(i => play('pop', PUSH - (15 - i) * BEAT, -4, 1 + i * 0.12)) // quatre couleurs, quatre temps
play('pop', word('t05', 6), -2, 0.9) // chrono
// Caisse
play('whoosh', 13.05, -8, 1.2, { onCrest: true })
play('bip', 14.05, 0)
for (let i = 0; i < 6; i++) play('pop', word('t06', 3) + 0.28 + i * 0.1, -9, 1.1 + i * 0.1) // les points montent
play('pop', word('t06', 3) + 0.2, -2) // « +20 »
// Notifications push
play('whoosh', 15.35, -6, 0.85, { onCrest: true }) // le tableau d'envoi monte
play('impact', T.push, -5) // « push » (sous le mot, sans le couvrir)
play('notif', T.push + 0.25, -6)
play('pop', 19.0, -3) // « Envoyer »
play('whoosh', 19.25, -4, 1.15, { onCrest: true }) // la notification part
play('notif', 19.45, -2)
play('notif', 19.78, -6, 1.06)
play('notif', 20.08, -8, 1.12)
play('whoosh', 20.9, -4, 0.7, { onCrest: true }) // la caméra recule
for (let i = 0; i < 6; i++) play('notif', 20.85 + i * 0.09, -16 - i, 1 + (i % 3) * 0.08, { pan: ((i % 3) - 1) * 0.6 }) // la vague
play('whoosh', 21.55, -6, 1.1, { onCrest: true }) // les points convergent
// Proximité
play('pop', 21.8, -3) // la boutique
play('notif', 23.2, -2) // la carte se rappelle au client
// Ils reviennent
play('whoosh', 24.6, -7, 1, { onCrest: true }) // le trajet devient la courbe
for (let k = 0; ; k++) {
  const t = PUSH + 19 * BEAT + k * BEAT // un clic sur chaque temps pendant que le compteur monte
  if (t >= T.build2 - 0.05) break
  play('pop', t, -12, 1.3)
}
play('pop', T.build2 + 0.02, 0) // « +14 d'un coup »
play('whoosh', 27.6, -3, 0.75, { onCrest: true }) // plongée dans le point
// Fin
play('impact', T.logo, -3)
play('pop', word('t13', 0) - 0.02, 0) // « Lien en bio »

function W2(id, n) {
  return word(id, n) + 0.08
}

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

const tmp = path.join(SONS, 'mix.wav')
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
console.log(`voix pendant la parole : ${rms(voice, speaking)} dB · musique sous la voix : ${rms(music, speaking)} dB · musique seule : ${rms(music, t => !speaking(t) && t < 33)} dB`)
console.log('temps forts :', Object.entries(T).map(([k, v]) => `${k} ${v.toFixed(2)} s`).join(' · '))
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
