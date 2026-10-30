// Musique et bruitages de la version verticale (TikTok, 34 s), entièrement synthétisés.
// → public/musique-tiktok.wav et public/bruitages-tiktok.wav
// Pop électronique à 128 BPM en la bémol majeur : une noire = 0,46875 s, une mesure = 1,875 s.
// Les impacts suivent les mots de la voix (src/voix-tiktok.json).
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const VOIX = JSON.parse(fs.readFileSync(path.join(root, 'src/voix-tiktok.json'), 'utf8'))
const word = (id, n) => {
  const c = VOIX.find(v => v.id === id)
  return c.at + Math.max(0, c.words[n].t)
}

const SR = 44100
const DUR = 34
const N = SR * DUR
const TAU = Math.PI * 2
const BEAT = 60 / 128
const BAR = BEAT * 4

// ─── Utilitaires ─────────────────────────────────────────────
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 }
const midi = s => {
  const [, n, o] = s.match(/^([A-G][b#]?)(-?\d)$/)
  return 12 * (+o + 1) + NOTE[n]
}
const hz = n => 440 * Math.pow(2, ((typeof n === 'string' ? midi(n) : n) - 69) / 12)
const bus = () => [new Float32Array(N), new Float32Array(N)]
const panGains = p => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)]
const add = (B, i, v, gl = 1, gr = 1) => {
  if (i < 0 || i >= N) return
  B[0][i] += v * gl
  B[1][i] += v * gr
}

let seed = 20261030
const rnd = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

const tables = new Map()
const table = h => {
  if (tables.has(h)) return tables.get(h)
  const T = new Float32Array(4096)
  let max = 0
  for (let i = 0; i < 4096; i++) {
    let s = 0
    for (let n = 1; n <= h; n++) s += Math.sin((TAU * n * i) / 4096) / n
    T[i] = s
    max = Math.max(max, Math.abs(s))
  }
  for (let i = 0; i < 4096; i++) T[i] /= max
  tables.set(h, T)
  return T
}
const read = (T, ph) => {
  const j = ph | 0
  return T[j & 4095] + (T[(j + 1) & 4095] - T[j & 4095]) * (ph - j)
}

// ─── Batterie ────────────────────────────────────────────────
const kick = (B, t0, gain = 1) => {
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < SR * 0.42; k++) {
    const t = k / SR
    ph += (TAU * (46 + 110 * Math.exp(-t * 32))) / SR
    const v = (Math.sin(ph) * Math.exp(-t * 7.5) + (rnd() * 2 - 1) * Math.exp(-t * 900) * 0.25) * gain * 0.55
    add(B, i0 + k, v)
  }
}

const clap = (B, t0, gain = 1, pan = 0) => {
  const i0 = Math.floor(t0 * SR)
  const [gl, gr] = panGains(pan)
  let bp = 0, lo = 0
  const F = 2 * Math.sin((Math.PI * 1500) / SR)
  for (let k = 0; k < SR * 0.25; k++) {
    const t = k / SR
    const burst = t < 0.03 ? Math.exp(-((t * 1000) % 10) * 0.35) : Math.exp(-(t - 0.03) * 22)
    const hi = rnd() * 2 - 1 - lo - 0.7 * bp
    bp += F * hi
    lo += F * bp
    add(B, i0 + k, bp * burst * gain * 0.32, gl, gr)
  }
}

const hat = (B, t0, gain = 1, open = false, pan = 0.2) => {
  const i0 = Math.floor(t0 * SR)
  const [gl, gr] = panGains(pan)
  let prev = 0
  const d = open ? 9 : 55
  for (let k = 0; k < SR * (open ? 0.3 : 0.06); k++) {
    const t = k / SR
    const n = rnd() * 2 - 1
    const h = n - prev // passe-haut
    prev = n
    add(B, i0 + k, h * Math.exp(-t * d) * gain * 0.07, gl, gr)
  }
}

// ─── Instruments ─────────────────────────────────────────────
// Pluck : dents de scie à travers un passe-bas dont la fréquence chute (filtre à variables d'état)
const pluck = (B, t0, note, vel = 1, pan = 0, decay = 0.35, cutoff = 5200) => {
  const f = hz(note)
  const T = table(18)
  const i0 = Math.floor(t0 * SR)
  const [gl, gr] = panGains(pan)
  let ph = rnd() * 4096, ph2 = rnd() * 4096, lo = 0, bp = 0
  const len = Math.floor(SR * decay * 5)
  for (let k = 0; k < len; k++) {
    const t = k / SR
    ph += (f * 4096) / SR
    ph2 += (f * 1.004 * 4096) / SR
    const s = (read(T, ph) + read(T, ph2)) * 0.5
    const fc = 260 + cutoff * Math.exp(-t / (decay * 0.45))
    const F = 2 * Math.sin((Math.PI * Math.min(fc, 12000)) / SR)
    const hi = s - lo - 0.5 * bp
    bp += F * hi
    lo += F * bp
    const env = Math.min(1, t / 0.002) * Math.exp(-t / decay)
    add(B, i0 + k, lo * env * vel * 0.13, gl, gr)
  }
}

