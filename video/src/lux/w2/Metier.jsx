import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, Line, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, Mirror, Neon, NotifDrop, Pass, PassShot, PhoneShot, Rig, easeInOut, mix, pr, spline, tex } from '../shots'

/* Vague 2 : une vidéo par métier (boulangerie, coiffeur, restaurant), même montage, contenu propre au métier.
   Le pass du métier sort du noir → balayage : il se pose sur l'écran du téléphone (Fidelyz) → fouet : scan laser, points →
   plongée : la notification du commerce → iris : néon de fin. */

const make = cfg => {
  const id = n => `${cfg.p}0${n}`
  const TEX = [cfg.pass, cfg.pass2, 'pass-back', 'lock-vide', cfg.lock, cfg.notif]
  const duree = () => END(id(5)) + 2.4
  const Video = ({ son = true }) => {
    const t = useT()
    const ready = usePreload(TEX)
    const C1 = W(id(2), 0) - 0.45
    const C2 = W(id(3), 0) - 0.35
    const C3 = W(id(4), 0) - 0.35
    const C4 = W(id(5), 0) - 0.45
    const shots = [
      {
        a: 0,
        b: C1,
        tr: 'streak',
        render: t =>
          ready && (
            <PassShot
              t={t}
              map={tex(cfg.pass)}
              back={tex('pass-back')}
              rot={[0.05, mix(-1.0, -0.2, pr(t, 0, C1, easeInOut)), 0.02]}
              cam={spline(t, [[0, [0.5, 0.0, 5.0]], [C1 + 0.6, [0.1, 0.15, 5.8]]])}
              look={[0, -0.1, 0]}
              rig={{ sweep: [0.15, 2.0], rimAt: 0.05, rimColor: cfg.rim, z: 1 }}
            />
          ),
      },
      {
        a: C1,
        b: C2,
        tr: 'whip',
        render: t => {
          const k = pr(t, W(id(2), 7) - 0.6, W(id(2), 9) + 0.1, easeInOut) // « dans leur téléphone / Wallet »
          return (
            ready && (
              <PhoneShot
                t={t}
                screen={tex('lock-vide')}
                glow={mix(0.15, 0.35, k)}
                rot={[0.02, -0.15, 0]}
                cam={spline(t, [[C1, [0.7, 0.4, 7.0]], [C2 + 0.6, [0.2, 0.25, 6.3]]])}
                look={[0, 0.15, 0]}
                rig={{ rimAt: -1, rimColor: cfg.rim, sweep: [C1 + 0.3, C1 + 1.8] }}
                extra={<Pass map={tex(cfg.pass)} scale={mix(0.95, 0.6, k)} position={[mix(1.7, 0, k), mix(0.45, 0.08, k), mix(1.3, 0.09, k)]} rotation={[mix(-0.4, 0, k), mix(0.9, -0.15, k), 0]} glow={0.1} />}
              />
            )
          )
        },
      },
      {
        a: C2,
        b: C3,
        tr: 'zoom',
        render: t => {
          const laser = pr(t, W(id(3), 3) - 0.15, W(id(3), 3) + 0.65, easeInOut)
          const up = t >= W(id(3), 5)
          const flash = Math.max(0, 1 - Math.abs(t - W(id(3), 5)) * 3)
          return (
            ready && (
              <Lux>
                <Cam pos={spline(t, [[C2, [0.4, 0.15, 5.6]], [C3 + 0.6, [-0.1, 0.1, 5.0]]])} look={[0, 0.2, 0]} fov={30} />
                <Mirror y={-1.05}>
                  <Pass map={tex(up ? cfg.pass2 : cfg.pass)} back={tex('pass-back')} rotation={[0.03, -0.12 + Math.sin(t * 0.5) * 0.05, 0]} glow={flash * 0.5} />
                </Mirror>
                {laser > 0 && laser < 1 && <Neon len={1.4} power={10} color={ACCENT} show={1.4} thick={0.01} position={[0, mix(-0.05, -0.68, laser), 0.25]} />}
                <Rig t={t} rimAt={-1} rimColor={cfg.rim} rim={1 + flash * 2} />
              </Lux>
            )
          )
        },
      },
      {
        a: C3,
        b: C4,
        tr: 'iris',
        render: t => {
          const at = W(id(4), cfg.notifWord) + 0.05
          return (
            ready && (
              <PhoneShot t={t} screen={tex(t >= at ? cfg.lock : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} rot={[0.02, mix(0.35, 0.08, pr(t, C3, C4, easeInOut)), 0]} cam={spline(t, [[C3, [-0.5, 0.35, 5.0]], [C4 + 0.6, [0.1, 0.4, 4.3]]])} look={[0, 0.42, 0]} rig={{ rimAt: -1, rimColor: cfg.rim }}>
                <NotifDrop t={t} at={at} map={tex(cfg.notif)} />
              </PhoneShot>
            )
          )
        },
      },
      { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line={cfg.endLine} /> },
    ]
    const plus = silk((t - W(id(3), 5)) / 0.5) * (1 - pr(t, C3 - 0.3, C3, easeInOut))
    return (
      <AbsoluteFill style={{ background: '#000' }}>
        <Montage t={t} shots={shots} />
        <Finish t={t} />
        <Line t={t} id={id(1)} top={250} size={66} {...cfg.l1} />
        <Line t={t} id={id(2)} top={230} size={60} blue={[1]} accent={[3, 4, 5]} />
        <ProductTag t={t} at={W(id(2), 5)} out={C2 - 0.1} top={1500} />
        <Line t={t} id={id(3)} top={250} size={64} {...cfg.l3} />
        {plus > 0.001 && (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 440, textAlign: 'center', fontFamily, fontSize: 64, fontWeight: 650, color: '#fff', opacity: plus, transform: `translateY(${(1 - plus) * 30}px)`, textShadow: '0 0 30px rgba(41,151,255,0.9)' }}>
            <span style={{ color: ACCENT }}>+{cfg.plus}</span> points
          </div>
        )}
        <Line t={t} id={id(4)} top={240} size={60} {...cfg.l4} />
        <Sound set={cfg.set} son={son} />
      </AbsoluteFill>
    )
  }
  return { Video, duree }
}

export const Pain = make({ set: 'mpain', p: 'tb', pass: 'pass-pain', pass2: 'pass-pain-130', plus: 10, lock: 'lock-pain', notif: 'notif-pain', notifWord: 6, rim: '#ffbf7a', endLine: 'Fais revenir tes clients.', l1: { blue: [0], accent: [3, 4, 5, 6, 7] }, l3: { accent: [1], blue: [5, 6] }, l4: { accent: [2, 3], blue: [8] } })
export const Coupe = make({ set: 'mcoupe', p: 'tc', pass: 'pass-coupe', pass2: 'pass-coupe-80', plus: 20, lock: 'lock-coupe', notif: 'notif-coupe', notifWord: 5, rim: '#c9d6ff', endLine: 'Fais revenir tes clients.', l1: { blue: [0], accent: [4, 5, 6, 7] }, l3: { accent: [1], blue: [5, 6] }, l4: { accent: [1, 2], blue: [10] } })
export const Resto = make({ set: 'mresto', p: 'tr', pass: 'pass-resto', pass2: 'pass-resto-270', plus: 30, lock: 'lock-resto', notif: 'notif-resto', notifWord: 4, rim: '#5aa9ff', endLine: 'Fais revenir tes clients.', l1: { blue: [0], accent: [6] }, l3: { accent: [2], blue: [6, 7] }, l4: { accent: [1, 2], blue: [6, 8] } })
