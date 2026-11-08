import { AbsoluteFill, Audio, Easing, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import '@fontsource-variable/inter'
import ECRANS from './ecrans.json'

/* ═══════════════ Kit de motion design des vidéos « campagne » ═══════════════
   Grammaire : des mouvements amortis (jamais de rebond nerveux), des transitions en continuité
   (l'objet principal traverse les plans), du flou de profondeur plutôt que des fondus plats,
   aucun tremblement d'image. */

export const FPS = 30
export const font = '"Inter Variable", "Inter", -apple-system, sans-serif'
export const C = {
  bg: '#000', text: '#f5f5f7', muted: 'rgba(245,245,247,0.6)', blue: '#2997ff', blueBtn: '#0071e3',
  champagne: '#e3c9a4', green: '#30d158', red: '#ff453a', line: 'rgba(255,255,255,0.1)',
}

// ─── Temps et courbes ───
export const useT = () => useCurrentFrame() / FPS
export const E = {
  out: Easing.bezier(0.16, 1, 0.3, 1), // arrivée : rapide puis très douce
  in: Easing.bezier(0.7, 0, 0.84, 0),
  io: Easing.bezier(0.65, 0, 0.35, 1), // mouvement de caméra
  soft: Easing.bezier(0.33, 0, 0.2, 1),
  lin: x => x,
}
export const ts = (t, a, b, from = 0, to = 1, easing = E.out) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
export const lerp = (a, b, k) => a + (b - a) * k
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
/* Ressort critique (aucun rebond) ou légèrement sous-amorti (zeta < 1) : 0 → 1 */
export const spring = (t, at, speed = 7, zeta = 0.82) => {
  if (t <= at) return 0
  const x = (t - at) * speed
  if (zeta >= 1) return 1 - (1 + x) * Math.exp(-x)
  const wd = Math.sqrt(1 - zeta * zeta)
  return 1 - Math.exp(-zeta * x) * (Math.cos(wd * x) + (zeta / wd) * Math.sin(wd * x))
}
/* Images clés : kf(t, [[t0, {x, y, s…}], [t1, {…}], …]) avec courbe io entre deux clés */
export const kf = (t, keys, easing = E.io) => {
  if (t <= keys[0][0]) return keys[0][1]
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i], [b, vb, ez] = keys[i + 1]
    if (t <= b) {
      const k = (ez ?? easing)((t - a) / (b - a))
      if (typeof va === 'number') return lerp(va, vb, k)
      const o = {}
      for (const key of Object.keys(vb)) o[key] = lerp(va[key] ?? vb[key], vb[key], k)
      return o
    }
  }
  return keys[keys.length - 1][1]
}

// ─── Sons ───
/* Ducking progressif : 1 pendant la voix, 0 hors voix. Les pauses de moins de 0,9 s restent « parlées »
   (pas de pompage entre deux phrases) et la musique remonte ou redescend sur 0,4 s. */
export const parle = (list, t) => {
  const iv = []
  for (const c of list) {
    if (!c.voice) continue
    const a = c.at - 0.2, b = c.at + c.dur + 0.25
    if (iv.length && a - iv[iv.length - 1][1] < 0.9) iv[iv.length - 1][1] = b
    else iv.push([a, b])
  }
  let v = 0
  for (const [a, b] of iv) {
    const d = t < a ? a - t : t > b ? t - b : 0
    v = Math.max(v, 1 - Math.min(1, d / 0.4))
  }
  return v
}
/* Volume de la musique : `haut` sans voix, `bas` sous la voix */
export const volMusique = (list, t, voix) => (voix ? 0.5 + (0.15 - 0.5) * parle(list, t) : 0.5) // musiques normalisées à -16 LUFS

/* Bruitages : une petite bibliothèque cohérente (public/campagne/sfx, générée et normalisée à -20 LUFS),
   dosée bas et de façon constante. Les anciens noms de sons sont redirigés ; montées, lasers, tic-tac… sont supprimés. */
