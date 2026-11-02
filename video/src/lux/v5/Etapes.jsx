import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Kicker, Line, MUTED, Montage, W, silk } from '../fx'
import { Cam, Lux, Mirror, Neon, Pass, PassShot, Phone, PhoneShot, Rig, easeInOut, mix, pr, screenTex, spline, tex } from '../shots'

/* 5. « Trois étapes » (série Lumière), sur les vrais écrans du tableau de bord.
   Trois téléphones s'allument un à un → plongée : 1. « Ma carte », les couleurs, le pass suit → fouet : 2. plaque QR au néon,
   inscription, la carte entre dans le Wallet → montée : 3. « Caisse », laser, +20 → iris : 5 min, 0 € → néon de fin. */

export const TEX = ['ecran:design-graphite', 'ecran:design-azur', 'ecran:design-champagne', 'ecran:design-ivory', 'ecran:join-filled', 'ecran:caisse-points20', 'ecran:caisse-done', 'pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory', 'pass-back', 'qr', 'wallet']
export const duree = () => END('ls06') + 2.6
const SKINS = ['graphite', 'azur', 'champagne', 'ivory']

const Figure = ({ t, at, out, big, unit, label, top }) => {
  const k = silk((t - at) / 0.7)
  const o = pr(t, out, out + 0.4, easeInOut)
  if (k <= 0 || o >= 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily, opacity: k * (1 - o), filter: `blur(${(1 - k) * 16 + o * 10}px)`, transform: `translateY(${(1 - k) * 40}px)` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span style={{ fontSize: 260, fontWeight: 150, letterSpacing: '-0.06em', lineHeight: 1, color: '#fff', textShadow: '0 0 30px rgba(255,255,255,0.5), 0 0 110px rgba(41,151,255,0.7)' }}>{big}</span>
        <span style={{ fontSize: 80, fontWeight: 500, color: ACCENT, textShadow: '0 0 30px rgba(41,151,255,0.7)' }}>{unit}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 500, color: MUTED, marginTop: 6 }}>{label}</div>
    </div>
  )
}

