import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Crowd, Lux, NotifDrop, PassShot, Phone, PhoneShot, Rig, easeInOut, mix, pr, screenTex, spline, tex } from '../shots'

/* Vague 2 : « Le client qui ne revient plus » (relance des clients inactifs).
   Au milieu de la foule, un téléphone s'éteint et s'éloigne → liquide : la liste des clients à relancer → plongée : la page « Campagnes »
   → fouet : « Ça fait longtemps ! » sur son écran → balayage : son pass se rallume → néon de fin. */

export const TEX = ['lock-campagne', 'lock-vide', 'lock-retour', 'notif-retour', 'pass-graphite', 'pass-back', 'ecran:campaigns-filled']
export const duree = () => END('tl06') + 2.4

const ROWS = [
  ['T', 'Thomas Martin', 34],
  ['L', 'Léa Bernard', 41],
  ['K', 'Karim Benali', 52],
  ['J', 'Julie Petit', 67],
]
const Panel = ({ t, a, out }) => {
  const k = silk((t - a) / 0.8)
  const o = pr(t, out, out + 0.4, easeInOut)
  if (k <= 0 || o >= 1) return null
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: k * (1 - o) }}>
      <div style={{ width: 860, fontFamily, padding: '40px 44px', borderRadius: 40, background: 'rgba(22,22,24,0.88)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px -20px rgba(41,151,255,0.35), 0 0 0 1px rgba(41,151,255,0.15)', transform: `translateY(${(1 - k) * 60 + 60}px) perspective(1600px) rotateX(${(1 - k) * 14}deg)`, filter: `blur(${(1 - k) * 10}px)` }}>
        <div style={{ fontSize: 24, fontWeight: 650, letterSpacing: '0.2em', color: ACCENT, textTransform: 'uppercase' }}>Clients à relancer</div>
        <div style={{ fontSize: 46, fontWeight: 650, letterSpacing: '-0.03em', color: INK, marginTop: 10 }}>Pas revenus depuis 30 jours</div>
        <div style={{ marginTop: 26 }}>
          {ROWS.map(([m, n, d], i) => {
            const r = silk((t - a - 0.4 - i * 0.22) / 0.5)
            return (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '20px 0', borderTop: i ? '1px solid rgba(255,255,255,0.07)' : 'none', opacity: r, transform: `translateX(${(1 - r) * -40}px)` }}>
                <div style={{ width: 62, height: 62, borderRadius: 31, background: '#2c2c2e', color: INK, display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 650 }}>{m}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 34, fontWeight: 600, color: INK }}>{n}</div>
                  <div style={{ fontSize: 26, color: MUTED, marginTop: 2 }}>Dernière visite il y a {d} jours</div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 650, color: '#fff', background: ACCENT, padding: '12px 22px', borderRadius: 999 }}>Relancer</div>
              </div>
            )
          })}
        </div>
      </div>
    </AbsoluteFill>
  )
}

export const Relance = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('tl02', 0) - 0.4
  const C2 = W('tl03', 0) - 0.35
  const C3 = W('tl04', 0) - 0.3
  const C4 = W('tl05', 0) - 0.3
  const C5 = W('tl06', 0) - 0.45
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'liquid',
      render: t => {
        const go = pr(t, W('tl01', 9) - 0.4, W('tl01', 12) + 0.5, easeInOut) // « tu ne le vois même pas partir »
        return (
          ready && (
            <Lux>
              <Cam pos={spline(t, [[0, [0.4, -0.6, 13.5]], [C1 + 1, [0.1, -0.2, 10.5]]])} look={[0, -0.3, 0]} fov={30} />
              <Crowd t={t} wave={-5} rows={5} cols={5} on="lock-campagne" />
              <Phone screen={tex('lock-campagne')} glow={mix(1, 0.0, go)} position={[0, 0, -go * 6]} rotation={[0, go * 0.6, 0]} />
              <Rig t={t} rimAt={-1} rim={1 - go * 0.6} />
            </Lux>
          )
        )
      },
    },
    {
      a: C1,
      b: C2,
      tr: 'zoom',
      render: t => ready && <AbsoluteFill style={{ filter: 'blur(14px) brightness(0.45)' }}><PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} rot={[0.05, -0.4 + (t - C1) * 0.2, 0]} cam={[0.3, 0.2, 5.4]} look={[0, 0.2, 0]} rig={{ rimAt: -1 }} /></AbsoluteFill>,
    },
    {
      a: C2,
      b: C3,
      tr: 'whip',
      render: t => ready && <PhoneShot t={t} screen={screenTex('ecran:campaigns-filled', 980, 'f')} body="#bdb7ad" rot={[0.1, -0.4, 0.04]} cam={spline(t, [[C2, [1.3, 0.8, 4.8]], [C3 + 0.6, [0.7, 0.45, 4.2]]])} look={[0, 0.3, 0]} rig={{ sweep: [C2 + 0.2, C3 + 0.2], rimAt: -1, warm: true }} />,
    },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t => {
        const at = W('tl04', 0) + 0.1
        return (
          ready && (
            <PhoneShot t={t} screen={tex(t >= at ? 'lock-retour' : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} rot={[0.02, mix(0.3, 0.08, pr(t, C3, C4, easeInOut)), 0]} cam={spline(t, [[C3, [-0.4, 0.35, 4.8]], [C4 + 0.6, [0.1, 0.4, 4.3]]])} look={[0, 0.42, 0]} rig={{ rimAt: -1, warm: true }}>
              <NotifDrop t={t} at={at} map={tex('notif-retour')} />
            </PhoneShot>
          )
        )
      },
    },
    {
      a: C4,
      b: C5,
      tr: 'light',
      render: t => ready && <PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} glow={Math.max(0, 1 - Math.abs(t - W('tl05', 2)) * 2.5) * 0.6} rot={[0.04, mix(-0.9, -0.15, pr(t, C4, C5, easeInOut)), 0]} cam={[0.3, 0.1, 5.2]} look={[0, 0.0, 0]} rig={{ sweep: [C4 + 0.1, C4 + 1.0], rimAt: C4 + 0.3, z: 1 }} />,
    },
    { a: C5, b: 99, render: t => <EndCard t={t} at={C5 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Panel t={t} a={W('tl02', 6) - 0.2} out={C2 - 0.2} />
      <Finish t={t} />
      <Line t={t} id="tl01" top={250} size={62} accent={[3, 4, 5]} blue={[12]} />
      <Line t={t} id="tl02" top={220} size={56} blue={[0]} accent={[2, 3, 4, 5]} />
      <ProductTag t={t} at={W('tl02', 4)} out={W('tl02', 6) - 0.3} top={1500} />
      <Line t={t} id="tl03" top={250} size={62} accent={[1, 2]} blue={[8, 9]} />
      <Line t={t} id="tl04" top={250} size={72} tokens={['« Ça', 'fait', 'longtemps !', 'Ton', 'café', 't’attend. »']} blue={[4, 5]} />
      <Line t={t} id="tl05" top={260} size={92} blue={[2]} />
      <Sound set="mrelance" son={son} />
    </AbsoluteFill>
  )
}