const SFX = {
  whoosh: ['whoosh', 0.22], whoosh7: ['whoosh', 0.22], whoosh_rapide: ['whoosh', 0.22], swoosh: ['whoosh', 0.18], swoosh2: ['whoosh', 0.18],
  clic: ['tap', 0.3], chrono_stop: ['tap', 0.3],
  notif: ['notif', 0.45], notif_douce: ['notif', 0.38],
  'bip-caisse': ['scan', 0.32],
  hit_logo: ['impact', 0.32], hit: ['impact', 0.28], braam: ['impact', 0.28], braam2: ['impact', 0.28], bass_drop: ['impact', 0.28], sub: ['impact', 0.28],
  hit_grave: ['stamp', 0.3],
  scintille: ['shimmer', 0.18], verre: ['shimmer', 0.18],
  pop: ['pop', 0.2], pop_cartoon: ['pop', 0.2],
}
export const Son = ({ src, at, vol = 1, dur }) => {
  let file = src, v = vol
  const m = src.match(/^sons_(?:tt|tiktok)\/([^/.]+)\.mp3$/)
  if (m) {
    const s = SFX[m[1]]
    if (!s) return null
    file = `campagne/sfx/${s[0]}.mp3`
    v = s[1] * Math.max(0.5, Math.min(1, vol / 0.4)) // garde les écarts voulus (ex. échos plus faibles), sans jamais dépasser le dosage
  }
  return (
    <Sequence from={Math.round(at * FPS)} durationInFrames={dur ? Math.round(dur * FPS) : undefined} layout="none">
      <Audio src={staticFile(file)} volume={v} />
    </Sequence>
  )
}

// ─── Fonds ───
/* Nuit : noir profond, deux lueurs qui dérivent lentement (bleu et champagne), vignette */
export const Nuit = ({ t, a = 1, hue = 0, warm = 0.16, cool = 0.26, w = 1080, h = 1920 }) => {
  const k = t * 0.32 + hue
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: w * 0.5 + Math.cos(k) * w * 0.25 - w * 0.75, top: h * 0.32 + Math.sin(k * 1.3) * h * 0.1 - w * 0.75, width: w * 1.5, height: w * 1.5, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(41,151,255,${cool * a}), transparent)` }} />
      <div style={{ position: 'absolute', left: w * 0.5 - Math.cos(k * 0.8) * w * 0.28 - w * 0.6, top: h * 0.72 - Math.sin(k) * h * 0.08 - w * 0.6, width: w * 1.2, height: w * 1.2, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(227,201,164,${warm * a}), transparent)` }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.65))' }} />
    </AbsoluteFill>
  )
}
/* Studio blanc (style keynote) : blanc cassé, sol légèrement plus sombre, lumière douce en haut */
export const Studio = ({ dark = 0 }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, #fbfbfd 0%, #f2f2f5 55%, #e6e6ea 100%)` }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 45% at 50% 30%, rgba(255,255,255,0.9), transparent)' }} />
    {dark > 0 && <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dark }} />}
  </AbsoluteFill>
)
/* Grain fin, fixe (aucun scintillement) */
export const Grain = ({ o = 0.05 }) => (
  <AbsoluteFill style={{ pointerEvents: 'none', opacity: o, mixBlendMode: 'overlay' }}>
    <svg width="100%" height="100%"><filter id="grainf"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /></filter><rect width="100%" height="100%" filter="url(#grainf)" /></svg>
  </AbsoluteFill>
)

// ─── Typographie ───
/* Titre cinétique : chaque mot monte de derrière un cache, avec un léger flou qui se dissipe.
   words : chaîne ou tableau ; `accent` : { indice: couleur } ; sortie floutée vers le haut à `out`. */
