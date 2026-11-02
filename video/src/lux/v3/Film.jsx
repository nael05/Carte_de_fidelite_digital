import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, Mirror, Neon, NotifDrop, Pass, PassShot, Phone, PhoneShot, Rig, TunnelShot, clamp, easeInOut, mix, pr, spline, tex } from '../shots'

/* 3. « Fidelyz en 30 secondes » (série Lumière) : le film produit.
   Le pass sort du noir (de profil, sa tranche est un trait de lumière) → fouet : iPhone et Android → liquide : tunnel de lumière, « 0 »
   → plongée : le pass change de couleur → montée : un laser le scanne, +20 → iris : la notification → néon de fin. */

export const TEX = ['pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory', 'pass-graphite-500', 'pass-back', 'wallet', 'lock-vide', 'lock-campagne', 'notif-campagne']
export const duree = () => END('lf08') + 2.4

const Zero = ({ t, a, b }) => {
  const k = silk((t - a - 0.2) / 0.9)
  const o = pr(t, b - 0.2, b + 0.3, easeInOut)
  if (k <= 0 || o >= 1) return null
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, opacity: k * (1 - o) }}>
      <div style={{ fontSize: 620, fontWeight: 150, letterSpacing: '-0.06em', lineHeight: 1, color: '#fff', transform: `translateY(-40px) scale(${mix(1.25, 1, k)})`, filter: `blur(${(1 - k) * 24}px)`, textShadow: '0 0 40px rgba(255,255,255,0.6), 0 0 140px rgba(41,151,255,0.8)' }}>0</div>
    </AbsoluteFill>
  )
}

