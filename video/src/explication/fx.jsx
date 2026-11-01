import { AbsoluteFill, Img, staticFile } from 'remotion'
import { C, W, fontFamily, inE, outE, springy, ts } from '../lib'
import { RECTS, VH, VW } from './device'

/* Effets de montage de la vidéo explicative : rythme, décor animé, transitions, mots qui claquent,
   éléments de l'interface qui jaillissent du téléphone. */

/* ── Rythme ─────────────────────────────────────────────── */
// La musique est recoupée pour que son drop tombe sur « Fidelyz » (scripts/mix-explication.mjs) :
// toute la grille de l'image part de là. 150 BPM : un temps = 0,4 s, une mesure = 1,6 s.
export const R = W('e04', 2)
export const BEAT = 0.4
export const beat = n => R + n * BEAT

/* Pulsation de l'image sur la grosse caisse : légère avant le drop, plus franche après */
export const pulse = t => {
  const x = t - R
  const n = Math.floor(x / BEAT + 1e-6)
  const since = x - n * BEAT
  const bar = ((n % 4) + 4) % 4 === 0
  const amp = t < R ? 0.004 : 0.012
  let k = amp * (bar ? 1.8 : 1) * Math.exp(-since * 10)
  if (t >= R && t < R + 0.6) k += 0.06 * Math.exp(-(t - R) * 6)
  return 1 + k
}

