import * as THREE from 'three'
import { useMemo } from 'react'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer } from '@react-three/postprocessing'
import { Cam, RenderOnMount, Card, Panel, Particles, Phone, clamp, easeIn, easeInOut, easeOut, expoOut, mix, noise1, pr, rnd, spring, useFaceGeometry, useSlabGeometry, useTex, useTextGeometry } from '../kit3d'
import UNBOUNDED from '../fonts/unbounded-900.json'
import { BEAT, LIME, P, PINK, VIOLET, bar } from './temps'

/* « Ton concurrent » : objets 3D façon jouets en pâte (couleurs saturées, formes rondes), fond transparent
   (les fonds colorés sont en CSS derrière le canevas). Un plan par « truc », chiffres 3D qui traversent l'écran. */

const NOTIF_H = 0.92 * (168 / 760)
// Matériau « pâte à modeler »
const Clay = ({ color, rough = 0.5, ...p }) => <meshPhysicalMaterial color={color} roughness={rough} clearcoat={0.35} clearcoatRoughness={0.4} {...p} />

// Secousse de caméra, forte sur les coups
const jolt = (t, at, amp = 0.08, len = 0.35) => {
  const a = t - at
  if (a < 0 || a > len) return [0, 0]
  const k = (1 - a / len) * amp
  return [noise1(a * 60) * k, noise1(a * 60 + 9) * k]
}

// Chiffre géant qui fonce vers la caméra et la traverse
const Digit = ({ t, at, char, color }) => {
  const g = useTextGeometry(char, UNBOUNDED, { size: 1.6, depth: 0.5, bevel: 0.06 })
  const a = t - at
  if (a < -0.05 || a > 0.75) return null
  // arrive de loin en rebondissant, puis plonge dans la caméra
  const inK = expoOut(clamp(a / 0.3))
  const dive = easeIn(clamp((a - 0.42) / 0.3))
  return (
    <mesh geometry={g} position={[0, 0.25, mix(-9, 0, inK) + dive * 6.8]} rotation={[mix(-0.8, 0, inK), mix(1.2, -0.15, inK) + dive * 0.3, 0.08]}>
      <Clay color={color} emissive={color} emissiveIntensity={0.15} />
    </mesh>
  )
}

// ─── 1. L'accroche : le téléphone qui s'écrase, la notification du concurrent ───
const Hook = ({ t }) => {
  const [lock, notif] = useTex('lock-vide', 'notif-concurrent')
  const fall = clamp((t + 0.25) / 0.3)
  const land = t >= 0.05 ? Math.exp(-(t - 0.05) * 7) * Math.sin((t - 0.05) * 26) * 0.12 : 0
  const slam = t < 0.05 ? fall * fall : 1
  const pop = spring(t, 0.78, 1.6, 6)
  const punch = t >= 2.0 ? expoOut(clamp((t - 2.0) / 0.25)) : 0
  const [jx, jy] = jolt(t, 0.12, 0.12)
  const [kx, ky] = jolt(t, 2.03, 0.1)
  return (
    <>
      <Cam pos={[jx + kx, jy + ky - 0.2, mix(6.8, 5.6, punch)]} look={[0, -0.5, 0]} fov={36} roll={-0.06 + punch * 0.05} />
      <Phone screen={lock} body={PINK} metal={0.05} rough={0.45} position={[0, mix(2.4, -0.1, slam) + land, 0]} rotation={[0.12, mix(0.5, -0.18, slam), mix(0.3, 0.06, slam)]} scale={1.05}>
        {t >= 0.78 && <Panel map={notif} w={0.92} h={NOTIF_H} position={[0.02, 0.45 + pop * 0.05, 0.08 + pop * 0.55]} rotation={[0, 0.25 * (1 - clamp(pop)), -0.06 * pop]} scale={0.9 + pop * 0.42} />}
      </Phone>
    </>
  )
}

