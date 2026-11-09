import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { useTextGeometry } from '../../tt/kit3d'
import UNB from '../../tt/fonts/unbounded-900.json'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, Mirror, Neon, Softbox, PassShot, PhoneShot, Rig, easeInOut, mix, pr, screenTex, spline, tex } from '../shots'

/* Vague 3 : « Les récompenses ». Le pass se retourne (le verso et ses récompenses) → liquide : la page « Ma carte » →
   plongée : trois paliers en chiffres chromés (100, 300, 500) le long d'une barre néon, la caméra glisse de l'un à l'autre →
   iris : la progression dans le Wallet → néon de fin. */

export const TEX = ['pass-graphite', 'pass-back', 'wallet', 'ecran:design-graphite']
export const duree = () => END('kr05') + 2.4
const TIERS = [
  { n: '100', label: 'un cookie', w: 0, x: -2.6 },
  { n: '300', label: 'une boisson', w: 4, x: 0 },
  { n: '500', label: 'un café offert', w: 8, x: 2.6 },
]

const Num = ({ text, lit, ...props }) => {
  const g = useTextGeometry(text, UNB, { size: 0.62, depth: 0.22, bevel: 0.025, curve: 10 })
  return (
    <mesh geometry={g} {...props}>
      <meshPhysicalMaterial color="#e6e9ef" metalness={0.75} roughness={0.22} clearcoat={1} emissive="#9cc8ff" emissiveIntensity={lit * 0.04} />
    </mesh>
  )
}

const Tiers = ({ t, a, b }) => {
  const at = i => W('kr03', TIERS[i].w)
  const keys = [[a, [-3.0, 0, 0]]]
  TIERS.forEach((tr, i) => {
    keys.push([at(i) - 0.35, [tr.x, 0, 0]])
    keys.push([(i < 2 ? at(i + 1) : b + 0.8) - 0.75, [tr.x + 0.15, 0, 0]])
  })
  const cx = spline(t, keys)[0]
  const fill = mix(-3.9, 3.9, pr(t, at(0) - 0.3, at(2) + 0.6, easeInOut))
  return (
    <Lux bloom={1.1}>
      <Cam pos={[cx, 0.5, 8.4]} look={[cx, -0.1, 0]} fov={30} />
      <Mirror y={-0.75}>
        {TIERS.map((tr, i) => {
          const k = silk((t - at(i) + 0.15) / 0.6)
          return <Num key={tr.n} text={tr.n} lit={k} position={[tr.x, mix(-0.6, 0.15, k), 0]} rotation={[0, mix(0.6, 0, k), 0]} scale={mix(0.6, 1, k)} />
        })}
      </Mirror>
      {/* barre de progression néon au sol */}
      <mesh position={[0, -0.72, 0.6]}>
        <boxGeometry args={[7.8, 0.012, 0.012]} />
        <meshBasicMaterial color="#2a2a30" />
      </mesh>
      <mesh position={[(fill - 3.9) / 2, -0.72, 0.6]}>
        <boxGeometry args={[Math.max(0.001, fill + 3.9), 0.02, 0.02]} />
        <meshBasicMaterial color={[0.6, 1.2, 3]} toneMapped={false} />
      </mesh>
      <Neon len={0.5} power={8} color={ACCENT} show={1.4} thick={0.02} position={[fill, -0.72, 0.6]} light={false} />
      <Softbox w={5} h={1.2} power={7} position={[cx, 1.6, 3.2]} target={[cx, 0, 0]} />
      <Softbox w={1} h={3} power={5} color="#9cc8ff" position={[cx - 3, 0.5, 1.5]} target={[cx, 0, 0]} />
      <Rig t={t} rimAt={-1} center={[cx, 0, 0]} />
    </Lux>
  )
}

