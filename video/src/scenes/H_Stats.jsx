import { AbsoluteFill } from 'remotion'
import { Aurora, C, W, Words, camera, fontFamily, geo, ioE, lerp, outE, ts, useT } from '../lib'
import { PIN } from './F_Push'
import { TRAIL, TRAIL_N, geoZoom } from './G_Geo'

/* H — Statistiques (44,4 – 50 s)
   Le tracé du client se redresse en courbe de fréquentation. Les indicateurs arrivent,
   « en temps réel » : ils bougent encore. Puis la caméra plonge dans le dernier point de la courbe,
   qui devient le logo (scène I). */

const X0 = 260
const X1 = 1660
const Y0 = 860
const CHART = Array.from({ length: TRAIL_N }, (_, i) => {
  const u = i / (TRAIL_N - 1)
  return [lerp(X0, X1, u), 820 - 420 * Math.pow(u, 1.25) + 24 * Math.sin(u * 13 + 1) * (0.55 + 0.45 * (1 - u))]
})
export const DOT = { x: CHART[TRAIL_N - 1][0], y: CHART[TRAIL_N - 1][1], d: 16 }
export const DOT_END = 13 // grossissement du point à la fin de la plongée

const MONTHS = ['Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.']

export const H_Stats = () => {
  const t = useT()
  if (t < 44.4 || t > 50.05) return null

  // Le tracé de la carte devient la courbe
  const z = geoZoom(44.45)
  const m = ts(t, 44.45, 45.2, 0, 1, ioE)
  const pts = TRAIL.map(([x, y], i) => {
    const tx = PIN.x + (x - PIN.x) * z
    const ty = PIN.y + (y - PIN.y) * z
    return [lerp(tx, CHART[i][0], m), lerp(ty, CHART[i][1], m)]
  })
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = ts(t, 45.15, 45.7)
  const grid = ts(t, 45.0, 45.5)

  const tLive = W('v12', 6)
  const live = ts(t, tLive - 0.1, tLive + 0.25, 0, 1, outE)
  const kpi = ts(t, 45.3, 46.5, 0, 1, outE)
  const tick = (t >= 47.7 ? 1 : 0) + (t >= 48.5 ? 1 : 0)
  const K = [
    ['Clients actifs', 248 * kpi + tick],
    ['Passages ce mois', 1204 * kpi + tick * 3],
    ['Récompenses offertes', 86 * kpi],
  ]

  // Plongée dans le dernier point
  const dive = ts(t, 49.0, 50.0, 0, 1, x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2))
  const cam = camera(DOT.x, DOT.y, geo(dive, 1, DOT_END), Math.min(1, dive * 1.4))
  const rest = 1 - ts(dive, 0, 0.6)

  return (
    <AbsoluteFill>
      <Aurora t={t} intensity={0.5 * m * rest} hue={5} />
      <AbsoluteFill style={dive > 0 ? cam : undefined}>
        {/* Grille et mois */}
        <div style={{ opacity: grid * rest }}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} style={{ position: 'absolute', left: X0, width: X1 - X0, top: 380 + i * 120, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          ))}
          {MONTHS.map((mo, i) => (
            <div key={mo} style={{ position: 'absolute', left: lerp(X0, X1, i / 5) - 50, width: 100, top: Y0 + 14, textAlign: 'center', fontFamily, fontSize: 18, color: C.muted }}>{mo}</div>
          ))}
        </div>

        <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="hLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={m > 0.5 ? '#5e9cff' : '#e3c9a4'} />
              <stop offset="100%" stopColor="#e3c9a4" />
            </linearGradient>
            <linearGradient id="hFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2997ff" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#2997ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${X1} ${Y0} L${X0} ${Y0} Z`} fill="url(#hFill)" opacity={area * rest} />
          <path d={d} fill="none" stroke="url(#hLine)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity={rest} />
        </svg>

        {/* Le dernier point, « en direct » */}
        {m >= 1 && (
          <>
            {[0, 1].map(i => {
              const k = ((t * 30 + i * 22) % 44) / 44
              return <div key={i} style={{ position: 'absolute', left: DOT.x - 8 - k * 30, top: DOT.y - 8 - k * 30, width: 16 + k * 60, height: 16 + k * 60, borderRadius: '50%', border: '2px solid rgba(41,151,255,0.7)', opacity: (1 - k) * live * rest }} />
            })}
            <div style={{ position: 'absolute', left: DOT.x - DOT.d / 2, top: DOT.y - DOT.d / 2, width: DOT.d, height: DOT.d, borderRadius: '50%', background: C.blueBtn, boxShadow: '0 0 0 4px rgba(41,151,255,0.25), 0 0 18px rgba(41,151,255,0.9)' }} />
            <div style={{ position: 'absolute', left: DOT.x - 150, top: DOT.y - 70, width: 132, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, background: 'rgba(41,151,255,0.16)', color: C.blue, fontFamily, fontSize: 17, fontWeight: 700, opacity: live * rest, transform: `translateY(${(1 - live) * 10}px)` }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: C.blue, opacity: 0.5 + 0.5 * Math.sin(t * 10) }} />
              En direct
            </div>
          </>
        )}

        {/* Indicateurs */}
        <div style={{ position: 'absolute', left: X0, top: 110, width: X1 - X0, display: 'flex', gap: 40, opacity: rest }}>
          {K.map(([l, v], i) => {
            const p = ts(t, 45.15 + i * 0.1, 45.65 + i * 0.1, 0, 1, outE)
            return (
              <div key={l} style={{ flex: 1, height: 150, borderRadius: 24, background: 'rgba(22,22,24,0.9)', border: `1px solid ${C.line}`, padding: '26px 30px', fontFamily, opacity: p, transform: `perspective(1200px) translateY(${(1 - p) * 40}px) rotateX(${(1 - p) * -30}deg)` }}>
                <div style={{ fontSize: 17, color: C.muted, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 56, fontWeight: 700, color: C.text, letterSpacing: '-0.04em', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{Math.round(v).toLocaleString('fr-FR')}</div>
              </div>
            )
          })}
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', top: 950, width: '100%', display: 'flex', justifyContent: 'center', opacity: rest }}>
        <Words id="v12" size={50} weight={600} accent={{ 6: C.blue, 7: C.blue, 8: C.blue }} />
      </div>
    </AbsoluteFill>
  )
}