// ─── 2. « Comment il fait ? » : point d'interrogation, puis le 3 ───
const Question = ({ t }) => {
  const q = useTextGeometry('?', UNBOUNDED, { size: 1.5, depth: 0.45, bevel: 0.06 })
  const three = useTextGeometry('3', UNBOUNDED, { size: 1.5, depth: 0.45, bevel: 0.06 })
  const a = t - P.comment
  const inK = spring(t, P.comment + 0.05, 1.4, 5)
  const beat = Math.exp(-(((t - P.comment) % BEAT) / BEAT) * 4)
  const swap = t >= 3.6
  const s3 = spring(t, 3.6, 1.6, 6)
  return (
    <>
      <Cam pos={[0, 0.2, 6.4]} look={[0, -0.25, 0]} fov={36} roll={0.05} />
      {!swap && (
        <mesh geometry={q} rotation={[0, Math.sin(a * 3) * 0.55, Math.sin(a * 4) * 0.12]} scale={clamp(inK) * (1 + beat * 0.06)} position-y={0.3}>
          <Clay color={LIME} />
        </mesh>
      )}
      {swap && (
        <mesh geometry={three} rotation={[0, mix(Math.PI, 0, clamp(s3)) + Math.sin(a * 3) * 0.12, -0.08]} scale={clamp(s3) * 1.1} position-y={0.3}>
          <Clay color={PINK} />
        </mesh>
      )}
      <ContactShadows position-y={-1.2} scale={6} blur={2} far={3} opacity={0.4} color="#1a0040" frames={Infinity} />
    </>
  )
}

// ─── 3. « Un » : la carte dans le téléphone, puis le tiroir qui claque ───
const One = ({ t }) => {
  const [front, back, wallet] = useTex('pass-graphite', 'pass-back', 'wallet')
  const k = pr(t, 5.15, 6.45, easeInOut)
  const inside = pr(t, 6.3, 6.5, x => x)
  const phoneIn = spring(t, 4.75, 1.4, 6)
  return (
    <>
      <Cam pos={[0.3, 0.0, 7.0]} look={[0, -0.6, 0]} fov={36} roll={-0.05} />
      <Phone screen={wallet} body={LIME} metal={0.05} rough={0.45} position={[0, mix(-5, -0.2, clamp(phoneIn)), 0]} rotation={[0.05, Math.sin(t * 2) * 0.12 - 0.1, 0.05]} />
      {inside < 1 && (
        <Card front={front} back={back} opacity={1 - inside} position={[mix(1.4, 0, k), mix(2.2, -0.62, k), mix(0.8, 0.075, k)]} rotation={[mix(0.5, 0, k), mix(-Math.PI * 3, 0, k), mix(0.5, 0, k)]} scale={mix(1.1, 0.807, k)} />
      )}
      <ContactShadows position-y={-1.35} scale={6} blur={2} far={3} opacity={0.4} color="#1a0040" frames={Infinity} />
    </>
  )
}

const Drawer = ({ t }) => {
  const [paper] = useTex('papier')
  const a = t - P.tiroir
  const open = t < 7.42 ? easeOut(clamp(a / 0.25)) : 1 - easeIn(clamp((t - 7.42) / 0.09))
  const [jx, jy] = jolt(t, 7.5, 0.18, 0.4)
  const face = useFaceGeometry(1.55 * 0.5, 0.5, 0.02)
  return (
    <>
      <Cam pos={[2.0 + jx, 3.0 + jy, 6.6]} look={[0, -0.55, 0.3]} fov={36} />
      {/* meuble */}
      <mesh position={[0, -0.2, -0.6]}>
        <boxGeometry args={[2.4, 1.6, 1.6]} />
        <Clay color="#ffb84d" />
      </mesh>
      {/* tiroir */}
      <group position={[0, 0, mix(0.2, 1.3, open)]}>
        <mesh position={[0, 0, 0.62]}>
          <boxGeometry args={[2.1, 0.62, 0.1]} />
          <Clay color="#ff7b2e" />
        </mesh>
        <mesh position={[0, 0.27, 0.72]}>
          <boxGeometry args={[0.5, 0.08, 0.08]} />
          <Clay color="#fff4e0" />
        </mesh>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[2.0, 0.06, 1.2]} />
          <Clay color="#e86a1f" />
        </mesh>
        {[0, 1, 2, 3].map(i => (
          <mesh key={i} geometry={face} position={[(rnd(i) - 0.5) * 1.1, -0.2 + i * 0.012, (rnd(i + 3) - 0.5) * 0.6]} rotation={[-Math.PI / 2, 0, (rnd(i + 5) - 0.5) * 1.2]}>
            <meshStandardMaterial map={paper} roughness={0.9} />
          </mesh>
        ))}
        {/* poussière */}
        <Particles count={40} size={0.025} color="#fff4e0" additive={false} fn={(i, o) => {
          o[0] = (rnd(i) - 0.5) * 1.6
          o[1] = -0.1 + rnd(i + 1) * 0.6 + Math.sin(t * 2 + i) * 0.03
          o[2] = (rnd(i + 2) - 0.5) * 0.8
          o[3] = 0.5 + rnd(i + 3)
          o[4] = 0.6 * open
        }} />
      </group>
      <ContactShadows position-y={-1.0} scale={8} blur={2} far={3} opacity={0.5} color="#3a1300" frames={Infinity} />
    </>
  )
}

