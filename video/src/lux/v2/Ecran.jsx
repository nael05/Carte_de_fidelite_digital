import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Crowd, Lux, Mirror, NotifDrop, Pass, PhoneShot, Phone, Rig, easeInOut, mix, pr, screenTex, spline, tex } from '../shots'

/* 2. « L'écran de verrouillage » (série Lumière).
   Téléphone éteint balayé par un néon → éclair : l'écran s'allume → iris : le pass descend dans le Wallet (Fidelyz)
   → fouet : la vraie page « Campagnes » → plongée : la notification tombe, recul sur la foule de téléphones → SMS, email barrés → fin. */

export const TEX = ['lock-vide', 'lock-campagne', 'notif-campagne', 'wallet', 'pass-graphite', 'ecran:campaigns-filled', 'ecran:campaigns-sent']
export const duree = () => END('le07') + 2.4

const Struck = ({ t, at, out, children, top }) => {
  const k = silk((t - at + 0.05) / 0.5)
  const line = pr(t, at + 0.2, at + 0.6, easeInOut)
  const o = pr(t, out, out + 0.4, easeInOut)
  if (k <= 0 || o >= 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: k * (1 - o), filter: `blur(${(1 - k) * 12 + o * 12}px)` }}>
      <div style={{ position: 'relative', fontFamily, fontSize: 200, fontWeight: 700, letterSpacing: '-0.05em', color: line > 0.5 ? 'rgba(245,245,247,0.45)' : INK }}>
        {children}
        <div style={{ position: 'absolute', left: -30, top: '52%', height: 9, borderRadius: 5, width: `calc(${line * 100}% + ${line * 60}px)`, background: '#fff', boxShadow: `0 0 18px 4px rgba(255,255,255,0.9), 0 0 70px 20px ${ACCENT}` }} />
      </div>
    </div>
  )
}

export const Ecran = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('le02', 1) - 0.35
  const C2 = W('le03', 0) - 0.45
  const C3 = W('le04', 0) - 0.3
  const C4 = W('le05', 0) - 0.35
  const C5 = W('le07', 0) - 0.5
  const blur = pr(t, W('le06', 0) - 0.4, W('le06', 0) + 0.3, easeInOut)
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'light',
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={tex('lock-vide')}
            glow={0}
            rot={[0, mix(0.7, 0.2, pr(t, 0, C1 + 0.8, easeInOut)), 0]}
            cam={spline(t, [[0, [-1.4, 0.6, 5.6]], [C1 + 0.8, [-0.5, 0.25, 5.0]]])}
            look={[0, 0.2, 0]}
            rig={{ sweep: [0.2, 2.4], rimAt: 1.7 }}
          />
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'iris',
      ix: 50,
      iy: 44,
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={tex('lock-vide')}
            glow={pr(t, C1, C1 + 0.9)}
            rot={[0.02, 0.1, 0]}
            cam={spline(t, [[C1, [0.3, 0.35, 4.4]], [C2 + 1, [0.1, 0.4, 3.4]]])}
            look={[0, 0.45, 0]}
            rig={{ rimAt: -1, top: 0.6 }}
          />
        ),
    },
    {
      a: C2,
      b: C3,
      tr: 'whip',
      render: t => {
        const k = pr(t, W('le03', 6) - 0.4, W('le03', 8) + 0.2, easeInOut) // « dans leur Wallet »
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={tex('wallet')}
              rot={[0.02, -0.12, 0]}
              cam={spline(t, [[C2, [0.6, 0.4, 6.8]], [C3 + 0.6, [0.2, 0.2, 6.2]]])}
              look={[0, 0.12, 0]}
              rig={{ rimAt: -1 }}
              extra={k < 0.98 && <Pass map={tex('pass-graphite')} scale={mix(0.95, 0.3, k)} position={[0, mix(2.4, -0.4, k), mix(0.8, 0.1, k)]} rotation={[mix(-0.4, 0, k), mix(0.8, -0.12, k), 0]} glow={0.1} />}
            />
          )
        )
      },
    },
    {
      a: C3,
      b: C4,
      tr: 'zoom',
      render: t => {
        const sent = t > W('le04', 5) // « faire revenir »
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={screenTex(sent ? 'ecran:campaigns-sent' : 'ecran:campaigns-filled', 980, sent ? 's' : 'f')}
              body="#bdb7ad"
              rot={[0.1, -0.4, 0.04]}
              cam={spline(t, [[C3, [1.3, 0.8, 4.6]], [C4 + 0.6, [0.7, 0.45, 3.9]]])}
              look={[0, 0.3, 0]}
              rig={{ sweep: [C3 + 0.2, C4 + 0.2], rimAt: -1, warm: true }}
            />
          )
        )
      },
    },
    {
      a: C4,
      b: C5,
      tr: 'streak',
      render: t => {
        const landed = t >= W('le05', 2)
        const pulse = Math.max(0, 1 - Math.abs(t - W('le05', 2)) * 2.5)
        return (
          ready && (
            <Lux>
              <Cam
                pos={spline(t, [[C4, [0.4, 0.35, 4.6]], [W('le05', 3), [0.1, 0.35, 4.3]], [W('le05', 4), [0.1, 0.2, 5.0]], [END('le05'), [0.5, -0.6, 14]], [C5 + 1, [0.3, -1.4, 17]]])}
                look={spline(t, [[C4, [0, 0.42, 0]], [W('le05', 4), [0, 0.35, 0]], [END('le05'), [0, -0.5, 0]], [C5 + 1, [0, -0.8, 0]]])}
                fov={30}
              />
              <Phone screen={tex(landed ? 'lock-campagne' : 'lock-vide')} glow={1 + pulse * 0.4} />
              <NotifDrop t={t} at={W('le05', 2)} map={tex('notif-campagne')} />
              {t > W('le05', 4) - 0.6 && <Crowd t={t} wave={W('le05', 5) - 0.2} />}
              <Rig t={t} rimAt={-1} rim={1 + pulse * 2} />
            </Lux>
          )
        )
      },
    },
    { a: C5, b: 99, render: t => <EndCard t={t} at={C5 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ filter: blur > 0.01 && t < C5 ? `blur(${blur * 16}px) brightness(${1 - blur * 0.55})` : undefined }}>
        <Montage t={t} shots={shots} />
      </AbsoluteFill>
      <Finish t={t} />
      <Line t={t} id="le01" top={250} size={64} blue={[7, 8, 9, 10]} />
      <Line t={t} id="le02" top={250} size={88} accent={[1, 2, 3]} />
      <Line t={t} id="le03" top={220} size={62} blue={[0]} accent={[3, 4, 5]} />
      <ProductTag t={t} at={W('le03', 3)} out={C3 - 0.1} top={395} />
      <Line t={t} id="le04" top={240} size={64} accent={[5, 6]} />
      <Line t={t} id="le05" top={240} size={64} accent={[2, 3]} blue={[5, 6, 7]} />
      <Struck t={t} at={W('le06', 2)} out={C5 - 0.4} top={640}>SMS</Struck>
      <Struck t={t} at={W('le06', 4)} out={C5 - 0.4} top={900}>Email</Struck>
      <Line t={t} id="le06" top={1250} size={52} />
      <Sound set="lecran" son={son} />
    </AbsoluteFill>
  )
}
