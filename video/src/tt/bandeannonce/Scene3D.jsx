import * as THREE from 'three'
import { useMemo } from 'react'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Cam, RenderOnMount, Card, Panel, Particles, Phone, burnShader, clamp, easeInOut, easeOut, expoOut, mix, noise1, pr, rnd, spring, useFaceGeometry, usePaperGeometry, useTex, useTextGeometry } from '../kit3d'
import CINZEL from '../fonts/cinzel-700.json'
import { HITS, SH } from './temps'

/* Bande-annonce : toute la 3D dans une seule scène, plan par plan selon le temps t.
   Chaque plan ne monte ses objets que pendant sa durée ; la caméra est recalculée à chaque image. */

const PAPER_W = 1.55
const PAPER_H = 1.0
const KRAFT = '#b8946a'

// Tremblé de caméra à la main, très léger
const shake = (t, amp = 0.012) => [noise1(t * 1.3) * amp, noise1(t * 1.1 + 40) * amp, 0]

/* Carte papier : recto texturé, verso kraft, froissée, qui peut se consumer (burn 0 → 1,3) */
const PaperCard = ({ t, crumple = 0.35, seed = 1, burn = 0, ...props }) => {
  const [paper] = useTex('papier')
  const geo = usePaperGeometry(PAPER_W, PAPER_H, crumple, seed)
  const back = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 4
    const g = c.getContext('2d')
    g.fillStyle = KRAFT
    g.fillRect(0, 0, 4, 4)
    const tx = new THREE.CanvasTexture(c)
    tx.colorSpace = THREE.SRGBColorSpace
    return tx
  }, [])
  const uniforms = useMemo(() => ({ uBurn: { value: 0 }, uEdge: { value: new THREE.Color('#ff7a1a') } }), [])
  uniforms.uBurn.value = burn
  const onFront = useMemo(() => burnShader(uniforms), [uniforms])
  return (
    <group {...props}>
      <mesh geometry={geo}>
        <meshStandardMaterial map={paper} roughness={0.92} side={THREE.FrontSide} onBeforeCompile={onFront} />
      </mesh>
      <mesh geometry={geo}>
        <meshStandardMaterial map={back} roughness={0.95} side={THREE.BackSide} onBeforeCompile={onFront} />
      </mesh>
    </group>
  )
}

