import { AbsoluteFill, Img, staticFile } from 'remotion'
import { Link2 } from 'lucide-react'
import { C, W, fontFamily, ioE, lerp, springy, ts, useT } from '../../lib'
import { AuroraV, Flash, Pop, Ring } from '../kit'
import { DOT, DOT_END } from './T7_Return'

/* 8 — Fin (28 – 34 s)
   Le point de la courbe, grossi au centre, devient l'icône Fidelyz. Puis le nom, la promesse,
   et l'appel : « Lien en bio ». */

const LOGO = 250
const CY = 520

export const T8_End = () => {
  const t = useT()
  if (t < 28.05) return null

  const startD = DOT.d * DOT_END
  const morph = ts(t, 28.05, 28.4, 0, 1, ioE)
  const pop = springy(t, 28.12, 1.7, 7)
  const size = lerp(startD, LOGO, morph) * (1 + 0.07 * Math.sin(Math.PI * morph))
  const up = ts(t, 28.25, 28.75, 0, 1, ioE)
  const y = lerp(960, CY, up)
  const img = ts(t, 28.1, 28.35)
  const end = ts(t, 33.55, 34.0)
  const tBio = W('t13', 0)
  const bio = springy(t, tBio - 0.05, 2.1, 8)
  const bob = Math.sin((t - tBio) * 5) * 10
  const word = 'Fidelyz'

  return (
    <AbsoluteFill style={{ opacity: 1 - end }}>
      <AuroraV t={t} intensity={ts(t, 28.1, 29.0)} hue={6.3} />
      <div style={{ position: 'absolute', left: 540 - 700, top: y - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(41,151,255,0.3), transparent)', opacity: ts(t, 28.05, 28.4) * (1 - 0.5 * ts(t, 29.5, 32)), transform: `scale(${0.6 + 0.4 * pop})` }} />

      <div style={{ position: 'absolute', left: 540 - size / 2, top: y - size / 2, width: size, height: size, borderRadius: lerp(size / 2, size * 0.225, morph), overflow: 'hidden', background: C.blueBtn, boxShadow: `0 ${size * 0.15}px ${size * 0.5}px -${size * 0.1}px rgba(41,151,255,0.5)`, transform: `scale(${0.92 + 0.08 * Math.min(1.1, pop)})` }}>
        <Img src={staticFile('logo-fidelyz.png')} style={{ position: 'absolute', width: size * (500 / 316), height: size * (500 / 316), left: -size * (92 / 316), top: -size * (92 / 316), opacity: img }} />
      </div>

      <div style={{ position: 'absolute', top: 680, width: '100%', textAlign: 'center', fontFamily, fontSize: 210, fontWeight: 800, letterSpacing: '-0.06em', color: C.text, lineHeight: 1 }}>
        {[...word].map((ch, i) => {
          const p = springy(t, 28.6 + i * 0.035, 2.4, 11)
          return (
            <span key={i} style={{ display: 'inline-block', opacity: ts(t, 28.6 + i * 0.035, 28.67 + i * 0.035), transform: `translateY(${(1 - Math.min(1, p)) * 80}px) scale(${0.5 + 0.5 * p})` }}>{ch}</span>
          )
        })}
      </div>

      <div style={{ position: 'absolute', top: 930, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t12" size={108} accent={{ 1: C.champagne }} />
      </div>

      {t >= tBio - 0.05 && (
        <div style={{ position: 'absolute', left: 540, top: 1290, transform: `translate(-50%, -50%) scale(${Math.max(0, bio)})` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '28px 56px', borderRadius: 999, background: C.blueBtn, color: '#fff', fontFamily, fontSize: 76, fontWeight: 800, letterSpacing: '-0.04em', boxShadow: '0 30px 90px rgba(41,151,255,0.55)', whiteSpace: 'nowrap' }}>
            <Link2 size={72} strokeWidth={2.6} /> Lien en bio
          </div>
          <div style={{ textAlign: 'center', marginTop: 18, fontFamily, fontSize: 40, fontWeight: 600, color: C.blue }}>fidelyzapp.fr</div>
        </div>
      )}
      <Ring t={t} at={tBio} x={540} y={1290} size={1000} width={5} />
      <Flash t={t} at={28.1} color={C.blue} strength={0.35} />
    </AbsoluteFill>
  )
}
