// Compose la musique et les bruitages du spot, entièrement synthétisés (aucun échantillon externe, aucun droit tiers).
// → public/musique.wav (piano, nappe, basses) et public/bruitages.wav (transitions, scan, notifications).
// Les temps sont en secondes et suivent la timeline de src/Promo.jsx.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SR = 44100
const DUR = 90
const N = SR * DUR
const TAU = Math.PI * 2

// ─── Utilitaires ─────────────────────────────────────────────
const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 }
const midi = s => {
  const [, n, o] = s.match(/^([A-G]#?)(-?\d)$/)
  return 12 * (+o + 1) + NOTE[n]
}
const hz = m => 440 * Math.pow(2, (m - 69) / 12)
const bus = () => [new Float32Array(N), new Float32Array(N)]
const panGains = p => [Math.cos(((p + 1) * Math.PI) / 4), Math.sin(((p + 1) * Math.PI) / 4)]

let seed = 20261028
const rnd = () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

// Table d'onde (dents de scie adoucie) : `h` harmoniques
const tables = new Map()
const table = h => {
  if (tables.has(h)) return tables.get(h)
  const T = new Float32Array(4096)
  let max = 0
  for (let i = 0; i < 4096; i++) {
    let s = 0
    for (let n = 1; n <= h; n++) s += Math.sin((TAU * n * i) / 4096) / Math.pow(n, 1.25)
    T[i] = s
    max = Math.max(max, Math.abs(s))
  }
  for (let i = 0; i < 4096; i++) T[i] /= max
  tables.set(h, T)
  return T
}

// ─── Instruments ─────────────────────────────────────────────
const piano = (B, t0, note, vel, pan = 0, decay) => {
  const f = hz(typeof note === 'string' ? midi(note) : note)
  const m = Math.log2(f / 261.6)
  const d = decay ?? Math.max(0.7, 1.9 - m * 0.45)
  const i0 = Math.floor(t0 * SR)
  const len = Math.min(N - i0, Math.floor(SR * d * 4.5))
  const parts = [[1, 1], [2.002, 0.42], [3.005, 0.2], [4.01, 0.09], [5.02, 0.045], [6.04, 0.02]]
  const [gl, gr] = panGains(pan)
  for (let k = 0; k < len; k++) {
    const t = k / SR
    const env = Math.min(1, t / 0.005) * Math.exp(-t / d)
    let s = 0
    for (const [h, a] of parts) {
      if (f * h > 15000) break
      s += a * Math.exp(-t * (h - 1) * 1.1) * Math.sin(TAU * f * h * t)
    }
    s *= env * vel * 0.22
    B[0][i0 + k] += s * gl
    B[1][i0 + k] += s * gr
  }
}

const bell = (B, t0, note, vel, pan = 0, decay = 3.2) => {
  const f = hz(midi(note))
  const i0 = Math.floor(t0 * SR)
  const len = Math.min(N - i0, Math.floor(SR * decay * 4))
  const parts = [[1, 1, 1], [2.76, 0.45, 1.6], [5.4, 0.22, 2.4], [8.93, 0.1, 3.2]]
  const [gl, gr] = panGains(pan)
  for (let k = 0; k < len; k++) {
    const t = k / SR
    let s = 0
    for (const [h, a, dk] of parts) s += a * Math.exp((-t * dk) / decay) * Math.sin(TAU * f * h * t)
    s *= Math.min(1, t / 0.003) * vel * 0.18
    B[0][i0 + k] += s * gl
    B[1][i0 + k] += s * gr
  }
}

// Nappe : trois voix légèrement désaccordées par note, attaque et relâche lentes
const pad = (B, t0, t1, notes, gain, bright) => {
  const T = table(bright)
  const atk = 1.4
  const rel = 2.2
  const i0 = Math.floor(t0 * SR)
  const i1 = Math.min(N, Math.floor((t1 + rel) * SR))
  for (const n of notes) {
    const f = hz(midi(n))
    for (const [cents, pan] of [[-7, -0.6], [0, 0], [7, 0.6]]) {
      const inc = (f * Math.pow(2, cents / 1200) * 4096) / SR
      const [gl, gr] = panGains(pan)
      let ph = rnd() * 4096
      let lp = 0
      for (let i = i0; i < i1; i++) {
        const t = i / SR
        const env = Math.min(1, (t - t0) / atk) * (t > t1 ? Math.max(0, 1 - (t - t1) / rel) : 1)
        ph += inc
        if (ph >= 4096) ph -= 4096
        const j = ph | 0
        const s = T[j] + (T[(j + 1) & 4095] - T[j]) * (ph - j)
        lp += (s - lp) * 0.18 // filtre doux
        const v = lp * env * gain * 0.05
        B[0][i] += v * gl
        B[1][i] += v * gr
      }
    }
  }
}

const sub = (B, t0, t1, note, gain) => {
  const f = hz(midi(note))
  const i0 = Math.floor(t0 * SR)
  const i1 = Math.min(N, Math.floor((t1 + 0.8) * SR))
  for (let i = i0; i < i1; i++) {
    const t = i / SR
    const env = Math.min(1, (t - t0) / 0.6) * (t > t1 ? Math.max(0, 1 - (t - t1) / 0.8) : 1)
    const v = Math.sin(TAU * f * t) * env * gain * 0.16
    B[0][i] += v
    B[1][i] += v
  }
}

const pulse = (B, t0, gain) => {
  const i0 = Math.floor(t0 * SR)
  let ph = 0
  for (let k = 0; k < SR * 0.45 && i0 + k < N; k++) {
    const t = k / SR
    ph += (TAU * (44 + 70 * Math.exp(-t * 28))) / SR
    const v = Math.sin(ph) * Math.exp(-t * 7) * gain * 0.3
    B[0][i0 + k] += v
    B[1][i0 + k] += v
  }
}

// ─── Bruitages ───────────────────────────────────────────────
// Souffle filtré dont la fréquence glisse de f0 à f1 ; shape : forme de l'enveloppe
const whoosh = (B, t0, dur, f0, f1, gain, shape = 'arc', pan0 = -0.4, pan1 = 0.4) => {
  const i0 = Math.floor(t0 * SR)
  const len = Math.floor(dur * SR)
  let lo = 0
  let bp = 0
  for (let k = 0; k < len && i0 + k < N; k++) {
    const x = k / len
    const fc = f0 * Math.pow(f1 / f0, x)
    const F = 2 * Math.sin((Math.PI * fc) / SR)
    const q = 0.55
    const hi = rnd() * 2 - 1 - lo - q * bp
    bp += F * hi
    lo += F * bp
    const env = shape === 'rise' ? Math.pow(x, 2.2) * Math.min(1, (1 - x) * 25) : shape === 'fall' ? Math.pow(1 - x, 2) * Math.min(1, x * 25) : Math.pow(Math.sin(Math.PI * x), 2)
    const [gl, gr] = panGains(pan0 + (pan1 - pan0) * x)
    const v = bp * env * gain * 0.5
    B[0][i0 + k] += v * gl
    B[1][i0 + k] += v * gr
  }
}

const thump = (B, t0, gain) => pulse(B, t0, gain * 1.3)

const click = (B, t0, gain = 0.5) => {
  const i0 = Math.floor(t0 * SR)
  for (let k = 0; k < SR * 0.03 && i0 + k < N; k++) {
    const t = k / SR
    const v = (Math.sin(TAU * 2400 * t) * 0.6 + (rnd() * 2 - 1) * 0.4) * Math.exp(-t * 260) * gain * 0.4
    B[0][i0 + k] += v
    B[1][i0 + k] += v
  }
}

const ding = (B, t0, gain = 0.5) => {
  const i0 = Math.floor(t0 * SR)
  for (let k = 0; k < SR * 1.2 && i0 + k < N; k++) {
    const t = k / SR
    const v = (Math.sin(TAU * 1318.5 * t) + 0.6 * Math.sin(TAU * 1975.5 * t) * Math.exp(-t * 3)) * Math.exp(-t * 4.5) * Math.min(1, t / 0.002) * gain * 0.12
    B[0][i0 + k] += v * 0.9
    B[1][i0 + k] += v
  }
}

const beep = (B, t0, gain = 0.5) => {
  const i0 = Math.floor(t0 * SR)
  for (let k = 0; k < SR * 0.26 && i0 + k < N; k++) {
    const t = k / SR
    const f = t < 0.09 ? 1760 : 2637
    const env = Math.min(1, (t % 0.09) / 0.003) * (t < 0.09 ? 1 : Math.exp(-(t - 0.09) * 14))
    const v = Math.sin(TAU * f * t) * env * gain * 0.1
    B[0][i0 + k] += v
    B[1][i0 + k] += v
  }
}

const shimmer = (B, t0, t1, count, gain) => {
  for (let n = 0; n < count; n++) {
    const t = t0 + rnd() * (t1 - t0)
    const f = 2200 + rnd() * 4200
    const i0 = Math.floor(t * SR)
    const [gl, gr] = panGains(rnd() * 1.6 - 0.8)
    for (let k = 0; k < SR * 0.4 && i0 + k < N; k++) {
      const tt = k / SR
      const v = Math.sin(TAU * f * tt) * Math.exp(-tt * 12) * Math.min(1, tt / 0.002) * gain * 0.03
      B[0][i0 + k] += v * gl
      B[1][i0 + k] += v * gr
    }
  }
}

const paper = (B, t0, dur, gain) => {
  const i0 = Math.floor(t0 * SR)
  let lp = 0
  for (let k = 0; k < SR * dur && i0 + k < N; k++) {
    const x = k / (SR * dur)
    const crackle = rnd() < 0.02 ? (rnd() * 2 - 1) * 3 : 0
    lp += (rnd() * 2 - 1 + crackle - lp) * 0.25
    const v = lp * Math.sin(Math.PI * x) * gain * 0.25
    B[0][i0 + k] += v
    B[1][i0 + k] += v * 0.8
  }
}

// ─── Réverbération (type Freeverb) ───────────────────────────
const reverb = ([L, R], wet = 0.3, room = 0.86) => {
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
  const aps = [556, 441, 341, 225]
  const run = (x, spread) => {
    const out = new Float32Array(N)
    for (const d0 of combs) {
      const d = d0 + spread
      const buf = new Float32Array(d)
      let idx = 0
      let store = 0
      for (let i = 0; i < N; i++) {
        const y = buf[idx]
        store = y * 0.8 + store * 0.2
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
    L[i] = L[i] * (1 - wet * 0.5) + wl[i] * wet
    R[i] = R[i] * (1 - wet * 0.5) + wr[i] * wet
  }
}

// ─── Écriture WAV 16 bits stéréo ─────────────────────────────
const writeWav = (file, [L, R], peak = 0.89) => {
  let max = 0
  for (let i = 0; i < N; i++) max = Math.max(max, Math.abs(L[i]), Math.abs(R[i]))
  const g = max > 0 ? peak / max : 1
  const data = Buffer.alloc(N * 4)
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * g)) * 32767), i * 4)
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * g)) * 32767), i * 4 + 2)
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
// 72 BPM : une noire = 0,833 s, une mesure = 3,333 s. Tonalité de si mineur / ré majeur.
const BEAT = 60 / 72
const BAR = BEAT * 4
const CH = {
  Bm: { pad: ['B2', 'F#3', 'D4', 'F#4'], arp: ['B3', 'F#4', 'B4', 'D5', 'F#5', 'B4', 'F#4', 'D4'], root: 'B1' },
  G: { pad: ['G2', 'D3', 'B3', 'D4'], arp: ['G3', 'D4', 'G4', 'B4', 'D5', 'G4', 'D4', 'B3'], root: 'G1' },
  D: { pad: ['D3', 'A3', 'F#4', 'A4'], arp: ['D4', 'A4', 'D5', 'F#5', 'A5', 'D5', 'A4', 'F#4'], root: 'D2' },
  A: { pad: ['A2', 'E3', 'C#4', 'E4'], arp: ['A3', 'E4', 'A4', 'C#5', 'E5', 'A4', 'E4', 'C#4'], root: 'A1' },
  Em: { pad: ['E3', 'B3', 'G4', 'B4'], arp: ['E4', 'B4', 'E5', 'G5', 'B5', 'E5', 'B4', 'G4'], root: 'E2' },
}