// ─── 4. « Deux » : les offres jaillissent en notifications, en boucle infinie ───
const Two = ({ t }) => {
  const [lock, notif] = useTex('lock-vide', 'notif-concurrent')
  const coin = useTextGeometry('0€', UNBOUNDED, { size: 0.42, depth: 0.12, bevel: 0.02 })
  const phoneIn = spring(t, 8.55, 1.4, 6)
  const burst = clamp((t - 9.75) * 2)
  const many = t >= 11.15 ? 1 : 0
  const coinK = spring(t, 10.45, 1.6, 6)
  const N = 14
  return (
    <>
      <Cam pos={[0, 0.1, 7.4]} look={[0, -0.45, 0]} fov={36} roll={0.04} />
      <Phone screen={lock} body={VIOLET} metal={0.1} rough={0.4} position={[0, mix(-5, -0.25, clamp(phoneIn)), -0.3]} rotation={[0.05, Math.sin(t * 1.5) * 0.1, -0.04]} glow={1} />
      {/* notifications en ∞ */}
      {burst > 0 &&
        Array.from({ length: N }, (_, i) => {
          const speed = 0.32 + many * 0.25
          const u = ((t - 9.75) * speed + i / N) % 1
          const ang = u * Math.PI * 2
          const den = 1 + Math.sin(ang) ** 2
          const x = (1.12 * Math.cos(ang)) / den
          const y = (1.12 * Math.sin(ang) * Math.cos(ang)) / den
          const show = clamp((t - 9.75 - i * 0.05) * 5) * (i < N * (0.45 + 0.55 * many) ? 1 : clamp((t - 11.15 - (i - N * 0.45) * 0.03) * 5))
          return <Panel key={i} map={notif} w={0.92} h={NOTIF_H} position={[x, 0.55 + y * 1.6, 0.6 + Math.sin(ang * 2) * 0.4]} rotation={[0, x * -0.3, y * 0.4]} scale={0.78 * show} />
        })}
      {/* pièce « 0 € » */}
      {t >= 10.4 && (
        <group position={[0.7, 0.95, 1.0]} rotation={[0.2, Math.sin(t * 3) * 0.5, 0.15]} scale={clamp(coinK) * 0.95}>
          <mesh rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.55, 0.55, 0.14, 64]} />
            <Clay color={LIME} />
          </mesh>
          <mesh geometry={coin} position-z={0.09}>
            <Clay color="#1a0040" />
          </mesh>
        </group>
      )}
    </>
  )
}