export const Titre = ({ t, at, out, text, size = 96, weight = 700, color = C.text, accent = {}, stagger = 0.07, align = 'center', width = 960, lh = 1.04, style, gradient }) => {
  const words = Array.isArray(text) ? text : text.split(' ')
  const o = out == null ? 0 : ts(t, out, out + 0.35, 0, 1, E.in)
  if (t < at - 0.05 || o >= 1) return null
  return (
    <div style={{ fontFamily: font, fontSize: size, fontWeight: weight, letterSpacing: '-0.045em', lineHeight: lh, color, textAlign: align, width, display: 'flex', flexWrap: 'wrap', justifyContent: align === 'center' ? 'center' : 'flex-start', columnGap: '0.24em', opacity: 1 - o, transform: `translateY(${-o * 40}px)`, filter: o > 0 ? `blur(${o * 14}px)` : undefined, ...style }}>
      {words.map((w, i) => {
        if (w === '\n') return <div key={i} style={{ flexBasis: '100%', height: 0 }} />
        const p = ts(t, at + i * stagger, at + i * stagger + 0.7)
        const c = accent[i]
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', paddingBottom: '0.12em', marginBottom: '-0.12em', paddingTop: '0.04em' }}>
            <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined, ...(c === 'grad' ? { background: gradient ?? 'linear-gradient(90deg, #2997ff, #64d2ff)', WebkitBackgroundClip: 'text', color: 'transparent' } : { color: c ?? color }) }}>{w}</span>
          </span>
        )
      })}
    </div>
  )
}
/* Petit libellé en pastille (« ÉTAPE 1 », « NOUVEAU »…) */
export const Pastille = ({ t, at, out, children, color = C.blue, size = 30, style }) => {
  const a = spring(t, at, 8, 0.9)
  const o = out == null ? 0 : ts(t, out, out + 0.25)
  if (t < at || o >= 1) return null
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '12px 26px', borderRadius: 999, background: `${color}22`, border: `1.5px solid ${color}66`, color, fontFamily: font, fontSize: size, fontWeight: 650, letterSpacing: '0.01em', opacity: Math.min(1, a * 1.4) * (1 - o), transform: `translateY(${(1 - a) * 24}px) scale(${0.94 + 0.06 * a})`, ...style }}>{children}</div>
  )
}
/* Bloc centré horizontalement, à une hauteur donnée */
export const Centre = ({ y, children, w = 1080, z = 50, style }) => (
  <div style={{ position: 'absolute', left: 0, top: y, width: w, display: 'flex', justifyContent: 'center', zIndex: z, ...style }}>{children}</div>
)

// ─── Sous-titres de la voix ───
/* Un bloc par réplique (cue = { at, dur, words: [{ w, t }] }) ; le mot prononcé s'allume, les autres attendent en gris. */
export const SousTitre = ({ t, cue, y = 1180, size = 64, accent = {}, w = 1080, maxW = 900, hide = false, ink = '#fff', dim = 'rgba(255,255,255,0.38)', shadow = true, scrim = 300 }) => {
  if (!cue || hide) return null
  const a = cue.at, b = cue.at + cue.dur
  if (t < a - 0.05 || t > b + 0.2) return null
  const inn = ts(t, a - 0.05, a + 0.25), out = ts(t, b, b + 0.2, 0, 1, E.in)
  return (
    <>
    {shadow && scrim > 0 && <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: y + scrim, background: 'linear-gradient(180deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 60%, transparent 100%)', zIndex: 79, opacity: inn * (1 - out) }} />}
    <div style={{ position: 'absolute', left: 0, top: y, width: w, display: 'flex', justifyContent: 'center', zIndex: 80, opacity: inn * (1 - out), transform: `translateY(${(1 - inn) * 18 - out * 10}px)` }}>
      <div style={{ maxWidth: maxW, textAlign: 'center', fontFamily: font, fontSize: size, fontWeight: 700, lineHeight: 1.18, letterSpacing: '-0.03em', textShadow: shadow ? '0 4px 30px rgba(0,0,0,0.55)' : undefined }}>
        {cue.words.map((wd, i) => {
          const on = t >= a + wd.t - 0.06
          return <span key={i} style={{ color: on ? (accent[i] ?? ink) : dim, transition: 'none' }}>{wd.w}{i < cue.words.length - 1 ? ' ' : ''}</span>
        })}
      </div>
    </div>
    </>
  )
}

