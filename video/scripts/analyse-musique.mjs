// Analyse d'un morceau : tempo, position des temps, énergie mesure par mesure et repérage des « drops ».
// Sert à caler le montage (src/tiktok/rythme.js) sur une musique importée.
// Usage : node scripts/analyse-musique.mjs public/sons_tiktok/morceau.mp3
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'

const file = process.argv[2]
if (!file || !fs.existsSync(file)) {
  console.error('fichier introuvable :', file)
  process.exit(1)
}

const ffmpeg = (() => {
  try {
    const require = createRequire(import.meta.url)
    const dir = path.dirname(require.resolve(`@remotion/compositor-${process.platform}-${process.arch}${process.platform === 'win32' ? '-msvc' : ''}/package.json`))
    const exe = path.join(dir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
    if (fs.existsSync(exe)) return exe
  } catch {}
  return 'ffmpeg'
})()

const SR = 22050
const r = spawnSync(ffmpeg, ['-v', 'error', '-i', file, '-f', 'wav', '-c:a', 'pcm_s16le', '-ac', '1', '-ar', String(SR), '-'], { maxBuffer: 1 << 30 })
if (r.status !== 0) throw new Error(r.stderr.toString())
const raw = r.stdout.subarray(r.stdout.indexOf('data') + 8)
const x = new Float32Array(Math.floor(raw.length / 2))
for (let i = 0; i < x.length; i++) x[i] = raw.readInt16LE(i * 2) / 32768
const dur = x.length / SR

// Enveloppe d'attaque : variation positive de l'énergie (graves et aigus séparés), 86 trames par seconde
const HOP = 256
const FR = SR / HOP
const n = Math.floor(x.length / HOP)
const low = new Float32Array(n)
const all = new Float32Array(n)
let lp = 0
for (let k = 0; k < n; k++) {
  let el = 0, ea = 0
  for (let i = k * HOP; i < (k + 1) * HOP; i++) {
    lp += (x[i] - lp) * 0.03 // passe-bas ≈ 110 Hz
    el += lp * lp
    ea += x[i] * x[i]
  }
  low[k] = Math.log(1e-6 + el)
  all[k] = Math.log(1e-6 + ea)
}
const onset = new Float32Array(n)
for (let k = 1; k < n; k++) onset[k] = Math.max(0, low[k] - low[k - 1]) * 1.5 + Math.max(0, all[k] - all[k - 1])

// Tempo : autocorrélation de l'enveloppe entre 70 et 180 BPM, légère préférence autour de 120
let best = { bpm: 0, s: -1 }
for (let bpm = 70; bpm <= 180; bpm += 0.25) {
  const lag = (60 / bpm) * FR
  let s = 0
  for (let k = 0; k + 4 * lag < n; k++) {
    const a = onset[k]
    if (!a) continue
    const f = j => {
      const p = k + j * lag
      const i = Math.floor(p)
      return onset[i] + (onset[i + 1] - onset[i]) * (p - i)
    }
    s += a * (f(1) + 0.5 * f(2) + 0.5 * f(4))
  }
  s *= Math.exp(-Math.pow(Math.log2(bpm / 120), 2) * 0.6)
  if (s > best.s) best = { bpm, s }
}
const beat = 60 / best.bpm

// Phase des temps puis du premier temps de mesure (le temps où les graves frappent le plus)
const sumAt = (t0, step) => {
  let s = 0
  for (let t = t0; t < dur; t += step) {
    const k = Math.round(t * FR)
    for (let d = -2; d <= 2; d++) s += onset[k + d] ?? 0
  }
  return s
}
let phase = 0, ps = -1
for (let p = 0; p < beat; p += 1 / FR) {
  const s = sumAt(p, beat)
  if (s > ps) { ps = s; phase = p }
}
let bar0 = phase, bs = -1
for (let j = 0; j < 4; j++) {
  let s = 0
  for (let t = phase + j * beat; t < dur; t += 4 * beat) {
    const k = Math.round(t * FR)
    for (let d = -2; d <= 2; d++) s += Math.max(0, (low[k + d] ?? -20) - (low[k + d - 3] ?? -20))
  }
  if (s > bs) { bs = s; bar0 = phase + j * beat }
}

// Énergie par mesure et repérage des montées brusques (drops)
const bar = 4 * beat
const bars = []
for (let t = bar0; t + bar <= dur + 0.01; t += bar) {
  let e = 0, c = 0
  for (let i = Math.floor(t * SR); i < Math.min(x.length, Math.floor((t + bar) * SR)); i++) { e += x[i] * x[i]; c++ }
  bars.push({ t, db: 10 * Math.log10(e / Math.max(1, c) + 1e-12) })
}
console.log(`durée ${dur.toFixed(2)} s · tempo ${best.bpm} BPM (temps ${beat.toFixed(4)} s, mesure ${bar.toFixed(3)} s)`)
console.log(`premier temps de mesure ≈ ${bar0.toFixed(3)} s`)
console.log('mesures (début → énergie dB) :')
bars.forEach((b, i) => {
  const prev = bars.slice(Math.max(0, i - 2), i)
  const jump = prev.length ? b.db - Math.max(...prev.map(p => p.db)) : 0
  console.log(`  ${String(i).padStart(3)}  ${b.t.toFixed(2).padStart(7)} s  ${b.db.toFixed(1).padStart(6)} dB${jump > 3.5 ? `   ← montée de ${jump.toFixed(1)} dB (drop ?)` : ''}`)
})
