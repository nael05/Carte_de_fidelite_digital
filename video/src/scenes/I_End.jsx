import { AbsoluteFill, Img, staticFile } from 'remotion'
import { Aurora, C, W, Words, fontFamily, ioE, lerp, outE, springy, ts, useT } from '../lib'
import { DOT, DOT_END } from './H_Stats'

/* I — Fin (50 – 58 s)
   Le point de la courbe, grossi au centre du cadre, devient l'icône Fidelyz (le cercle se fait carré arrondi),
   puis le nom, la promesse et l'adresse du site. */

const LOGO = 176

export const I_End = () => {
  const t = useT()
  if (t < 49.97) return null

  const startD = DOT.d * DOT_END
  const morph = ts(t, 49.97, 50.35, 0, 1, ioE)
  const pop = springy(t, 49.97, 1.6, 6)
  const size = lerp(startD, LOGO, morph) * (1 + 0.06 * Math.sin(Math.PI * morph))
  const up = ts(t, 50.25, 50.85, 0, 1, ioE)
  const y = lerp(540, 330, up)
  const img = ts(t, 50.0, 50.3)
  const end = ts(t, 57.0, 58.0, 0, 1, x => x)

  const word = 'Fidelyz'
  const site = 'fidelyzapp.fr'
  const tSite = W('v15', 0)

  return (
    <AbsoluteFill style={{ opacity: 1 - end }}>
      <Aurora t={t} intensity={ts(t, 50, 51.2, 0, 1, x => x)} hue={6} />

      {/* Halo qui s'ouvre au moment où le cercle devient le logo */}
      <div style={{ position: 'absolute', left: 960 - 600, top: y - 600, width: 1200, height: 1200, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.28), transparent)', opacity: ts(t, 49.97, 50.3) * (1 - 0.5 * ts(t, 51, 53)), transform: `scale(${0.6 + 0.4 * pop})` }} />

      <div
        style={{
          position: 'absolute',
          left: 960 - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: lerp(size / 2, size * 0.225, morph),
          overflow: 'hidden',
          background: C.blueBtn,
          boxShadow: `0 ${size * 0.15}px ${size * 0.5}px -${size * 0.1}px rgba(41,151,255,0.45)`,
          transform: `scale(${0.92 + 0.08 * Math.min(1.1, pop)})`,
        }}
      >
        <Img src={staticFile('logo-fidelyz.png')} style={{ position: 'absolute', width: size * (500 / 316), height: size * (500 / 316), left: -size * (92 / 316), top: -size * (92 / 316), opacity: img }} />
      </div>

      <div style={{ position: 'absolute', top: 470, width: '100%', textAlign: 'center', fontFamily, fontSize: 150, fontWeight: 700, letterSpacing: '-0.055em', color: C.text, lineHeight: 1 }}>
        {[...word].map((ch, i) => {
          const p = ts(t, 50.35 + i * 0.04, 50.75 + i * 0.04, 0, 1, outE)
          return (
            <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: '0.06em' }}>
              <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)` }}>{ch}</span>
            </span>
          )
        })}
      </div>

      <div style={{ position: 'absolute', top: 668, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v14" size={64} weight={600} color="rgba(245,245,247,0.92)" accent={{ 1: C.champagne }} />
      </div>

      <div style={{ position: 'absolute', top: 800, width: '100%', textAlign: 'center', fontFamily, fontSize: 46, fontWeight: 600, color: C.blue, letterSpacing: '-0.02em' }}>
        {[...site].map((ch, i) => {
          const p = ts(t, tSite - 0.1 + i * 0.03, tSite + 0.25 + i * 0.03, 0, 1, outE)
          return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 16}px)`, filter: `blur(${(1 - p) * 6}px)` }}>{ch}</span>
        })}
      </div>
      <div style={{ position: 'absolute', top: 878, width: '100%', textAlign: 'center', fontFamily, fontSize: 24, fontWeight: 500, color: C.muted, opacity: ts(t, tSite + 0.6, tSite + 1.1), letterSpacing: '0.02em' }}>
        Apple Wallet · Google Wallet
      </div>
    </AbsoluteFill>
  )
}