const bell = (B, t0, note, vel = 1, pan = 0, decay = 1.4) => {
  const f = hz(note)
  const i0 = Math.floor(t0 * SR)
  const [gl, gr] = panGains(pan)
  const parts = [[1, 1, 1], [2.0, 0.35, 1.8], [3.0, 0.12, 2.6], [4.07, 0.08, 3.4]]
  for (let k = 0; k < SR * decay * 4; k++) {
    const t = k / SR
    let s = 0
    for (const [h, a, dk] of parts) s += a * Math.exp((-t * dk) / decay) * Math.sin(TAU * f * h * t)
    add(B, i0 + k, s * Math.min(1, t / 0.002) * vel * 0.08, gl, gr)
  }
}

// Nappe chaude : 3 voix désaccordées par note, filtrée
const pad = (B, t0, t1, notes, gain = 1, bright = 0.12, atk = 0.25, rel = 0.6) => {
  const T = table(10)
  const i0 = Math.floor(t0 * SR)
  const i1 = Math.min(N, Math.floor((t1 + rel) * SR))
  for (const n of notes) {
    const f = hz(n)
    for (const [cents, pan] of [[-9, -0.7], [0, 0], [9, 0.7]]) {
      const inc = (f * Math.pow(2, cents / 1200) * 4096) / SR
      const [gl, gr] = panGains(pan)
      let ph = rnd() * 4096
      let lp = 0
      for (let i = i0; i < i1; i++) {
        const t = i / SR
        const env = Math.min(1, (t - t0) / atk) * (t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1)
        ph += inc
        lp += (read(T, ph) - lp) * bright
        add(B, i, lp * env * gain * 0.03, gl, gr)
      }
    }
  }
}

// Basse : sinus + un peu d'harmoniques, notes en croches décalées
const bass = (B, t0, dur, note, gain = 1) => {
  const f = hz(note)
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < SR * (dur + 0.05); k++) {
    const t = k / SR
    ph += (TAU * f) / SR
    const env = Math.min(1, t / 0.005) * (t > dur ? Math.max(0, 1 - (t - dur) / 0.05) : 1) * (0.75 + 0.25 * Math.exp(-t * 6))
    const v = (Math.sin(ph) + 0.18 * Math.sin(2 * ph) + 0.06 * Math.sin(3 * ph)) * env * gain * 0.2
    add(B, i0 + k, v)
  }
}

// ─── Effets ──────────────────────────────────────────────────
const noiseSweep = (B, t0, dur, f0, f1, gain, shape = 'rise', pan0 = 0, pan1 = 0) => {
  const i0 = Math.floor(t0 * SR)
  const len = Math.floor(dur * SR)
  let lo = 0, bp = 0
  for (let k = 0; k < len; k++) {
    const x = k / len
    const fc = f0 * Math.pow(f1 / f0, x)
    const F = 2 * Math.sin((Math.PI * Math.min(fc, 14000)) / SR)
    const hi = rnd() * 2 - 1 - lo - 0.55 * bp
    bp += F * hi
    lo += F * bp
    const env = shape === 'rise' ? Math.pow(x, 2) * Math.min(1, (1 - x) * 40) : shape === 'fall' ? Math.pow(1 - x, 2) * Math.min(1, x * 40) : Math.pow(Math.sin(Math.PI * x), 2)
    const [gl, gr] = panGains(pan0 + (pan1 - pan0) * x)
    add(B, i0 + k, bp * env * gain * 0.4, gl, gr)
  }
}

const riser = (B, t0, t1, gain = 1) => {
  noiseSweep(B, t0, t1 - t0, 300, 9000, gain, 'rise')
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  const len = Math.floor((t1 - t0) * SR)
  for (let k = 0; k < len; k++) {
    const x = k / len
    ph += (TAU * (220 * Math.pow(4, x))) / SR
    add(B, i0 + k, Math.sin(ph) * Math.sin(ph * 1.005) * Math.pow(x, 2.5) * gain * 0.05)
  }
}

