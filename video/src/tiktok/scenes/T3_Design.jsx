import { AbsoluteFill } from 'remotion'
import { Timer } from 'lucide-react'
import { C, W, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { Pass } from '../../Pass'
import { AuroraV, Pop, Ring, Sticker } from '../kit'
import { CARD_C } from './T2_Reveal'

/* 3 — Personnalisation (9,4 – 13,3 s)
   La carte tourne sur elle-même. « Logo » : la pastille disparaît et revient en rebondissant.
   Les couleurs changent à chaque temps de la musique, en vagues circulaires qui partent d'un coin.
   « Deux minutes » : le chrono. Puis elle descend vers le scanner (scène 4). */

export const CARD_D = { x: 540, y: 1190, w: 520 } // la carte pendant le scan

const FLIPS = [
  { skin: 'azur', at: 10.78, from: [1080, 300] },
  { skin: 'champagne', at: 11.25, from: [0, 1100] },
  { skin: 'ivory', at: 11.72, from: [1080, 1300] },
  { skin: 'graphite', at: 12.19, from: [0, 500] },
]

export const T3_Design = () => {
  const t = useT()
  if (t < 9.3 || t > 13.5) return null

  const tLogo = W('t05', 1)
  const tDeux = W('t05', 6)

  // Entrée : la carte reprend le vol de la scène 2, déjà de face
  const settle = ts(t, 9.375, 9.55, 0, 1, outE)
  const spin = ts(t, 10.05, 10.95, 0, 360, ioE) // tour complet pendant les premiers temps
  const flip = ts(t, 12.6, 13.1, 0, 1, ioE)
  const pos = {
    x: lerp(CARD_C.x, CARD_D.x, flip),
    y: lerp(CARD_C.y, CARD_D.y, flip),
    w: lerp(CARD_C.w, CARD_D.w, flip),
  }

  // Pastille du logo : sort, puis revient en rebondissant
  const markGone = ts(t, 9.95, 10.04, 1, 0, x => x)
  const markBack = springy(t, tLogo - 0.02, 2.2, 8)
  const markScale = t < tLogo - 0.05 ? markGone : Math.max(0, markBack)

  // Couches de couleur
  const layers = [{ skin: 'graphite', r: 1 }, ...FLIPS.map(f => ({ skin: f.skin, r: ts(t, f.at, f.at + 0.42, 0, 1, ioE), from: f.from }))]
  let base = 0
  layers.forEach((l, i) => { if (l.r >= 1) base = i })
  const pulse = Math.max(...FLIPS.map(f => Math.exp(-Math.max(0, t - f.at) * 7) * (t >= f.at ? 1 : 0)))

  const ry = spin + Math.sin(t * 1.7) * 3
  const common = { width: pos.w, rx: Math.sin(t * 1.3) * 3, ry, light: 0.2 + 0.6 * ts(t, 9.4, 12.3, 0, 1, x => x), points: 460, markScale, markOpacity: Math.min(1, markScale * 2) }

  // Chrono
  const chrono = springy(t, tDeux, 2.4, 10)
  const secs = Math.max(0, Math.round(120 - ts(t, tDeux, 13.0, 0, 120, x => x)))

  return (
    <AbsoluteFill>
      <AuroraV t={t} intensity={0.8 * ts(t, 9.3, 9.8)} hue={2.2} bare />
      <AbsoluteFill style={{ transform: `scale(${1 + pulse * 0.022})` }}>
        <div style={{ position: 'absolute', left: pos.x - pos.w / 2, top: pos.y - (pos.w * 1.58) / 2, opacity: settle }}>
          {layers.slice(base).map((l, k) => (
            <div key={l.skin + k} style={k === 0 ? { position: 'relative' } : { position: 'absolute', inset: 0, clipPath: `circle(${l.r * 150}% at ${(l.from[0] / 1080) * 100}% ${(l.from[1] / 1920) * 100}%)` }}>
              <Pass {...common} skin={l.skin} />
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {FLIPS.map(f => (
        <Ring key={f.at} t={t} at={f.at} x={CARD_C.x} y={CARD_C.y} size={1300} color="rgba(255,255,255,0.35)" width={6} dur={0.5} />
      ))}

      <Sticker t={t} at={tLogo - 0.02} x={210} y={590} rot={-9} size={50} bg={C.champagne} fg="#2b1f12">Logo ✓</Sticker>
      <Sticker t={t} at={W('t05', 3) - 0.05} x={850} y={520} rot={7} size={50} bg="#fff" fg="#000">Couleurs ✓</Sticker>

      {t >= tDeux && t < 13.05 && (
        <div style={{ position: 'absolute', left: 540, top: 1470, transform: `translate(-50%, -50%) scale(${Math.max(0, chrono)})`, display: 'flex', alignItems: 'center', gap: 18, padding: '18px 40px', borderRadius: 999, background: C.blueBtn, color: '#fff', fontFamily: 'Inter Variable, sans-serif', fontSize: 58, fontWeight: 800, letterSpacing: '-0.03em', boxShadow: '0 20px 60px rgba(41,151,255,0.5)' }}>
          <Timer size={52} strokeWidth={2.6} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, '0')}</span>
        </div>
      )}

      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t05" only={[0, 3]} size={116} out={11.22} accent={{ 1: C.champagne, 3: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t05" only={[4, 7]} size={116} out={13.0} accent={{ 6: C.champagne, 7: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}