// ─── 1. Le tambour de la machine à laver ──────────────────────
const Drum = ({ t }) => {
  const drum = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 256
    const g = c.getContext('2d')
    g.fillStyle = '#9aa3ad'
    g.fillRect(0, 0, 1024, 256)
    for (let y = 8; y < 256; y += 22) for (let x = (y / 22) % 2 ? 11 : 0; x < 1024; x += 22) {
      g.fillStyle = '#20262d'
      g.beginPath()
      g.arc(x, y, 5.5, 0, Math.PI * 2)
      g.fill()
    }
    const tx = new THREE.CanvasTexture(c)
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping
    tx.repeat.set(3, 2)
    tx.colorSpace = THREE.SRGBColorSpace
    return tx
  }, [])
  const end = SH.sac
  const spin = t * 0.7 + Math.pow(pr(t, end - 0.55, end, k => k), 3) * 5
  const z = mix(4.4, 2.5, easeInOut(clamp(t / 3.3)))
  const [sx, sy] = shake(t, 0.02)
  return (
    <>
      <color attach="background" args={['#020a12']} />
      <fog attach="fog" args={['#03141f', 2, 9]} />
      <Cam pos={[sx + 0.05, sy + 0.08, z]} look={[0, 0, -1.4]} fov={38} roll={-spin * 0.06 + 0.04} />
      <ambientLight intensity={0.25} color="#5fb6ff" />
      <pointLight position={[0, 0.4, -1.3]} intensity={6} distance={5} color="#5cc8ff" />
      <directionalLight position={[-2, 3, 3]} intensity={1.1} color="#dff3ff" />
      <spotLight position={[1.2, 1.5, 2]} angle={0.5} penumbra={1} intensity={9} color="#ffffff" />
      {/* hublot chromé et sa vitre */}
      <mesh position-z={0.2}>
        <torusGeometry args={[1.32, 0.2, 32, 96]} />
        <meshPhysicalMaterial color="#d7dde4" metalness={1} roughness={0.16} clearcoat={1} />
      </mesh>
      <mesh position-z={0.2}>
        <torusGeometry args={[1.12, 0.05, 24, 96]} />
        <meshPhysicalMaterial color="#0d1116" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position-z={0.15}>
        <circleGeometry args={[1.12, 64]} />
        <meshPhysicalMaterial color="#9fdcff" transparent opacity={0.1} roughness={0.04} clearcoat={1} metalness={0.1} depthWrite={false} />
      </mesh>
      {/* façade de la machine */}
      <mesh position-z={0.05}>
        <ringGeometry args={[1.5, 6, 64]} />
        <meshStandardMaterial color="#e8ecef" roughness={0.45} />
      </mesh>
      {/* tambour perforé */}
      <mesh rotation={[Math.PI / 2, spin, 0]} position-z={-1.4}>
        <cylinderGeometry args={[1.45, 1.45, 2.6, 64, 1, true]} />
        <meshStandardMaterial map={drum} metalness={0.85} roughness={0.35} side={THREE.BackSide} />
      </mesh>
      <mesh position-z={-2.7}>
        <circleGeometry args={[1.45, 64]} />
        <meshStandardMaterial color="#2a3640" metalness={0.8} roughness={0.4} />
      </mesh>
      {/* la carte tourne au ralenti dans l'eau */}
      <PaperCard
        t={t}
        crumple={0.55}
        seed={3}
        position={[Math.cos(spin * 0.8 + 1) * 0.12, Math.sin(spin * 0.8 + 1) * 0.15 + 0.05, -0.75]}
        rotation={[Math.sin(t * 0.7) * 0.5 + 0.25, Math.sin(t * 0.5) * 0.6, Math.PI / 2 + spin * 0.35]}
        scale={0.78}
      />
      {/* bulles */}
      <Particles
        count={140}
        size={0.05}
        color="#bfe8ff"
        fn={(i, o) => {
          const a = rnd(i) * Math.PI * 2 + spin * (0.4 + rnd(i + 3) * 0.6)
          const r = 0.2 + rnd(i + 1) * 1.15
          const life = (t * (0.18 + rnd(i + 2) * 0.25) + rnd(i + 5)) % 1
          o[0] = Math.cos(a) * r
          o[1] = Math.sin(a) * r + life * 0.6 - 0.3
          o[2] = -0.3 - rnd(i + 4) * 2.3
          o[3] = 0.4 + rnd(i + 6) * 1.6
          o[4] = Math.sin(life * Math.PI) * 0.8
        }}
      />
    </>
  )
}

// ─── 2. Au fond du sac ────────────────────────────────────────
const Coin = props => (
  <mesh {...props}>
    <cylinderGeometry args={[0.13, 0.13, 0.022, 48]} />
    <meshStandardMaterial color="#c99b45" metalness={1} roughness={0.32} />
  </mesh>
)
const Bag = ({ t }) => {
  const k = pr(t, SH.sac, SH.tampon, k => k)
  const y = mix(5.6, 3.7, easeOut(k))
  const swing = Math.sin(t * 1.4) * 0.25
  const receipt = usePaperGeometry(0.42, 1.2, 1, 9)
  const [sx, sz] = shake(t, 0.03)
  return (
    <>
      <color attach="background" args={['#040302']} />
      <fog attach="fog" args={['#040302', 2, 7]} />
      <Cam pos={[sx + 0.1, y, sz + 0.25]} look={[0, 0, 0]} fov={40} roll={0.25 + k * 0.35} />
      <ambientLight intensity={0.05} />
      <spotLight position={[swing, 3.6, 0.4]} angle={0.42} penumbra={0.8} intensity={60} color="#ffe2b8" />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[8, 8]} />
        <meshStandardMaterial color="#2b211b" roughness={1} />
      </mesh>
      <PaperCard t={t} crumple={0.9} seed={5} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0.35]} scale={0.95} />
      <mesh geometry={receipt} position={[-0.75, 0.03, -0.35]} rotation={[-Math.PI / 2, 0, -0.5]}>
        <meshStandardMaterial color="#eeeae2" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <Coin position={[0.72, 0.03, 0.45]} rotation={[0.05, 0, 0.1]} />
      <Coin position={[0.55, 0.06, 0.62]} rotation={[0.3, 0, 0.25]} />
      <Coin position={[-0.5, 0.03, 0.62]} />
      {/* clés */}
      <group position={[0.6, 0.04, -0.55]} rotation={[-Math.PI / 2, 0, 0.8]}>
        <mesh>
          <torusGeometry args={[0.13, 0.025, 16, 48]} />
          <meshStandardMaterial color="#b9bcc2" metalness={1} roughness={0.25} />
        </mesh>
        <mesh position={[0.32, 0, 0]}>
          <boxGeometry args={[0.42, 0.07, 0.015]} />
          <meshStandardMaterial color="#c9b37a" metalness={1} roughness={0.3} />
        </mesh>
      </group>
      {/* stylo */}
      <mesh position={[-0.2, 0.05, -0.85]} rotation={[0, 0.3, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 1.1, 24]} />
        <meshStandardMaterial color="#14306b" roughness={0.3} />
      </mesh>
      {/* poussière dans le faisceau */}
      <Particles
        count={160}
        size={0.022}
        color="#ffe7c4"
        fn={(i, o) => {
          o[0] = (rnd(i) - 0.5) * 2 + noise1(t * 0.3 + i) * 0.2 + swing * 0.3
          o[1] = 0.3 + rnd(i + 1) * 2.6 + noise1(t * 0.2 + i * 3) * 0.2
          o[2] = (rnd(i + 2) - 0.5) * 2 + 0.2
          o[3] = 0.5 + rnd(i + 3)
          o[4] = 0.35 + 0.4 * rnd(i + 4)
        }}
      />
    </>
  )
}