/* ── Décor : sol quadrillé qui défile, poussières, lueurs ─── */
export const Backdrop = ({ t }) => {
  const blue = ts(t, R - 0.05, R + 0.25)
  const speed = t < R ? 60 : 160
  const z = (t * speed) % 120
  const lines = Array.from({ length: 16 }, (_, i) => i)
  return (
    <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
      {/* lueurs */}
      <div style={{ position: 'absolute', left: 540 + Math.cos(t * 0.5) * 240 - 750, top: 560 + Math.sin(t * 0.6) * 200 - 750, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,80,60,0.26), transparent)', opacity: 1 - blue }} />
      <div style={{ position: 'absolute', left: 540 + Math.cos(t * 0.5) * 240 - 750, top: 560 + Math.sin(t * 0.6) * 200 - 750, width: 1500, height: 1500, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.30), transparent)', opacity: blue }} />
      <div style={{ position: 'absolute', left: 540 - Math.cos(t * 0.4) * 300 - 640, top: 1400 - Math.sin(t * 0.5) * 160 - 640, width: 1280, height: 1280, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(227,201,164,0.16), transparent)' }} />
      {/* sol en perspective */}
      <div style={{ position: 'absolute', left: -540, top: 1180, width: 2160, height: 1400, transform: 'perspective(700px) rotateX(72deg)', transformOrigin: '50% 0%', opacity: 0.55, WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 35%)', maskImage: 'linear-gradient(180deg, transparent, #000 35%)' }}>
        <svg width="2160" height="1400" style={{ position: 'absolute', inset: 0 }}>
          {lines.map(i => <line key={`v${i}`} x1={i * 144} y1="0" x2={i * 144} y2="1400" stroke={blue > 0.5 ? 'rgba(41,151,255,0.35)' : 'rgba(255,110,90,0.28)'} strokeWidth="2" />)}
          {Array.from({ length: 13 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 120 + z - 120} x2="2160" y2={i * 120 + z - 120} stroke={blue > 0.5 ? 'rgba(41,151,255,0.35)' : 'rgba(255,110,90,0.28)'} strokeWidth="2" />)}
        </svg>
      </div>
      {/* poussières */}
      {Array.from({ length: 34 }, (_, i) => {
        const sx = (i * 397) % 1080
        const sy = (i * 733) % 1920
        const sp = 18 + (i % 5) * 9
        const y = (sy - t * sp * (t < R ? 1 : 2.2)) % 1920
        const r = 2 + (i % 3)
        return <div key={i} style={{ position: 'absolute', left: sx + Math.sin(t * 0.7 + i) * 30, top: (y + 1920) % 1920, width: r * 2, height: r * 2, borderRadius: r, background: i % 4 ? 'rgba(255,255,255,0.35)' : 'rgba(227,201,164,0.6)', filter: `blur(${i % 3 === 0 ? 2 : 0}px)` }} />
      })}
      {/* vignette */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 45%, transparent 55%, rgba(0,0,0,0.75))' }} />
    </AbsoluteFill>
  )
}

/* ── Transitions entre plans ───────────────────────────────
   Chaque coupe a un type ; le plan sortant (side = 'out') et l'entrant ('in') reçoivent un style.
   D = demi-durée (s). */
export const D = { zoom: 0.28, whip: 0.22, glitch: 0.14, swipe: 0.25, iris: 0.4, cut: 0, flash: 0.12, up: 0.3 }

const glitchSlices = (t, c, seed) => {
  const k = 1 - Math.min(1, Math.abs(t - c) / D.glitch)
  return Array.from({ length: 7 }, (_, i) => ({ top: (i / 7) * 100, h: 100 / 7, dx: Math.sin(i * 12.9898 + seed + Math.floor(t * 30) * 7.1) * 120 * k }))
}

export const shotStyle = (t, c, type, side, opt = {}) => {
  if (type === 'cut' || t === undefined) return {}
  const d = D[type]
  if (side === 'out') {
    const p = ts(t, c - d, c, 0, 1, inE)
    if (p <= 0) return {}
    if (type === 'zoom') return { transform: `scale(${1 + 1.6 * p})`, filter: `blur(${p * 22}px)`, opacity: 1 - 0.6 * p }
    if (type === 'whip') return { transform: `translateX(${(opt.dir ?? -1) * 1400 * p}px)`, filter: `blur(${p * 34}px)` }
    if (type === 'up') return { transform: `translateY(${-1900 * p}px) scale(${1 - 0.2 * p})`, filter: `blur(${p * 26}px)` }
    if (type === 'flash' || type === 'glitch' || type === 'swipe' || type === 'iris') return {}
  } else {
    const p = 1 - ts(t, c, c + d, 0, 1, outE)
    if (p <= 0) return {}
    if (type === 'zoom') return { transform: `scale(${1 - 0.45 * p})`, filter: `blur(${p * 22}px)` }
    if (type === 'whip') return { transform: `translateX(${-(opt.dir ?? -1) * 1400 * p}px)`, filter: `blur(${p * 34}px)` }
    if (type === 'up') return { transform: `translateY(${1900 * p}px)`, filter: `blur(${p * 26}px)` }
    if (type === 'iris') return { clipPath: `circle(${(1 - p) * 2300}px at ${opt.x ?? 540}px ${opt.y ?? 960}px)` }
  }
  return {}
}

/* Un plan : visible de a à b (avec ses transitions), contenu dans une caméra qui avance et pulse */
export const Shot = ({ t, a, b, tin = 'cut', tout = 'cut', oin = {}, oout = {}, push = 0.05, children }) => {
  // Le plan entrant commence à la coupe ; seul le volet circulaire (iris) garde le plan sortant visible après la coupe
  if (t < a || t >= b + (tout === 'iris' ? D.iris : 0)) return null
  const p = Math.max(0, Math.min(1, (t - a) / Math.max(0.1, b - a)))
  const s = (1 + push * p) * pulse(t)
  const style = { ...shotStyle(t, a, tin, 'in', oin), ...shotStyle(t, b, tout, 'out', oout) }
  const glitch = (tin === 'glitch' && t < a + D.glitch) || (tout === 'glitch' && t > b - D.glitch)
  const inner = <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>
  return (
    <AbsoluteFill style={style}>
      {glitch ? (
        glitchSlices(t, tin === 'glitch' && t < a + D.glitch ? a : b, a).map((sl, i) => (
          <AbsoluteFill key={i} style={{ clipPath: `inset(${sl.top}% 0 ${100 - sl.top - sl.h}% 0)`, transform: `translateX(${sl.dx}px)`, filter: i % 2 ? 'hue-rotate(40deg) saturate(1.6)' : undefined }}>{inner}</AbsoluteFill>
        ))
      ) : inner}
    </AbsoluteFill>
  )
}

/* Habillage par-dessus une coupe : traits de vitesse, volet bleu, éclair, bandes de glitch */
export const CutFx = ({ t, c, type, dir = -1 }) => {
  const near = Math.abs(t - c)
  if (type === 'zoom' || type === 'up') {
    const k = 1 - Math.min(1, near / 0.3)
    if (k <= 0) return null
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: k }}>
          {Array.from({ length: 48 }, (_, i) => {
            const a = (i / 48) * Math.PI * 2 + i * 0.37
            const r0 = 260 + ((i * 97) % 200)
            const r1 = r0 + 300 + 500 * k
            return <line key={i} x1={540 + Math.cos(a) * r0} y1={960 + Math.sin(a) * r0} x2={540 + Math.cos(a) * r1} y2={960 + Math.sin(a) * r1} stroke="rgba(255,255,255,0.55)" strokeWidth={2 + (i % 3)} strokeLinecap="round" />
          })}
        </svg>
        <AbsoluteFill style={{ background: '#fff', opacity: 0.35 * Math.pow(k, 3) }} />
      </AbsoluteFill>
    )
  }
  if (type === 'whip') {
    const k = 1 - Math.min(1, near / 0.25)
    if (k <= 0) return null
    return (
      <AbsoluteFill style={{ pointerEvents: 'none', opacity: k }}>
        {Array.from({ length: 22 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', top: (i * 89) % 1920, left: ((i * 431 + (t - c) * 9000 * -dir) % 2400) - 600, width: 500 + (i % 4) * 200, height: 3 + (i % 3) * 2, borderRadius: 4, background: 'rgba(255,255,255,0.5)' }} />
        ))}
      </AbsoluteFill>
    )
  }
  if (type === 'swipe') {
    const p = ts(t, c - D.swipe, c + D.swipe, 0, 1, x => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2))
    if (p <= 0 || p >= 1) return null
    const x = (dir < 0 ? 1 : -1) * (1 - 2 * p) * 2000
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: -600 + x, top: -400, width: 2280, height: 2720, transform: 'rotate(-14deg)', background: `linear-gradient(90deg, ${C.champagne} 0 18px, ${C.blueBtn} 18px calc(100% - 18px), ${C.champagne} calc(100% - 18px))`, boxShadow: '0 0 120px rgba(41,151,255,0.8)' }} />
      </AbsoluteFill>
    )
  }
  if (type === 'flash' || type === 'glitch') {
    const k = 1 - Math.min(1, near / (type === 'flash' ? 0.25 : 0.14))
    if (k <= 0) return null
    return (
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <AbsoluteFill style={{ background: type === 'flash' ? '#fff' : 'transparent', opacity: 0.6 * k * k }} />
        {type === 'glitch' && Array.from({ length: 6 }, (_, i) => (
          <div key={i} style={{ position: 'absolute', left: 0, width: 1080, top: ((i * 331 + Math.floor(t * 30) * 173) % 1920), height: 10 + (i % 3) * 24, background: i % 2 ? 'rgba(255,60,80,0.35)' : 'rgba(41,200,255,0.35)', mixBlendMode: 'screen', opacity: k }} />
        ))}
      </AbsoluteFill>
    )
  }
  return null
}