// ─── Écrans capturés du vrai site ───
export const META = ECRANS
const src = n => staticFile(`campagne/ecrans/${n}.png`)
/* Page du site dans un écran de 390 pt de large : défilement, barres fixes, calques par-dessus (fondus) */
export const Page = ({ name, scroll = 0, layers = [], children, w = 390, h = 844, bars = true }) => {
  const m = META[name] ?? { height: h }
  const k = w / (name.startsWith('d-') ? 1440 : 390)
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: w, transform: `translateY(${-scroll * k}px)` }}>
        <Img src={src(name)} style={{ display: 'block', width: w, height: m.height * k }} />
        {layers.map((l, i) => (l.o ?? 1) > 0.001 && <Img key={i} src={src(l.name)} style={{ position: 'absolute', left: 0, top: 0, width: w, height: (META[l.name]?.height ?? m.height) * k, opacity: l.o ?? 1 }} />)}
        {children}
      </div>
      {bars && m.top && <Img src={src(`${name}-top`)} style={{ position: 'absolute', left: 0, top: 0, width: w, height: m.top * k }} />}
      {bars && m.tab && <Img src={src(`${name}-tab`)} style={{ position: 'absolute', left: 0, top: h - m.tab * k, width: w, height: m.tab * k }} />}
    </div>
  )
}
export const rectOf = (name, key) => META[name]?.rects?.[key]

