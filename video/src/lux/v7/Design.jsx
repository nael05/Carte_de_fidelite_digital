import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { END, EndCard, Finish, INK, Line, Montage, ProductTag, W, silk } from '../fx'
import { Pass, PassShot, PhoneShot, easeInOut, mix, pr, spline, tex } from '../shots'

/* 7. « À ton image » (série Lumière) : plateau tournant façon constructeur automobile.
   La tranche du pass est un trait de lumière, il pivote face à nous sous le balayage → une couleur par mot, chacune sous un néon
   de sa teinte, en coups de fouet → le pass descend dans le Wallet → néon de fin. */

export const TEX = ['pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory', 'pass-back', 'wallet']
export const duree = () => END('ld05') + 2.6
const COLORS = [
  { k: 'graphite', name: 'Graphite', rim: '#cfd6e0', rim2: '#ffffff' },
  { k: 'azur', name: 'Azur', rim: '#3d8bff', rim2: '#9cc8ff' },
  { k: 'champagne', name: 'Champagne', rim: '#ffc27a', rim2: '#fff0d8' },
  { k: 'ivory', name: 'Ivoire', rim: '#fff4e0', rim2: '#ffffff' },
]

export const Design = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('ld03', 0) - 0.3
  const CC = [1, 2, 3].map(i => W('ld03', i) - 0.28)
  const C5 = W('ld04', 0) - 0.35
  const C6 = W('ld05', 0) - 0.45
  const colorShot = (i, a, b) => ({
    a,
    b,
    tr: i < 3 ? 'whip' : 'zoom',
    d: i < 3 ? 0.42 : 0.6,
    render: t =>
      ready && (
        <PassShot
          t={t}
          map={tex(`pass-${COLORS[i].k}`)}
          back={tex('pass-back')}
          rot={[0.06, -0.55 + (t - a) * 0.35 + i * 0.1, 0.02]}
          cam={[mix(0.9, 0.5, (t - a) / 1.2), 0.1, 6.0]}
          look={[0, -0.15, 0]}
          rig={{ rimAt: -1, rimColor: COLORS[i].rim, rimColor2: COLORS[i].rim2, rim: 1.3, sweep: [a + 0.05, a + 0.9], z: 1 }}
        />
      ),
  })
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'whip',
      d: 0.42,
      render: t =>
        ready && (
          <PassShot
            t={t}
            map={tex('pass-graphite')}
            back={tex('pass-back')}
            rot={[0.05, mix(-1.15, -0.25, pr(t, 0, W('ld02', 2), easeInOut)), 0]}
            cam={spline(t, [[0, [0.15, 0.05, 5.2]], [C1 + 0.5, [0.4, 0.15, 6.2]]])}
            look={[0, -0.12, 0]}
            rig={{ sweep: [W('ld01', 0) - 0.2, W('ld01', 0) + 1.6], rimAt: 0.05, z: 1 }}
          />
        ),
    },
    colorShot(0, C1, CC[0]),
    colorShot(1, CC[0], CC[1]),
    colorShot(2, CC[1], CC[2]),
    colorShot(3, CC[2], C5),
    {
      a: C5,
      b: C6,
      tr: 'streak',
      render: t => {
        const k = pr(t, W('ld04', 5) - 0.5, W('ld04', 6) + 0.2, easeInOut) // « dans le Wallet »
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={tex('wallet')}
              rot={[0.02, -0.12, 0]}
              cam={spline(t, [[C5, [0.6, 0.4, 7.0]], [C6 + 0.6, [0.2, 0.25, 6.4]]])}
              look={[0, 0.12, 0]}
              rig={{ rimAt: -1 }}
              extra={k < 0.98 && <Pass map={tex('pass-ivory')} scale={mix(0.95, 0.3, k)} position={[0, mix(1.0, -0.4, k), mix(1.2, 0.1, k)]} rotation={[mix(-0.2, 0, k), mix(0.5, -0.12, k), 0]} />}
            />
          )
        )
      },
    },
    { a: C6, b: 99, render: t => <EndCard t={t} at={C6 + 0.3} dur={duree()} line="Ta carte. À ton image." /> },
  ]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Line t={t} id="ld01" top={250} size={70} blue={[0]} accent={[2, 3, 4, 5]} out={W('ld02', 0) - 0.5} />
      <ProductTag t={t} at={W('ld01', 3)} out={C1 - 0.2} top={1470} />
      <Line t={t} id="ld02" top={270} size={96} accent={[1, 2]} />
      {/* nom de la couleur, très grand et fin, au moment où il est prononcé */}
      {COLORS.map((c, i) => {
        const a = i ? CC[i - 1] : C1
        const b = i < 3 ? CC[i] : C5
        const k = silk((t - a - 0.15) / 0.45) * (1 - pr(t, b - 0.1, b + 0.2, easeInOut))
        if (k <= 0.001) return null
        return (
          <div key={c.k} style={{ position: 'absolute', left: 0, right: 0, top: 1460, textAlign: 'center', fontFamily, fontSize: 120, fontWeight: 200, letterSpacing: '-0.04em', color: INK, opacity: k, filter: `blur(${(1 - k) * 14}px)`, transform: `translateX(${(1 - k) * 60}px)`, textShadow: `0 0 40px ${c.rim}` }}>
            {c.name}
          </div>
        )
      })}
      <Line t={t} id="ld04" top={240} size={62} accent={[1, 3]} blue={[6]} />
      <Sound set="ldesign" son={son} />
    </AbsoluteFill>
  )
}
