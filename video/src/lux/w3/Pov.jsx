import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, Kicker, Line, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Dust, Lux, Mirror, Pass, PassShot, Phone, Rig, Softbox, easeInOut, mix, pr, screenTex, spline, tex } from '../shots'

/* Vague 3 : « POV : ton client ». À la première personne, on s'approche du comptoir (lueurs chaudes) jusqu'à la plaque QR au néon →
   plongée : le téléphone en main, la vraie page d'inscription, prénom, email → la carte entre dans le Wallet → fouet : les points montent → fin. */

export const TEX = ['qr', 'lock-vide', 'ecran:join-empty', 'ecran:join-filled', 'wallet', 'pass-pain', 'pass-pain-130', 'pass-back']
export const duree = () => END('kv05') + 2.4

// La plaque QR posée sur le comptoir, cadre néon
const Plaque = props => (
  <group {...props}>
    <mesh position={[0, 0, -0.03]}>
      <boxGeometry args={[1.32, 1.62, 0.05]} />
      <meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.25} clearcoat={1} />
    </mesh>
    <mesh>
      <planeGeometry args={[1.22, 1.52]} />
      <meshBasicMaterial map={tex('qr')} toneMapped={false} />
    </mesh>
    {[[0, 0.83, 1.36, 0], [0, -0.83, 1.36, 0], [-0.68, 0, 1.68, 1], [0.68, 0, 1.68, 1]].map(([x, y, l, v], i) => (
      <mesh key={i} position={[x, y, 0.01]} rotation-z={v ? Math.PI / 2 : 0}>
        <boxGeometry args={[l, 0.016, 0.016]} />
        <meshBasicMaterial color={[1.6, 1.25, 0.8]} toneMapped={false} />
      </mesh>
    ))}
  </group>
)

// Lueurs chaudes de la boutique, floues au loin (bokeh)
const Bokeh = ({ t }) => (
  <group>
    {Array.from({ length: 14 }, (_, i) => {
      const r = k => {
        const x = Math.sin(i * 41.3 + k * 7.7) * 43758.5453
        return x - Math.floor(x)
      }
      return (
        <mesh key={i} position={[(r(1) - 0.5) * 9, 0.6 + r(2) * 2.6, -6 - r(3) * 4]}>
          <circleGeometry args={[0.05 + r(4) * 0.1, 24]} />
          <meshBasicMaterial color={[1.4 + r(5), 0.9 + r(5) * 0.3, 0.45]} toneMapped={false} transparent opacity={0.35 + 0.25 * Math.sin(t * 0.8 + i)} />
        </mesh>
      )
    })}
  </group>
)

