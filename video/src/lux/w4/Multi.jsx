import * as THREE from 'three'
import { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { City } from '../v6/Geo'
import { Cam, Lux, PassShot, easeInOut, mix, pr, spline, tex } from '../shots'

/* Vague 4 : « Plusieurs boutiques, une seule carte » (offre Business : jusqu'à 10 établissements).
   Quartier de nuit : trois boutiques s'allument une à une, reliées par des traits néon → fouet : le pass unique →
   liquide : un client passe d'une boutique à l'autre, ses points s'additionnent → iris : les chiffres par établissement → fin. */

export const TEX = ['pass-graphite', 'pass-graphite-500', 'pass-back']
export const duree = () => END('km05') + 2.4
const SHOPS = [
  { n: 'Centre', p: [-1.95, 0, -1], c: '#ffbf7a' },
  { n: 'Gare', p: [1.05, 0, -3], c: '#ffbf7a' },
  { n: 'Marché', p: [2.05, 0, 1], c: '#ffbf7a' },
]

const Shops = ({ t, on, link }) => {
  const line = useMemo(() => {
    // arcs lumineux d'une boutique à l'autre, au-dessus des toits
    const pts = []
    const loop = [...SHOPS, SHOPS[0]]
    for (let i = 0; i < loop.length - 1; i++) {
      const a = new THREE.Vector3(loop[i].p[0], 1.75, loop[i].p[2])
      const b = new THREE.Vector3(loop[i + 1].p[0], 1.75, loop[i + 1].p[2])
      for (let k = 0; k <= 20; k++) {
        const v = a.clone().lerp(b, k / 20)
        v.y += Math.sin((k / 20) * Math.PI) * 0.9
        pts.push(v)
      }
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 300, 0.035, 8, false)
  }, [])
  return (
    <group>
      {SHOPS.map((s, i) => {
        const k = pr(t, on[i], on[i] + 0.4)
        const pulse = ((t - on[i]) * 0.6) % 1
        return (
          <group key={s.n} position={s.p}>
            <mesh position={[0, 0.85, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 1.7, 8]} />
              <meshBasicMaterial color={[0.5 * k, 1 * k, 2.4 * k]} toneMapped={false} />
            </mesh>
            <mesh position={[0, 1.75, 0]}>
              <sphereGeometry args={[0.2, 24, 24]} />
              <meshBasicMaterial color={[1.8 * k + 0.05, 1.3 * k + 0.05, 0.7 * k + 0.05]} toneMapped={false} />
            </mesh>
            {k > 0 && (
              <mesh rotation-x={-Math.PI / 2} position-y={0.02} scale={0.2 + pulse * 1.2}>
                <ringGeometry args={[0.9, 1, 64]} />
                <meshBasicMaterial color={[0.4, 0.8, 2]} toneMapped={false} transparent opacity={(1 - pulse) * 0.8 * k} />
              </mesh>
            )}
            <pointLight position={[0, 0.5, 0]} intensity={2.5 * k} distance={2.5} color={s.c} />
          </group>
        )
      })}
      {link > 0.01 && (
        <mesh geometry={line}>
          <meshBasicMaterial color={[0.8, 1.6, 4]} toneMapped={false} transparent opacity={link} />
        </mesh>
      )}
    </group>
  )
}

const CityShot = ({ t, a, b, on, link }) => (
  <Lux bloom={1.2} threshold={0.75}>
    <Cam pos={spline(t, [[a, [1.2, 13, 10]], [b + 0.8, [-0.8, 12, 9]]])} look={[0.3, 0.6, -1.0]} fov={34} />
    <hemisphereLight args={['#3a5aa0', '#000', 0.25]} />
    <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#9fb6ff" />
    <City t={t} />
    <Shops t={t} on={on} link={link} />
  </Lux>
)

const Row = ({ t, at, name, c, v }) => {
  const k = silk((t - at) / 0.5)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0', borderTop: '1px solid rgba(255,255,255,0.07)', opacity: k, transform: `translateX(${(1 - k) * -40}px)` }}>
      <div style={{ width: 14, height: 14, borderRadius: 7, background: ACCENT, boxShadow: `0 0 14px ${ACCENT}` }} />
      <div style={{ flex: 1, fontSize: 34, fontWeight: 600, color: INK }}>{name}</div>
      <div style={{ fontSize: 30, color: MUTED, fontVariantNumeric: 'tabular-nums' }}>{c} clients · {v} passages</div>
    </div>
  )
}