/* ── Mot qui claque au centre (tampon, chiffre, mot clé) ──── */
export const Slam = ({ t, at, out = at + 1.2, children, size = 200, color = C.text, rot = 0, x = 540, y = 960, stamp = false, glow }) => {
  if (t < at || t > out + 0.2) return null
  const a = springy(t, at, 2.2, 9)
  const o = 1 - ts(t, out, out + 0.18)
  const k = Math.max(0, 1 - (t - at) / 0.35) // décalage rouge / bleu à l'impact
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${2.4 - 1.4 * Math.min(1.04, a)})`, opacity: Math.min(1, (t - at) / 0.06) * o, zIndex: 40, filter: k > 0.6 ? `blur(${(k - 0.6) * 20}px)` : undefined }}>
      <div style={{ fontFamily, fontWeight: 900, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1, color, whiteSpace: 'nowrap', textShadow: `${-12 * k}px 0 rgba(255,40,80,${0.8 * k}), ${12 * k}px 0 rgba(40,200,255,${0.8 * k}), 0 20px 60px rgba(0,0,0,0.6)${glow ? `, 0 0 70px ${glow}` : ''}`, ...(stamp ? { padding: '0.06em 0.22em', border: `${size * 0.07}px solid ${color}`, borderRadius: size * 0.12, textTransform: 'uppercase' } : {}) }}>
        {children}
      </div>
    </div>
  )
}

/* ── Morceau d'écran qui sort du téléphone ─────────────────
   page : capture pleine page ; layers comme AppScreen ; rect : zone (pixels CSS de la page) ; k : échelle. */
export const PageCrop = ({ page, rect, k = 1, layers = [], view = false, radius = 18, shadow = true }) => {
  const H = view ? VH : RECTS[page].height
  return (
    <div style={{ position: 'relative', width: rect.w * k, height: rect.h * k, overflow: 'hidden', borderRadius: radius * k, boxShadow: shadow ? '0 40px 90px -10px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.08)' : 'none', background: '#000' }}>
      <div style={{ position: 'absolute', left: -rect.x * k, top: -rect.y * k, width: VW, height: H, transformOrigin: '0 0', transform: `scale(${k})` }}>
        <Img src={staticFile(`explication/ecrans/${page}.png`)} style={{ position: 'absolute', left: 0, top: 0, width: VW, height: H }} />
        {layers.map((l, i) => (l.opacity ?? 1) > 0 && (
          <Img key={i} src={staticFile(`explication/ecrans/${l.page}.png`)} style={{ position: 'absolute', left: 0, top: 0, width: VW, height: l.view ? VH : RECTS[l.page].height, opacity: l.opacity ?? 1, clipPath: l.clip }} />
        ))}
      </div>
    </div>
  )
}

/* Gerbe d'étincelles autour d'un point */
export const Sparks = ({ t, at, x, y, n = 18, color = C.champagne, dist = 260 }) => {
  const p = ts(t, at, at + 0.7, 0, 1, outE)
  if (p <= 0 || p >= 1) return null
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + i * 0.3
    const r = dist * (0.6 + 0.4 * ((i * 7) % 5) / 5) * p
    return <div key={i} style={{ position: 'absolute', left: x + Math.cos(a) * r - 5, top: y + Math.sin(a) * r - 5 + 80 * p * p, width: 10, height: 10, borderRadius: i % 3 ? 5 : 2, background: i % 2 ? color : C.blue, opacity: 1 - p, transform: `scale(${1 - 0.5 * p})`, boxShadow: `0 0 12px ${color}` }} />
  })
}

/* Barre de progression en haut de l'écran */
export const Progress = ({ t, dur }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 8, background: 'rgba(255,255,255,0.08)', zIndex: 90 }}>
    <div style={{ width: `${Math.min(100, (t / dur) * 100)}%`, height: '100%', background: `linear-gradient(90deg, ${C.blue}, ${C.champagne})`, boxShadow: '0 0 14px rgba(41,151,255,0.8)' }} />
  </div>
)