export const Film = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('lf03', 0) - 0.4
  const C2 = W('lf04', 0) - 0.35
  const C3 = W('lf05', 0) - 0.35
  const C4 = W('lf06', 0) - 0.3
  const C5 = W('lf07', 0) - 0.35
  const C6 = W('lf08', 0) - 0.45
  const SK = [W('lf05', 2), W('lf05', 3), W('lf05', 3) + 0.45]
  const skin = ['pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory'][SK.filter(s => t >= s).length]
  const spin = SK.reduce((a, s) => a + pr(t, s - 0.3, s + 0.3, easeInOut), 0)
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'whip',
      render: t =>
        ready && (
          <PassShot
            t={t}
            map={tex('pass-graphite')}
            back={tex('pass-back')}
            rot={[0.05, mix(-1.52, -0.18, pr(t, 0.4, W('lf02', 2), easeInOut)), 0]}
            cam={spline(t, [[0, [0.25, 0.1, 4.4]], [C1 + 0.6, [0.2, 0.15, 5.6]]])}
            look={[0, 0.3, 0]}
            rig={{ sweep: [W('lf01', 1) - 0.3, W('lf01', 1) + 1.4], rimAt: W('lf01', 1) + 0.2, z: 1.0 }}
          />
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'liquid',
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={tex('wallet')}
            pos={[-0.6, mix(-2.6, 0, silk((t - C1) / 1.2)), 0]}
            rot={[0, 0.22, 0]}
            cam={spline(t, [[C1, [-0.5, 0.2, 8.0]], [C2 + 0.8, [0.35, 0.2, 7.5]]])}
            look={[0, 0.15, 0]}
            rig={{ rimAt: -1 }}
            extra={
              <group position={[0.6, mix(-2.6, 0, silk((t - W('lf03', 3)) / 1.2)), -0.05]} rotation={[0, -0.22, 0]}>
                <Phone screen={tex('lock-vide')} glow={0.1} android body="#c9c4bb">
                  <Pass map={tex('pass-graphite')} scale={0.6} position={[0, 0.1, 0.085]} />
                </Phone>
              </group>
            }
          />
        ),
    },
    { a: C2, b: C3, tr: 'zoom', render: t => ready && <TunnelShot t={t} a={C2} dur={C3 - C2 + 0.6} /> },
    {
      a: C3,
      b: C4,
      tr: 'rise',
      render: t =>
        ready && (
          <PassShot
            t={t}
            map={tex(skin)}
            back={tex('pass-back')}
            rot={[0.05, Math.PI * 2 * spin - 0.2 + Math.sin(t) * 0.05, 0]}
            cam={spline(t, [[C3, [0.5, 0.2, 5.2]], [C4 + 0.6, [-0.2, 0.15, 5.6]]])}
            look={[0, 0.2, 0]}
            rig={{ rimAt: -1, sweep: [SK[0] - 0.4, SK[2] + 0.3], z: 1.0 }}
          />
        ),
    },
    {
      a: C4,
      b: C5,
      tr: 'iris',
      render: t => {
        const laser = pr(t, W('lf06', 1) - 0.1, W('lf06', 1) + 0.8, easeInOut)
        const up = t >= W('lf06', 6)
        const flash = Math.max(0, 1 - Math.abs(t - W('lf06', 6)) * 3)
        return (
          ready && (
            <Lux>
              <Cam pos={spline(t, [[C4, [0.2, 0.1, 5.4]], [W('lf06', 1), [0.05, 0.05, 4.6]], [C5 + 0.8, [0, 0.1, 5.0]]])} look={spline(t, [[C4, [0, 0.25, 0]], [W('lf06', 1), [0, 0.12, 0]], [C5 + 0.8, [0, 0.25, 0]]])} fov={30} />
              <Mirror y={-1.05}>
                <Pass map={tex(up ? 'pass-graphite-500' : 'pass-graphite')} back={tex('pass-back')} rotation={[0.03, -0.05, 0]} glow={flash * 0.5} />
              </Mirror>
              {laser > 0 && laser < 1 && <Neon len={1.4} power={10} color={ACCENT} show={1.4} thick={0.01} position={[0, mix(-0.05, -0.68, laser), 0.25]} />}
              <Rig t={t} rimAt={-1} rim={1 + flash * 2} />
            </Lux>
          )
        )
      },
    },
    {
      a: C5,
      b: C6,
      tr: 'streak',
      render: t => {
        const at = W('lf07', 1) + 0.1
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={tex(t >= at ? 'lock-campagne' : 'lock-vide')}
              glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4}
              rot={[0.02, mix(0.35, 0.08, pr(t, C5, C6, easeInOut)), 0]}
              cam={spline(t, [[C5, [-0.6, 0.35, 5.0]], [C6 + 0.8, [0.1, 0.4, 4.2]]])}
              look={[0, 0.42, 0]}
              rig={{ rimAt: -1 }}
            >
              <NotifDrop t={t} at={at} map={tex('notif-campagne')} />
            </PhoneShot>
          )
        )
      },
    },
    { a: C6, b: 99, render: t => <EndCard t={t} at={C6 + 0.3} dur={duree()} line="Gratuit pour commencer." /> },
  ]
  const plus = silk((t - W('lf06', 6)) / 0.5) * (1 - pr(t, C5 - 0.3, C5, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Zero t={t} a={C2} b={C3} />
      <Finish t={t} />
      <Line t={t} id="lf01" top={300} size={96} blue={[1]} tokens={['Voici', 'Fidelyz.']} />
      <Line t={t} id="lf02" top={260} size={64} accent={[1, 2, 3, 4]} />
      <ProductTag t={t} at={W('lf02', 4)} out={C1 - 0.1} top={420} />
      <Line t={t} id="lf03" top={240} size={64} blue={[1, 2, 5, 6]} />
      <Line t={t} id="lf04" top={1330} size={64} accent={[0, 1]} />
      <Line t={t} id="lf05" top={260} size={80} accent={[1]} blue={[3]} />
      <Line t={t} id="lf06" top={240} size={64} blue={[6, 7]} />
      {plus > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily, fontSize: 64, fontWeight: 650, color: '#fff', opacity: plus, transform: `translateY(${(1 - plus) * 30}px)`, textShadow: '0 0 30px rgba(41,151,255,0.9)' }}>
          <span style={{ color: ACCENT }}>+20</span> points
        </div>
      )}
      <Line t={t} id="lf07" top={240} size={66} accent={[1]} blue={[4]} />
      <Sound set="lfilm" son={son} />
    </AbsoluteFill>
  )
}