// ─── 5. « Trois » : le quartier jouet, le passant, la notification de proximité ───
const BLOCK_COLORS = [PINK, LIME, '#8b5cff', '#ffb84d', '#ffffff', '#2ee6ff']
const Three = ({ t }) => {
  const [toast] = useTex('toast')
  const rise = spring(t, P.trois + 0.25, 1.2, 6)
  const blocks = useMemo(() => {
    const out = []
    for (let gx = -4; gx <= 4; gx++)
      for (let gz = -4; gz <= 4; gz++) {
        if (gz === 1 || gx === -2 || (gx === 0 && gz === 0)) continue
        const i = gx * 17 + gz * 5 + 3
        out.push([gx * 0.95, 0.2 + rnd(i) * 0.6, gz * 0.95, BLOCK_COLORS[Math.floor(rnd(i + 1) * BLOCK_COLORS.length)], i])
      }
    return out
  }, [])
  const walk = pr(t, 12.5, 14.6, x => x)
  const wx = mix(-4.2, -0.85, walk)
  const near = t >= 13.4
  const ring = ((t - 12.3) % 0.87) / 0.87
  const ph = spring(t, 14.0, 1.5, 6)
  const orbit = 0.7 + (t - P.trois) * 0.12
  return (
    <>
      <Cam pos={[Math.sin(orbit) * 7.4, 7.6, Math.cos(orbit) * 7.4]} look={[-0.7, -0.9, 0.5]} fov={36} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <circleGeometry args={[6.5, 64]} />
        <Clay color="#bff7e6" />
      </mesh>
      {blocks.map(([x, h, z, c, i]) => {
        const hh = h * clamp(spring(t, P.trois + 0.2 + rnd(i + 7) * 0.4, 1.4, 6))
        return (
          <mesh key={i} position={[x, hh / 2, z]} scale={[0.7, Math.max(0.001, hh), 0.7]}>
            <boxGeometry />
            <Clay color={c} />
          </mesh>
        )
      })}
      {/* la boutique, sa sucette-repère */}
      <mesh position={[0, 0.35 * clamp(rise), 0]} scale={[0.75, 0.7 * clamp(rise) + 0.001, 0.75]}>
        <boxGeometry />
        <Clay color="#ffffff" />
      </mesh>
      <group position={[0, 1.0 + Math.sin(t * 6) * 0.06, 0]} scale={clamp(rise)}>
        <mesh position-y={0.55}>
          <sphereGeometry args={[0.32, 32, 32]} />
          <Clay color={PINK} emissive={PINK} emissiveIntensity={0.2} />
        </mesh>
        <mesh position-y={0.1}>
          <cylinderGeometry args={[0.04, 0.04, 0.6, 16]} />
          <Clay color="#ffffff" />
        </mesh>
      </group>
      {/* onde de proximité */}
      {near && [0, 1].map(k => {
        const r = ((t - 13.4) / 0.87 + k * 0.5) % 1
        return (
          <mesh key={k} rotation-x={-Math.PI / 2} position-y={0.02} scale={0.4 + r * 2.4}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial color={PINK} transparent opacity={(1 - r) * 0.9} />
          </mesh>
        )
      })}
      <mesh rotation-x={-Math.PI / 2} position-y={0.015} scale={1.6}>
        <ringGeometry args={[0.97, 1, 96]} />
        <meshBasicMaterial color={PINK} transparent opacity={0.5 * clamp(rise) + ring * 0} />
      </mesh>
      {/* le passant */}
      <group position={[wx, 0, 0.95]}>
        <mesh position-y={0.24}>
          <capsuleGeometry args={[0.12, 0.25, 8, 16]} />
          <Clay color={LIME} />
        </mesh>
        <mesh position-y={0.58}>
          <sphereGeometry args={[0.12, 24, 24]} />
          <Clay color={LIME} />
        </mesh>
        {t >= 14.0 && (
          <group position={[0, 1.25, 0]} scale={clamp(ph) * 1.2}>
            <Panel map={toast} w={2.1} h={2.1 * (104 / 640)} position={[0.33, 0, 0]} rotation={[-0.35, 0.5, 0]} />
          </group>
        )}
      </group>
      <ContactShadows position-y={0} scale={14} blur={1.5} far={2} opacity={0.5} color="#004433" frames={Infinity} />
    </>
  )
}

