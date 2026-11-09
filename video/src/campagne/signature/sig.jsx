import { AbsoluteFill, Audio, staticFile } from 'remotion'
import { C, E, FPS, Logo, Son, clamp, font, lerp, ts, volMusique } from '../kit'

/* ═══════════ Série « Signature » : grammaire sobre, façon film produit ═══════════
   Une idée par plan, l'objet en héros sous une lumière de studio, reflet au sol, mouvements lents (courbe io),
   texte en une seule ligne qui apparaît en fondu, transitions par fondu enchaîné ou raccord sur l'objet.
   Aucun rebond, aucun flou appuyé, aucune pastille. */

export const S = { out: E.out, io: E.io }

/* Studio noir : noir profond, une lumière douce tombe d'en haut, halo au sol */
export const StudioNoir = ({ w = 1080, h = 1920, sol = 0.62, glow = 1, tint = '255,255,255' }) => (
  <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: w / 2 - w * 0.7, top: -h * 0.35, width: w * 1.4, height: h * 0.95, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(${tint},${0.11 * glow}), transparent)` }} />
    <div style={{ position: 'absolute', left: w / 2 - w * 0.55, top: h * sol - h * 0.08, width: w * 1.1, height: h * 0.2, borderRadius: '50%', background: `radial-gradient(closest-side, rgba(${tint},${0.07 * glow}), transparent)` }} />
  </AbsoluteFill>
)
/* Studio blanc : blanc cassé, sol très légèrement plus sombre */
export const StudioBlanc = () => (
  <AbsoluteFill style={{ background: 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 58%, #ececef 100%)' }} />
)

/* Reflet au sol : la même scène, retournée autour de la ligne `sol`, qui s'efface vite */
export const Reflet = ({ sol, children, o = 0.16, long = 360 }) => (
  <>
    {children}
    <AbsoluteFill style={{ transform: `translateY(${2 * sol}px) scaleY(-1)`, transformOrigin: '0 0', opacity: o, WebkitMaskImage: `linear-gradient(to bottom, transparent ${sol - long}px, #000 ${sol}px, transparent ${sol + 1}px)`, maskImage: `linear-gradient(to bottom, transparent ${sol - long}px, #000 ${sol}px, transparent ${sol + 1}px)`, pointerEvents: 'none' }}>
      {children}
    </AbsoluteFill>
  </>
)

/* Une ligne de texte : fondu et légère montée, sortie en fondu. Le mot `accent` peut être coloré. */
export const Ligne = ({ t, at, out, children, y, size = 76, weight = 650, color = '#f5f5f7', w = 1080, lh = 1.08, maxW = 900, sub }) => {
  const a = ts(t, at, at + 0.7, 0, 1, E.out)
  const o = out == null ? 0 : ts(t, out, out + 0.5, 0, 1, E.io)
  if (a <= 0 || o >= 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, top: y, width: w, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 50, opacity: a * (1 - o), transform: `translateY(${(1 - a) * 18}px)` }}>
      <div style={{ maxWidth: maxW, textAlign: 'center', fontFamily: font, fontSize: size, fontWeight: weight, letterSpacing: '-0.035em', lineHeight: lh, color }}>{children}</div>
      {sub && <div style={{ maxWidth: maxW, textAlign: 'center', fontFamily: font, fontSize: size * 0.42, fontWeight: 500, letterSpacing: '-0.01em', color: 'rgba(134,134,139,1)', marginTop: size * 0.35 }}>{sub}</div>}
    </div>
  )
}

/* Fondu enchaîné doux entre deux plans (sans flou ni zoom), avec une très légère respiration d'échelle */
export const Fondu = ({ t, a, b, d = 0.8, children, w = 1080, h = 1920 }) => {
  if (t < a - d / 2 || t > b + d / 2) return null
  const i = a <= 0 ? 1 : ts(t, a - d / 2, a + d / 2, 0, 1, E.io)
  const o = ts(t, b - d / 2, b + d / 2, 0, 1, E.io)
  const s = 1.015 - 0.015 * i + 0.01 * o
  return <AbsoluteFill style={{ opacity: i * (1 - o), transform: `scale(${s})`, transformOrigin: `${w / 2}px ${h / 2}px` }}>{children}</AbsoluteFill>
}

/* Fin de film : logo, nom, promesse, adresse. Rien d'autre. */
export const FinSig = ({ t, at, dark = true, w = 1080, h = 1920, promesse = 'La fidélité, réinventée.' }) => {
  const a = ts(t, at, at + 1.0, 0, 1, E.out)
  const b = ts(t, at + 0.5, at + 1.4, 0, 1, E.out)
  const c = ts(t, at + 1.1, at + 2.0, 0, 1, E.out)
  const cy = h / 2 - (w > h ? 60 : 120)
  const ink = dark ? '#f5f5f7' : '#1d1d1f'
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: w / 2 - 70, top: cy - 170, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}><Logo size={140} /></div>
      <div style={{ position: 'absolute', left: 0, width: w, top: cy, textAlign: 'center', fontFamily: font, fontSize: 120, fontWeight: 700, letterSpacing: '-0.045em', color: ink, opacity: a, transform: `translateY(${(1 - a) * 14}px)` }}>Fidelyz</div>
      <div style={{ position: 'absolute', left: 0, width: w, top: cy + 160, textAlign: 'center', fontFamily: font, fontSize: 48, fontWeight: 500, letterSpacing: '-0.02em', color: '#86868b', opacity: b }}>{promesse}</div>
      <div style={{ position: 'absolute', left: 0, width: w, top: cy + 250, textAlign: 'center', fontFamily: font, fontSize: 38, fontWeight: 600, color: C.blue, opacity: c }}>fidelyzapp.fr</div>
    </AbsoluteFill>
  )
}

/* Bande-son : musique originale (fondu d'entrée et de sortie), voix, et au plus quelques sons très discrets */
export const BandeSig = ({ Q, video, duree, voix, sons = [] }) => (
  <>
    <Audio src={staticFile(`campagne/musique/${video}.mp3`)} volume={f => {
      const tt = f / FPS
      return Math.min(1, tt / 1.2) * Math.min(1, Math.max(0, (duree - tt) / 2)) * volMusique(Q.$list, tt, voix)
    }} />
    {voix && Q.$list.filter(c => c.voice).map(c => <Son key={c.id} src={`campagne/voix/${c.id}.mp3`} at={c.at - c.lead} />)}
    {sons.map(([src, at], i) => <Son key={i} src={src} at={at} vol={0.3} />)}
  </>
)

export { clamp, lerp, ts }
