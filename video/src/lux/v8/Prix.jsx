import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, Montage, W, silk } from '../fx'
import { Pass, PassShot, Phone, PhoneShot, TunnelShot, easeInOut, mix, pr, spline, tex } from '../shots'

/* 8. « Combien ça coûte ? » (série Lumière) : le prix et l'appel à l'action.
   Le pass sous le néon → fouet : iPhone et Android → plongée dans le tunnel de lumière, le prix défile jusqu'à 0 € →
   iris : ce qui est compris (offre gratuite du site : 15 clients, Apple et Google Wallet, sans engagement, 5 min) → néon de fin. */

export const TEX = ['pass-graphite', 'pass-back', 'wallet', 'lock-vide']
export const duree = () => END('lx06') + 2.6

const STEPS = ['29', '19', '9', '0']
const Price = ({ t, a, out }) => {
  const roll = pr(t, a, a + 0.8, k => 1 - Math.pow(1 - k, 4))
  const k = silk((t - a + 0.3) / 0.5)
  const o = pr(t, out, out + 0.4, easeInOut)
  if (k <= 0 || o >= 1) return null
  const H = 420
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: k * (1 - o), filter: o > 0 ? `blur(${o * 14}px)` : undefined }}>
      <div style={{ display: 'flex', alignItems: 'baseline', fontFamily, transform: 'translateY(40px)' }}>
        <div style={{ height: H, overflow: 'hidden', fontSize: H, fontWeight: 150, letterSpacing: '-0.06em', lineHeight: 1, color: '#fff', textShadow: '0 0 40px rgba(255,255,255,0.6), 0 0 140px rgba(41,151,255,0.85)' }}>
          <div style={{ transform: `translateY(${-roll * (STEPS.length - 1) * H}px)`, filter: roll > 0 && roll < 1 ? `blur(${Math.sin(roll * Math.PI) * 8}px)` : undefined }}>
            {STEPS.map(s => <div key={s} style={{ height: H, textAlign: 'right' }}>{s}</div>)}
          </div>
        </div>
        <div style={{ fontSize: 150, fontWeight: 300, color: ACCENT, marginLeft: 18, textShadow: '0 0 40px rgba(41,151,255,0.8)' }}>€</div>
      </div>
    </AbsoluteFill>
  )
}

const ROWS = [
  ['Jusqu’à 15 clients', () => W('lx04', 2)],
  ['Apple & Google Wallet', () => W('lx04', 3) + 0.2],
  ['Sans engagement', () => W('lx04', 4)],
  ['Prête en 5 minutes', () => W('lx05', 2)],
]
const List = ({ t, out }) => {
  const o = pr(t, out, out + 0.4, easeInOut)
  return (
    <div style={{ position: 'absolute', left: 140, right: 140, top: 560, fontFamily, opacity: 1 - o }}>
      {ROWS.map(([label, at], i) => {
        const k = silk((t - at() + 0.1) / 0.55)
        if (k <= 0) return null
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '34px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: k, transform: `translateX(${(1 - k) * -60}px)`, filter: `blur(${(1 - k) * 10}px)` }}>
            <div style={{ width: 58, height: 58, borderRadius: 29, background: ACCENT, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 700, boxShadow: `0 0 30px rgba(41,151,255,${0.7 * k})` }}>✓</div>
            <div style={{ fontSize: 54, fontWeight: 600, letterSpacing: '-0.03em', color: INK }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export const Prix = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('lx02', 0) - 0.35
  const C2 = W('lx03', 0) - 0.4
  const C3 = W('lx04', 0) - 0.35
  const C4 = W('lx06', 0) - 0.45
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'whip',
      render: t => ready && <PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} rot={[0.05, mix(-0.9, -0.2, pr(t, 0, C1, easeInOut)), 0]} cam={spline(t, [[0, [0.6, 0.1, 5.4]], [C1 + 0.5, [0.2, 0.15, 6.0]]])} look={[0, -0.1, 0]} rig={{ sweep: [0.1, 1.9], rimAt: 0.05, z: 1 }} />,
    },
    {
      a: C1,
      b: C2,
      tr: 'zoom',
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={tex('wallet')}
            pos={[-0.6, mix(-2.6, 0, silk((t - C1) / 1.0)), 0]}
            rot={[0, 0.22, 0]}
            cam={spline(t, [[C1, [-0.4, 0.2, 8.0]], [C2 + 0.6, [0.3, 0.2, 7.4]]])}
            look={[0, 0.15, 0]}
            rig={{ rimAt: -1 }}
            extra={
              <group position={[0.6, mix(-2.6, 0, silk((t - W('lx02', 3)) / 1.0)), -0.05]} rotation={[0, -0.22, 0]}>
                <Phone screen={tex('lock-vide')} glow={0.1} android body="#c9c4bb">
                  <Pass map={tex('pass-graphite')} scale={0.6} position={[0, 0.1, 0.085]} />
                </Phone>
              </group>
            }
          />
        ),
    },
    { a: C2, b: C3, tr: 'iris', render: t => ready && <TunnelShot t={t} a={C2} dur={C3 - C2 + 1} /> },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t => ready && <AbsoluteFill style={{ filter: 'blur(12px) brightness(0.45)' }}><PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} rot={[0.05, -0.4 + (t - C3) * 0.3, 0]} cam={[0.5, 0.3, 5.0]} look={[0, 0.2, 0]} rig={{ rimAt: -1 }} /></AbsoluteFill>,
    },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line="Gratuit pour commencer." /> },
  ]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Price t={t} a={W('lx03', 2) - 0.75} out={C3 + 0.1} />
      <Finish t={t} />
      <Line t={t} id="lx01" top={250} size={68} accent={[1]} blue={[3, 4, 5, 6]} />
      <Line t={t} id="lx02" top={250} size={64} blue={[1, 2, 4, 5]} />
      <Line t={t} id="lx03" top={250} size={70} blue={[1]} accent={[2, 3]} />
      <List t={t} out={C4 - 0.2} />
      <Line t={t} id="lx04" top={250} size={58} accent={[0]} />
      <Line t={t} id="lx05" top={250} size={58} />
      <Sound set="lprix" son={son} />
    </AbsoluteFill>
  )
}
