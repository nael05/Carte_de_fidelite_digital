import { AbsoluteFill } from 'remotion'
import { C, displayTokens, fontFamily, getCue, inE, outE, springy, ts, useT } from '../lib'

/* Éléments communs de la version verticale (1080 × 1920).
   Zones sûres TikTok : rien d'important sous y = 1500 (légende et nom du compte)
   ni à droite de x = 930 entre y = 900 et y = 1500 (boutons). */
export const W9 = 1080
export const H9 = 1920

/* Fond : noir, deux lueurs (bleu, champagne) qui dérivent */
export const AuroraV = ({ t, intensity = 1, hue = 0, bare = false }) => {
  const a = t * 0.5 + hue
  return (
    <AbsoluteFill style={{ background: bare ? 'transparent' : '#000', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 540 + Math.cos(a) * 260 - 650, top: 560 + Math.sin(a * 1.3) * 200 - 650, width: 1300, height: 1300, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.26), transparent)', opacity: intensity }} />
      <div style={{ position: 'absolute', left: 540 - Math.cos(a * 0.8) * 280 - 600, top: 1380 - Math.sin(a) * 180 - 600, width: 1200, height: 1200, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(227,201,164,0.18), transparent)', opacity: intensity }} />
    </AbsoluteFill>
  )
}

/* Légende cinétique : chaque mot jaillit (ressort avec dépassement) à l'instant où il est prononcé.
   Les mots non encore prononcés gardent leur place : la mise en page ne bouge pas. */
export const Pop = ({ id, only, size = 100, weight = 800, color = C.text, accent = {}, out, lead = 0.05, maxWidth = 920, lineHeight = 1.0, style, upper = false }) => {
  const t = useT()
  const cue = getCue(id)
  const tokens = displayTokens(cue)
  const [a, b] = only ?? [0, tokens.length - 1]
  const o = out == null ? 0 : ts(t, out, out + 0.2, 0, 1, inE)
  return (
    <div
      style={{
        fontFamily,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '-0.045em',
        lineHeight,
        color,
        maxWidth,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: size * 0.24,
        rowGap: size * 0.02,
        textAlign: 'center',
        textTransform: upper ? 'uppercase' : undefined,
        opacity: 1 - o,
        transform: `translateY(${-o * 70}px) scale(${1 + o * 0.08})`,
        filter: o > 0 ? `blur(${o * 14}px)` : undefined,
        textShadow: '0 8px 50px rgba(0,0,0,0.6)',
        ...style,
      }}
    >
      {tokens.slice(a, b + 1).map((tok, k) => {
        const i = a + k
        const at = cue.at + Math.max(0, cue.words[i].t) - lead
        const sp = springy(t, at, 2.6, 12)
        const show = ts(t, at, at + 0.07, 0, 1, x => x)
        return (
          <span key={i} style={{ display: 'inline-block', whiteSpace: 'nowrap', opacity: show, transform: `translateY(${(1 - Math.min(1, sp)) * 46}px) scale(${0.45 + 0.55 * sp})`, transformOrigin: '50% 80%', color: accent[i] ?? color }}>
            {tok}
          </span>
        )
      })}
    </div>
  )
}

/* Secousse d'impact : décalage pseudo-aléatoire qui s'amortit */
export const shake = (t, at, amp = 16, dur = 0.38) => {
  const x = (t - at) / dur
  if (x < 0 || x > 1) return { x: 0, y: 0, r: 0 }
  const k = Math.pow(1 - x, 2) * amp
  return { x: Math.sin(t * 91) * k, y: Math.cos(t * 77) * k, r: Math.sin(t * 63) * k * 0.05 }
}
export const shakeStyle = s => ({ transform: `translate(${s.x}px, ${s.y}px) rotate(${s.r}deg)` })

/* Éclair d'impact */
export const Flash = ({ t, at, color = '#fff', dur = 0.22, strength = 0.5 }) => {
  const x = (t - at) / dur
  if (x < 0 || x > 1) return null
  return <AbsoluteFill style={{ background: color, opacity: strength * Math.pow(1 - x, 2), pointerEvents: 'none' }} />
}

/* Onde qui part d'un point (retour d'impact) */
export const Ring = ({ t, at, x, y, size = 600, color = 'rgba(41,151,255,0.8)', dur = 0.6, width = 4 }) => {
  const p = ts(t, at, at + dur, 0, 1, outE)
  if (p <= 0 || p >= 1) return null
  const s = size * p
  return <div style={{ position: 'absolute', left: x - s / 2, top: y - s / 2, width: s, height: s, borderRadius: '50%', border: `${width}px solid ${color}`, opacity: 1 - p }} />
}

/* Autocollant : petite étiquette qui claque à l'écran */
export const Sticker = ({ t, at, x, y, rot = -6, children, bg = '#fff', fg = '#000', size = 40 }) => {
  const sp = springy(t, at, 2.4, 11)
  if (t < at) return null
  return (
    <div style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${Math.max(0, sp)})`, padding: `${size * 0.3}px ${size * 0.6}px`, borderRadius: size, background: bg, color: fg, fontFamily, fontSize: size, fontWeight: 800, letterSpacing: '-0.03em', whiteSpace: 'nowrap', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
      {children}
    </div>
  )
}