export const Recompenses = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('kr02', 0) - 0.4
  const C2 = W('kr03', 0) - 0.35
  const C3 = W('kr04', 0) - 0.35
  const C4 = W('kr05', 0) - 0.45
  const flip = pr(t, W('kr01', 5) - 0.3, W('kr01', 8) + 0.2, easeInOut) // « Toi, tu choisis lesquels » : le verso
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'liquid',
      render: t => ready && <PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} rot={[0.04, -0.35 + Math.PI * flip + Math.sin(t * 0.6) * 0.05, 0]} cam={spline(t, [[0, [0.5, 0.1, 5.0]], [C1 + 0.6, [0.1, 0.15, 5.6]]])} look={[0, -0.05, 0]} rig={{ sweep: [0.1, 1.9], rimAt: 0.05, z: 1 }} />,
    },
    {
      a: C1,
      b: C2,
      tr: 'zoom',
      render: t => ready && <PhoneShot t={t} screen={screenTex('ecran:design-graphite', mix(0, 500, silk((t - C1) / 4)), 'r')} body="#bdb7ad" rot={[0.06, -0.35, 0.03]} cam={spline(t, [[C1, [1.2, 0.5, 6.0]], [C2 + 0.6, [0.6, 0.3, 5.4]]])} look={[0, 0.2, 0]} rig={{ sweep: [C1 + 0.3, C1 + 2.0], rimAt: -1 }} />,
    },
    { a: C2, b: C3, tr: 'iris', render: t => ready && <Tiers t={t} a={C2} b={C3} /> },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t => ready && <PhoneShot t={t} screen={tex('wallet')} rot={[0.02, mix(0.3, 0.05, pr(t, C3, C4, easeInOut)), 0]} cam={spline(t, [[C3, [-0.4, 0.3, 7.4]], [C4 + 0.6, [0.1, 0.25, 6.9]]])} look={[0, 0.4, 0]} rig={{ rimAt: -1, sweep: [C3 + 0.2, C3 + 1.6] }} />,
    },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  const prog = pr(t, W('kr04', 3), W('kr04', 6), easeInOut)
  const pv = silk((t - W('kr04', 3) + 0.2) / 0.5) * (1 - pr(t, C4 - 0.3, C4, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      <Line t={t} id="kr01" top={250} size={64} accent={[3, 4]} blue={[7, 8]} />
      <Line t={t} id="kr02" top={230} size={58} blue={[1]} accent={[3, 4, 5, 6]} />
      <ProductTag t={t} at={W('kr02', 5)} out={C2 - 0.1} top={1520} />
      {/* légende des paliers : le libellé du palier prononcé */}
      {t > C2 && t < C3 + 0.4 &&
        TIERS.map((tr, i) => {
          const a = W('kr03', tr.w)
          const b = i < 2 ? W('kr03', TIERS[i + 1].w) : C3
          const k = silk((t - a) / 0.5) * (1 - pr(t, b - 0.2, b + 0.1, easeInOut))
          if (k <= 0.001) return null
          return (
            <div key={tr.n} style={{ position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily, opacity: k, transform: `translateY(${(1 - k) * 24}px)`, filter: `blur(${(1 - k) * 10}px)` }}>
              <div style={{ fontSize: 34, fontWeight: 650, letterSpacing: '0.24em', color: ACCENT }}>{tr.n} POINTS</div>
              <div style={{ fontSize: 96, fontWeight: 600, letterSpacing: '-0.04em', color: '#fff', marginTop: 8 }}>{tr.label}</div>
            </div>
          )
        })}
      <Line t={t} id="kr04" top={240} size={58} accent={[5]} blue={[9]} />
      {pv > 0.001 && (
        <div style={{ position: 'absolute', left: 150, right: 150, top: 405, fontFamily, opacity: pv }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, fontWeight: 600, color: INK }}>
            <span>Maison Lumière</span>
            <span style={{ color: MUTED }}>{Math.round(mix(400, 480, prog))} / 500</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.12)', marginTop: 14, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${mix(80, 96, prog)}%`, borderRadius: 5, background: ACCENT, boxShadow: `0 0 20px ${ACCENT}` }} />
          </div>
          <div style={{ fontSize: 28, color: MUTED, marginTop: 12, textAlign: 'center' }}>Plus que {Math.round(mix(100, 20, prog))} points avant ton café</div>
        </div>
      )}
      <Sound set="mrecomp" son={son} />
    </AbsoluteFill>
  )
}
