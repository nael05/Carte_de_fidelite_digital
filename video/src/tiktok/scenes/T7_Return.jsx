import { AbsoluteFill } from 'remotion'
import { C, camera, fontFamily, geo, ioE, lerp, springy, ts, useT } from '../../lib'
import { AuroraV, Flash, Pop, Sticker } from '../kit'
import { TRAIL, TRAIL_N } from './T6_Geo'

/* 7 — Ils reviennent (24,3 – 28,2 s)
   Le trajet du client se redresse en courbe de fréquentation. Le compteur de clients actifs grimpe
   sur les temps de la musique. Sur « encore » : le temps fort. Puis la caméra plonge dans le dernier point
   de la courbe, qui devient le logo (scène 8). */

const X0 = 90
const X1 = 990
const Y0 = 1380
const CHART = Array.from({ length: TRAIL_N }, (_, i) => {
  const u = i / (TRAIL_N - 1)
  return [lerp(X0, X1, u), Y0 - 600 * Math.pow(u, 1.2) + 34 * Math.sin(u * 12 + 1) * (0.55 + 0.45 * (1 - u))]
})
export const DOT = { x: CHART[TRAIL_N - 1][0], y: CHART[TRAIL_N - 1][1], d: 22 }
export const DOT_END = 12

const BEAT = 60 / 128

export const T7_Return = () => {
  const t = useT()
  if (t < 24.25 || t > 28.2) return null

  const m = ts(t, 24.3, 24.95, 0, 1, ioE)
  const pts = TRAIL.map(([x, y], i) => [lerp(x, CHART[i][0], m), lerp(y, CHART[i][1], m)])
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const area = ts(t, 24.8, 25.3)
  const grid = ts(t, 24.8, 25.3)

  // Compteur : un client de plus à chaque temps, puis le grand saut sur « encore »
  const tEncore = 26.25
  const beats = Math.max(0, Math.floor((Math.min(t, tEncore) - 24.45) / BEAT) + 1)
  const clients = 248 + beats * 3 + (t >= tEncore ? 14 : 0)
  const kpi = springy(t, 24.55, 1.8, 8)
  const bump = Math.exp(-((t - 24.45) % BEAT) * 9) * (t >= 24.45 && t < tEncore ? 1 : 0)

  // Plongée dans le dernier point
  const dive = ts(t, 26.55, 28.1, 0, 1, x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2))
  const cam = camera(DOT.x, DOT.y, geo(dive, 1, DOT_END), Math.min(1, dive * 1.5))
  const rest = 1 - ts(dive, 0, 0.55)

  return (
    <AbsoluteFill>
      <AuroraV t={t} intensity={0.55 * m * rest} hue={5.2} bare />
      <AbsoluteFill style={dive > 0 ? cam : undefined}>
        <div style={{ opacity: grid * rest }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ position: 'absolute', left: X0, width: X1 - X0, top: 820 + i * 140, height: 2, background: 'rgba(255,255,255,0.07)' }} />
          ))}
        </div>
        <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <linearGradient id="t7Line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={m > 0.5 ? '#5e9cff' : '#e3c9a4'} />
              <stop offset="100%" stopColor="#e3c9a4" />
            </linearGradient>
            <linearGradient id="t7Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2997ff" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#2997ff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${X1} ${Y0} L${X0} ${Y0} Z`} fill="url(#t7Fill)" opacity={area * rest} />
          <path d={d} fill="none" stroke="url(#t7Line)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" opacity={rest} />
        </svg>

        {m >= 1 && (
          <>
            {[0, 1].map(i => {
              const k = ((t * 30 + i * 22) % 44) / 44
              return <div key={i} style={{ position: 'absolute', left: DOT.x - DOT.d / 2 - k * 50, top: DOT.y - DOT.d / 2 - k * 50, width: DOT.d + k * 100, height: DOT.d + k * 100, borderRadius: '50%', border: '3px solid rgba(41,151,255,0.7)', opacity: (1 - k) * rest }} />
            })}
            <div style={{ position: 'absolute', left: DOT.x - DOT.d / 2, top: DOT.y - DOT.d / 2, width: DOT.d, height: DOT.d, borderRadius: '50%', background: C.blueBtn, boxShadow: '0 0 0 6px rgba(41,151,255,0.25), 0 0 30px rgba(41,151,255,0.95)' }} />
          </>
        )}

        {/* Compteur de clients actifs */}
        <div style={{ position: 'absolute', left: 0, width: 1080, top: 470, textAlign: 'center', fontFamily, opacity: rest, transform: `scale(${Math.max(0, kpi)})` }}>
          <div style={{ fontSize: 40, fontWeight: 700, color: C.muted, letterSpacing: '0.04em' }}>CLIENTS ACTIFS</div>
          <div style={{ fontSize: 300, fontWeight: 800, color: C.text, letterSpacing: '-0.07em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + bump * 0.05})`, textShadow: bump > 0.3 ? '0 0 80px rgba(41,151,255,0.6)' : 'none' }}>{clients}</div>
        </div>
      </AbsoluteFill>

      <Flash t={t} at={tEncore} color={C.champagne} strength={0.3} />
      <div style={{ opacity: rest }}><Sticker t={t} at={tEncore} x={810} y={800} rot={8} size={62} bg={C.champagne} fg="#2b1f12">+14 d’un coup</Sticker></div>

      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: rest }}>
        <Pop id="t10" only={[0, 1]} size={128} out={25.3} accent={{ 1: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: rest }}>
        <Pop id="t10" only={[2, 4]} size={128} out={27.0} accent={{ 2: C.champagne, 4: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}
