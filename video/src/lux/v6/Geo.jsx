import * as THREE from 'three'
import { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Particles, rnd } from '../../tt/kit3d'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, NotifDrop, PassShot, PhoneShot, easeInOut, mix, pr, spline, tex } from '../shots'

/* 6. « Ils passent devant chez toi » (série Lumière).
   Quartier de nuit (rues en néon bleu, enseigne chaude de la boutique), un passant lumineux entre dans le cercle de 50 m
   → plongée : son téléphone, la notification Wallet → fouet : le pass, ses points → néon de fin. */

export const TEX = ['lock-vide', 'lock-proche', 'notif-proche', 'pass-graphite', 'pass-back']
export const duree = () => END('lg04') + 1.8
const SHOP = [1.25, 0, 0]
const R50 = 1.7

const walker = t => {
  const a = pr(t, 0, W('lg01', 4), k => k)
  const z = mix(-6.0, -R50 + 0.05, a) + Math.max(0, t - W('lg01', 4)) * 0.25
  return [0.95, 0.06, Math.min(z, -0.1)]
}

export const City = ({ t }) => {
  const boxes = useMemo(() => {
    const out = []
    for (let i = -3; i <= 3; i++)
      for (let j = -4; j <= 3; j++)
        for (let k = 0; k < 4; k++) {
          const s = i * 37 + j * 11 + k * 5
          const h = 0.18 + rnd(s) * 0.55
          out.push({ p: [i * 2 + (k % 2 ? 0.4 : -0.4), h / 2, j * 2 + (k < 2 ? -0.4 : 0.4)], s: [0.72, h, 0.72], lit: rnd(s + 9) > 0.55 })
        }
    return out
  }, [])
  // rues : traits néon bleus au sol (x = impair, z = impair)
  const streets = []
  for (let i = -3; i <= 4; i++) {
    streets.push(<mesh key={`x${i}`} position={[i * 2 - 1, 0.004, -1]} rotation-x={-Math.PI / 2}><planeGeometry args={[0.02, 18]} /><meshBasicMaterial color={[0.25, 0.55, 1.2]} toneMapped={false} transparent opacity={0.55} /></mesh>)
    streets.push(<mesh key={`z${i}`} position={[0, 0.004, i * 2 - 1]} rotation-x={-Math.PI / 2}><planeGeometry args={[16, 0.02]} /><meshBasicMaterial color={[0.25, 0.55, 1.2]} toneMapped={false} transparent opacity={0.55} /></mesh>)
  }
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#040507" roughness={0.6} metalness={0.4} />
      </mesh>
      {streets}
      {boxes.map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.s} />
          <meshPhysicalMaterial color="#14161c" metalness={0.7} roughness={0.35} clearcoat={0.6} emissive={b.lit ? '#1b2a44' : '#000'} emissiveIntensity={0.6} />
        </mesh>
      ))}
    </group>
  )
}

const Shop = ({ t }) => {
  const cross = pr(t, W('lg01', 4) - 0.1, W('lg01', 4) + 0.5)
  const pulse = (t * 0.6) % 1
  const ring = useMemo(() => new THREE.RingGeometry(R50 - 0.02, R50, 128), [])
  const wave = useMemo(() => new THREE.RingGeometry(0.97, 1, 128), [])
  const c = SHOP[0] - 0.35
  return (
    <group>
      {/* enseigne chaude et vitrine */}
      <mesh position={[SHOP[0] - 0.02, 0.32, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.5, 0.06]} />
        <meshBasicMaterial color={[2.4, 1.6, 0.8]} toneMapped={false} />
      </mesh>
      <mesh position={[SHOP[0] - 0.02, 0.14, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.46, 0.22]} />
        <meshBasicMaterial color={[1.2, 0.85, 0.5]} toneMapped={false} />
      </mesh>
      <pointLight position={[SHOP[0] - 0.4, 0.3, 0]} intensity={2.5} distance={2.2} color="#ffbf7a" />
      {/* cercle des 50 m */}
      <mesh geometry={ring} rotation-x={-Math.PI / 2} position={[c, 0.01, 0]}>
        <meshBasicMaterial color={[0.4 + cross, 0.8 + cross, 2 + cross]} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[c, 0.006, 0]}>
        <circleGeometry args={[R50, 96]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.05 + cross * 0.1} depthWrite={false} />
      </mesh>
      <mesh geometry={wave} rotation-x={-Math.PI / 2} position={[c, 0.012, 0]} scale={R50 * pulse}>
        <meshBasicMaterial color={[0.4, 0.8, 2]} toneMapped={false} transparent opacity={(1 - pulse) * 0.7} />
      </mesh>
      {/* repère lumineux */}
      <mesh position={[c, 1.1, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 2.2, 6]} />
        <meshBasicMaterial color={[0.4, 0.8, 2]} toneMapped={false} />
      </mesh>
      <mesh position={[c, 2.25, 0]}>
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshBasicMaterial color={[1.5, 2, 3]} toneMapped={false} />
      </mesh>
    </group>
  )
}

