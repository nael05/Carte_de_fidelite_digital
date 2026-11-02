import { AbsoluteFill } from 'remotion'
import { useT } from '../../lib'
import { usePreload } from '../../serie/kit'
import { Sound } from '../../serie/kit'
import { END, EndCard, Finish, Line, Montage, ProductTag, W } from '../fx'
import { Phone } from '../engine'
import { PaperShot, PassShot, PhoneShot, Pass, clamp, easeInOut, mix, pr, spline, tex } from '../shots'

/* 1. « La carte perdue » (série Lumière).
   Carte papier dans un faisceau chaud → elle se consume → balayage néon : le téléphone sort du noir (Fidelyz, carte de fidélité digitale)
   → coup de fouet : iPhone et Android → plongée : le pass, 480 → 500 → néon de fin. */

export const TEX = ['papier', 'wallet', 'lock-vide', 'pass-graphite', 'pass-graphite-500', 'pass-back']
export const duree = () => END('lp07') + 2.4

export const Perdue = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('lp04', 0) - 0.5
  const C2 = W('lp05', 4) - 0.25 // « téléphone » → les deux Wallet
  const C3 = W('lp06', 0) - 0.35
  const C4 = W('lp07', 0) - 0.45
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'streak',
      render: t =>
        ready && (
          <PaperShot
            t={t}
            burnFrom={W('lp03', 3)}
            burnTo={END('lp03') + 0.3}
            cam={spline(t, [[0, [-0.7, 0.55, 2.2]], [2.4, [-0.4, 0.45, 1.9]], [W('lp02', 4), [0.25, 0.3, 1.7]], [END('lp02') + 0.3, [0.5, 0.2, 1.45]], [W('lp03', 3), [0.15, 0.3, 2.6]], [C1 + 1, [0, 0.4, 3.4]]])}
            look={spline(t, [[0, [-0.35, 0.15, 0]], [2.4, [-0.15, 0.1, 0]], [W('lp02', 4), [0.35, -0.22, 0]], [END('lp02') + 0.3, [0.55, -0.3, 0]], [W('lp03', 3), [0, 0.0, 0]]])}
          />
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'whip',
      render: t => {
        const wake = pr(t, W('lp04', 3), W('lp04', 4) + 0.4)
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={tex('wallet')}
              glow={wake}
              rot={[0, mix(-0.55, -0.15, pr(t, C1, C2 + 0.5, easeInOut)), 0]}
              cam={spline(t, [[C1, [0.9, 0.0, 7.4]], [C2 + 0.6, [0.2, 0.1, 6.6]]])}
              look={[0, 0.22, 0]}
              rig={{ sweep: [C1 + 0.45, C1 + 2.1], rimAt: C1 + 1.9 }}
            />
          )
        )
      },
    },
    {
      a: C2,
      b: C3,
      tr: 'zoom',
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={tex('wallet')}
            pos={[-0.62, 0, 0]}
            rot={[0, 0.22, 0]}
            cam={spline(t, [[C2, [-0.4, 0.3, 6.6]], [C3 + 0.6, [0.3, 0.3, 6.0]]])}
            look={[0, 0.3, 0]}
            rig={{ rimAt: -1 }}
            extra={
              <group position={[0.62, 0, -0.05]} rotation={[0, -0.22, 0]}>
                <PhoneInner />
              </group>
            }
          />
        ),
    },
    {
      a: C3,
      b: C4,
      tr: 'light',
      render: t => {
        const swap = t >= W('lp06', 4) // « à jour »
        const glow = Math.max(0, 1 - Math.abs(t - W('lp06', 4)) * 3) * 0.6
        return (
          ready && (
            <PassShot
              t={t}
              map={tex(swap ? 'pass-graphite-500' : 'pass-graphite')}
              back={tex('pass-back')}
              glow={glow}
              rot={[0.04, mix(-0.9, -0.15, pr(t, C3, W('lp06', 3), easeInOut)) + Math.sin(t * 0.6) * 0.06, 0]}
              cam={spline(t, [[C3, [0.6, 0.0, 3.6]], [C4 + 0.8, [0.1, 0.25, 4.6]]])}
              look={[0, 0.12, 0]}
              rig={{ sweep: [W('lp06', 3) - 0.3, W('lp06', 5) + 0.3], rimAt: -1, z: 0.9 }}
            />
          )
        )
      },
    },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.2} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Line t={t} id="lp01" top={300} size={92} tokens={['« J’ai', 'perdu', 'ma', 'carte. »']} accent={[1]} out={END('lp01') + 0.4} />
      <Line t={t} id="lp02" top={290} size={68} blue={[5]} />
      <Line t={t} id="lp03" top={1240} size={64} accent={[4, 5, 6, 7]} />
      <Line t={t} id="lp04" top={215} size={66} blue={[0]} accent={[3, 4, 5, 6]} />
      <Line t={t} id="lp05" top={240} size={60} blue={[5, 6, 7, 8]} out={C3 - 0.1} />
      <Line t={t} id="lp06" top={240} size={68} accent={[0, 1, 2]} blue={[3, 4, 5]} out={C4 - 0.1} />
      <ProductTag t={t} at={W('lp04', 3)} out={C2 - 0.1} top={392} />
      <Sound set="lperdue" son={son} />
    </AbsoluteFill>
  )
}

// Deuxième téléphone (Android, Google Wallet) : écran noir et le pass dessus
const PhoneInner = () => (
  <group>
    <AndroidPhone />
  </group>
)
const AndroidPhone = () => (
  <Phone screen={tex('lock-vide')} glow={0.1} android body="#c9c4bb">
    <Pass map={tex('pass-graphite')} scale={0.6} position={[0, 0.1, 0.085]} />
  </Phone>
)