// ─── 3. Le dixième tampon (macro) ─────────────────────────────
const SLOT10 = [0.355, -0.25] // centre de la 10ᵉ case sur la carte (unités de la carte)
const Stamp = ({ t }) => {
  const close = t >= HITS[1]
  const k = close ? pr(t, HITS[1], SH.retraite, k => k) : pr(t, SH.tampon, HITS[1], k => k)
  const pos = close
    ? [SLOT10[0] + mix(0.05, 0.0, k), mix(0.62, 0.36, easeOut(k)), -SLOT10[1] + mix(0.32, 0.14, easeOut(k))]
    : [mix(-0.75, 0.05, k), mix(0.42, 0.36, k), mix(0.45, 0.22, k)]
  const look = close ? [SLOT10[0], 0, -SLOT10[1]] : [mix(-0.45, 0.25, k), 0, mix(0.15, 0.05, k)]
  // le dixième tampon apparaît à peine… puis disparaît
  const ghost = Math.max(0, Math.sin(pr(t, 10.45, 11.3, k => k) * Math.PI)) * 0.45 * (0.7 + 0.3 * noise1(t * 30))
  return (
    <>
      <color attach="background" args={['#050403']} />
      <fog attach="fog" args={['#050403', 0.6, 3]} />
      <Cam pos={pos} look={look} fov={close ? 30 : 34} roll={close ? 0.15 : -0.1} />
      <ambientLight intensity={0.08} />
      <spotLight position={[1.4, 1.3, 0.6]} target-position={[0, 0, 0]} angle={0.6} penumbra={1} intensity={14} color="#ffd9a8" />
      <pointLight position={[-1, 0.4, -0.6]} intensity={2} color="#6aa8ff" distance={3} />
      <mesh rotation-x={-Math.PI / 2} position-y={-0.01}>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#1a120c" roughness={0.6} metalness={0.1} />
      </mesh>
      <PaperCard t={t} crumple={0.2} seed={7} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh position={[SLOT10[0], 0.012, -SLOT10[1]]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.042, 0.054, 48]} />
        <meshBasicMaterial color="#b22222" transparent opacity={ghost} />
      </mesh>
      <Particles
        count={70}
        size={0.006}
        color="#ffe2b0"
        fn={(i, o) => {
          o[0] = SLOT10[0] + (rnd(i) - 0.5) * 1.4 + noise1(t * 0.2 + i) * 0.05
          o[1] = 0.03 + rnd(i + 1) * 0.5
          o[2] = -SLOT10[1] + (rnd(i + 2) - 0.5) * 1.2
          o[3] = 0.5 + rnd(i + 3)
          o[4] = 0.5
        }}
      />
    </>
  )
}

