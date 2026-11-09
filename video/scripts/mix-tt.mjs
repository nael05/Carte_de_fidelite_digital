// Bande-son des trois TikToks 3D → public/tt/mix-<set>.wav
// Usage : node scripts/mix-tt.mjs bandeannonce|keynote|concurrent
//
// Musiques et bruitages Pixabay dans public/sons_tt/ (liste et liens dans SOURCES.md), voix ElevenLabs
// dans public/voix/<id>.wav (scripts/voice-elevenlabs.mjs --set=<set>).
// Chaque musique est recoupée pour que ses coups tombent sur les instants clés de l'image (src/tt/<set>/temps.js),
// baisse sous la voix, puis l'ensemble est amené à −14 LUFS sans dépasser −1 dBFS.
import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const SET = process.argv[2]
const SONS = path.join(root, 'public/sons_tt')
const VOIX = JSON.parse(fs.readFileSync(path.join(root, `src/voix-${SET}.json`), 'utf8'))
const word = (id, n = 0) => {
  const c = VOIX.find(v => v.id === id)
  return c.at + Math.max(0, c.words[n].t)
}
const SR = 44100

const ffmpeg = (() => {
  const require = createRequire(import.meta.url)
  const base = `@remotion/compositor-${process.platform}-${process.arch}`
  for (const name of [base + (process.platform === 'win32' ? '-msvc' : ''), base + '-gnu', base + '-musl']) {
    try {
      const dir = path.dirname(require.resolve(`${name}/package.json`))
      return path.join(dir, process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg')
    } catch {}
  }
  return 'ffmpeg' // celui du système
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
const db = g => Math.pow(10, g / 20)

/* Réglages par vidéo
   music : fichier ; segments [début vidéo, fin vidéo, début dans le morceau] ; xf : fondu entre segments (s)
   open / duck : niveau de la musique seule et sous la voix (dB) ; fadeIn / fadeOut (s)
   sfx : [nom, instant, gain dB, vitesse, { crest: aligner la crête sur l'instant, len: durée max, fade }] */
const BAR_CC = 1.7423 // phonk, 137,75 BPM
const CONFIG = {
  // ─── Série « Studio » (PLAN-TIKTOK.md) : musique très en retrait, peu de bruitages, tous discrets ───
  // ─── Série « Lumière » (v2) ───
  ...(SET === 'mpov' && {
    mpov: {
      dur: Math.ceil((word('kv05') + 4.6) * 30) / 30,
      music: 'musique-keynote.mp3',
      segments: [[0, 40, 13.7 - (word('kv03') - 0.35)]],
      xf: 0.02, open: -12, duck: -25, fadeIn: 0.5, fadeOut: 1.8,
      sfx: [
        ['scintille', 0.2, -25, 1, { len: 2.4, fade: 1 }],
        ['whoosh', word('kv02') - 0.35, -21, 1, { crest: true }],
        ['bip-caisse', word('kv02', 4), -19, 1.1],
        ['clic', word('kv03'), -24, 1.3],
        ['clic', word('kv03', 1), -24, 1.4],
        ['swoosh2', word('kv03', 6) - 0.2, -20, 1, { crest: true }],
        ['whoosh_rapide', word('kv04') - 0.35, -19, 1, { crest: true }],
        ['pop', word('kv04', 6), -19, 1],
        ['neon', word('kv05') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('kv05') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'mappli' && {
    mappli: {
      dur: Math.ceil((word('ko05') + 4.6) * 30) / 30,
      music: 'musique-noir.mp3',
      segments: [[0, 40, 16.2 - (word('ko02') - 0.4)]],
      xf: 0.02, open: -9, duck: -21, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ['laser_long', 0.1, -25, 1, { len: 1.6, fade: 0.6 }],
        ['feu', word('ko01', 5) - 0.1, -24, 1.2, { len: 1.8, fade: 0.8 }],
        ['scintille', word('ko01', 6), -22, 1, { len: 1.4, fade: 0.6 }],
        ['whoosh_rapide', word('ko02') - 0.4, -18, 1, { crest: true }],
        ['neon', word('ko02') + 0.1, -22, 1, { len: 1, fade: 0.4 }],
        ['whoosh7', word('ko03') - 0.35, -19, 1, { crest: true }],
        ['laser_long', word('ko04') - 0.35, -24, 1.1, { len: 1.2, fade: 0.5 }],
        ['swoosh2', word('ko04', 6) - 0.2, -20, 1, { crest: true }],
        ['clic', word('ko04', 12) + 0.15, -18, 0.9],
        ['neon', word('ko05') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('ko05') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'mrecomp' && {
    mrecomp: {
      dur: Math.ceil((word('kr05') + 4.6) * 30) / 30,
      music: 'musique-keynote.mp3',
      segments: [[0, 40, 13.7 - (word('kr03') - 0.35)]],
      xf: 0.02, open: -12, duck: -25, fadeIn: 0.4, fadeOut: 1.8,
      sfx: [
        ['laser_long', 0.1, -25, 1, { len: 1.8, fade: 0.6 }],
        ['whoosh7', word('kr01', 5) - 0.3, -21, 1, { crest: true }],
        ['visqueux', word('kr02') - 0.4, -25, 1, { len: 1, fade: 0.4 }],
        ['whoosh', word('kr03') - 0.35, -20, 1, { crest: true }],
        ['hit', word('kr03', 0), -21, 1],
        ['hit', word('kr03', 4), -21, 1.06],
        ['hit', word('kr03', 8), -20, 1.12],
        ['scintille', word('kr03', 11), -21, 1, { len: 1.6, fade: 0.7 }],
        ['laser_long', word('kr04') - 0.3, -24, 1.2, { len: 1.2, fade: 0.5 }],
        ['neon', word('kr05') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('kr05') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'mraisons' && {
    mraisons: {
      dur: Math.ceil((word('tx05') + 4.6) * 30) / 30,
      music: 'musique-chrono.mp3',
      segments: [[0, 40, 16.2 - (word('tx02') - 0.35)]],
      xf: 0.02, open: -10, duck: -22, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ['laser_long', 0.1, -24, 1, { len: 2, fade: 0.6 }],
        ['hit_grave', 0.2, -22, 1],
        ['whoosh_rapide', word('tx02') - 0.35, -18, 1, { crest: true }],
        ['hit', word('tx02'), -22, 1],
        ['whoosh7', word('tx03') - 0.35, -18, 1, { crest: true }],
        ['hit', word('tx03'), -22, 1.05],
        ['notif_douce', word('tx03', 3) + 0.05, -14, 1],
        ['whoosh', word('tx04') - 0.35, -18, 1.1, { crest: true }],
        ['hit', word('tx04'), -22, 1.1],
        ['sub', word('tx04', 2), -20, 1],
        ['neon', word('tx05') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('tx05') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'mrelance' && {
    mrelance: {
      dur: Math.ceil((word('tl06') + 4.6) * 30) / 30,
      music: 'musique-noir.mp3',
      segments: [[0, 40, 16.2 - (word('tl03') - 0.35)]],
      xf: 0.02, open: -9, duck: -21, fadeIn: 0.5, fadeOut: 1.6,
      sfx: [
        ['visqueux', word('tl02') - 0.4, -25, 1, { len: 1, fade: 0.4 }],
        ['scintille', word('tl02', 6), -22, 1, { len: 1.6, fade: 0.6 }],
        ...[0, 1, 2, 3].map(i => ['pop', word('tl02', 6) + 0.2 + i * 0.22, -25, 1.1 + i * 0.05]),
        ['whoosh7', word('tl03') - 0.35, -19, 1, { crest: true }],
        ...[0, 0.1, 0.19, 0.3].map((d, i) => ['clic', word('tl03', 2) + d, -27, 1.4]),
        ['whoosh_rapide', word('tl04') - 0.3, -18, 1, { crest: true }],
        ['notif_douce', word('tl04') + 0.1, -12, 1],
        ['laser_long', word('tl05') - 0.3, -23, 1.1, { len: 1.2, fade: 0.5 }],
        ['scintille', word('tl05', 2), -20, 1, { len: 1.4, fade: 0.6 }],
        ['neon', word('tl06') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('tl06') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'mcamille' && {
    mcamille: {
      dur: Math.ceil((word('tm06') + 4.6) * 30) / 30,
      music: 'musique-keynote.mp3',
      segments: [[0, 40, 13.7 - (word('tm03') - 0.35)]],
      xf: 0.02, open: -12, duck: -25, fadeIn: 0.4, fadeOut: 1.8,
      sfx: [
        ['laser_long', 0.1, -26, 1, { len: 1.6, fade: 0.6 }],
        ['neon', 0.4, -23, 1, { len: 1, fade: 0.4 }],
        ['whoosh_rapide', word('tm02') - 0.4, -19, 1, { crest: true }],
        ['swoosh2', word('tm02', 6) - 0.2, -21, 1, { crest: true }],
        ['whoosh7', word('tm03') - 0.35, -20, 1, { crest: true }],
        ['pop', word('tm03'), -21, 1],
        ['pop', word('tm03', 2), -21, 1.1],
        ['pop', word('tm03', 5), -20, 1.2],
        ['laser_long', word('tm04') - 0.35, -24, 1.1, { len: 1.2, fade: 0.5 }],
        ['notif_douce', word('tm04', 3) + 0.05, -12, 1],
        ['scintille', word('tm04', 5), -20, 1, { len: 1.6, fade: 0.7 }],
        ['swoosh', word('tm05', 2), -22, 1.1, { crest: true }],
        ['swoosh', word('tm05', 4), -22, 1.2, { crest: true }],
        ['neon', word('tm06') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('tm06') + 0.1, -16, 1],
      ],
    },
  }),
  // vague 2 : vidéos par métier (même montage)
  ...(['mpain', 'mcoupe', 'mresto', 'mcafe', 'mpizza'].includes(SET) && (() => {
    const p = { mpain: 'tb', mcoupe: 'tc', mresto: 'tr', mcafe: 'ka', mpizza: 'kp' }[SET]
    const w = (n, k = 0) => word(`${p}0${n}`, k)
    const nw = { mpain: 6, mcoupe: 5, mresto: 4, mcafe: 4, mpizza: 5 }[SET]
    return {
      [SET]: {
        dur: Math.ceil((w(5) + 4.6) * 30) / 30,
        music: SET === 'mcoupe' ? 'musique-keynote.mp3' : SET === 'mpizza' ? 'musique-chrono.mp3' : 'musique-noir.mp3',
        segments: [[0, 40, (SET === 'mcoupe' ? 13.7 : 16.2) - (w(2) - 0.45)]],
        xf: 0.02, open: SET === 'mcoupe' ? -12 : -9, duck: SET === 'mcoupe' ? -25 : -21, fadeIn: 0.3, fadeOut: 1.6,
        sfx: [
          ['laser_long', 0.15, -25, 1, { len: 1.8, fade: 0.6 }],
          ['neon', 0.1, -23, 1, { len: 1, fade: 0.4 }],
          ['laser', w(2) - 0.45, -21, 1, { len: 0.9, fade: 0.3 }],
          ['swoosh2', w(2, 7) - 0.3, -21, 1, { crest: true }],
          ['whoosh_rapide', w(3) - 0.35, -18, 1, { crest: true }],
          ['laser', w(3, 3) - 0.15, -21, 1.1, { len: 0.8, fade: 0.3 }],
          ['bip-caisse', w(3, 3) + 0.4, -18, 1],
          ['pop', w(3, 5), -18, 1],
          ['whoosh', w(4) - 0.35, -20, 1.1, { crest: true }],
          ['notif_douce', w(4, nw) + 0.05, -12, 1],
          ['neon', w(5) - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
          ['hit_logo', w(5) + 0.1, -16, 1],
        ],
      },
    }
  })()),
  ...(SET === 'lprix' && {
    lprix: {
      dur: Math.ceil((word('lx06') + 4.6) * 30) / 30,
      music: 'musique-chrono.mp3',
      // entrée franche du morceau (16,2 s) sur « zéro euro »
      segments: [[0, 40, 16.2 - word('lx03', 2)]],
      xf: 0.02, open: -10, duck: -22, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ['laser_long', 0.1, -25, 1, { len: 1.8, fade: 0.6 }],
        ['whoosh_rapide', word('lx02') - 0.35, -18, 1, { crest: true }],
        ['whoosh7', word('lx03') - 0.4, -18, 0.9, { crest: true }],
        ...[0, 0.1, 0.2, 0.32, 0.45].map((d, i) => ['chrono_tic', word('lx03', 2) - 0.75 + d, -24, 1.2, { len: 0.2 }]),
        ['bass_drop', word('lx03', 2), -18, 1],
        ['scintille', word('lx04') - 0.35, -22, 1, { len: 1.4, fade: 0.6 }],
        ['pop', word('lx04', 2), -21, 1.1],
        ['pop', word('lx04', 3) + 0.2, -21, 1.15],
        ['pop', word('lx04', 4), -21, 1.2],
        ['pop', word('lx05', 2), -21, 1.25],
        ['neon', word('lx06') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('lx06') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'ldesign' && {
    ldesign: {
      dur: Math.ceil((word('ld05') + 3.6) * 30) / 30,
      music: 'musique-keynote.mp3',
      // la montée du morceau tombe sur « Graphite »
      segments: [[0, 40, 13.7 - (word('ld03') - 0.3)]],
      xf: 0.02, open: -12, duck: -25, fadeIn: 0.4, fadeOut: 1.8,
      sfx: [
        ['neon', 0.05, -22, 1, { len: 1.2, fade: 0.5 }],
        ['laser_long', word('ld01') - 0.2, -24, 1, { len: 1.8, fade: 0.6 }],
        ['whoosh_rapide', word('ld03') - 0.3, -19, 1, { crest: true }],
        ['whoosh_rapide', word('ld03', 1) - 0.28, -19, 1.05, { crest: true }],
        ['whoosh_rapide', word('ld03', 2) - 0.28, -19, 1.1, { crest: true }],
        ['whoosh_rapide', word('ld03', 3) - 0.28, -19, 1.15, { crest: true }],
        ['whoosh', word('ld04') - 0.35, -20, 1, { crest: true }],
        ['swoosh2', word('ld04', 5) - 0.3, -21, 1, { crest: true }],
        ['neon', word('ld05') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('ld05') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'lgeo' && {
    lgeo: {
      dur: Math.ceil((word('lg04') + 6.4) * 30) / 30,
      music: 'musique-noir.mp3',
      segments: [[0, 40, 16.2 - (word('lg02') - 0.35)]],
      xf: 0.02, open: -9, duck: -21, fadeIn: 0.4, fadeOut: 1.6,
      sfx: [
        ['scintille', word('lg01', 4), -20, 1.2, { len: 1.6, fade: 0.8 }],
        ['sub', word('lg01', 4), -22, 1],
        ['whoosh', word('lg02') - 0.35, -19, 1, { crest: true }],
        ['notif_douce', word('lg02', 6) + 0.05, -11, 1],
        ['whoosh_rapide', word('lg03') - 0.3, -18, 1, { crest: true }],
        ['laser_long', word('lg03') - 0.2, -25, 1, { len: 1.4, fade: 0.6 }],
        ['neon', word('lg04') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('lg04') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'letapes' && {
    letapes: {
      dur: Math.ceil((word('ls06') + 4.8) * 30) / 30,
      music: 'musique-chrono.mp3',
      segments: [[0, 40, 16.2 - (word('ls02') - 0.4)]],
      xf: 0.02, open: -10, duck: -22, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ...[0, 1, 2].map(i => ['laser', 0.5 + i * 0.6, -26, 1 + i * 0.1, { len: 0.8, fade: 0.3 }]),
        ['neon', 2.6, -22, 1, { len: 1.2, fade: 0.5 }],
        ['whoosh7', word('ls02') - 0.4, -18, 0.9, { crest: true }],
        ['swoosh', word('ls02', 3), -23, 1.2, { crest: true }],
        ['swoosh', word('ls02', 4), -23, 1.3, { crest: true }],
        ['swoosh', word('ls02', 4) + 0.4, -23, 1.4, { crest: true }],
        ['whoosh_rapide', word('ls03') - 0.4, -18, 1, { crest: true }],
        ['neon', word('ls03', 1), -23, 1.2, { len: 1, fade: 0.4 }],
        ['swoosh2', word('ls03', 8), -21, 1, { crest: true }],
        ['whoosh', word('ls04') - 0.4, -20, 1.1, { crest: true }],
        ['laser', word('ls04', 5) - 0.2, -21, 1, { len: 0.8, fade: 0.3 }],
        ['bip-caisse', word('ls04', 5) + 0.3, -18, 1],
        ['pop', word('ls04', 8), -18, 1],
        ['laser_long', word('ls05') - 0.35, -24, 1.2, { len: 1, fade: 0.4 }],
        ['sub', word('ls05', 2), -20, 1],
        ['sub', word('ls05', 4), -20, 1.1],
        ['neon', word('ls06') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('ls06') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'lversus' && {
    lversus: {
      dur: Math.ceil((word('lv05') + 4.6) * 30) / 30,
      music: 'musique-noir.mp3',
      segments: [[0, 40, 16.2 - (word('lv02', 4) - 0.3)]],
      xf: 0.02, open: -10, duck: -21, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ['laser_long', 0.4, -26, 1, { len: 2, fade: 0.8 }],
        ['visqueux', word('lv02') - 0.4, -24, 1, { len: 1, fade: 0.4 }],
        ['whoosh', word('lv02', 2), -22, 0.8, { crest: true }],
        ['whoosh_rapide', word('lv02', 4) - 0.3, -18, 1, { crest: true }],
        ['whoosh_rapide', word('lv03') - 0.35, -18, 0.95, { crest: true }],
        ['scratch', word('lv03', 2) - 0.2, -26, 1, { len: 1, fade: 0.4 }],
        ['whoosh_rapide', word('lv03', 3) - 0.3, -18, 1.05, { crest: true }],
        ['scintille', word('lv03', 7), -21, 1, { len: 1.5, fade: 0.6 }],
        ['whoosh_rapide', word('lv04') - 0.35, -18, 0.9, { crest: true }],
        ['scintille', word('lv04', 5) - 0.3, -22, 1.1, { len: 1.4, fade: 0.6 }],
        ['notif_douce', word('lv04', 6) + 0.1, -12, 1],
        ['neon', word('lv05') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('lv05') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'lfilm' && {
    lfilm: {
      dur: Math.ceil((word('lf08') + 4.6) * 30) / 30,
      music: 'musique-chrono.mp3',
      // entrée franche du morceau (16,2 s) dans le tunnel de lumière (« Aucune application »)
      segments: [[0, 40, 16.2 - (word('lf04') - 0.35)]],
      xf: 0.02, open: -10, duck: -22, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ['laser_long', word('lf01', 1) - 0.3, -24, 1, { len: 1.8, fade: 0.6 }],
        ['neon', word('lf01', 1) + 0.2, -21, 1, { len: 1.4, fade: 0.6 }],
        ['whoosh_rapide', word('lf03') - 0.4, -18, 1, { crest: true }],
        ['visqueux', word('lf04') - 0.35, -24, 1, { len: 1, fade: 0.4 }],
        ['whoosh7', word('lf04') - 0.1, -18, 0.9, { crest: true }],
        ['bass_drop', word('lf04'), -20, 1],
        ['whoosh', word('lf05') - 0.35, -20, 1.1, { crest: true }],
        ['swoosh', word('lf05', 2), -23, 1.2, { crest: true }],
        ['swoosh', word('lf05', 3), -23, 1.3, { crest: true }],
        ['swoosh', word('lf05', 3) + 0.45, -23, 1.4, { crest: true }],
        ['swoosh2', word('lf06') - 0.3, -21, 1, { crest: true }],
        ['laser', word('lf06', 1), -20, 1, { len: 0.9, fade: 0.3 }],
        ['bip-caisse', word('lf06', 3), -18, 1],
        ['pop', word('lf06', 6), -18, 1],
        ['scintille', word('lf07') - 0.4, -22, 1, { len: 1.6, fade: 0.6 }],
        ['notif_douce', word('lf07', 1) + 0.1, -12, 1],
        ['neon', word('lf08') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('lf08') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'lecran' && {
    lecran: {
      dur: Math.ceil((word('le07') + 4.6) * 30) / 30,
      music: 'musique-keynote.mp3',
      segments: [[0, 40, 13.7 - word('le05', 2)]],
      xf: 0.02, open: -12, duck: -24, fadeIn: 0.3, fadeOut: 1.6,
      sfx: [
        ['laser_long', 0.2, -26, 1, { len: 2.2, fade: 0.8 }],
        ['neon', 1.7, -22, 1, { len: 1.2, fade: 0.5 }],
        ['verre', word('le02', 1) - 0.35, -18, 1, { len: 1.6, fade: 0.8 }],
        ['scintille', word('le03') - 0.45, -20, 1, { len: 1.6, fade: 0.8 }],
        ['swoosh2', word('le03', 6), -20, 1, { crest: true }],
        ['whoosh_rapide', word('le04') - 0.3, -18, 1, { crest: true }],
        ['whoosh', word('le05') - 0.35, -19, 1.1, { crest: true }],
        ['notif_douce', word('le05', 2), -12, 1],
        ...[0.25, 0.5, 0.8, 1.1].map((d, i) => ['notif_douce', word('le05', 5) + d, -22 - i * 2, 1.05 + i * 0.05]),
        ['laser', word('le06', 2) + 0.2, -22, 1.1, { len: 0.6, fade: 0.3 }],
        ['laser', word('le06', 4) + 0.2, -22, 1.2, { len: 0.6, fade: 0.3 }],
        ['neon', word('le07') - 0.2, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('le07') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'lperdue' && {
    lperdue: {
      dur: Math.ceil((word('lp07') + 4.6) * 30) / 30,
      music: 'musique-noir.mp3',
      segments: [[0, 40, 16.2 - (word('lp04') - 0.5)]],
      xf: 0.02, open: -9, duck: -20, fadeIn: 0.4, fadeOut: 1.6,
      sfx: [
        ['feu', word('lp03', 3), -20, 1, { len: 3.2, fade: 1.4 }],
        ['laser_long', word('lp04') - 0.5, -24, 1, { len: 1.2, fade: 0.5 }],
        ['neon', word('lp04') + 0.4, -20, 1, { len: 1.6, fade: 0.6 }],
        ['whoosh_rapide', word('lp05', 4) - 0.25, -18, 1, { crest: true }],
        ['whoosh', word('lp06') - 0.35, -20, 1.1, { crest: true }],
        ['scintille', word('lp06', 4), -20, 1, { len: 1.8, fade: 0.8 }],
        ['neon', word('lp07') - 0.25, -19, 1.1, { len: 1.4, fade: 0.6 }],
        ['hit_logo', word('lp07') + 0.1, -16, 1],
      ],
    },
  }),
  ...(SET === 'design' && {
    design: {
      dur: Math.ceil((word('de04') + 3.4) * 30) / 30,
      music: 'musique-keynote.mp3',
      // la montée du morceau (13,7 s) tombe sur « Graphite »
      segments: [[0, 40, 13.7 - (word('de02') - 0.1)]],
      xf: 0.02,
      open: -13,
      duck: -26,
      fadeIn: 0.4,
      fadeOut: 1.8,
      sfx: [
        ['scintille', 0.2, -24, 1, { len: 2, fade: 1 }],
        ['swoosh', word('de02', 1) - 0.1, -24, 1.1, { crest: true }],
        ['swoosh', word('de02', 2) - 0.1, -24, 1.2, { crest: true }],
        ['swoosh', word('de02', 3) - 0.1, -24, 1.3, { crest: true }],
        ['swoosh2', word('de03') - 0.2, -23, 1, { crest: true }],
        ['clic', word('de03', 1), -24, 1],
        ['clic', word('de03', 3), -24, 1.1],
        ['clic', word('de03', 5), -24, 1.2],
        ['hit_logo', word('de04') - 0.15, -16, 1],
      ],
    },
  }),
  ...(SET === 'offre' && {
    offre: {
      dur: Math.ceil((word('of05', 3) + 3.4) * 30) / 30,
      music: 'musique-chrono.mp3',
      // entrée franche du morceau (16,2 s) sur « Zéro euro »
      segments: [[0, 40, 16.2 - word('of02')]],
      xf: 0.02,
      open: -9,
      duck: -21,
      fadeIn: 0.3,
      fadeOut: 1.5,
      sfx: [
        ...[0, 0.08, 0.16, 0.24, 0.33, 0.42].map((d, i) => ['chrono_tic', word('of02') - 0.55 + d, -26, 1.2, { len: 0.2 }]),
        ['sub', word('of02'), -18, 1],
        ...[2, 4].map(n => ['pop', word('of03', n), -23, 1.1]),
        ...[0, 4].map(n => ['pop', word('of04', n), -23, 1.2]),
        ['hit_logo', word('of05') - 0.15, -16, 1],
      ],
    },
  }),
  ...(SET === 'geo' && {
    geo: {
      dur: Math.ceil((word('ge05') + 4.4) * 30) / 30,
      music: 'musique-noir.mp3',
      // la basse entre (16,2 s du morceau) quand le téléphone du passant s'allume
      segments: [[0, 40, 16.2 - word('ge02', 4)]],
      xf: 0.02,
      open: -9,
      duck: -21,
      fadeIn: 0.3,
      fadeOut: 1.5,
      sfx: [
        ['scintille', word('ge01', 4), -24, 1.2, { len: 1.6, fade: 0.8 }],
        ['whoosh', word('ge02') - 0.3, -24, 1, { crest: true }],
        ['notif_douce', word('ge02', 4), -13, 1],
        ['swoosh2', word('ge03', 1), -22, 1, { crest: true }],
        ['whoosh', word('ge04') - 0.35, -24, 0.9, { crest: true }],
        ['pop', word('ge04', 1) + 0.3, -24, 0.8],
        ['hit_logo', word('ge05') - 0.15, -17, 1],
      ],
    },
  }),
  ...(SET === 'etapes' && {
    etapes: {
      dur: Math.ceil((word('et06') + 3.4) * 30) / 30,
      music: 'musique-chrono.mp3',
      // l'entrée franche du morceau (16,2 s) tombe sur « Un » (étape 1)
      segments: [[0, 40, 16.2 - (word('et02') - 0.35)]],
      xf: 0.02,
      open: -10,
      duck: -22,
      fadeIn: 0.3,
      fadeOut: 1.5,
      sfx: [
        ['swoosh2', 0.3, -24, 1, { crest: true }],
        ['whoosh', word('et02') - 0.35, -24, 1, { crest: true }],
        ['swoosh', word('et02', 7), -27, 1.2, { crest: true }],
        ['swoosh', word('et02', 8), -27, 1.3, { crest: true }],
        ['swoosh', word('et02', 9), -27, 1.4, { crest: true }],
        ['whoosh', word('et03') - 0.35, -24, 1.05, { crest: true }],
        ['pop', word('et03', 10), -22, 1],
        ['swoosh2', word('et03', 12), -22, 1, { crest: true }],
        ['whoosh', word('et04') - 0.35, -24, 1.1, { crest: true }],
        ['bip-caisse', word('et04', 5), -19, 1],
        ['pop', word('et04', 8), -21, 1.1],
        ['sub', word('et05'), -22, 1],
        ['hit_logo', word('et06') - 0.2, -17, 1],
      ],
    },
  }),
  ...(SET === 'film' && {
    film: {
      dur: Math.ceil((word('fi07') + 4.4) * 30) / 30,
      music: 'musique-keynote.mp3',
      // la montée du morceau tombe sur l'arrivée des deux téléphones
      segments: [[0, 40, 13.7 - (word('fi02') - 0.3)]],
      xf: 0.02,
      open: -12,
      duck: -24,
      fadeIn: 0.2,
      fadeOut: 1.6,
      sfx: [
        ['scintille', 0.1, -24, 1, { len: 2.5, fade: 1.2 }],
        ['swoosh2', word('fi02') - 0.2, -22, 1, { crest: true }],
        ['swoosh2', word('fi02', 6) - 0.3, -23, 1.1, { crest: true }],
        ['sub', word('fi03'), -20, 1],
        ['swoosh', word('fi04', 2), -25, 1.2, { crest: true }],
        ['swoosh', word('fi04', 3) + 0.25, -25, 1.3, { crest: true }],
        ['swoosh', word('fi04', 4) + 0.3, -25, 1.4, { crest: true }],
        ['bip-caisse', word('fi05', 1) + 0.3, -18, 1],
        ['pop', word('fi05', 6), -20, 1],
        ['notif_douce', word('fi06', 7) + 0.1, -14, 1],
        ['hit_logo', word('fi07') - 0.15, -17, 1],
      ],
    },
  }),
  ...(SET === 'versus' && {
    versus: {
      dur: Math.ceil((word('vs05', 4) + 3.6) * 30) / 30,
      music: 'musique-chrono.mp3',
      // électro posée ; son entrée franche (16,2 s) quand le pass prend tout l'écran
      segments: [[0, 40, 16.2 - (word('vs05') - 0.5)]],
      xf: 0.02,
      open: -9,
      duck: -21,
      fadeIn: 0.3,
      fadeOut: 1.4,
      sfx: [
        ['whoosh_rapide', word('vs02', 2), -24, 1, { crest: true }],
        ['clic', word('vs02', 3), -22, 1],
        ['clic', word('vs02', 6), -20, 1.3],
        ['scratch', word('vs03', 2) - 0.05, -30, 1, { len: 0.9, fade: 0.4 }],
        ['clic', word('vs03', 2), -22, 1],
        ['clic', word('vs03', 6), -20, 1.3],
        ['clic', word('vs04', 6), -22, 1],
        ['notif_douce', word('vs04', 13), -17, 1],
        ['whoosh', word('vs05') - 0.5, -22, 0.9, { crest: true }],
        ['hit_logo', word('vs05', 4) + 0.6, -17, 1],
      ],
    },
  }),
  ...(SET === 'ecran' && {
    ecran: {
      dur: Math.ceil((word('ec06') + 4.4) * 30) / 30,
      music: 'musique-keynote.mp3',
      // la montée du morceau (13,7 s) tombe quand la notification se pose sur l'écran
      segments: [[0, 40, 13.7 - word('ec04', 3)]],
      xf: 0.02,
      open: -13,
      duck: -25,
      fadeIn: 0.3,
      fadeOut: 1.6,
      sfx: [
        ['verre', word('ec02', 1) - 0.1, -22, 1, { len: 1.6, fade: 0.8 }],
        ['whoosh', word('ec03') - 0.35, -24, 0.9, { crest: true }],
        ...[0, 0.11, 0.2, 0.33, 0.41, 0.52].map((d, i) => ['clic', word('ec03', 3) + d, -29 + (i % 2), 1.4 + (i % 3) * 0.1]),
        ['swoosh', word('ec04') - 0.4, -21, 1, { crest: true }],
        ['notif_douce', word('ec04', 3), -13, 1],
        ...[0.25, 0.5, 0.8, 1.1].map((d, i) => ['notif_douce', word('ec04', 5) + d, -24 - i * 2, 1.05 + i * 0.05]),
        ['whoosh7', word('ec05', 2) + 0.2, -26, 1.2, { crest: true }],
        ['whoosh7', word('ec05', 6) + 0.2, -26, 1.3, { crest: true }],
        ['hit_logo', word('ec06') - 0.15, -17, 1],
      ],
    },
  }),
  ...(SET === 'perdue' && {
    perdue: {
      dur: Math.ceil((word('pa07') + 4.5) * 30) / 30,
      music: 'musique-noir.mp3',
      // intro feutrée sur la carte papier, entrée de la basse (16,2 s du morceau) quand le téléphone apparaît
      segments: [[0, 40, 16.2 - (word('pa04') - 0.35)]],
      xf: 0.02,
      open: -9,
      duck: -21,
      fadeIn: 0.4,
      fadeOut: 1.6,
      sfx: [
        ['feu', word('pa03', 2), -24, 1, { len: 2.6, fade: 1.2 }],
        ['whoosh', word('pa04') - 0.35, -22, 0.8, { crest: true }],
        ['swoosh2', word('pa05') + 0.3, -21, 1, { crest: true }],
        ['scintille', word('pa06', 2), -20, 1, { len: 2.4, fade: 1 }],
        ['notif_douce', word('pa06', 2) + 0.05, -16, 1],
        ['hit_logo', word('pa07') - 0.15, -17, 1],
      ],
    },
  }),
  bandeannonce: {
    dur: 40,
    music: 'musique-bandeannonce.mp3',
    // m = v + 1,925 : coups du morceau (2,025 · 10,03 · 20,975 · 28,92) → 0,1 · 8,105 · 19,05 · 27,0
    // puis le coup de 91,0 s à 27,0 ; la fin (silence puis coup de 109,95 s) sur le logo à 33,22 ; dernier coup 114,055 → 37,33
    segments: [
      [0, 27.0, 1.925],
      [27.0, 30.6, 91.0 - 27.0],
      [30.6, 40, 109.95 - 33.22],
    ],
    xf: 0.03,
    open: -5,
    duck: -14,
    fadeIn: 0,
    fadeOut: 1.2,
    sfx: [
      ['machine', 0.0, -15, 1, { len: 3.6, fade: 0.25 }],
      ['whoosh', 3.5, -10, 1, { crest: true }],
      ['riser', 7.95, -16, 1, { crest: true }],
      ['feu', 15.85, -12, 1, { len: 2.2, fade: 0.6 }],
      ['riser', 19.0, -14, 0.9, { crest: true }],
      ['braam', 19.05, -13, 1],
      ['whoosh7', 20.95, -10, 1, { crest: true }],
      ['dechirure', 25.2, -14, 0.8],
      ['swoosh', 25.95, -12, 1, { crest: true }],
      ['notif_douce', 27.35, -12, 1],
      ['sub', 27.0, -15, 1],
      ['hit_logo', 33.22, -11, 1],
      ['scintille', 33.5, -16, 1, { len: 3, fade: 1 }],
      ['braam2', 37.33, -15, 1],
    ],
  },
  keynote: {
    dur: 28,
    music: 'musique-keynote.mp3',
    // montée du morceau (13,71 s) juste après « Elle n'existe pas » (3,2 s)
    segments: [[0, 28, 13.71 - 3.2]],
    xf: 0.02,
    open: -12,
    duck: -25,
    fadeIn: 0.25,
    fadeOut: 2.2,
    sfx: [
      ['verre', 2.3, -15, 1, { len: 2, fade: 0.8 }], // la carte devient hologramme
      ['scintille', 3.2, -19, 1, { len: 2.5, fade: 1 }],
      ['pop', 3.82, -17, 1], // papier
      ['pop', 4.32, -17, 1.15], // plastique
      ['swoosh2', 4.9, -20, 1.2, { crest: true }], // la vraie carte se reconstitue
      ['swoosh', 5.45, -17, 1, { crest: true }], // dans le Wallet
      ['swoosh2', 7.3, -17, 1, { crest: true }], // elle ressort
      ['clic', 8.15, -19, 1],
      ['clic', 8.73, -19, 1.1],
      ['clic', 9.74, -19, 1.2],
      ['clic', 10.72, -12, 0.8], // les couches se referment
      ['hit_grave', 10.72, -24, 1.2],
      ['whoosh7', 11.95, -19, 1.1, { crest: true }], // retournement
      ...[0, 0.09, 0.17, 0.28, 0.36, 0.43, 0.55, 0.62, 0.7].map((d, i) => ['clic', 13.38 + d, -27 + (i % 3), 1.4 + (i % 2) * 0.2]), // frappe
      ['swoosh', 14.35, -17, 1, { crest: true }], // envoi
      ['notif_douce', 15.0, -11, 1],
      ['whoosh', 15.7, -20, 0.8, { crest: true }], // la grue
      ['notif', 18.3, -12, 1],
      ['swoosh2', 19.35, -19, 0.9, { crest: true }],
      ['clic', 21.55, -15, 0.9],
      ['scintille', 23.25, -15, 1, { len: 3, fade: 1 }],
      ['pop', 24.9, -16, 1],
    ],
  },
  concurrent: {
    dur: 24.44,
    music: 'musique-concurrent.mp3',
    // mesures du morceau (drop à 13,39 s) remontées sur la grille de l'image (mesure n à 0,05 + n × 1,7423 s) :
    // 9 mesures pleines, la mesure de break (« Son secret ? »), le retour sur « Fidelyz », trois mesures pleines
    segments: [0, 1, 2, 3, 0, 1, 2, 3, 4, 7, 8, 11, 12, 13].map((b, j) => [0.05 + j * BAR_CC, 0.05 + (j + 1) * BAR_CC, 13.39 + b * BAR_CC - (0.05 + j * BAR_CC)]),
    xf: 0.006,
    open: -9,
    duck: -20,
    fadeIn: 0,
    fadeOut: 0.05,
    sfx: [
      ['bass_drop', 0.05, -19, 1], // le téléphone s'écrase sur le drop
      ['notif', 0.78, -11, 1], // la notification du concurrent
      ['hit', 2.03, -14, 1.1], // « TES »
      ['whoosh_rapide', 2.72, -11, 1, { crest: true }],
      ['pop_cartoon', 2.82, -13, 1],
      ['pop_cartoon', 3.6, -11, 0.85], // le 3
      ['whoosh7', 4.78, -11, 1.1, { crest: true }], // le 1 traverse l'écran
      ['swoosh2', 5.6, -13, 1, { crest: true }], // la carte dans le téléphone
      ['whoosh_rapide', 6.98, -11, 1, { crest: true }],
      ['hit', 7.5, -8, 0.8], // le tiroir claque
      ['whoosh7', 8.63, -11, 1.1, { crest: true }], // le 2
      ...[0, 0.22, 0.44, 0.66, 0.88, 1.1, 1.42, 1.56, 1.7, 1.84].map((d, i) => ['notif', 9.8 + d, -17 - (i % 3), 0.9 + (i % 4) * 0.08]),
      ['pop', 10.45, -10, 0.9], // pièce 0 €
      ['whoosh7', 12.43, -11, 1.1, { crest: true }], // le 3
      ['pop_cartoon', 12.3, -15, 1.2],
      ['notif_douce', 14.0, -10, 1], // à 50 m
      ['scratch', 16.08, -13, 1], // break : « Son secret ? »
      ['riser_court', 17.45, -11, 1, { crest: true }],
      ['bass_drop', 17.47, -16, 1], // « Fidelyz »
      ['pop', 17.5, -15, 1.3],
      ['whoosh_rapide', 18.4, -12, 1, { crest: true }],
      ['pop_cartoon', 18.46, -10, 1],
      ['pop_cartoon', 19.46, -10, 1.1],
      ['pop_cartoon', 20.03, -10, 1.2],
      ['whoosh_rapide', 21.35, -12, 1, { crest: true }],
      ['notif', 22.65, -10, 1],
    ],
  },
}
CONFIG.noir = {
  dur: 24,
  music: 'musique-noir.mp3',
  // la basse du morceau (16,24 s) entre quand la carte sort du téléphone (4,6 s)
  segments: [[0, 24, 16.24 - 4.6]],
  xf: 0.02,
  open: -9,
  duck: -19,
  fadeIn: 0.15,
  fadeOut: 1.6,
  sfx: [
    ['goutte', 0.9, -10, 0.85], // la goutte touche le bassin
    ['goutte', 1.55, -16, 1.1],
    ['visqueux', 2.4, -14, 0.8], // le liquide remonte
    ['swoosh2', 4.6, -16, 0.8, { crest: true }], // la carte sort de l'écran
    ['scintille', 5.85, -19, 1, { len: 2, fade: 0.8 }], // le logo
    ['clic', 6.45, -22, 1.2],
    ['clic', 6.73, -22, 1.3],
    ['clic', 7.0, -22, 1.4],
    ['swoosh', 9.55, -18, 0.9, { crest: true }], // la carte bancaire
    ['visqueux', 11.0, -13, 0.7], // la carte fond
    ['goutte', 11.85, -12, 0.7], // elle plonge
    ['hit_grave', 12.55, -20, 1.3], // 480 → 500
    ['goutte', 13.9, -12, 0.8],
    ['visqueux', 14.0, -15, 0.85],
    ['notif_douce', 15.4, -11, 1], // la notification
    ['visqueux', 17.4, -14, 0.75], // le téléphone fond
    ['sub', 18.3, -16, 1],
    ['scintille', 18.35, -16, 1, { len: 3, fade: 1.2 }], // le logo
  ],
}
CONFIG.chrono = {
  dur: 23,
  music: 'musique-chrono.mp3',
  // le drop (16,18 s) tombe sur « chrono » (2,645 s)
  segments: [[0, 23, 16.18 - 2.645]],
  xf: 0.02,
  open: -8,
  duck: -18,
  fadeIn: 0.05,
  fadeOut: 0.6,
  sfx: [
    ['chrono_tic', 0.15, -17, 1, { len: 2.4, fade: 0.2 }], // le tic-tac sous l'accroche
    ['clic', 2.55, -9, 0.8], // la couronne du chronomètre
    ['bass_drop', 2.645, -17, 1], // « Top chrono ! »
    ...[3.2, 5.2, 7.5, 12.35, 15.95, 18.95].map((c, i) => ['laser', c, -15, 0.9 + (i % 3) * 0.1, { crest: true }]), // traînées de néon
    ['pop', 3.97, -12, 0.9], // le logo se pose
    ['clic', 4.42, -19, 1.2],
    ['clic', 4.78, -19, 1.3],
    ['clic', 5.0, -19, 1.4],
    ['laser_long', 6.2, -20, 1.2, { len: 0.7, fade: 0.2 }], // impression du QR code
    ['bip-caisse', 8.98, -13, 1], // le scan
    ['swoosh', 10.1, -15, 1, { crest: true }], // la carte vole vers le téléphone
    ['pop', 10.7, -14, 1.1],
    ['notif', 14.3, -10, 1], // l'offre s'affiche
    ['chrono_stop', 15.95, -9, 1, { len: 0.8, fade: 0.2 }], // « Stop ! »
    ['hit', 15.97, -16, 1.2],
    ['scintille', 18.95, -17, 1, { len: 2.5, fade: 1 }],
    ['neon', 19.0, -23, 1, { len: 1.2, fade: 0.5 }],
  ],
}
const C = CONFIG[SET]
if (!C) throw new Error('set inconnu : ' + SET)
const N = Math.round(SR * C.dur)
const bus = () => [new Float32Array(N), new Float32Array(N)]
const music = bus()
const fx = bus()
const voice = bus()

// ─── 1. Musique ──────────────────────────────────────────────
const M = decode(path.join(SONS, C.music))
const XF = Math.round(C.xf * SR)
for (const [v0, v1, off] of C.segments) {
  const i0 = Math.round(v0 * SR)
  const i1 = Math.round(v1 * SR)
  for (let i = i0 - XF; i < i1 + XF; i++) {
    if (i < 0 || i >= N) continue
    const j = i + Math.round(off * SR)
    if (j < 0 || j >= M[0].length) continue
    const g = i < i0 ? (i - (i0 - XF)) / XF : i >= i1 ? 1 - (i - i1) / XF : 1
    const e = Math.sin((Math.PI / 2) * Math.max(0, Math.min(1, g))) // fondu à puissance constante
    music[0][i] += M[0][j] * e
    music[1][i] += M[1][j] * e
  }
}
for (let i = 0; i < N; i++) {
  const t = i / SR
  const g = Math.min(1, C.fadeIn ? t / C.fadeIn : 1, Math.max(0, (C.dur - t) / C.fadeOut))
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
    if (t >= a - 0.12 && t <= b + 0.35) k = Math.max(k, t < a ? (t - (a - 0.12)) / 0.12 : t > b ? 1 - (t - b) / 0.35 : 1)
  }
  return k
}
for (let i = 0; i < N; i++) {
  const k = duckAt(i / SR)
  const g = db(C.open + (C.duck - C.open) * k)
  music[0][i] *= g
  music[1][i] *= g
}

// ─── 3. Bruitages ────────────────────────────────────────────
const cache = {}
const load = name => {
  if (cache[name]) return cache[name]
  const file = ['mp3', 'wav'].map(e => path.join(SONS, `${name}.${e}`)).find(fs.existsSync) ?? path.join(root, 'public/sons_tiktok', `${name}.mp3`)
  const data = decode(file)
  let a = 0
  while (a < data[0].length && Math.abs(data[0][a]) < 0.008 && Math.abs(data[1][a]) < 0.008) a++
  let peak = 0, crest = 0
  for (let i = 0; i < data[0].length; i++) {
    const v = Math.max(Math.abs(data[0][i]), Math.abs(data[1][i]))
    if (v > peak) { peak = v; crest = i }
  }
  return (cache[name] = { data, lead: a, crest, norm: 1 / peak })
}
const sfxLog = []
for (const [name, at, gain, rate = 1, o = {}] of C.sfx) {
  const s = load(name)
  let acc = 0, cnt = 0
  const [L, R] = s.data
  const start = o.crest ? (s.crest - s.lead) / rate : 0
  const i0 = Math.round((at - start / SR) * SR)
  const g = s.norm * db(gain)
  const len = o.len ? o.len * SR : Infinity
  const fade = (o.fade ?? 0.02) * SR
  for (let k = 0; k < len; k++) {
    const p = s.lead + k * rate
    const j = Math.floor(p)
    if (j + 1 >= L.length) break
    const i = i0 + k
    if (i < 0) continue
    if (i >= N) break
    const f = p - j
    const env = len === Infinity ? 1 : Math.min(1, (len - k) / fade)
    const v = (L[j] + (L[j + 1] - L[j]) * f) * g * env
    fx[0][i] += v
    fx[1][i] += (R[j] + (R[j + 1] - R[j]) * f) * g * env
    acc += v * v
    cnt++
  }
  sfxLog.push(`${name}@${at.toFixed(2)} ${(10 * Math.log10(acc / Math.max(1, cnt) + 1e-12)).toFixed(1)} dB/${(cnt / SR).toFixed(1)} s`)
}
if (process.argv.includes('--detail')) console.log(sfxLog.join('\n'))

// ─── 4. Mixage et niveau ─────────────────────────────────────
const mix = bus()
for (let c = 0; c < 2; c++) for (let i = 0; i < N; i++) mix[c][i] = music[c][i] + fx[c][i] + voice[c][i]
const writeWav = (file, [L, R]) => {
  const data = Buffer.alloc(N * 4)
  for (let i = 0; i < N; i++) {
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), i * 4)
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), i * 4 + 2)
  }
  const h = Buffer.alloc(44)
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16)
  h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22); h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 4, 28)
  h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(data.length, 40)
  fs.writeFileSync(file, Buffer.concat([h, data]))
}
const lufs = file => {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-i', file, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' })
  const m = r.stderr.match(/"input_i"\s*:\s*"(-?[\d.]+)"/)
  return m ? Number(m[1]) : null
}
const limit = (B, gain) => {
  const ceil = db(-1)
  const look = Math.round(0.005 * SR)
  const rel = Math.exp(-1 / (0.08 * SR))
  const env = new Float32Array(N)
  for (let i = 0; i < N; i++) {
    let p = 0
    for (let k = 0; k < look && i + k < N; k += 2) p = Math.max(p, Math.abs(B[0][i + k] * gain), Math.abs(B[1][i + k] * gain))
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
const out = path.join(root, `public/tt/mix-${SET}.wav`)
fs.mkdirSync(path.dirname(out), { recursive: true })
writeWav(out, limit(mix, 1))
const measured = lufs(out)
const makeup = measured == null ? 1 : db(Math.min(8, -14 - measured))
writeWav(out, limit(mix, makeup))
console.log(`${SET} : ${measured?.toFixed(1)} LUFS avant réglage, gain ${(20 * Math.log10(makeup)).toFixed(1)} dB → ${lufs(out)?.toFixed(1)} LUFS`)
const rms = (B, pred) => {
  let s = 0, c = 0
  for (let i = 0; i < N; i += 4) if (pred(i / SR)) { s += B[0][i] * B[0][i]; c++ }
  return (10 * Math.log10(s / Math.max(1, c) + 1e-12)).toFixed(1)
}
const speaking = t => merged.some(([a, b]) => t >= a + 0.1 && t <= b - 0.1)
console.log(`voix : ${rms(voice, speaking)} dB · musique sous la voix : ${rms(music, speaking)} dB · musique seule : ${rms(music, t => !speaking(t))} dB · bruitages : ${rms(fx, () => true)} dB`)
