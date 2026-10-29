import { AbsoluteFill, Easing, Img, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from 'remotion'
import '@fontsource-variable/inter'

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