// ─── 4–6. La retraite, les braises, la remplaçante ────────────
const BURN0 = 15.95 // « prend »
const EMBERS = 260
const emberAt = (i, t, o) => {
  const tb = BURN0 + rnd(i) * 1.7 // naissance sur le front de flamme
  if (t < tb) {
    o[4] = 0
    return
  }
  const age = t - tb
  const x0 = (rnd(i + 1) - 0.5) * PAPER_W * 0.95
  const y0 = 0.08 + clamp((tb - BURN0) / 1.7) * PAPER_H * 0.95
  let x = x0 + noise1(i + age * 1.2) * 0.25 * age
  let y = y0 + age * (0.25 + rnd(i + 2) * 0.35)
  let z = (rnd(i + 3) - 0.5) * 0.2 + noise1(i * 2 + age) * 0.2 * age
  // à partir de 17,6 s les braises sont aspirées vers un point de lumière
  const pull = easeInOut(pr(t, 17.5 + rnd(i + 4) * 0.4, 18.85, k => k))
  x = mix(x, 0, pull)
  y = mix(y, 0.95, pull)
  z = mix(z, 0, pull)
  // explosion sur le coup (19,05 s)
  const blast = t >= HITS[2] ? t - HITS[2] : 0
  if (blast > 0) {
    const a = rnd(i + 5) * Math.PI * 2
    const b = (rnd(i + 6) - 0.5) * Math.PI
    const v = (2 + rnd(i + 7) * 5) * (1 - Math.exp(-blast * 4)) / 4 * 4
    x += Math.cos(a) * Math.cos(b) * v
    y += Math.sin(b) * v
    z += Math.sin(a) * Math.cos(b) * v * 0.5
  }
  o[0] = x
  o[1] = y
  o[2] = z
  o[3] = (0.6 + rnd(i + 8) * 1.4) * (1 + pull * 0.5)
  o[4] = (blast > 0 ? Math.exp(-blast * 1.8) : 1) * (age < 0.15 ? age / 0.15 : 1) * (pull > 0 ? 1 : Math.exp(-age * 0.45))
}

const Retirement = ({ t }) => {
  const burn = mix(-0.05, 1.3, pr(t, BURN0, BURN0 + 1.7, k => k))
  const orbit = mix(-0.55, 0.2, easeInOut(pr(t, SH.retraite, SH.presente, k => k)))
  const r = mix(5.4, 4.6, pr(t, SH.retraite, SH.presente, k => k))
  const flame = clamp((t - BURN0) * 2) * (1 - pr(t, BURN0 + 1.5, BURN0 + 2, k => k))
  return (
    <>
      <color attach="background" args={['#030303']} />
      <Cam pos={[Math.sin(orbit) * r, 0.55, Math.cos(orbit) * r]} look={[0, 0.25, 0]} fov={34} />
      <ambientLight intensity={0.04} />
      <spotLight position={[0, 4, 0.5]} angle={0.32} penumbra={0.7} intensity={70} color="#f3e6d2" />
      <pointLight position={[0, 0.4, 0.4]} intensity={flame * 5} color="#ff8a2a" distance={3} />
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[12, 12]} />
        <MeshReflectorMaterial blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={1.6} roughness={0.85} depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.2} color="#0a0a0a" metalness={0.5} />
      </mesh>
      {t < BURN0 + 2.2 && <PaperCard t={t} crumple={0.25} seed={2} burn={burn} position={[0, PAPER_H / 2 + 0.06, 0]} rotation={[0, 0, 0.02]} />}
      <Particles count={EMBERS} size={0.03} color="#ff9a3c" fn={(i, o) => emberAt(i, t, o)} />
    </>
  )
}

const Presents = ({ t }) => {
  const star = pr(t, 17.9, HITS[2], k => k * k)
  return (
    <>
      <color attach="background" args={['#000']} />
      <Cam pos={[0, 0.95, mix(2.8, 2.2, pr(t, SH.presente, HITS[2], k => k))]} look={[0, 0.95, 0]} fov={34} />
      <mesh position={[0, 0.95, 0]} scale={0.02 + star * 0.05}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={[4 * star + 1, 3 * star + 0.8, 2 * star + 0.4]} toneMapped={false} />
      </mesh>
      <Particles count={EMBERS} size={0.03} color="#ffb060" fn={(i, o) => emberAt(i, t, o)} />
    </>
  )
}

// Rayons de lumière derrière la carte
const Rays = ({ t, intensity = 1, color = '#9cc9ff', ...props }) => (
  <group {...props}>
    {Array.from({ length: 14 }, (_, i) => {
      const a = (i / 14) * Math.PI * 2 + t * 0.12 + rnd(i) * 0.3
      const len = 3 + rnd(i + 1) * 3
      return (
        <mesh key={i} rotation-z={a} position={[Math.cos(a + Math.PI / 2) * -len * 0, 0, -0.5]}>
          <planeGeometry args={[0.05 + rnd(i + 2) * 0.12, len]} />
          <meshBasicMaterial color={color} transparent opacity={0.08 * intensity * (0.6 + 0.4 * Math.sin(t * 2 + i))} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      )
    })}
  </group>
)