export const Etapes = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('ls02', 0) - 0.4
  const C2 = W('ls03', 0) - 0.4
  const C3 = W('ls04', 0) - 0.4
  const C4 = W('ls05', 0) - 0.35
  const C5 = W('ls06', 0) - 0.45
  const SW = [W('ls02', 3), W('ls02', 4), W('ls02', 4) + 0.4]
  const si = SW.filter(s => t >= s).length
  const spin = SW.reduce((a, s) => a + pr(t, s - 0.3, s + 0.3, easeInOut), 0)
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'zoom',
      render: t => {
        const scr = [screenTex('ecran:design-graphite', 0, 'f1'), screenTex('ecran:join-filled', 0, 'f2'), screenTex('ecran:caisse-points20', 0, 'f3')]
        const on = i => pr(t, 1.0 + i * 0.6, 1.5 + i * 0.6)
        return (
          ready && (
            <Lux>
              <Cam pos={spline(t, [[0, [0.4, 0.1, 11.4]], [C1 + 0.6, [-0.1, 0.2, 10.0]]])} look={[0, 0.3, 0]} fov={30} />
              <Mirror y={-1.05}>
                {[-1, 0, 1].map((x, i) => (
                  <Phone key={i} screen={scr[i]} glow={on(i)} body={i === 1 ? '#4a4a4f' : '#bdb7ad'} position={[x * 1.12, 0, -Math.abs(x) * 0.4]} rotation={[0, -x * 0.32, 0]} />
                ))}
              </Mirror>
              {[-1, 0, 1].map((x, i) => {
                const k = pr(t, 0.5 + i * 0.6, 1.4 + i * 0.6, easeInOut)
                return k > 0 && k < 1 ? <Neon key={i} len={1.2} power={14} show={Math.sin(k * Math.PI) * 1.4} position={[x * 1.12, mix(1.3, -1.1, k), 0.6]} /> : null
              })}
              <Rig t={t} rimAt={2.6} />
            </Lux>
          )
        )
      },
    },
    {
      a: C1,
      b: C2,
      tr: 'whip',
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={screenTex(`ecran:design-${SKINS[si]}`, mix(0, 220, silk((t - C1) / 3)), 'd')}
            body="#bdb7ad"
            pos={[-0.42, 0, 0]}
            rot={[0.02, 0.3, 0]}
            cam={spline(t, [[C1, [0.9, 0.2, 7.2]], [C2 + 0.6, [0.3, 0.25, 6.6]]])}
            look={[0.1, 0.15, 0]}
            rig={{ rimAt: -1, sweep: [SW[0] - 0.4, SW[2] + 0.3] }}
            extra={<Pass map={tex(`pass-${SKINS[si]}`)} back={tex('pass-back')} scale={0.62} position={[0.62, -0.2, 0.55]} rotation={[0.05, -0.3 + Math.PI * 2 * spin, 0.02]} />}
          />
        ),
    },
    {
      a: C2,
      b: C3,
      tr: 'rise',
      render: t => {
        const pin = silk((t - W('ls03', 1)) / 1.2)
        const added = t >= W('ls03', 8) + 0.1
        const fly = pr(t, W('ls03', 8) - 0.4, W('ls03', 11) + 0.1, easeInOut)
        return (
          ready && (
            <Lux>
              <Cam pos={spline(t, [[C2, [-1.0, 0.3, 8.4]], [W('ls03', 8), [0.1, 0.35, 8.0]], [C3 + 0.6, [0.5, 0.35, 7.6]]])} look={[0, 0.2, 0]} fov={30} />
              <Mirror y={-1.05}>
                <group position={[-0.6, 0.0, -0.6]} rotation={[0, 0.35, 0]}>
                  <mesh position={[0, 0, -0.03]}>
                    <boxGeometry args={[1.32, 1.62, 0.05]} />
                    <meshPhysicalMaterial color="#111" metalness={0.9} roughness={0.25} clearcoat={1} />
                  </mesh>
                  <mesh position={[0, 0, 0.0]}>
                    <planeGeometry args={[1.22, 1.52]} />
                    <meshBasicMaterial map={tex('qr')} toneMapped={false} />
                  </mesh>
                  {/* cadre néon de la plaque */}
                  {[[0, 0.83, 1.36, 0], [0, -0.83, 1.36, 0], [-0.68, 0, 1.68, 1], [0.68, 0, 1.68, 1]].map(([x, y, l, v], i) => (
                    <mesh key={i} position={[x, y, 0.01]} rotation-z={v ? Math.PI / 2 : 0}>
                      <boxGeometry args={[l, 0.016, 0.016]} />
                      <meshBasicMaterial color={[0.6 * 1.5, 0.85 * 1.5, 1 * 1.5]} toneMapped={false} />
                    </mesh>
                  ))}
                </group>
                <Phone screen={added ? tex('wallet') : screenTex('ecran:join-filled', 100, 'j')} position={[0.5, mix(-2.8, -0.05, pin), 0.4]} rotation={[0.04, -0.28, 0]} />
                {fly > 0 && fly < 1 && <Pass map={tex('pass-graphite')} scale={mix(0.6, 0.28, fly)} position={[mix(-0.6, 0.5, fly), mix(0.2, -0.3, fly), mix(0.2, 0.5, fly)]} rotation={[0, mix(0.35, -0.28, fly) + fly * Math.PI * 2, 0]} />}
              </Mirror>
              <Rig t={t} rimAt={-1} />
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
        const done = t >= W('ls04', 8)
        const laser = pr(t, W('ls04', 5) - 0.2, W('ls04', 5) + 0.6, easeInOut)
        return (
          ready && (
            <PhoneShot
              t={t}
              screen={screenTex(done ? 'ecran:caisse-done' : 'ecran:caisse-points20', 0, 'c')}
              body="#bdb7ad"
              rot={[0.03, mix(-0.5, -0.12, silk((t - C3) / 1.5)), 0]}
              cam={spline(t, [[C3, [0.9, 0.0, 6.6]], [C4 + 0.6, [0.2, 0.2, 6.0]]])}
              look={[0, 0.2, 0]}
              rig={{ rimAt: -1, warm: true }}
              extra={laser > 0 && laser < 1 && <Neon len={1.3} power={10} color={ACCENT} show={1.4} thick={0.01} position={[0, mix(0.8, -0.8, laser), 0.4]} />}
            />
          )
        )
      },
    },
    {
      a: C4,
      b: C5,
      tr: 'streak',
      render: t => ready && <AbsoluteFill style={{ filter: 'blur(10px) brightness(0.5)' }}><PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} rot={[0.05, t * 0.4, 0]} cam={[0, 0.2, 5.4]} look={[0, 0.2, 0]} rig={{ rimAt: -1 }} /></AbsoluteFill>,
    },
    { a: C5, b: 99, render: t => <EndCard t={t} at={C5 + 0.3} dur={duree()} line="Ta carte de fidélité en 5 minutes." /> },
  ]
  const plus = silk((t - W('ls04', 8)) / 0.5) * (1 - pr(t, C4 - 0.3, C4, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Kicker t={t} at={0.3} out={C1 - 0.3} text="Carte de fidélité digitale" top={172} color={ACCENT} />
      <Kicker t={t} at={C1 + 0.2} out={C2 - 0.2} text="Étape 1 · Ta carte" top={172} color={ACCENT} />
      <Kicker t={t} at={C2 + 0.2} out={C3 - 0.2} text="Étape 2 · Tes clients" top={172} color={ACCENT} />
      <Kicker t={t} at={C3 + 0.2} out={C4 - 0.2} text="Étape 3 · En caisse" top={172} color={ACCENT} />
      <Line t={t} id="ls01" top={250} size={66} accent={[1, 2, 3, 4]} blue={[5, 6]} />
      <Line t={t} id="ls02" top={250} size={64} from={1} blue={[2, 4]} accent={[6, 7, 8]} />
      <Line t={t} id="ls03" top={250} size={58} from={1} blue={[5, 6, 11]} />
      <Line t={t} id="ls04" top={250} size={62} from={1} blue={[8, 9]} />
      {plus > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 430, textAlign: 'center', fontFamily, fontSize: 56, fontWeight: 650, color: '#fff', opacity: plus, transform: `translateY(${(1 - plus) * 24}px)`, textShadow: '0 0 30px rgba(41,151,255,0.9)' }}>
          <span style={{ color: ACCENT }}>+20</span> points
        </div>
      )}
      <Line t={t} id="ls05" top={250} size={60} blue={[2, 3, 4]} />
      <Figure t={t} at={W('ls05', 2) - 0.1} out={C5 - 0.3} big="5" unit="min" label="pour créer ta carte" top={560} />
      <Figure t={t} at={W('ls05', 4) - 0.1} out={C5 - 0.3} big="0" unit="€" label="jusqu’à 15 clients" top={1000} />
      <Sound set="letapes" son={son} />
    </AbsoluteFill>
  )
}
