import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Kicker, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { NotifDrop, Pass, PassShot, PhoneShot, easeInOut, mix, pr, spline, tex } from '../shots'

/* Vague 2 : « L'histoire de Camille ». La fidélité racontée en une minute de vie de cliente.
   Son téléphone sort du noir → fouet : la carte entre dans son Wallet (0 point) → plongée : visite après visite, les points montent
   (100, 250, 480) → éclair : la notification « café offert » → balayage : elle revient, encore et encore → néon de fin. */

export const TEX = ['lock-vide', 'pass-graphite-0', 'pass-graphite-100', 'pass-graphite-250', 'pass-graphite', 'pass-graphite-500', 'pass-back', 'lock-cafe-offert', 'notif-cafe-offert']
export const duree = () => END('tm06') + 2.4

const Steps = ({ t, list, out }) => {
  const o = pr(t, out, out + 0.4, easeInOut)
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 425, display: 'flex', justifyContent: 'center', gap: 22, fontFamily, opacity: 1 - o }}>
      {list.map(([label, at], i) => {
        const k = silk((t - at) / 0.5)
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: 0.35 + 0.65 * k }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: k > 0.5 ? ACCENT : 'rgba(255,255,255,0.2)', boxShadow: k > 0.5 ? `0 0 ${20 * k}px ${ACCENT}` : 'none' }} />
            <div style={{ fontSize: 26, fontWeight: 600, color: k > 0.5 ? INK : MUTED, letterSpacing: '0.02em' }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export const Camille = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('tm02', 0) - 0.4
  const C2 = W('tm03', 0) - 0.35
  const C3 = W('tm04', 0) - 0.35
  const C4 = W('tm05', 0) - 0.35
  const C5 = W('tm06', 0) - 0.45
  const V = [W('tm03', 0), W('tm03', 2), W('tm03', 5)] // 2e passage, 5e, « montent »
  const pts = ['pass-graphite-0', 'pass-graphite-100', 'pass-graphite-250', 'pass-graphite'][V.filter(v => t >= v).length]
  const flash = V.reduce((a, v) => Math.max(a, 1 - Math.abs(t - v) * 3), 0)
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'whip',
      render: t => ready && <PhoneShot t={t} screen={tex('lock-vide')} glow={pr(t, 0.8, 1.6)} rot={[0.02, mix(0.6, 0.2, pr(t, 0, C1 + 0.5, easeInOut)), 0]} cam={spline(t, [[0, [-0.8, 0.3, 6.0]], [C1 + 0.5, [-0.3, 0.3, 5.2]]])} look={[0, 0.3, 0]} rig={{ sweep: [0.1, 1.6], rimAt: 0.4 }} />,
    },
    {
      a: C1,
      b: C2,
      tr: 'zoom',
      render: t => {
        const k = pr(t, W('tm02', 6) - 0.4, W('tm02', 13) + 0.1, easeInOut) // « elle ajoute la carte … à son Wallet »
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={tex('lock-vide')}
              glow={mix(0.15, 0.35, k)}
              rot={[0.02, -0.15, 0]}
              cam={spline(t, [[C1, [0.7, 0.4, 7.0]], [C2 + 0.6, [0.2, 0.25, 6.3]]])}
              look={[0, 0.15, 0]}
              rig={{ rimAt: -1, warm: true, sweep: [C1 + 0.3, C1 + 1.8] }}
              extra={<Pass map={tex('pass-graphite-0')} scale={mix(0.95, 0.6, k)} position={[mix(1.7, 0, k), mix(0.45, 0.08, k), mix(1.3, 0.09, k)]} rotation={[mix(-0.4, 0, k), mix(0.9, -0.15, k), 0]} glow={0.1} />}
            />
          )
        )
      },
    },
    {
      a: C2,
      b: C3,
      tr: 'light',
      render: t => ready && <PassShot t={t} map={tex(pts)} back={tex('pass-back')} glow={flash * 0.6} rot={[0.04, -0.3 + (t - C2) * 0.08, 0]} cam={spline(t, [[C2, [0.6, 0.15, 5.6]], [C3 + 0.6, [-0.2, 0.15, 5.0]]])} look={[0, 0.15, 0]} rig={{ rimAt: -1, rim: 1 + flash * 1.5, sweep: [V[0] - 0.4, V[2] + 0.4], z: 1 }} />,
    },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t => {
        const at = W('tm04', 3) + 0.05 // « notification »
        return (
          ready && (
            <PhoneShot t={t} screen={tex(t >= at ? 'lock-cafe-offert' : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} rot={[0.02, mix(0.35, 0.08, pr(t, C3, C4, easeInOut)), 0]} cam={spline(t, [[C3, [-0.5, 0.35, 5.0]], [C4 + 0.6, [0.1, 0.4, 4.3]]])} look={[0, 0.42, 0]} rig={{ rimAt: -1, warm: true }}>
              <NotifDrop t={t} at={at} map={tex('notif-cafe-offert')} />
            </PhoneShot>
          )
        )
      },
    },
    {
      a: C4,
      b: C5,
      tr: 'iris',
      render: t => {
        const enc = [W('tm05', 2), W('tm05', 4)]
        const fl = enc.reduce((a, v) => Math.max(a, 1 - Math.abs(t - v) * 2.5), 0)
        return ready && <PassShot t={t} map={tex('pass-graphite-500')} back={tex('pass-back')} glow={fl * 0.5} rot={[0.05, -0.4 + Math.PI * 2 * pr(t, enc[0] - 0.3, enc[1] + 0.2, easeInOut), 0]} cam={spline(t, [[C4, [0.3, 0.2, 6.2]], [C5 + 0.6, [0, 0.2, 5.4]]])} look={[0, 0.0, 0]} rig={{ rimAt: -1, rim: 1 + fl * 2, sweep: [enc[0] - 0.3, enc[1] + 0.3], z: 1 }} />
      },
    },
    { a: C5, b: 99, render: t => <EndCard t={t} at={C5 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  const bigName = silk((t - 0.45) / 0.7) * (1 - pr(t, C1 - 0.5, C1, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Kicker t={t} at={0.3} out={C1 - 0.4} text="Une histoire de fidélité" top={172} color={ACCENT} />
      {bigName > 0.001 && <div style={{ position: 'absolute', left: 0, right: 0, top: 1380, textAlign: 'center', fontFamily, fontSize: 150, fontWeight: 200, letterSpacing: '-0.04em', color: '#fff', opacity: bigName, filter: `blur(${(1 - bigName) * 16}px)`, textShadow: '0 0 40px rgba(41,151,255,0.6)' }}>Camille</div>}
      <Line t={t} id="tm01" top={250} size={80} blue={[1]} />
      <Line t={t} id="tm02" top={220} size={56} accent={[1]} blue={[8, 9, 10]} />
      <ProductTag t={t} at={W('tm02', 8)} out={C2 - 0.1} top={1500} />
      <Line t={t} id="tm03" top={250} size={62} blue={[4, 5]} />
      {t > C2 && t < C3 + 0.5 && <Steps t={t} out={C3 - 0.2} list={[['1re visite', C2 - 1], ['2e', V[0]], ['5e', V[1]], ['10e', V[2]]]} />}
      <Line t={t} id="tm04" top={240} size={64} accent={[3]} blue={[5, 6, 7]} />
      <Line t={t} id="tm05" top={260} size={74} accent={[1]} blue={[2, 4]} />
      <Sound set="mcamille" son={son} />
    </AbsoluteFill>
  )
}