const music = bus()
const dry = bus() // basses et pulsations, hors réverbération

// Sections : [début, fin, enchaînement d'accords, gain de nappe, brillance, arpège, basse]
const SECTIONS = [
  [0.3, 5.5, ['Bm'], 0.5, 3, 0, 0],
  [5.5, 15.0, ['Bm', 'G'], 0.65, 3, 0, 0.4],
  [15.0, 24.0, ['D', 'A', 'Bm', 'G'], 0.8, 5, 0.22, 0.6],
  [24.0, 40.0, ['D', 'A', 'Bm', 'G'], 0.85, 6, 0.3, 0.8],
  [40.0, 53.2, ['G', 'D', 'A', 'Bm'], 0.9, 7, 0.32, 0.9],
  [53.2, 70.0, ['D', 'A', 'Bm', 'G'], 0.95, 8, 0.34, 1],
  [70.0, 80.6, ['G', 'D', 'Em', 'A'], 0.7, 4, 0.18, 0.6],
]

for (const [t0, t1, prog, padGain, bright, arpVel, subGain] of SECTIONS) {
  let k = 0
  for (let t = t0; t < t1 - 0.05; t += BAR, k++) {
    const end = Math.min(t + BAR, t1)
    const c = CH[prog[k % prog.length]]
    pad(music, t, end, c.pad, padGain, bright)
    if (subGain) sub(dry, t, end, c.root, subGain)
    if (arpVel) {
      for (let e = 0; e < 8; e++) {
        const te = t + (e * BEAT) / 2
        if (te >= end || te < 16.6) continue
        piano(music, te, c.arp[e], arpVel * (e % 2 ? 0.75 : 1) * (0.9 + rnd() * 0.2), e % 2 ? 0.35 : -0.35)
      }
    } else if (t >= 5.5) {
      piano(music, t + 0.05, c.arp[0].replace(/\d/, d => String(+d - 1)), 0.35, -0.2, 2.4)
    }
    if (t >= 40 && t < 70) for (let b = 0; b < 4; b += 2) pulse(dry, t + b * BEAT, 0.55)
  }
}