const Replacement = ({ t }) => {
  const [front, back] = useTex('pass-graphite', 'pass-back')
  const a = t - HITS[2]
  const rise = expoOut(clamp(a / 0.9))
  const spinY = mix(-Math.PI * 2.5, 0.25, rise) + Math.sin(a * 0.8) * 0.12
  const cz = mix(4.6, 5.4, easeOut(clamp(a / 2)))
  return (
    <>
      <color attach="background" args={['#01040a']} />
      <Cam pos={[0.25 * (1 - rise) + noise1(t * 2) * 0.01, 0.1, cz]} look={[0, -0.05, 0]} fov={36} roll={mix(0.3, -0.05, rise)} />
      <ambientLight intensity={0.2} />
      <spotLight position={[2, 3, 3]} angle={0.5} penumbra={1} intensity={40} color="#ffffff" />
      <pointLight position={[-2, -1, 1]} intensity={6} color="#2997ff" />
      <Rays t={t} intensity={1.5 * (1 - 0.5 * clamp(a))} position={[0, 0.42, -0.6]} scale={1.6} />
      <Card front={front} back={back} position={[0, mix(-3.2, 0.42, rise), 0]} rotation={[mix(0.6, -0.08, rise), spinY, mix(-0.4, 0.04, rise)]} emissive={0.04} />
      <Particles count={EMBERS} size={0.03} color="#ffb060" fn={(i, o) => emberAt(i, t, o)} />
    </>
  )
}

// ─── 7–8. Le téléphone, les cartes qui tombent, la surface ────
const IntoPhone = ({ t }) => {
  const [front, back, wallet] = useTex('pass-graphite', 'pass-back', 'wallet')
  const k = pr(t, SH.telephone, SH.telephone + 1.2, easeInOut)
  const inside = pr(t, SH.telephone + 0.9, SH.telephone + 1.25, k => k)
  const orbit = mix(0.7, -0.2, easeInOut(pr(t, SH.telephone, SH.perd, k => k)))
  return (
    <>
      <color attach="background" args={['#02050b']} />
      <Cam pos={[Math.sin(orbit) * 6.2, 0.1, Math.cos(orbit) * 6.2]} look={[0, -0.35, 0]} fov={36} />
      <ambientLight intensity={0.25} />
      <spotLight position={[2, 3, 3]} angle={0.6} penumbra={1} intensity={40} />
      <pointLight position={[-2, 1, -1]} intensity={8} color="#2997ff" />
      <Rays t={t} intensity={0.6} position={[0, 0, -1]} scale={1.6} />
      <Phone screen={wallet} body="#3a3a3e" position={[0, mix(-3, 0, easeOut(k)), 0]} rotation={[0, mix(-0.6, 0, k), 0]} />
      {inside < 1 && (
        <Card front={front} back={back} opacity={1 - inside} position={[0, mix(0.55, -0.42, k), mix(1.6, 0.075, k)]} rotation={[mix(-0.3, 0, k), mix(Math.PI * 2 + 0.25, 0, k), 0]} scale={mix(1.15, 0.807, k)} />
      )}
    </>
  )
}