export const Multi = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('km02', 0) - 0.35
  const C2 = W('km03', 0) - 0.35
  const C3 = W('km04', 0) - 0.35
  const C4 = W('km05', 0) - 0.45
  const on = [0.5, 0.85, 1.2]
  const shots = [
    { a: 0, b: C1, tr: 'whip', render: t => ready && <CityShot t={t} a={0} b={C1} on={on} link={0} /> },
    {
      a: C1,
      b: C2,
      tr: 'liquid',
      render: t => ready && <PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} rot={[0.04, mix(-0.9, -0.15, pr(t, C1, C2, easeInOut)), 0]} cam={spline(t, [[C1, [0.5, 0.15, 5.6]], [C2 + 0.6, [0.1, 0.15, 6.0]]])} look={[0, -0.05, 0]} rig={{ sweep: [C1 + 0.2, C1 + 1.8], rimAt: -1, z: 1 }} />,
    },
    { a: C2, b: C3, tr: 'iris', render: t => ready && <CityShot t={t} a={C2} b={C3} on={[-9, -9, -9]} link={pr(t, C2, C2 + 1.2)} /> },
    { a: C3, b: C4, tr: 'streak', render: t => ready && <AbsoluteFill style={{ filter: 'blur(14px) brightness(0.45)' }}><CityShot t={t} a={C3} b={C4} on={[-9, -9, -9]} link={1} /></AbsoluteFill> },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line="Une carte. Toutes tes boutiques." /> },
  ]
  const pts = t < W('km03', 4) ? 480 : Math.round(mix(480, 520, pr(t, W('km03', 4), W('km03', 9), easeInOut)))
  const pv = silk((t - W('km03', 2)) / 0.5) * (1 - pr(t, C3 - 0.3, C3, easeInOut))
  const panel = silk((t - C3) / 0.6) * (1 - pr(t, C4 - 0.3, C4, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      {t < C1 + 0.3 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1460, display: 'flex', justifyContent: 'center', gap: 16, fontFamily }}>
          {SHOPS.map((s, i) => {
            const k = silk((t - on[i] - 0.1) / 0.5) * (1 - pr(t, C1 - 0.3, C1, easeInOut))
            return <div key={s.n} style={{ opacity: k, transform: `translateY(${(1 - k) * 16}px)`, fontSize: 30, fontWeight: 600, color: INK, padding: '12px 24px', borderRadius: 999, border: '1px solid rgba(255,191,122,0.5)', background: 'rgba(20,16,12,0.6)' }}>{s.n}</div>
          })}
        </div>
      )}
      <Line t={t} id="km01" top={260} size={84} blue={[2, 3]} />
      <Line t={t} id="km02" top={230} size={60} blue={[1]} accent={[2, 3, 4, 5, 6, 7]} />
      <ProductTag t={t} at={W('km02', 6)} out={C2 - 0.1} top={1520} />
      <Line t={t} id="km03" top={250} size={62} accent={[2]} blue={[3, 4]} />
      {pv > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1450, textAlign: 'center', fontFamily, opacity: pv }}>
          <span style={{ fontSize: 110, fontWeight: 250, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: '0 0 40px rgba(41,151,255,0.7)' }}>{pts}</span>
          <span style={{ fontSize: 40, color: ACCENT, marginLeft: 12 }}>points</span>
        </div>
      )}
      <Line t={t} id="km04" top={250} size={60} accent={[3, 4, 5]} blue={[7, 8, 9]} />
      {panel > 0.001 && (
        <div style={{ position: 'absolute', left: 90, right: 90, top: 640, fontFamily, opacity: panel, padding: '34px 40px', borderRadius: 36, background: 'rgba(22,22,24,0.88)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 120px -20px rgba(41,151,255,0.35)' }}>
          <div style={{ fontSize: 24, fontWeight: 650, letterSpacing: '0.2em', color: ACCENT }}>ÉTABLISSEMENTS</div>
          <div style={{ marginTop: 14 }}>
            <Row t={t} at={C3 + 0.3} name="Centre" c={164} v={412} />
            <Row t={t} at={C3 + 0.55} name="Gare" c={98} v={233} />
            <Row t={t} at={C3 + 0.8} name="Marché" c={121} v={305} />
          </div>
          <div style={{ fontSize: 22, color: 'rgba(245,245,247,0.35)', marginTop: 14, textAlign: 'center' }}>Données d’exemple</div>
        </div>
      )}
      <Sound set="mmulti" son={son} />
    </AbsoluteFill>
  )
}