// Notes lumineuses : « Un scan. » / « Un point. »
bell(music, 1.85, 'F#5', 0.5, -0.2)
bell(music, 3.85, 'A5', 0.8, 0.2, 4)
piano(music, 3.85, 'D4', 0.35, 0)
// Quatre skins sur quatre temps (scène 4)
;[[27.0, 'D6'], [27.93, 'F#6'], [28.87, 'A6'], [29.8, 'D7']].forEach(([t, n], i) => bell(music, t, n, 0.32 + i * 0.04, -0.3 + i * 0.2, 1.6))
// Ré majeur égrené après la seconde de silence, puis la note finale sur le logo
;['D3', 'A3', 'F#4', 'A4', 'E5'].forEach((n, i) => piano(music, 82.0 + i * 0.07, n, 0.42, -0.4 + i * 0.2, 3))
pad(music, 82.0, 88.5, ['D3', 'A3', 'E4', 'F#4'], 0.6, 4)
sub(dry, 82.0, 88.5, 'D2', 0.6)
bell(music, 88.3, 'D6', 0.75, 0, 4)
piano(music, 88.3, 'D2', 0.4, 0, 3)

reverb(music, 0.38, 0.88)
for (let i = 0; i < N; i++) {
  music[0][i] += dry[0][i]
  music[1][i] += dry[1][i]
}

