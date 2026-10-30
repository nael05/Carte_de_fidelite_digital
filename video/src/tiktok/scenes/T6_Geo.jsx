import { AbsoluteFill } from 'remotion'
import { MapPin } from 'lucide-react'
import { C, fontFamily, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { Notif } from '../../Pass'
import { Flash, Pop, Ring, shake, shakeStyle } from '../kit'
import { PIN } from './T5_Push'

/* 6 — Proximité (21,4 – 24,5 s)
   Les points de la scène précédente convergent et deviennent la boutique sur la carte du quartier.
   Un client passe, entre dans le cercle de proximité : la carte se rappelle à lui, en grand.
   Son trajet deviendra la courbe de la scène suivante. */

const FENCE = 330
const bez = (p0, p1, p2, p3, u) => {
  const v = 1 - u
  return [
    v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
  ]
}
export const TRAIL_N = 48
const P = [[90, 1640], [120, 1260], [330, 1180], [430, 1010]]
export const TRAIL = Array.from({ length: TRAIL_N }, (_, i) => bez(...P, i / (TRAIL_N - 1)))
export const WALK = { a: 22.15, b: 23.05 }

export const T6_Geo = () => {
  const t = useT()
  if (t < 21.35 || t > 24.7) return null

  const map = ts(t, 21.4, 21.85, 0, 1, x => x)
  const pin = springy(t, 21.8, 1.8, 8)
  const fence = ts(t, 22.0, 22.4, 0, 1, outE)
  const walk = ts(t, WALK.a, WALK.b, 0, 1, ioE)
  const n = Math.max(1, Math.round(walk * (TRAIL_N - 1)))
  const [wx, wy] = bez(...P, walk)
  const inside = Math.hypot(wx - PIN.x, wy - PIN.y) < FENCE
  const enterT = WALK.a + (WALK.b - WALK.a) * 0.55
  const walker = ts(t, WALK.a - 0.05, WALK.a + 0.1)
  const call = springy(t, 23.2, 1.9, 8)
  const drift = lerp(1.05, 1, ts(t, 21.4, 24.5, 0, 1, x => x))
  const fade = ts(t, 24.2, 24.5)
  const sh = shake(t, 23.2, 12, 0.3)

  const d = TRAIL.slice(0, n + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

  return (
    <AbsoluteFill style={{ background: '#050608', opacity: map }}>
      <AbsoluteFill style={{ ...shakeStyle(sh), transform: `scale(${drift})`, transformOrigin: `${PIN.x}px ${PIN.y}px`, opacity: 1 - fade }}>
        <svg viewBox="0 0 320 569" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <g fill="none" strokeLinecap="round">
            <path d="M-10 330 C 60 280, 110 360, 180 300 S 290 200, 340 230" stroke="rgba(180,190,210,0.14)" strokeWidth="11" />
            <path d="M60 -10 C 80 150, 110 330, 70 580" stroke="rgba(180,190,210,0.14)" strokeWidth="11" />
            <path d="M240 -10 C 220 160, 270 400, 250 580" stroke="rgba(180,190,210,0.14)" strokeWidth="11" />
            <path d="M-10 120 H 340 M-10 470 H 340 M140 -10 V 580 M290 -10 V 580 M-10 230 H 340" stroke="rgba(180,190,210,0.06)" strokeWidth="3" />
            <path d="M-10 330 C 60 280, 110 360, 180 300 S 290 200, 340 230" stroke="rgba(227,201,164,0.18)" strokeWidth="0.8" />
          </g>
          {[[20, 20, 36, 40], [120, 40, 40, 36], [220, 18, 60, 44], [20, 360, 44, 50], [100, 440, 50, 40], [220, 440, 60, 60], [180, 120, 36, 50], [20, 170, 50, 40]].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
          ))}
        </svg>

        {/* Cercle de proximité */}
        <div style={{ position: 'absolute', left: PIN.x - FENCE, top: PIN.y - FENCE, width: FENCE * 2, height: FENCE * 2, borderRadius: '50%', border: `4px dashed rgba(41,151,255,${0.7 * fence})`, background: `rgba(41,151,255,${0.07 * fence + (inside ? 0.06 : 0)})`, transform: `scale(${0.8 + 0.2 * fence})` }} />
        {[0, 1].map(i => {
          const k = ((t * 30 + i * 30) % 60) / 60
          return <div key={i} style={{ position: 'absolute', left: PIN.x - 40 - k * 120, top: PIN.y - 40 - k * 120, width: 80 + k * 240, height: 80 + k * 240, borderRadius: '50%', border: '3px solid rgba(41,151,255,0.6)', opacity: (1 - k) * Math.min(1, pin) * 0.9 }} />
        })}

        {/* La boutique */}
        <div style={{ position: 'absolute', left: PIN.x - 54, top: PIN.y - 54, width: 108, height: 108, borderRadius: 54, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${Math.max(0, pin)})`, boxShadow: '0 0 80px rgba(41,151,255,0.85)' }}>
          <MapPin size={54} />
        </div>
        <div style={{ position: 'absolute', left: PIN.x - 300, width: 600, top: PIN.y + 78, textAlign: 'center', fontFamily, fontSize: 44, fontWeight: 700, color: C.text, opacity: ts(t, 22.0, 22.3), letterSpacing: '-0.03em' }}>Maison Lumière</div>

        {/* Le client qui passe */}
        <div style={{ position: 'absolute', left: wx - 24, top: wy - 24, width: 48, height: 48, borderRadius: 24, background: C.champagne, boxShadow: '0 0 0 10px rgba(227,201,164,0.25), 0 0 44px rgba(227,201,164,0.95)', opacity: walker }} />
      </AbsoluteFill>

      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0, opacity: walker }}>
        <defs>
          <linearGradient id="t6Trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#e3c9a4" stopOpacity="0" />
            <stop offset="100%" stopColor="#e3c9a4" />
          </linearGradient>
        </defs>
        {t < 24.6 && <path d={d} fill="none" stroke="url(#t6Trail)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />}
      </svg>

      <Ring t={t} at={enterT} x={PIN.x} y={PIN.y} size={FENCE * 2.8} width={7} />
      <Flash t={t} at={23.2} color={C.blue} strength={0.22} />

      {/* La carte se rappelle au client */}
      {t >= 23.2 && (
        <div style={{ position: 'absolute', left: 56, top: 1190, width: 440, transform: `scale(${2.2 * Math.min(1.05, Math.max(0.01, call))})`, transformOrigin: 'top left', opacity: (1 - fade) * ts(t, 23.2, 23.28) }}>
          <Notif title="Maison Lumière · à 50 m" body="Ton café offert t’attend. Passe nous voir !" time="maintenant" />
        </div>
      )}

      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t09" only={[0, 6]} size={108} out={23.15} accent={{ 3: C.blue, 4: C.blue, 5: C.blue, 6: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t09" only={[7, 10]} size={118} out={24.35} accent={{ 10: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}