const impact = (B, t0, gain = 1) => {
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < SR * 1.6; k++) {
    const t = k / SR
    ph += (TAU * (34 + 60 * Math.exp(-t * 9))) / SR
    add(B, i0 + k, (Math.sin(ph) * Math.exp(-t * 2.6) + (rnd() * 2 - 1) * Math.exp(-t * 30) * 0.3) * gain * 0.5)
  }
}

// ─── Réverbération (type Freeverb) ───────────────────────────
const reverb = ([L, R], wet = 0.3, room = 0.84) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
  const aps = [556, 441, 341, 225]
  const run = (x, spread) => {
    const out = new Float32Array(N)
    for (const d0 of combs) {
      const d = d0 + spread
      const buf = new Float32Array(d)
      let idx = 0, store = 0
      for (let i = 0; i < N; i++) {
        const y = buf[idx]
        store = y * 0.75 + store * 0.25
        buf[idx] = x[i] * 0.015 + store * room
        out[i] += y
        if (++idx >= d) idx = 0
      }
    }
    for (const d0 of aps) {
      const d = d0 + spread
      const buf = new Float32Array(d)
      let idx = 0
      for (let i = 0; i < N; i++) {
        const b = buf[idx]
        const y = -out[i] + b
        buf[idx] = out[i] + b * 0.5
        out[i] = y
        if (++idx >= d) idx = 0
      }
    }
    return out
  }
  const wl = run(L, 0)
  const wr = run(R, 23)
  for (let i = 0; i < N; i++) {
    L[i] += wl[i] * wet
    R[i] += wr[i] * wet
  }
}

const mixInto = (dst, src, g = 1) => {
  for (let i = 0; i < N; i++) {
    dst[0][i] += src[0][i] * g
    dst[1][i] += src[1][i] * g
  }
}