export const Pov = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('kv02', 0) - 0.35
  const C2 = W('kv03', 0) - 0.35
  const C3 = W('kv04', 0) - 0.35
  const C4 = W('kv05', 0) - 0.45
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'zoom',
      render: t =>
        ready && (
          <Lux bloom={1.1}>
            {/* on marche vers le comptoir, à hauteur d'yeux, très doucement */}
            <Cam pos={[Math.sin(t * 1.6) * 0.02, 0.55 + Math.sin(t * 3.2) * 0.012, mix(6.5, 3.4, pr(t, 0, C1 + 0.6, easeInOut))]} look={[0, 0.0, 0]} fov={32} />
            <Mirror y={-0.95}>
              <Plaque position={[0, 0, 0]} rotation={[-0.05, 0, 0]} />
            </Mirror>
            <Bokeh t={t} />
            <Softbox w={3} h={0.6} power={3} color="#ffd9b0" position={[0, 2.4, 1.5]} target={[0, 0, 0]} />
            <Dust t={t} color="#ffd9b0" center={[0, 0.5, 1.5]} />
          </Lux>
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'light',
      render: t => {
        const open = t >= W('kv02', 4) - 0.1 // « scannes » : la page s'ouvre
        return (
          ready && (
            <Lux>
              <Cam pos={[0.05, 0.2, 6.2]} look={[0, 0.3, 0]} fov={32} />
              {/* le téléphone tenu en main, devant la plaque floue au loin */}
              <Phone screen={open ? screenTex('ecran:join-empty', 0, 'je') : tex('lock-vide')} glow={open ? 1 : 0.4} position={[0, mix(-1.6, -0.05, silk((t - C1) / 1.0)), 0.6]} rotation={[-0.12, 0.1, 0.03]} />
              <group position={[0.4, 0.3, -5]} scale={1.4}>
                <Plaque />
              </group>
              <Bokeh t={t} />
              <Rig t={t} rimAt={-1} warm dust={false} />
            </Lux>
          )
        )
      },
    },
    {
      a: C2,
      b: C3,
      tr: 'whip',
      render: t => {
        const filled = t >= W('kv03', 1) // « email »
        const added = t >= W('kv03', 6) + 0.2 // « s'ajoute »
        const fly = pr(t, W('kv03', 6) - 0.3, W('kv03', 9) + 0.1, easeInOut)
        return (
          ready && (
            <Lux>
              <Cam pos={spline(t, [[C2, [-0.3, 0.3, 6.4]], [C3 + 0.6, [0.2, 0.3, 6.8]]])} look={[0, 0.3, 0]} fov={30} />
              <Mirror y={-1.05}>
                <Phone screen={added ? tex('wallet') : screenTex(filled ? 'ecran:join-filled' : 'ecran:join-empty', 100, filled ? 'jf' : 'je2')} rotation={[0.02, mix(0.25, -0.05, pr(t, C2, C3, easeInOut)), 0]} />
                {fly > 0 && fly < 1 && <Pass map={tex('pass-pain')} scale={mix(0.8, 0.3, fly)} position={[mix(1.4, 0, fly), mix(1.2, -0.35, fly), mix(1.0, 0.1, fly)]} rotation={[0, mix(-0.8, 0, fly) + fly * Math.PI * 2, 0]} />}
              </Mirror>
              <Rig t={t} rimAt={-1} warm />
            </Lux>
          )
        )
      },
    },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t => {
        const up = t >= W('kv04', 6) // « montent »
        const fl = Math.max(0, 1 - Math.abs(t - W('kv04', 6)) * 3)
        return ready && <PassShot t={t} map={tex(up ? 'pass-pain-130' : 'pass-pain')} back={tex('pass-back')} glow={fl * 0.5} rot={[0.04, mix(-0.7, -0.15, pr(t, C3, C4, easeInOut)), 0]} cam={spline(t, [[C3, [0.5, 0.15, 6.0]], [C4 + 0.6, [0.1, 0.15, 6.4]]])} look={[0, 0.3, 0]} rig={{ rimAt: -1, rimColor: '#ffbf7a', rim: 1 + fl * 2, sweep: [W('kv04', 4) - 0.3, W('kv04', 7) + 0.2], z: 1 }} />
      },
    },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  const plus = silk((t - W('kv04', 6)) / 0.5) * (1 - pr(t, C4 - 0.3, C4, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Kicker t={t} at={0.2} out={C1 - 0.3} text="Point de vue du client" top={172} color="#ffbf7a" />
      <Line t={t} id="kv01" top={250} size={64} blue={[0]} accent={[8, 9]} />
      <Line t={t} id="kv02" top={250} size={80} blue={[1, 2]} accent={[4]} />
      <Line t={t} id="kv03" top={230} size={58} accent={[0, 1]} blue={[3, 4, 5, 9]} />
      <ProductTag t={t} at={W('kv03', 6)} out={C3 - 0.1} top={395} />
      <Line t={t} id="kv04" top={250} size={62} blue={[5, 6]} accent={[7, 8, 9]} />
      {plus > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 430, textAlign: 'center', fontFamily, fontSize: 64, fontWeight: 650, color: '#fff', opacity: plus, transform: `translateY(${(1 - plus) * 30}px)`, textShadow: '0 0 30px rgba(41,151,255,0.9)' }}>
          <span style={{ color: ACCENT }}>+10</span> points
        </div>
      )}
      <Sound set="mpov" son={son} />
    </AbsoluteFill>
  )
}