// Seconde de silence total (81 – 82 s) et fin en douceur
const gate = t => {
  if (t > 80.6 && t < 81.0) return 1 - (t - 80.6) / 0.4
  if (t >= 81.0 && t < 82.0) return 0
  if (t > 89.2) return Math.max(0, 1 - (t - 89.2) / 0.8)
  return Math.min(1, t / 0.3)
}
for (let i = 0; i < N; i++) {
  const g = gate(i / SR)
  music[0][i] *= g
  music[1][i] *= g
}
writeWav(path.join(root, 'public/musique.wav'), music)

// ═══ Bruitages ═══════════════════════════════════════════════
const fx = bus()
whoosh(fx, 4.75, 0.8, 400, 3200, 0.9, 'rise', -0.6, 0.6) // la carte tourne sur la tranche
paper(fx, 5.6, 0.55, 0.5) // la carte papier
shimmer(fx, 13.3, 15.1, 70, 1) // particules
whoosh(fx, 23.0, 1.1, 1800, 500, 0.5, 'arc', 0.3, -0.2) // la carte quitte le téléphone
whoosh(fx, 38.9, 1.1, 200, 2600, 1, 'rise', 0, 0) // plongée dans la carte
thump(fx, 40.0, 0.7)
whoosh(fx, 40.0, 1.0, 2400, 300, 0.45, 'fall', 0, 0) // la caméra recule
click(fx, 43.1, 0.6) // « Créer ma carte »
click(fx, 45.4, 0.6) // « Ajouter à Apple Wallet »
whoosh(fx, 45.7, 0.7, 600, 1800, 0.3, 'arc', 0, 0) // la feuille monte
click(fx, 47.4, 0.5) // « Ajouter »
ding(fx, 49.4, 0.6)
ding(fx, 50.2, 0.5)
whoosh(fx, 51.4, 1.85, 250, 4200, 1, 'rise', 0, 0) // plongée dans le QR code
whoosh(fx, 53.25, 1.4, 4200, 400, 0.6, 'fall', 0, 0) // sortie dans le scanner
beep(fx, 55.73, 0.9) // le scanner valide
click(fx, 55.95, 0.35)
whoosh(fx, 58.4, 0.6, 900, 1600, 0.25, 'arc', 0.5, -0.5) // vue Clients
whoosh(fx, 61.4, 0.6, 900, 1600, 0.25, 'arc', 0.5, -0.5) // vue Statistiques
whoosh(fx, 64.5, 1.2, 300, 3800, 0.8, 'rise', 0.4, 0) // plongée dans le point
whoosh(fx, 65.73, 1.1, 3000, 350, 0.45, 'fall', 0, 0)
ding(fx, 67.5, 0.6) // notification de proximité
whoosh(fx, 68.7, 1.3, 1200, 150, 0.35, 'fall', 0, 0) // la lumière s'éteint
shimmer(fx, 70.0, 71.6, 30, 0.7) // le halo s'ouvre
whoosh(fx, 80.1, 0.75, 700, 2200, 0.4, 'arc', -0.4, 0.4) // la carte se retourne
for (let i = 0; i < N; i++) {
  const t = i / SR
  if (t >= 80.9 && t < 82) {
    fx[0][i] = 0
    fx[1][i] = 0
  }
}
reverb(fx, 0.18, 0.7)
writeWav(path.join(root, 'public/bruitages.wav'), fx, 0.8)