const Walker = ({ t }) => (
  <Particles
    count={50}
    size={0.16}
    color="#ffffff"
    fn={(i, o) => {
      const q = walker(t - i * 0.05)
      o[0] = q[0]
      o[1] = q[1]
      o[2] = q[2]
      o[3] = i === 0 ? 3 : 1.4 * (1 - i / 50)
      o[4] = i === 0 ? 1 : (1 - i / 50) * 0.6
    }}
  />
)

export const Geo = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('lg02', 0) - 0.35
  const C2 = W('lg03', 0) - 0.3
  const C3 = W('lg04', 0) - 0.45
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'zoom',
      render: t =>
        ready && (
          <Lux bloom={1.2} threshold={0.75}>
            <Cam pos={spline(t, [[0, [4.4, 11, -9.5]], [C1 + 0.6, [3.2, 7.5, -5.2]]])} look={spline(t, [[0, [0.9, 0, -1.4]], [C1 + 0.6, [0.9, 0, -0.6]]])} fov={30} />
            <hemisphereLight args={['#3a5aa0', '#000', 0.25]} />
            <directionalLight position={[-6, 8, -4]} intensity={0.35} color="#9fb6ff" />
            <City t={t} />
            <Shop t={t} />
            <Walker t={t} />
          </Lux>
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'whip',
      render: t => {
        const at = W('lg02', 6) + 0.05 // « s'affiche »
        return (
          ready && (
            <PhoneShot t={t} screen={tex(t >= at ? 'lock-proche' : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} rot={[0.02, mix(0.35, 0.1, pr(t, C1, C2, easeInOut)), 0]} cam={spline(t, [[C1, [-0.5, 0.35, 5.0]], [C2 + 0.6, [0.1, 0.4, 4.4]]])} look={[0, 0.42, 0]} rig={{ rimAt: -1 }}>
              <NotifDrop t={t} at={at} map={tex('notif-proche')} />
            </PhoneShot>
          )
        )
      },
    },
    {
      a: C2,
      b: C3,
      tr: 'streak',
      render: t => ready && <PassShot t={t} map={tex('pass-graphite')} back={tex('pass-back')} glow={Math.max(0, 1 - Math.abs(t - W('lg03', 2)) * 3) * 0.5} rot={[0.04, mix(-0.7, -0.15, pr(t, C2, C3, easeInOut)), 0]} cam={spline(t, [[C2, [0.6, 0.15, 5.4]], [C3 + 0.6, [0.1, 0.2, 5.0]]])} look={[0, 0.2, 0]} rig={{ rimAt: -1, warm: true, sweep: [C2 + 0.1, C2 + 1.5], z: 1 }} />,
    },
    { a: C3, b: 99, render: t => <EndCard t={t} at={C3 + 0.3} dur={duree()} line="La carte qui fait revenir tes clients." /> },
  ]
  const dist = Math.max(50, Math.round(-walker(t)[2] * 30))
  const badge = silk((t - 0.5) / 0.6) * (1 - pr(t, C1 - 0.3, C1, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      {badge > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, display: 'flex', justifyContent: 'center', opacity: badge }}>
          <div style={{ fontFamily, fontSize: 36, fontWeight: 600, color: INK, padding: '16px 32px', borderRadius: 999, background: 'rgba(10,12,18,0.7)', border: '1px solid rgba(90,169,255,0.4)', boxShadow: '0 0 40px rgba(41,151,255,0.35)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: ACCENT, boxShadow: `0 0 16px ${ACCENT}` }} />
            Maison Lumière <span style={{ color: MUTED, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>· {dist} m</span>
          </div>
        </div>
      )}
      <Line t={t} id="lg01" top={250} size={64} blue={[4, 5]} />
      <Line t={t} id="lg02" top={230} size={60} accent={[2, 3, 4]} blue={[5]} />
      <ProductTag t={t} at={W('lg02', 4)} out={C2 - 0.1} top={1530} />
      <Line t={t} id="lg03" top={250} size={70} blue={[2]} accent={[4, 5]} />
      <Sound set="lgeo" son={son} />
    </AbsoluteFill>
  )
}
