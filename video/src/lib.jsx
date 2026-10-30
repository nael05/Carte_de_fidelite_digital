import { AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from 'remotion'
import '@fontsource-variable/inter'
import VOIX_MAIN from './voix.json'
import VOIX_TIKTOK from './voix-tiktok.json'

// Répliques des deux versions (identifiants distincts : vNN en 16:9, tNN en vertical)
const VOIX = [...VOIX_MAIN, ...VOIX_TIKTOK]

// Inter embarquée dans le bundle (aucun appel réseau pendant le rendu)
export const fontFamily = '"Inter Variable", "Inter", sans-serif'
const fontHandle = delayRender('Chargement de Inter')
Promise.all(['300', '400', '500', '600', '700'].map(w => document.fonts.load(`${w} 20px "Inter Variable"`)))
  .then(() => continueRender(fontHandle))
  .catch(() => continueRender(fontHandle))

export const FPS = 30
export const sec = s => Math.round(s * FPS)

// Tokens de la DA du site (frontend/src/index.css, Home.css)
export const C = {
  black: '#000000',
  surface: '#111113',
  raised: '#1c1c1e',
  line: 'rgba(255, 255, 255, 0.08)',
  blue: '#2997ff',
  blueBtn: '#0071e3',
  champagne: '#e3c9a4',
  text: '#f5f5f7',
  muted: 'rgba(245, 245, 247, 0.56)',
}

// Courbes de la grammaire du mouvement
export const outE = Easing.bezier(0.16, 1, 0.3, 1)
export const inE = Easing.bezier(0.7, 0, 0.84, 0)
export const ioE = Easing.bezier(0.65, 0, 0.35, 1)

export const tw = (f, a, b, from = 0, to = 1, easing = outE) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })

export const lerp = (a, b, t) => a + (b - a) * t

// Zoom géométrique : la vitesse perçue reste constante, comme un vrai travelling
export const geo = (t, a, b) => a * Math.pow(b / a, t)

/* Caméra virtuelle : amène le point (cx, cy) vers le centre du cadre (selon move)
   et agrandit la scène s fois autour de ce point. */
export const camera = (cx, cy, s, move = 1) => ({
  transformOrigin: `${cx}px ${cy}px`,
  transform: `translate(${(960 - cx) * move}px, ${(540 - cy) * move}px) scale(${s})`,
})

// ─── Temps absolu, en secondes (toutes les scènes sont posées sur la même timeline) ───
export const useT = () => useCurrentFrame() / FPS
export const ts = (t, a, b, from = 0, to = 1, easing = outE) =>
  interpolate(t, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
export const lin = x => x
export const clamp01 = x => Math.max(0, Math.min(1, x))
// Ressort amorti (dépassement puis retour) pour les arrivées « physiques »
export const springy = (t, a, freq = 2, damp = 8) =>
  t <= a ? 0 : 1 - Math.exp(-damp * (t - a)) * Math.cos(2 * Math.PI * freq * (t - a))

// Instant (s) où la voix prononce le n-ième mot d'une réplique, d'après src/voix.json
export const W = (id, n = 0) => {
  const c = VOIX.find(v => v.id === id)
  return c.at + Math.max(0, c.words[n].t)
}
export const cueEnd = id => {
  const c = VOIX.find(v => v.id === id)
  return c.at + c.dur
}

// Mots affichés : le texte écrit (`text`), découpé comme les mots prononcés
export const getCue = id => VOIX.find(v => v.id === id)
export const displayTokens = cue => {
  const raw = cue.text.split(/\s+/).filter(Boolean)
  const tokens = []
  for (const r of raw) {
    if (/^[:;!?…]+$/.test(r) && tokens.length) tokens[tokens.length - 1] += ' ' + r
    else tokens.push(r)
  }
  return tokens.length === cue.words.length ? tokens : cue.words.map(w => w.w)
}

/* Typographie cinétique calée sur la voix : chaque mot monte de derrière un cache
   à l'instant où il est prononcé. `accent` : { indice: couleur }. `only` : [premier, dernier] mot affiché. */
export const Words = ({ id, size = 76, weight = 650, color = C.text, accent = {}, out, only, lead = 0.08, style, lineHeight = 1.06, maxWidth }) => {
  const t = useT()
  const cue = VOIX.find(v => v.id === id)
  const tokens = displayTokens(cue)
  const [a, b] = only ?? [0, tokens.length - 1]
  const o = out == null ? 0 : ts(t, out, out + 0.3, 0, 1, inE)
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.04em',
        lineHeight,
        color,
        maxWidth,
        opacity: 1 - o,
        transform: `translateY(${-o * 40}px)`,
        filter: o > 0 ? `blur(${o * 10}px)` : undefined,
        ...style,
      }}
    >
      {tokens.slice(a, b + 1).map((tok, k) => {
        const i = a + k
        const at = cue.at + Math.max(0, cue.words[i].t) - lead
        const p = ts(t, at, at + 0.32, 0, 1, outE)
        return (
          <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.08em', marginBottom: '-0.08em' }}>
            <span
              style={{
                display: 'inline-block',
                transform: `translateY(${(1 - p) * 105}%) rotate(${(1 - p) * 4}deg)`,
                transformOrigin: 'left bottom',
                color: accent[i] ?? color,
                whiteSpace: 'pre',
              }}
            >
              {tok}
              {k < b - a ? ' ' : ''}
            </span>
          </span>
        )
      })}
    </div>
  )
}