/* Doigt qui tape : appui puis onde (coordonnées de l'écran) */
export const Tap = ({ t, at, x, y, size = 1 }) => {
  if (t < at - 0.3 || t > at + 0.55) return null
  const pre = ts(t, at - 0.3, at - 0.02), post = ts(t, at, at + 0.5)
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, zIndex: 40 }}>
      <div style={{ position: 'absolute', left: -24 * size, top: -24 * size, width: 48 * size, height: 48 * size, borderRadius: '50%', background: 'rgba(255,255,255,0.32)', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 6px 20px rgba(0,0,0,0.35)', opacity: t < at ? pre : 1 - post, transform: `scale(${t < at ? 0.7 + 0.3 * pre : 1 - 0.2 * post})` }} />
      {t >= at && <div style={{ position: 'absolute', left: -(14 + 50 * post) * size, top: -(14 + 50 * post) * size, width: (28 + 100 * post) * size, height: (28 + 100 * post) * size, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.7)', opacity: 1 - post }} />}
    </div>
  )
}

// ─── iPhone ───
export const SW = 390 // largeur de l'écran (pt)
export const SH = 894 // hauteur de l'écran (pt) : 50 de barre d'état + 844 de page
const BZ = 13 // bordure noire autour de l'écran
const FW = SW + 2 * BZ, FH = SH + 2 * BZ
/* Barre d'état iOS */
export const BarreEtat = ({ color = '#fff', time = '9:41' }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 30px 0 40px', boxSizing: 'border-box', fontFamily: font, color, zIndex: 30 }}>
    <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.01em' }}>{time}</span>
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <svg width="18" height="12" viewBox="0 0 18 12">{[0, 1, 2, 3].map(i => <rect key={i} x={i * 4.7} y={9 - i * 2.8} width="3.2" height={3 + i * 2.8} rx="0.8" fill={color} />)}</svg>
      <svg width="16" height="12" viewBox="0 0 16 11"><path d="M8 10.5 5.6 8a3.4 3.4 0 0 1 4.8 0zM3.6 6a6.2 6.2 0 0 1 8.8 0l-1.3 1.3a4.4 4.4 0 0 0-6.2 0zM1.3 3.7a9.4 9.4 0 0 1 13.4 0L13.4 5a7.6 7.6 0 0 0-10.8 0z" fill={color} /></svg>
      <svg width="27" height="13" viewBox="0 0 27 12"><rect x="0.5" y="0.5" width="23" height="11" rx="3.4" fill="none" stroke={color} strokeOpacity="0.4" /><rect x="2" y="2" width="18" height="8" rx="2" fill={color} /><rect x="24.6" y="4" width="1.6" height="4" rx="0.8" fill={color} fillOpacity="0.45" /></svg>
    </span>
  </div>
)
/* Le téléphone. (x, y) = centre, s = échelle, rotations en degrés. L'épaisseur est faite de tranches empilées.
   inset : le contenu commence sous la barre d'état (pages du site) ; sinon il passe dessous (écran verrouillé, Wallet). */
export const IPhone = ({ x = 540, y = 960, s = 1.6, rx = 0, ry = 0, rz = 0, o = 1, children, inset = false, status = true, statusColor = '#fff', time = '9:41', glare = true, shadow = 1, persp = 2600, style }) => (
  <div style={{ position: 'absolute', left: x - FW / 2, top: y - FH / 2, width: FW, height: FH, transform: `scale(${s})`, opacity: o, perspective: persp, ...style }}>
    <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
      {/* ombre portée au sol */}
      <div style={{ position: 'absolute', left: '8%', right: '8%', top: '12%', bottom: '-4%', borderRadius: 80, background: 'rgba(0,0,0,0.75)', filter: 'blur(50px)', transform: 'translateZ(-14px)', opacity: shadow }} />
      {/* tranche (titane) */}
      {[...Array(9)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', inset: -4, borderRadius: 68, background: i % 3 === 0 ? '#9a9a9f' : '#6e6e73', transform: `translateZ(${-9 + i * 1.6}px)` }} />
      ))}
      {/* boutons latéraux */}
      {[[150, 34], [210, 62], [290, 62]].map(([top, hgt], i) => <div key={i} style={{ position: 'absolute', left: -7, top, width: 5, height: hgt, borderRadius: 3, background: 'linear-gradient(90deg,#55555a,#a1a1a6)' }} />)}
      <div style={{ position: 'absolute', right: -7, top: 240, width: 5, height: 96, borderRadius: 3, background: 'linear-gradient(270deg,#55555a,#a1a1a6)' }} />
      {/* face avant */}
      <div style={{ position: 'absolute', inset: -4, borderRadius: 68, background: 'linear-gradient(140deg, #d1d1d6 0%, #6e6e73 18%, #3a3a3c 50%, #8e8e93 82%, #d1d1d6 100%)', transform: 'translateZ(5px)', boxShadow: '0 0 0 1px rgba(0,0,0,0.6)' }} />
      <div style={{ position: 'absolute', inset: -1, borderRadius: 65, background: '#000', transform: 'translateZ(5.2px)' }} />
      <div style={{ position: 'absolute', left: BZ, top: BZ, width: SW, height: SH, borderRadius: 54, overflow: 'hidden', background: '#000', transform: 'translateZ(5.4px)', isolation: 'isolate' }}>
        <div style={{ position: 'absolute', left: 0, top: inset ? 50 : 0, width: SW, height: inset ? SH - 50 : SH, overflow: 'hidden' }}>{children}</div>
        {status && <BarreEtat color={statusColor} time={time} />}
        <div style={{ position: 'absolute', left: SW / 2 - 63, top: 11, width: 126, height: 37, borderRadius: 19, background: '#000', zIndex: 31 }} />
        {glare && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${115 + ry * 0.8}deg, transparent 35%, rgba(255,255,255,0.07) 48%, transparent 62%)`, zIndex: 32, pointerEvents: 'none' }} />}
      </div>
      {/* dos (visible quand le téléphone tourne) */}
      <div style={{ position: 'absolute', inset: -4, borderRadius: 68, background: 'linear-gradient(150deg,#4a4a4f,#2a2a2d 60%,#3d3d41)', transform: 'rotateY(180deg) translateZ(9px)', backfaceVisibility: 'hidden' }}>
        <div style={{ position: 'absolute', left: 26, top: 26, width: 150, height: 150, borderRadius: 40, background: 'rgba(0,0,0,0.35)', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.08)' }} />
      </div>
    </div>
  </div>
)
/* Taille de l'écran d'un téléphone à l'échelle s, et position (écran) d'un point du contenu */
export const phonePoint = ({ x = 540, y = 960, s = 1.6 }, px, py, inset = false) => ({
  x: x + (px - SW / 2) * s,
  y: y + (py + (inset ? 50 : 0) - SH / 2) * s,
})

// ─── iOS : écran verrouillé, notification, Wallet ───
export const FondEcran = ({ hue = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(165deg, #10234d 0%, #1b1150 38%, #3a1640 70%, #120d1f 100%)', filter: `hue-rotate(${hue}deg)` }}>
    <div style={{ position: 'absolute', left: -120, top: 380, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,140,90,0.45), transparent)' }} />
    <div style={{ position: 'absolute', left: 120, top: 40, width: 460, height: 460, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(80,140,255,0.5), transparent)' }} />
  </div>
)
/* Icône du pass (le logo du commerce) */
export const IconePass = ({ size = 38, mark = 'L' }) => (
  <div style={{ width: size, height: size, borderRadius: size * 0.24, background: '#1c1c1e', display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
    <div style={{ width: size * 0.66, height: size * 0.66, borderRadius: size * 0.16, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', color: '#1d1d1f', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: size * 0.38 }}>{mark}</div>
  </div>
)
/* Notification iOS d'un pass Wallet : icône du pass, nom du commerce, message (changeMessage du pass) */
export const NotifIOS = ({ title = 'Maison Lumière', body, time = 'maintenant', width = 362, light = false, mark = 'L', style }) => (
  <div style={{ width, display: 'flex', gap: 11, alignItems: 'center', padding: '12px 14px', borderRadius: 24, background: light ? 'rgba(245,245,247,0.82)' : 'rgba(60,60,67,0.55)', backdropFilter: 'blur(30px) saturate(180%)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)', fontFamily: font, color: light ? '#000' : '#fff', boxSizing: 'border-box', ...style }}>
    <IconePass size={38} mark={mark} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <strong style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</strong>
        <span style={{ fontSize: 13, opacity: 0.55 }}>{time}</span>
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.3, opacity: 0.92, letterSpacing: '-0.01em' }}>{body}</div>
    </div>
  </div>
)
/* Écran verrouillé : heure, date, notifications ({ at, body, title, time }) qui arrivent avec un ressort amorti */
export const Verrouille = ({ t, notifs = [], date = 'dimanche 8 novembre', time = '9:41', hue = 0, dim = 0 }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: font, color: '#fff' }}>
    <FondEcran hue={hue} />
    <div style={{ position: 'absolute', top: 92, width: '100%', textAlign: 'center' }}>
      <div style={{ fontSize: 21, fontWeight: 600, opacity: 0.9 }}>{date}</div>
      <div style={{ fontSize: 104, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1, marginTop: 2 }}>{time}</div>
    </div>
    <div style={{ position: 'absolute', left: 14, right: 14, bottom: 120, display: 'flex', flexDirection: 'column-reverse', gap: 8 }}>
      {notifs.map((n, i) => {
        const a = spring(t, n.at, 7, 0.78)
        if (t < n.at) return null
        return <div key={i} style={{ opacity: clamp(a * 1.5), transform: `translateY(${(1 - a) * 60}px) scale(${0.9 + 0.1 * a})` }}><NotifIOS {...n} /></div>
      })}
    </div>
    <div style={{ position: 'absolute', bottom: 40, left: 46, width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }} />
    <div style={{ position: 'absolute', bottom: 40, right: 46, width: 50, height: 50, borderRadius: 25, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }} />
    <div style={{ position: 'absolute', bottom: 10, left: SW / 2 - 70, width: 140, height: 5, borderRadius: 3, background: '#fff' }} />
    {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: dim }} />}
  </div>
)
/* Feuille iOS « Ajouter le pass » (après un clic sur « Ajouter à Cartes d'Apple ») */
export const FeuilleAjout = ({ t, at = 0, children, tapAdd }) => {
  const a = spring(t, at, 6, 1)
  return (
    <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.5 * a})`, fontFamily: font }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 54 + (1 - a) * 800, bottom: 0, borderRadius: '14px 14px 0 0', background: '#f2f2f7', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', fontSize: 17 }}>
          <span style={{ color: '#007aff' }}>Annuler</span>
          <span style={{ fontWeight: 600, color: '#000' }}>Carte de fidélité</span>
          <span style={{ color: '#007aff', fontWeight: 600, transform: tapAdd ? `scale(${tapAdd})` : undefined }}>Ajouter</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>{children}</div>
      </div>
    </div>
  )
}
/* Application Cartes (Wallet) : titre, boutons, pile de cartes, le pass en avant */
export const WalletApp = ({ children, title = 'Cartes' }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily: font, color: '#fff' }}>
    <div style={{ position: 'absolute', top: 62, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em' }}>{title}</span>
      <span style={{ display: 'flex', gap: 12 }}>
        {['+', '···'].map(s => <span key={s} style={{ width: 36, height: 36, borderRadius: 18, background: '#1c1c1e', display: 'grid', placeItems: 'center', fontSize: s === '+' ? 24 : 18, fontWeight: 600, color: '#fff' }}>{s}</span>)}
      </span>
    </div>
    {children}
  </div>
)
/* Barre Safari (en bas, iOS) avec l'adresse */
export const BarreSafari = ({ url = 'fidelyzapp.fr' }) => (
  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, background: 'rgba(28,28,30,0.92)', backdropFilter: 'blur(20px)', borderTop: '0.5px solid rgba(255,255,255,0.12)', fontFamily: font, zIndex: 25 }}>
    <div style={{ margin: '8px 14px 0', height: 44, borderRadius: 12, background: 'rgba(118,118,128,0.24)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#fff', fontSize: 16 }}>
      <svg width="11" height="14" viewBox="0 0 11 14"><rect x="0.5" y="6" width="10" height="7.5" rx="1.6" fill="#fff" /><path d="M2.6 6V4.2a2.9 2.9 0 0 1 5.8 0V6" stroke="#fff" strokeWidth="1.4" fill="none" /></svg>
      {url}
    </div>
  </div>
)