// ─── Écriture WAV 16 bits stéréo ─────────────────────────────
const writeWav = (file, [L, R], peak = 0.89) => {
  let max = 0
  for (let i = 0; i < N; i++) max = Math.max(max, Math.abs(L[i]), Math.abs(R[i]))
  const g = max > 0 ? peak / max : 1
  const data = Buffer.alloc(N * 4)
  for (let i = 0; i < N; i++) {
    // Saturation douce : arrondit les crêtes sans écrêter
    data.writeInt16LE(Math.round(Math.tanh(L[i] * g * 1.1) / Math.tanh(1.1) * 32767 * 0.98), i * 4)
    data.writeInt16LE(Math.round(Math.tanh(R[i] * g * 1.1) / Math.tanh(1.1) * 32767 * 0.98), i * 4 + 2)
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
  console.log(file, `gain ${g.toFixed(2)}`)
}


// ═══ Partition ═══════════════════════════════════════════════
// Fa mineur – Ré bémol – La bémol – Mi bémol (vi – IV – I – V en la bémol majeur)
const CH = {
  Fm: { pad: ['F3', 'Ab3', 'C4', 'Eb4'], root: 'F1', arp: ['F4', 'Ab4', 'C5', 'Eb5', 'C5', 'Ab4', 'C5', 'F5'] },
  Db: { pad: ['Db3', 'F3', 'Ab3', 'C4'], root: 'Db1', arp: ['Db4', 'F4', 'Ab4', 'C5', 'Ab4', 'F4', 'Ab4', 'Db5'] },
  Ab: { pad: ['Ab2', 'C3', 'Eb3', 'G3'], root: 'Ab1', arp: ['Ab4', 'C5', 'Eb5', 'G5', 'Eb5', 'C5', 'Eb5', 'Ab5'] },
  Eb: { pad: ['Eb3', 'G3', 'Bb3', 'Db4'], root: 'Eb1', arp: ['G4', 'Bb4', 'Eb5', 'G5', 'Eb5', 'Bb4', 'Eb5', 'Bb5'] },
}
const PROG = ['Fm', 'Db', 'Ab', 'Eb']
const chordAt = t => CH[PROG[Math.floor(t / BAR + 1e-6) % 4]]

const drums = bus()
const side = bus()
const fxm = bus()

// Sections : [début, fin, grosse caisse, clap, charleston, basse, pluck, nappe, mélodie]
const S = [
  [0, 3.75, 0, 0, 1, 0, 0, 0.6, 0], // accroche : tic-tac et nappe sombre
  [3.75, 15.0, 1, 1, 2, 1, 1, 1, 0], // la carte arrive, groove
  [15.0, 16.875, 0, 0, 2, 0, 0.6, 0.8, 0], // montée avant « push »
  [16.875, 26.25, 1, 1, 2, 1, 1, 1, 1], // le temps fort : notifications
  [26.25, 28.125, 0, 0, 0, 0, 0.5, 0.9, 0], // souffle avant le logo
  [28.125, 34, 0, 0, 1, 0, 0, 1, 0], // fin
]

const onBar = t => Math.abs(t / BAR - Math.round(t / BAR)) < 1e-6
const kicks = []
for (const [t0, t1, kk, cl, hh, bs, pl, pd, mel] of S) {
  for (let t = t0; t < t1 - 0.01; t += BEAT) {
    const b = Math.round(t / BEAT)
    const c = chordAt(t)
    if (kk) {
      kick(drums, t, 1)
      kicks.push(t)
    }
    if (cl && b % 2 === 1) clap(drums, t, 0.9, b % 4 === 1 ? -0.1 : 0.1)
    if (hh) {
      hat(drums, t + BEAT / 2, hh === 2 ? 1 : 0.6, b % 4 === 3 && hh === 2, 0.25)
      if (hh === 2) {
        hat(drums, t + BEAT / 4, 0.35, false, -0.25)
        hat(drums, t + (3 * BEAT) / 4, 0.45, false, -0.25)
      }
    }
    if (bs) bass(side, t + BEAT / 2, BEAT / 2 - 0.03, c.root.replace(/\d/, d => String(+d + 1)), 1)
    if (pl) {
      for (let e = 0; e < 2; e++) {
        const te = t + (e * BEAT) / 2
        const idx = ((b % 4) * 2 + e) % 8
        pluck(side, te, c.arp[idx], pl * (e ? 0.7 : 1), e ? 0.35 : -0.35, 0.2, 3800)
      }
    }
    if (pd && onBar(t)) pad(side, t, Math.min(t + BAR, t1), c.pad, pd, t0 < 3.75 ? 0.05 : 0.1)
    if (mel && onBar(t)) {
      const phrase = { Fm: ['C6', 'Eb6', 'F6', 'Eb6'], Db: ['Ab5', 'C6', 'Db6', 'C6'], Ab: ['Eb6', 'C6', 'Ab5', 'C6'], Eb: ['Bb5', 'G5', 'Bb5', 'Eb6'] }[PROG[Math.floor(t / BAR + 1e-6) % 4]]
      ;[0, 0.75, 1.5, 1.75].forEach((o, i) => bell(fxm, t + o * BEAT, phrase[i], 0.55, i % 2 ? 0.3 : -0.3, 0.7))
    }
  }
}

// Accroche : le choc de la carte, puis le tampon « PERDUE »
impact(fxm, 0.1, 0.7)
clap(fxm, 0.1, 0.7)
impact(fxm, word('t02', 4), 0.8)
clap(fxm, word('t02', 4), 0.7)
// Montées vers les deux temps forts et roulements de claps
riser(fxm, 3.0, 3.75, 0.8)
riser(fxm, 15.0, 16.875, 0.9)
for (const [a, b] of [[3.1, 3.7], [15.6, 16.8]]) {
  for (let t = a; t < b; ) {
    const x = (t - a) / (b - a)
    clap(drums, t, 0.25 + 0.6 * x)
    t += x < 0.5 ? BEAT / 2 : BEAT / 4
  }
}
impact(fxm, 3.75, 1)
impact(fxm, 16.875, 1)
riser(fxm, 26.9, 28.125, 0.7)
impact(fxm, 26.25, 0.5)
// Final : accord tenu sur le logo
impact(fxm, 28.125, 1)
;['Ab2', 'Eb3', 'C4', 'Eb4', 'G4', 'C5'].forEach((n, i) => pluck(fxm, 28.125 + i * 0.03, n, 0.8, -0.5 + i * 0.2, 1.2, 3000))
bell(fxm, 28.125, 'Eb6', 0.8, 0, 2.5)
bell(fxm, 29.3, 'C6', 0.5, -0.2, 2.2)
bell(fxm, 30.8, 'Ab5', 0.45, 0.2, 2.5)
pad(side, 28.125, 33, ['Ab2', 'Eb3', 'C4', 'G4'], 1.1, 0.06, 0.6, 1.5)
bass(side, 28.125, 4.5, 'Ab1', 0.6)

// La nappe et la basse s'effacent à chaque grosse caisse
const duck = new Float32Array(N).fill(1)
for (const t of kicks) {
  const i0 = Math.floor(t * SR)
  for (let k = 0; k < SR * 0.4 && i0 + k < N; k++) duck[i0 + k] = Math.min(duck[i0 + k], 1 - 0.65 * Math.exp(-(k / SR) / 0.09))
}
for (let i = 0; i < N; i++) {
  side[0][i] *= duck[i]
  side[1][i] *= duck[i]
}

const music = bus()
mixInto(music, side, 1)
mixInto(music, fxm, 1)
reverb(music, 0.2, 0.8)
mixInto(music, drums, 1)
for (let i = 0; i < N; i++) {
  const t = i / SR
  const g = t > 32.4 ? Math.max(0, 1 - (t - 32.4) / 1.5) : Math.min(1, t / 0.03)
  music[0][i] *= g
  music[1][i] *= g
}
writeWav(path.join(root, 'public/musique-tiktok.wav'), music)

// ═══ Bruitages (courts, discrets) ════════════════════════════
const fx = bus()
const tap = (B, t0, gain = 0.5) => {
  const i0 = Math.floor(t0 * SR)
  for (let k = 0; k < SR * 0.04; k++) {
    const t = k / SR
    add(B, i0 + k, (Math.sin(TAU * 1800 * t) * 0.5 + (rnd() * 2 - 1) * 0.3) * Math.exp(-t * 200) * gain * 0.4)
  }
}
const chime = (B, t0, gain = 0.5, pan = 0) => {
  bell(B, t0, 'Eb6', gain, pan, 0.5)
  bell(B, t0 + 0.09, 'Ab6', gain * 0.8, pan, 0.6)
}
const beep = (B, t0, gain = 0.5) => {
  const i0 = Math.floor(t0 * SR)
  for (let k = 0; k < SR * 0.18; k++) {
    const t = k / SR
    add(B, i0 + k, Math.sin(TAU * 2093 * t) * Math.min(1, t / 0.003) * Math.exp(-t * 18) * gain * 0.12)
  }
}
const paperHit = (B, t0, gain) => {
  const i0 = Math.floor(t0 * SR)
  let lp = 0
  for (let k = 0; k < SR * 0.18; k++) {
    const t = k / SR
    lp += (rnd() * 2 - 1 - lp) * 0.3
    add(B, i0 + k, lp * Math.exp(-t * 25) * gain * 0.5)
  }
}

paperHit(fx, 0.1, 0.8) // la carte papier claque
tap(fx, word('t02', 4), 0.8) // le tampon
noiseSweep(fx, 3.15, 0.55, 500, 3500, 0.3, 'rise') // la carte file vers le haut
noiseSweep(fx, 7.1, 0.5, 2500, 600, 0.22, 'arc', 0.4, -0.4) // le téléphone passe de iOS à Android
tap(fx, 8.55, 0.7) // l'icône « zéro application »
bell(fx, 8.55, 'C7', 0.4, 0, 0.3)
noiseSweep(fx, 8.9, 0.5, 400, 3200, 0.25, 'rise') // la carte jaillit du téléphone
for (const t of [10.78, 11.25, 11.72, 12.19]) tap(fx, t, 0.5) // les couleurs sur les temps
tap(fx, 10.1, 0.6)
noiseSweep(fx, 13.4, 0.6, 600, 4200, 0.2, 'rise') // le scanner balaie la carte
beep(fx, 14.05, 0.9)
;['Ab5', 'Bb5', 'C6', 'Eb6', 'F6', 'G6', 'Ab6', 'C7'].forEach((n, i) => bell(fx, 14.3 + i * 0.09, n, 0.28, -0.3 + i * 0.09, 0.3)) // les points tombent
chime(fx, 16.9, 0.5)
for (let t = 17.85; t < 19.0; t += 0.075) tap(fx, t, 0.16) // la frappe du message
tap(fx, 19.0, 0.6)
noiseSweep(fx, 19.05, 0.5, 500, 5000, 0.3, 'rise') // l'envoi
chime(fx, 19.3, 0.45, -0.2)
chime(fx, 19.7, 0.38, 0.2)
chime(fx, 20.0, 0.32, 0)
for (let i = 0; i < 16; i++) chime(fx, 20.65 + i * 0.07 + rnd() * 0.04, 0.12 + 0.08 * rnd(), rnd() * 1.6 - 0.8) // les téléphones s'allument
bell(fx, 22.15, 'Ab6', 0.4, 0, 0.6) // le client entre dans le cercle
chime(fx, 22.95, 0.5)
for (let t = 24.4; t < 26.2; t += BEAT / 2) tap(fx, t, 0.22) // le compteur monte
noiseSweep(fx, 27.6, 0.55, 300, 4000, 0.25, 'rise')

writeWav(path.join(root, 'public/bruitages-tiktok.wav'), fx, 0.6)