/* Flou de mouvement directionnel (filtre SVG) : <MBlur id x y /> puis style filter: url(#id) */
export const MBlur = ({ id, x = 0, y = 0 }) => (
  <svg width="0" height="0" style={{ position: 'absolute' }}>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={`${Math.max(0, x)} ${Math.max(0, y)}`} />
    </filter>
  </svg>
)

/* Fond : noir profond, deux lueurs (bleu, champagne) qui dérivent lentement */
export const Aurora = ({ t, intensity = 1, hue = 0 }) => {
  const a = t * 0.35 + hue
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 960 + Math.cos(a) * 380 - 700, top: 420 + Math.sin(a * 1.3) * 160 - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.22), transparent)', opacity: intensity }} />
      <div style={{ position: 'absolute', left: 960 - Math.cos(a * 0.8) * 420 - 600, top: 660 - Math.sin(a) * 140 - 600, width: 1200, height: 1200, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(227,201,164,0.16), transparent)', opacity: intensity }} />
    </AbsoluteFill>
  )
}

/* Texte qui entre par un flou qui se règle, sort par un flou */
export const Type = ({ children, at, out, size = 64, weight = 600, color = C.text, style }) => {
  const f = useCurrentFrame()
  const i = tw(f, at, at + 26)
  const o = out == null ? 0 : tw(f, out, out + 16, 0, 1, inE)
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.035em',
        lineHeight: 1.08,
        color,
        opacity: i * (1 - o),
        filter: `blur(${(1 - i) * 16 + o * 12}px)`,
        transform: `translateY(${(1 - i) * 18}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/* Texte lettre par lettre, chaque lettre sort d'un flou */
export const LetterType = ({ text, at, out, size = 64, weight = 600, color = C.text, stagger = 1.6, style }) => {
  const f = useCurrentFrame()
  const o = out == null ? 0 : tw(f, out, out + 16, 0, 1, inE)
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.035em',
        lineHeight: 1.08,
        color,
        whiteSpace: 'pre',
        opacity: 1 - o,
        filter: `blur(${o * 12}px)`,
        ...style,
      }}
    >
      {[...text].map((ch, k) => {
        const p = tw(f, at + k * stagger, at + k * stagger + 20)
        return (
          <span
            key={k}
            style={{
              display: 'inline-block',
              opacity: p,
              filter: `blur(${(1 - p) * 10}px)`,
              transform: `translateY(${(1 - p) * 12}px)`,
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </span>
        )
      })}
    </div>
  )
}

/* Halo de lumière douce */
export const Spot = ({ x, y, size, color = 'rgba(255,255,255,0.12)', opacity = 1 }) => (
  <div
    style={{
      position: 'absolute',
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: '50%',
      background: `radial-gradient(closest-side, ${color}, transparent)`,
      opacity,
    }}
  />
)

/* Grain de film + vignettage, posés sur toute la vidéo */
export const Grain = () => {
  const f = useCurrentFrame()
  const seed = f % 8
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
      <AbsoluteFill style={{ mixBlendMode: 'overlay', opacity: 0.1 }}>
        <svg width="100%" height="100%">
          <filter id={`grain${seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={seed} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter={`url(#grain${seed})`} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* Logo Fidelyz (frontend/public/logo-fidelyz.png), recadré sur l'icône */
export const Logo = ({ size = 120, style }) => {
  const k = size / 316
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.225,
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
        boxShadow: `0 ${size * 0.15}px ${size * 0.5}px -${size * 0.1}px rgba(41,151,255,0.35)`,
        ...style,
      }}
    >
      <Img
        src={staticFile('logo-fidelyz.png')}
        style={{ position: 'absolute', width: 500 * k, height: 500 * k, left: -92 * k, top: -92 * k }}
      />
    </div>
  )
}

/* iPhone titane, écran 416 × 876 */
export const PHONE = { w: 440, h: 900, bezel: 12 }
export const SCREEN = { w: PHONE.w - 2 * PHONE.bezel, h: PHONE.h - 2 * PHONE.bezel }

export const Phone = ({ children, style, frame = 1, screenBg = '#000', island = true }) => (
  <div style={{ position: 'relative', width: PHONE.w, height: PHONE.h, ...style }}>
    <div
      style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 76,
        opacity: frame,
        background: 'linear-gradient(135deg, #a1a1a6 0%, #3a3a3e 20%, #6e6e73 48%, #2c2c2e 76%, #a1a1a6 100%)',
        boxShadow: '0 60px 120px -40px rgba(0,0,0,0.95), inset 0 0 0 1.5px rgba(255,255,255,0.28)',
      }}
    />
    <div
      style={{
        position: 'absolute',
        inset: PHONE.bezel,
        borderRadius: 64,
        overflow: 'hidden',
        background: screenBg,
      }}
    >
      {children}
      {island && (
        <div
          style={{
            position: 'absolute',
            top: 14,
            left: '50%',
            width: 120,
            height: 34,
            marginLeft: -60,
            borderRadius: 20,
            background: '#000',
            opacity: frame,
          }}
        />
      )}
    </div>
  </div>
)