// ─── 6–7. Le secret : la boîte qui tremble puis explose sur « Fidelyz » ───
const Secret = ({ t }) => {
  const [logo] = useTex('logo-fidelyz.png')
  const tile = useFaceGeometry(1, 1, 0.225, [0.184, 0.184, 0.816, 0.816])
  const slab = useSlabGeometry(1, 1, 0.225, 0.12, 0.04)
  const D = P.fidelyz
  const a = t - D
  const shiver = t < D ? Math.pow(clamp((t - P.secret) / 1.7), 2) : 0
  const sx = noise1(t * 40) * 0.04 * shiver
  const lid = a > 0 ? expoOut(clamp(a / 0.5)) : 0
  const up = spring(t, D + 0.02, 1.3, 5.5)
  const [jx, jy] = jolt(t, D, 0.16, 0.5)
  return (
    <>
      <Cam pos={[jx, 0.9 + jy, mix(7.2, 7.8, clamp(a / 0.6))]} look={[0, -0.3, 0]} fov={36} roll={mix(0.06, 0, clamp(a * 3))} />
      <spotLight position={[0, 5, 2]} angle={0.4} penumbra={0.6} intensity={t < D ? 60 : 20} color="#ffffff" />
      {/* boîte */}
      <group position={[sx, -0.6, 0]} rotation={[0, t * 0.6 + sx * 4, sx * 2]}>
        <mesh>
          <boxGeometry args={[1.3, 1.1, 1.3]} />
          <Clay color={LIME} />
        </mesh>
        <mesh position-y={0}>
          <boxGeometry args={[1.32, 1.12, 0.2]} />
          <Clay color={PINK} />
        </mesh>
        <mesh rotation-y={Math.PI / 2}>
          <boxGeometry args={[1.32, 1.12, 0.2]} />
          <Clay color={PINK} />
        </mesh>
        <group position={[0, 0.62 + lid * 3, lid * 1.5]} rotation={[lid * 2.2, 0, lid * 0.8]}>
          <mesh>
            <boxGeometry args={[1.42, 0.22, 1.42]} />
            <Clay color={LIME} />
          </mesh>
          <mesh position-y={0.18}>
            <torusGeometry args={[0.2, 0.07, 16, 32]} />
            <Clay color={PINK} />
          </mesh>
        </group>
      </group>
      {/* le logo jaillit */}
      {a > 0 && (
        <group position={[0, mix(-0.6, 0.85, clamp(up)), 0.3]} rotation={[0.1, mix(Math.PI * 2, 0, clamp(up)) + Math.sin(a * 2) * 0.15, 0]} scale={clamp(up) * 1.15}>
          <mesh geometry={slab}>
            <Clay color="#ffffff" rough={0.2} />
          </mesh>
          <mesh geometry={tile} position-z={0.1}>
            <meshPhysicalMaterial map={logo} roughness={0.15} clearcoat={1} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={0.3} />
          </mesh>
        </group>
      )}
      {/* confettis */}
      {a > 0 && (
        <>
          {[LIME, PINK, '#ffffff', '#2ee6ff'].map((c, k) => (
            <Particles key={k} count={60} size={0.06} color={c} additive={false} fn={(i, o) => {
              const j = i + k * 100
              const ang = rnd(j) * Math.PI * 2
              const v = 2 + rnd(j + 1) * 4
              const up0 = 2 + rnd(j + 2) * 4
              o[0] = Math.cos(ang) * v * Math.min(a, 1.2) * 0.8
              o[1] = -0.2 + up0 * a - 4.5 * a * a
              o[2] = Math.sin(ang) * v * Math.min(a, 1.2) * 0.5
              o[3] = 0.6 + rnd(j + 3)
              o[4] = 1 - clamp((a - 1.2) / 0.6)
            }} />
          ))}
        </>
      )}
      <ContactShadows position-y={-1.16} scale={6} blur={2} far={3} opacity={0.5} color="#1a0040" frames={Infinity} />
    </>
  )
}