// ─── MacBook (version paysage) ───
export const MacBook = ({ x = 960, y = 560, s = 1, rx = 0, ry = 0, o = 1, children, W = 1440, H = 900 }) => {
  const k = 1100 / W // l'écran fait 1100 px de large à l'échelle 1
  const sw = W * k, sh = H * k
  return (
    <div style={{ position: 'absolute', left: x - (sw + 44) / 2, top: y - (sh + 40) / 2, width: sw + 44, height: sh + 40, transform: `scale(${s})`, opacity: o, perspective: 3200 }}>
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg)`, transformOrigin: '50% 100%' }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 26, background: 'linear-gradient(180deg,#2c2c2e,#1c1c1e)', boxShadow: '0 0 0 2px #3a3a3c, 0 60px 120px -40px rgba(0,0,0,0.9)' }} />
        <div style={{ position: 'absolute', left: 22, top: 20, width: sw, height: sh, borderRadius: 10, overflow: 'hidden', background: '#000' }}>
          <div style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0', position: 'relative' }}>{children}</div>
        </div>
        <div style={{ position: 'absolute', left: '50%', top: 20, width: 180, height: 24, marginLeft: -90, borderRadius: '0 0 12px 12px', background: '#000' }} />
      </div>
      <div style={{ position: 'absolute', left: -110, right: -110, top: sh + 38, height: 26, borderRadius: '4px 4px 22px 22px', background: 'linear-gradient(180deg,#b9b9be 0%,#8e8e93 40%,#5a5a5e 100%)', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8)' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, width: 200, height: 9, marginLeft: -100, borderRadius: '0 0 10px 10px', background: '#6e6e73' }} />
      </div>
    </div>
  )
}

// ─── Montage : plans et transitions ───
/* Un plan visible de a à b. Les transitions d'entrée/sortie (durée d) :
   'fade' (fondu enchaîné), 'push' (la caméra avance : l'ancien grossit et se floute, le nouveau arrive de plus loin),
   'pull' (inverse), 'up' / 'left' / 'right' (glissement avec flou de mouvement léger), 'iris' (cercle depuis x, y), 'cut'. */
export const Plan = ({ t, a, b, tin = 'fade', tout = 'fade', din = 0.6, dout = 0.6, ox = 540, oy = 960, w = 1080, h = 1920, children, z = 1 }) => {
  if (t < a - (tin === 'cut' ? 0 : din / 2) || t > b + (tout === 'cut' ? 0 : dout / 2)) return null
  const pi = tin === 'cut' ? 1 : ts(t, a - din / 2, a + din / 2, 0, 1, E.io)
  const po = tout === 'cut' ? 0 : ts(t, b - dout / 2, b + dout / 2, 0, 1, E.io)
  let s = 1, x = 0, y = 0, blur = 0, op = 1, clip
  const apply = (type, p, entering) => {
    const q = entering ? 1 - p : p // 0 = plein écran, 1 = parti
    if (q <= 0) return
    switch (type) {
      case 'fade': op *= 1 - q; break
      case 'push': s *= entering ? 1 - 0.14 * q : 1 + 0.35 * q; blur += 18 * q; op *= entering ? 1 - q : 1 - q * q; break
      case 'pull': s *= entering ? 1 + 0.25 * q : 1 - 0.12 * q; blur += 14 * q; op *= 1 - q; break
      case 'up': y += (entering ? 1 : -1) * h * q; blur += 10 * Math.sin(Math.PI * q); break
      case 'left': x += (entering ? 1 : -1) * w * q; blur += 10 * Math.sin(Math.PI * q); break
      case 'right': x += (entering ? -1 : 1) * w * q; blur += 10 * Math.sin(Math.PI * q); break
      case 'iris': if (entering) clip = `circle(${(1 - q) * Math.hypot(w, h)}px at ${ox}px ${oy}px)`; else op *= 1 - q * 0.6; break
      default: break
    }
  }
  apply(tin, pi, true)
  apply(tout, po, false)
  return (
    <AbsoluteFill style={{ zIndex: z, opacity: op, transform: `translate(${x}px, ${y}px) scale(${s})`, filter: blur > 0.3 ? `blur(${blur}px)` : undefined, clipPath: clip }}>
      {children}
    </AbsoluteFill>
  )
}

/* Logo Fidelyz (fichier du site) */
export const Logo = ({ size = 120, style }) => <Img src={staticFile('logo-fidelyz.png')} style={{ width: size, height: size, borderRadius: size * 0.23, ...style }} />

/* Fin commune : logo, nom, promesse, appel à l'action */
export const Fin = ({ t, at, cta = 'Lien en bio', sub = "Gratuit jusqu'à 15 clients", w = 1080, h = 1920, landscape = false }) => {
  const a = spring(t, at, 5, 1)
  const cy = landscape ? 400 : 720
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: w / 2 - 80, top: cy - 80, opacity: a, transform: `scale(${0.8 + 0.2 * a})`, filter: `blur(${(1 - a) * 12}px)` }}><Logo size={160} /></div>
      <Centre y={cy + 110} w={w}><Titre t={t} at={at + 0.2} text="Fidelyz" size={landscape ? 120 : 132} /></Centre>
      <Centre y={cy + 270} w={w}><Titre t={t} at={at + 0.45} text={sub} size={landscape ? 46 : 52} weight={500} color={C.muted} stagger={0.04} /></Centre>
      <Centre y={cy + 380} w={w}><Pastille t={t} at={at + 0.9} size={landscape ? 36 : 42} color={C.blue}>{cta} →</Pastille></Centre>
    </AbsoluteFill>
  )
}