const Rain = ({ t }) => {
  const [wallet] = useTex('wallet')
  const [paper] = useTex('papier')
  const geo = usePaperGeometry(PAPER_W, PAPER_H, 0.6, 4)
  const N = 26
  return (
    <>
      <color attach="background" args={['#020306']} />
      <fog attach="fog" args={['#020306', 3, 11]} />
      <Cam pos={[0, 0, mix(6.8, 6.0, pr(t, SH.perd, SH.froisse, k => k))]} look={[0, -0.45, 0]} fov={38} />
      <ambientLight intensity={0.2} />
      <directionalLight position={[3, 4, 2]} intensity={2.2} />
      <pointLight position={[-2, 0, 2]} intensity={6} color="#2997ff" />
      <Phone screen={wallet} body="#3a3a3e" rotation={[0, Math.sin(t * 0.6) * 0.35, 0]} />
      {Array.from({ length: N }, (_, i) => {
        const fall = ((t - SH.perd) * (0.55 + rnd(i) * 0.4) + rnd(i + 1) * 1.4) % 1.4
        const x = (rnd(i + 2) - 0.5) * 5
        const z = -1 - rnd(i + 3) * 5 + (i % 4 === 0 ? 2.6 : 0)
        return (
          <mesh key={i} geometry={geo} position={[x, 3.2 - fall * 5, z]} rotation={[t * (0.6 + rnd(i + 4)), t * (0.4 + rnd(i + 5)), rnd(i + 6) * 6]} scale={0.6}>
            <meshStandardMaterial map={paper} roughness={0.9} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </>
  )
}

const Crumple = ({ t }) => {
  const [front, back] = useTex('pass-graphite', 'pass-back')
  const k = pr(t, SH.froisse + 0.1, SH.froisse + 0.8, k => k)
  const crumple = 0.2 + easeOut(k) * 1.5
  const fall = pr(t, SH.froisse + 0.75, SH.froisse + 1.2, k => k * k)
  const rise = spring(t, SH.froisse + 0.85, 1.3, 6)
  const sweep = mix(-2.5, 2.5, pr(t, SH.froisse + 1.0, HITS[3], k => k))
  return (
    <>
      <color attach="background" args={['#020203']} />
      <Cam pos={[0, 0.15, 5.4]} look={[0, -0.3, 0]} fov={36} />
      <ambientLight intensity={0.2} />
      <spotLight position={[sweep, 2, 3]} angle={0.45} penumbra={0.7} intensity={40} />
      <directionalLight position={[-2, 2, 3]} intensity={1.2} />
      {fall < 1 && (
        <PaperCard t={t} crumple={crumple} seed={6} position={[0, 0.45 - fall * 3.5, 0]} rotation={[0.2 + k * 1.2, k * 2.5, k * 0.8]} scale={1.2 * (1 - k * 0.65)} />
      )}
      <Card front={front} back={back} position={[0, mix(-3, 0.45, clamp(rise)), -0.1]} rotation={[0, mix(-1.2, 0.18, clamp(rise)), 0]} scale={0.95} />
    </>
  )
}

// ─── 9. Ils reviennent : la notification et la vague d'écrans ─
const Comeback = ({ t }) => {
  const [lock, empty, notif] = useTex('lock-retour', 'lock-vide', 'notif-retour')
  const a = t - HITS[3]
  const back = easeInOut(pr(t, HITS[3] + 0.3, SH.silence, k => k))
  const pop = spring(t, 27.3, 1.4, 5)
  const phones = []
  for (let gx = -3; gx <= 3; gx++)
    for (let gy = -3; gy <= 3; gy++) {
      if (gx === 0 && gy === 0) continue
      const d = Math.hypot(gx, gy)
      const on = clamp((t - 28.55 - d * 0.16) * 4)
      phones.push(<Phone key={`${gx}${gy}`} screen={lock} body="#2c2c2e" glow={0.08 + on * 0.92} position={[gx * 1.35, gy * 2.35, -Math.abs(gx) * 0.25 - d * 0.1]} />)
    }
  return (
    <>
      <color attach="background" args={['#000']} />
      <fog attach="fog" args={['#000', 4, 16]} />
      <Cam pos={[mix(0.2, 0.6, back), mix(0.1, 0.4, back), mix(5.8, 12, back)]} look={[0, -0.3, 0]} fov={36} roll={mix(-0.06, 0.05, back)} />
      <ambientLight intensity={0.15} />
      <spotLight position={[2, 3, 4]} angle={0.6} penumbra={1} intensity={25} />
      <Phone screen={empty} body="#3a3a3e" glow={clamp(a * 4)} />
      <Panel map={notif} w={0.92} h={0.92 * (168 / 760)} position={[0, 0.5 + pop * 0.03, 0.07 + pop * 0.32]} scale={0.95 + pop * 0.12} opacity={clamp(pop * 1.5)} />
      {phones}
    </>
  )
}

// ─── 11. Le titre ─────────────────────────────────────────────
const Title = ({ t }) => {
  const word = useTextGeometry('FIDELYZ', CINZEL, { size: 0.3, depth: 0.1, bevel: 0.01 })
  const [logo] = useTex('logo-fidelyz.png')
  const tile = useFaceGeometry(0.62, 0.62, 0.14, [0.184, 0.184, 0.816, 0.816])
  const a = t - HITS[4]
  const slam = expoOut(clamp(a / 0.45))
  const ring = clamp(a / 0.9)
  const tileIn = spring(t, HITS[4] + 0.25, 1.2, 5)
  const sweep = mix(-3, 3, clamp((a % 3.2) / 1.6))
  const hit2 = t >= HITS[5] ? Math.exp(-(t - HITS[5]) * 5) : 0
  return (
    <>
      <color attach="background" args={['#000']} />
      <Cam pos={[noise1(t * 3) * 0.01 * (1 + hit2 * 4), 0.3 + hit2 * 0.02, mix(2.6, 6.2, slam) + a * 0.05]} look={[0, 0.3, 0]} fov={34} />
      <ambientLight intensity={0.1} />
      <spotLight position={[sweep, 1.5, 2]} angle={0.4} penumbra={0.5} intensity={140} />
      <directionalLight position={[0, 1, 4]} intensity={2.4} color="#dfe9ff" />
      <directionalLight position={[0, -2, 1]} intensity={1.2} color="#2997ff" />
      <pointLight position={[0, -0.5, 1.5]} intensity={4} color="#2997ff" />
      <mesh geometry={word} position={[0, -0.05, 0]} scale={mix(2.2, 1, slam)} rotation-x={mix(-0.5, 0, slam)}>
        <meshPhysicalMaterial color="#f2f5f9" metalness={0.85} roughness={0.22} clearcoat={1} emissive="#9cc9ff" emissiveIntensity={0.06} />
      </mesh>
      <mesh geometry={tile} position={[0, 0.78, -0.05]} rotation-y={mix(Math.PI, 0, clamp(tileIn))} scale={clamp(tileIn) * 1.15}>
        <meshPhysicalMaterial map={logo} roughness={0.2} clearcoat={1} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, -0.05, -0.2]} scale={0.2 + ring * 7}>
        <ringGeometry args={[0.95, 1, 96]} />
        <meshBasicMaterial color="#9cc9ff" transparent opacity={(1 - ring) * 0.8} toneMapped={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <Particles
        count={120}
        size={0.02}
        color="#cfe5ff"
        fn={(i, o) => {
          const ang = rnd(i) * Math.PI * 2
          const v = (0.6 + rnd(i + 1) * 2.4) * (1 - Math.exp(-a * 2.5))
          o[0] = Math.cos(ang) * v
          o[1] = -0.05 + Math.sin(ang) * v * 0.6 - a * a * 0.05
          o[2] = (rnd(i + 2) - 0.5) * 1.5
          o[3] = 0.5 + rnd(i + 3)
          o[4] = Math.exp(-a * 0.7)
        }}
      />
    </>
  )
}

// ─── Assemblage ───────────────────────────────────────────────
export const Scene3D = ({ t }) => {
  const kick = HITS.reduce((m, h) => (t >= h ? Math.max(m, Math.exp(-(t - h) * 6)) : m), 0)
  return (
    <>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[0, 4, 2]} scale={[8, 1.5, 1]} />
        <Lightformer form="rect" intensity={1.5} color="#7cb8ff" position={[-5, 1, 0]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="ring" intensity={2} color="#ffd9a8" position={[4, 1, 3]} scale={1.6} />
      </Environment>
      {t < SH.sac && <Drum t={t} />}
      {t >= SH.sac && t < SH.tampon && <Bag t={t} />}
      {t >= SH.tampon && t < SH.retraite && <Stamp t={t} />}
      {t >= SH.retraite && t < SH.presente && <Retirement t={t} />}
      {t >= SH.presente && t < HITS[2] && <Presents t={t} />}
      {t >= HITS[2] && t < SH.telephone && <Replacement t={t} />}
      {t >= SH.telephone && t < SH.perd && <IntoPhone t={t} />}
      {t >= SH.perd && t < SH.froisse && <Rain t={t} />}
      {t >= SH.froisse && t < HITS[3] && <Crumple t={t} />}
      {t >= HITS[3] && t < SH.silence && <Comeback t={t} />}
      {t >= HITS[4] && <Title t={t} />}
      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.62} luminanceSmoothing={0.2} />
        <ChromaticAberration offset={[0.0006 + kick * 0.006, 0.0003 + kick * 0.002]} radialModulation={false} />
        <Noise premultiply blendFunction={BlendFunction.ADD} opacity={0.35} />
        <Vignette darkness={0.75} offset={0.25} />
      </EffectComposer>
    </>
  )
}