// ─── 8. Les atouts : logo au centre, cartes en orbite ───
const Assets = ({ t }) => {
  const [logo, f1, f2, f3, back] = useTex('logo-fidelyz.png', 'pass-graphite', 'pass-azur', 'pass-champagne', 'pass-back')
  const tile = useFaceGeometry(1, 1, 0.225, [0.184, 0.184, 0.816, 0.816])
  const slab = useSlabGeometry(1, 1, 0.225, 0.12, 0.04)
  const beat = Math.exp(-(((t - P.atouts) % BEAT) / BEAT) * 5)
  return (
    <>
      <Cam pos={[0, 0.3, 6.0]} look={[0, -0.15, 0]} fov={36} />
      <group position={[0, 0.85, 0]} rotation={[0.1, Math.sin(t * 1.4) * 0.35, 0]} scale={1 + beat * 0.05}>
        <mesh geometry={slab}>
          <Clay color="#ffffff" rough={0.2} />
        </mesh>
        <mesh geometry={tile} position-z={0.1}>
          <meshPhysicalMaterial map={logo} roughness={0.15} clearcoat={1} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={0.3} />
        </mesh>
      </group>
      {[f1, f2, f3].map((m, i) => {
        const ang = t * 1.1 + (i * Math.PI * 2) / 3
        return <Card key={i} front={m} back={back} position={[Math.cos(ang) * 1.5, 0.85 + Math.sin(ang * 2) * 0.12, Math.sin(ang) * 0.45 - 1.1]} rotation={[0.1, -ang + Math.PI / 2, 0.2]} scale={0.4} />
      })}
    </>
  )
}

// ─── 9. À ton tour ───
const YourTurn = ({ t }) => {
  const [lock, notif] = useTex('lock-vide', 'notif-toi')
  const inK = spring(t, P.fin + 0.05, 1.4, 6)
  const pop = spring(t, 22.65, 1.6, 6)
  return (
    <>
      <Cam pos={[0, 0.1, 7.6]} look={[0, -0.85, 0]} fov={36} roll={-0.04} />
      <Phone screen={lock} body={LIME} metal={0.05} rough={0.45} position={[0, mix(-5, 0.1, clamp(inK)), 0]} rotation={[0.05, Math.sin(t * 1.6) * 0.15, 0.04]}>
        {t >= 22.65 && <Panel map={notif} w={0.92} h={NOTIF_H} position={[0.02, 0.45, 0.08 + pop * 0.6]} rotation={[0, 0, -0.05 * pop]} scale={0.95 + pop * 0.55} />}
      </Phone>
    </>
  )
}

export const Scene3D = ({ t }) => {
  const kicks = [0.05, 2.03, 4.44, 7.5, 8.29, 12.09, P.fidelyz]
  const kick = kicks.reduce((m, h) => (t >= h ? Math.max(m, Math.exp(-(t - h) * 8)) : m), 0)
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, 3]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#ffd6f0" position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#e6ffd0" position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[6, 3, 1]} />
      </Environment>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 6, 5]} intensity={1.8} />
      <directionalLight position={[-4, 1, 3]} intensity={0.7} color="#ffc4e6" />
      {t < P.comment && <Hook t={t} />}
      {t >= P.comment && t < P.un && <Question t={t} />}
      {t >= P.un - 0.05 && t < P.tiroir && <One t={t} />}
      {t >= P.tiroir && t < P.deux && <Drawer t={t} />}
      {t >= P.deux - 0.05 && t < P.trois && <Two t={t} />}
      {t >= P.trois && t < P.secret && <Three t={t} />}
      {t >= P.secret && t < P.atouts && <Secret t={t} />}
      {t >= P.atouts && t < P.fin && <Assets t={t} />}
      {t >= P.fin && <YourTurn t={t} />}
      {/* chiffres qui traversent l'écran */}
      <Digit t={t} at={4.18} char="1" color={LIME} />
      <Digit t={t} at={8.03} char="2" color={PINK} />
      <Digit t={t} at={11.83} char="3" color="#2ee6ff" />
      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={0.35} luminanceThreshold={0.92} luminanceSmoothing={0.1} />
        <ChromaticAberration offset={[kick * 0.012, kick * 0.004]} radialModulation={false} />
      </EffectComposer>
    </>
  )
}
