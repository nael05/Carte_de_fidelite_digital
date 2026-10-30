import { AbsoluteFill } from 'remotion'
import { MapPin } from 'lucide-react'
import { C, W, Words, fontFamily, ioE, lerp, outE, springy, ts, useT } from '../lib'
import { Notif } from '../Pass'
import { PIN } from './F_Push'

/* G — Proximité (39,4 – 45 s)
   Vue du dessus du quartier. Les points convergent vers la boutique. Un client passe :
   il entre dans le cercle de proximité, sa carte s'affiche avec un message.
   Son tracé deviendra la courbe des statistiques (scène H). */

const bez = (p0, p1, p2, p3, u) => {
  const v = 1 - u
  return [
    v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0],
    v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1],
  ]
}
export const TRAIL_N = 48
// Trajet du client, échantillonné (utilisé aussi pour le fondu vers la courbe)
export const TRAIL = Array.from({ length: TRAIL_N }, (_, i) => bez([180, 1040], [420, 760], [560, 880], [760, 650], i / (TRAIL_N - 1)))
export const WALK = { a: 41.3, b: 42.7 }
// Léger travelling vertical sur le quartier
export const geoZoom = t => lerp(1.25, 1, ts(t, 39.45, 41.0, 0, 1, outE)) * lerp(1, 1.04, ts(t, 41, 44.6, 0, 1, x => x))
const FENCE = 250

export const G_Geo = () => {
  const t = useT()
  if (t < 39.4 || t > 44.9) return null

  const map = ts(t, 39.45, 40.3, 0, 1, x => x)
  const zoom = geoZoom(t)
  const pin = springy(t, 40.45, 2.2, 7)
  const label = ts(t, 40.7, 41.0)
  const fence = ts(t, 41.4, 41.8, 0, 1, outE)
  const walk = ts(t, WALK.a, WALK.b, 0, 1, ioE)
  const n = Math.max(1, Math.round(walk * (TRAIL_N - 1)))
  const [wx, wy] = bez([180, 1040], [420, 760], [560, 880], [760, 650], walk)
  const inside = Math.hypot(wx - PIN.x, wy - PIN.y) < FENCE
  const enterT = 42.45
  const ripple = ts(t, enterT, enterT + 0.8, 0, 1, x => x)
  const call = ts(t, W('v11', 8) + 0.05, W('v11', 8) + 0.45, 0, 1, outE)
  const fade = ts(t, 44.25, 44.6) // tout s'efface sauf le tracé (scène H)
  const walkerOn = ts(t, 41.2, 41.4)

  const d = TRAIL.slice(0, n + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')

  return (
    <AbsoluteFill style={{ background: '#050608', opacity: map }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: `${PIN.x}px ${PIN.y}px`, opacity: 1 - fade }}>
        <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          <g fill="none" strokeLinecap="round">
            <path d="M-10 128 C 60 108, 110 148, 180 108 S 290 48, 340 68" stroke="rgba(180,190,210,0.13)" strokeWidth="9" />
            <path d="M40 -10 C 60 60, 90 110, 70 210" stroke="rgba(180,190,210,0.13)" strokeWidth="9" />
            <path d="M210 -10 C 200 70, 240 120, 230 210" stroke="rgba(180,190,210,0.13)" strokeWidth="9" />
            <path d="M-10 52 H 340 M140 -10 V 210 M-10 160 H 340 M285 -10 V 210 M100 -10 V 210" stroke="rgba(180,190,210,0.06)" strokeWidth="3" />
            <path d="M-10 128 C 60 108, 110 148, 180 108 S 290 48, 340 68" stroke="rgba(227,201,164,0.16)" strokeWidth="0.6" />
          </g>
          {[[18, 18, 26, 20], [118, 14, 30, 24], [250, 20, 26, 22], [20, 140, 32, 24], [160, 132, 34, 22], [250, 120, 28, 26], [110, 66, 22, 30], [180, 60, 20, 26]].map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="2" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" />
          ))}
        </svg>

        {/* Cercle de proximité */}
        <div style={{ position: 'absolute', left: PIN.x - FENCE, top: PIN.y - FENCE, width: FENCE * 2, height: FENCE * 2, borderRadius: '50%', border: `2px dashed rgba(41,151,255,${0.6 * fence})`, background: `rgba(41,151,255,${0.06 * fence + (inside ? 0.05 : 0)})`, transform: `scale(${0.8 + 0.2 * fence})` }} />
        {ripple > 0 && ripple < 1 && (
          <div style={{ position: 'absolute', left: PIN.x - FENCE * (1 + ripple * 0.5), top: PIN.y - FENCE * (1 + ripple * 0.5), width: FENCE * 2 * (1 + ripple * 0.5), height: FENCE * 2 * (1 + ripple * 0.5), borderRadius: '50%', border: `3px solid rgba(41,151,255,${0.7 * (1 - ripple)})` }} />
        )}
        {[0, 1].map(i => {
          const k = ((t * 30 + i * 30) % 60) / 60
          return <div key={i} style={{ position: 'absolute', left: PIN.x - 30 - k * 80, top: PIN.y - 30 - k * 80, width: 60 + k * 160, height: 60 + k * 160, borderRadius: '50%', border: '2px solid rgba(41,151,255,0.55)', opacity: (1 - k) * pin * 0.8 }} />
        })}

        {/* La boutique */}
        <div style={{ position: 'absolute', left: PIN.x - 32, top: PIN.y - 32, width: 64, height: 64, borderRadius: 32, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', transform: `scale(${Math.max(0, pin)})`, boxShadow: '0 0 40px rgba(41,151,255,0.8)' }}>
          <MapPin size={30} />
        </div>
        <div style={{ position: 'absolute', left: PIN.x + 52, top: PIN.y - 20, fontFamily, fontSize: 28, fontWeight: 600, color: C.text, opacity: label, transform: `translateX(${(1 - label) * -12}px)` }}>Maison Lumière</div>

        {/* Le client qui passe */}
        <div style={{ position: 'absolute', left: wx - 13, top: wy - 13, width: 26, height: 26, borderRadius: 13, background: C.champagne, boxShadow: '0 0 0 6px rgba(227,201,164,0.25), 0 0 24px rgba(227,201,164,0.9)', opacity: walkerOn }} />
      </AbsoluteFill>

      {/* Tracé du client (reste visible pendant le fondu) */}
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0, opacity: walkerOn }}>
        <defs>
          <linearGradient id="trailG" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#e3c9a4" stopOpacity="0" />
            <stop offset="100%" stopColor="#e3c9a4" />
          </linearGradient>
        </defs>
        {t < 44.45 && <path d={d} fill="none" stroke="url(#trailG)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: `scale(${zoom})`, transformOrigin: `${PIN.x}px ${PIN.y}px` }} />}
      </svg>

      {/* La carte se rappelle au client */}
      {call > 0 && (
        <div style={{ position: 'absolute', left: 110, top: 300, width: 440, transform: `scale(${1.75 * (0.9 + 0.1 * call)})`, transformOrigin: 'left top', opacity: call * (1 - fade) }}>
          <Notif title="Maison Lumière · à 50 m" body="Votre café offert vous attend. Passez nous voir !" time="maintenant" />
        </div>
      )}

      <div style={{ position: 'absolute', top: 920, width: '100%', display: 'flex', justifyContent: 'center', opacity: 1 - fade }}>
        <Words id="v11" size={52} weight={600} maxWidth={1500} style={{ textAlign: 'center' }} accent={{ 4: C.blue, 5: C.blue, 6: C.blue, 7: C.blue }} />
      </div>
    </AbsoluteFill>
  )
}
