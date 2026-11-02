import * as THREE from 'three'
import { useMemo } from 'react'
import { ThreeCanvas } from '@remotion/three'
import { Environment, Lightformer, MarchingCube, MarchingCubes, MeshTransmissionMaterial } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AbsoluteFill } from 'remotion'
import { fontFamily } from '../../lib'
import { Cam, Card, RenderOnMount, clamp, easeInOut, mix, rnd, roundedRect, smooth, useTex, usePreloadTextures } from '../kit3d'

/* Propositions de formes futuristes, lisses et fluides, qui se transforment en carte Wallet.
   Props : idee (1 → 10), k (0 = forme de départ, 0,5 = transformation, 1 = arrivée sur la carte).
   Retenus du premier tour : ruban LED, métal liquide, voile irisé (retravaillés) ; les sept autres sont nouveaux. */

export const IDEES = [
  'Rubans LED',
  'Métal liquide',
  'Voile irisé',
  'Gouttes de verre',
  'Ruban de Möbius',
  'Bassin de mercure',
  'Fibres optiques',
  'Bulle de savon',
  'Aura',
  'Lentille de verre',
]

const W = 1
const H = 1.58
const sq = (a, e) => Math.sign(a) * Math.pow(Math.abs(a), e)
// point du contour arrondi de la carte (u de 0 à 1)
const OUTLINE = roundedRect(W, H, 0.08).getSpacedPoints(600)
const outline = u => OUTLINE[Math.min(599, Math.floor(clamp(u) * 599))]

// Chrome : bandes de lumière nettes pour des reflets lisses
const CHROME = { color: '#f2f5fa', metalness: 1, roughness: 0.06, envMapIntensity: 2.6 }

const useGlowTexture = () =>
  useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.35, 'rgba(255,255,255,0.45)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])

// Halos flous derrière les objets en verre (dégradés doux, pas de formes nettes)
const Backlights = ({ z = -3 }) => {
  const glow = useGlowTexture()
  return (
    <group position-z={z}>
      {[
        [-1.6, 1.0, 2.4, '#2f6bff'],
        [1.7, -0.9, 2.2, '#8a3dff'],
        [0.4, 1.8, 1.6, '#16c8ff'],
      ].map(([x, y, sc, c], i) => (
        <sprite key={i} position={[x, y, 0]} scale={[sc, sc, 1]}>
          <spriteMaterial map={glow} color={c} transparent opacity={0.32} blending={THREE.AdditiveBlending} depthWrite={false} />
        </sprite>
      ))}
    </group>
  )
}

// ─── 1. Rubans LED : trois rubans de lumière qui dansent puis s'enroulent sur le contour ───
const RubansLED = ({ k, t, front }) => {
  const COLORS = [
    [0.25, 1.2, 4.5],
    [0.3, 3.2, 3.2],
    [2.6, 0.7, 4.2],
  ]
  const tubes = useMemo(
    () =>
      COLORS.map((_, s) => {
        const pts = []
        for (let i = 0; i <= 260; i++) {
          const u = i / 260
          const a = u * Math.PI * 2 * 1.6 + t * 0.8 + s * 2.1
          const free = new THREE.Vector3(Math.sin(a) * (0.55 + 0.3 * Math.sin(u * 5 + s)), (u - 0.5) * 2.4 + Math.sin(a * 0.5 + s) * 0.25, Math.cos(a) * (0.5 + 0.2 * Math.cos(u * 4 + s)))
          const o = outline((u + s * 0.04) % 1)
          const inset = 1 + s * 0.035
          const target = new THREE.Vector3(o.x * inset, o.y * (1 + s * 0.022), 0.01 + s * 0.012)
          const kk = smooth(clamp(k * 1.7 - (1 - u) * 0.7))
          pts.push(free.lerp(target, kk))
        }
        const curve = new THREE.CatmullRomCurve3(pts)
        return [new THREE.TubeGeometry(curve, 700, 0.011, 10, false), new THREE.TubeGeometry(curve, 700, 0.045, 10, false)]
      }),
    [k, t]
  )
  return (
    <group rotation={[0.08, mix(0.5, -0.15, k), 0]}>
      {tubes.map(([core, halo], s) => (
        <group key={s}>
          <mesh geometry={core}>
            <meshBasicMaterial color={COLORS[s]} toneMapped={false} />
          </mesh>
          <mesh geometry={halo}>
            <meshBasicMaterial color={COLORS[s]} transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {k > 0.72 && <Card front={front} opacity={clamp((k - 0.72) / 0.28)} position-z={-0.015} />}
    </group>
  )
}

// ─── 2. Métal liquide : une goutte de chrome qui ondule doucement, absorbe deux gouttelettes, s'étire en carte ───
const MetalLiquide = ({ k, t, front }) => {
  const base = useMemo(() => new THREE.SphereGeometry(0.72, 200, 150), [])
  const geo = useMemo(() => {
    const g = base.clone()
    const p = g.attributes.position
    const v = new THREE.Vector3()
    const kk = easeInOut(k)
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(base.attributes.position, i).normalize()
      // ondulation basse fréquence : surface toujours lisse
      const n = Math.sin(v.x * 2.1 + t * 1.3) * Math.sin(v.y * 1.7 + t * 0.9) * 0.11 + Math.sin(v.z * 2.4 - t * 1.1 + v.y) * 0.07
      const blob = v.clone().multiplyScalar(0.72 * (1 + n * (1 - kk)))
      const card = new THREE.Vector3(sq(v.x, 0.16) * W * 0.5, sq(v.y, 0.16) * H * 0.5, v.z * 0.035)
      p.setXYZ(i, ...blob.lerp(card, kk).toArray())
    }
    g.computeVertexNormals()
    return g
  }, [k, t, base])
  const drop = clamp(k * 3)
  return (
    <group rotation={[0.15, mix(0.7, -0.2, k), 0.04]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial {...CHROME} clearcoat={1} />
      </mesh>
      {drop < 1 &&
        [
          [1.3, 0.7, 0.16],
          [-1.2, -0.8, 0.12],
        ].map(([x, y, r], i) => (
          <mesh key={i} position={[mix(x, x * 0.45, smooth(drop)), mix(y, y * 0.45, smooth(drop)), 0.1]} scale={1 - drop * 0.6}>
            <sphereGeometry args={[r, 64, 48]} />
            <meshPhysicalMaterial {...CHROME} clearcoat={1} />
          </mesh>
        ))}
      {k > 0.82 && <Card front={front} opacity={clamp((k - 0.82) / 0.18)} position-z={0.04} />}
    </group>
  )
}

// ─── 3. Voile irisé : un tissu holographique qui ondule, se tend, et la carte s'imprime dessus ───
const VoileIrise = ({ k, t, front }) => {
  const base = useMemo(() => new THREE.PlaneGeometry(1.7, 2.3, 120, 160), [])
  const geo = useMemo(() => {
    const g = base.clone()
    const p = g.attributes.position
    const kk = easeInOut(k)
    for (let i = 0; i < p.count; i++) {
      const x = base.attributes.position.getX(i)
      const y = base.attributes.position.getY(i)
      // grandes vagues lentes, le bas flotte plus que le haut
      const free = (1 - (y + 1.15) / 2.3) * 0.5 + 0.5
      const w = (Math.sin(x * 1.8 + y * 0.9 + t * 1.6) * 0.28 + Math.sin(y * 1.4 - t * 1.1) * 0.18) * free
      const curl = Math.sin(x * 1.2 + t) * 0.12
      p.setXYZ(i, mix(x + curl * (1 - y / 2.3) * 0.3, (x / 1.7) * W, kk), mix(y + w * 0.25, (y / 2.3) * H, kk), w * (1 - kk))
    }
    g.computeVertexNormals()
    return g
  }, [k, t, base])
  const print = clamp((k - 0.5) / 0.45)
  return (
    <group rotation={[0.08, mix(0.55, -0.15, k), 0.04]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#ffffff" metalness={0.92} roughness={0.12} iridescence={1} iridescenceIOR={2.3} iridescenceThicknessRange={[100, 1400]} clearcoat={1} clearcoatRoughness={0.05} side={THREE.DoubleSide} envMapIntensity={2.4} />
      </mesh>
      {print > 0 && (
        <mesh geometry={geo} position-z={0.002}>
          <meshPhysicalMaterial map={front} transparent opacity={smooth(print)} roughness={0.3} clearcoat={1} iridescence={0.6 * (1 - print)} />
        </mesh>
      )}
    </group>
  )
}

// ─── 4. Gouttes de verre : des gouttes en apesanteur qui fusionnent en une seule, puis se figent en carte ───
const Gouttes = ({ k, t, front }) => {
  const merge = smooth(clamp(k * 1.6))
  const melt = clamp((k - 0.62) / 0.38)
  const balls = [0, 1, 2, 3, 4, 5].map(i => {
    const a = i * 1.05 + t * (0.5 + i * 0.08)
    const r = mix(0.32 + rnd(i) * 0.1, 0.03, merge)
    return [Math.cos(a) * r, Math.sin(a * 1.3) * r * 0.9, Math.sin(a) * r * 0.5]
  })
  return (
    <group rotation={[0.1, mix(0.3, -0.15, k), 0]}>
      <Backlights />
      {melt < 1 && (
        <MarchingCubes resolution={72} maxPolyCount={60000} enableUvs={false} scale={1.6 * (1 - melt * 0.55)}>
          <meshPhysicalMaterial color="#d6ecff" transmission={1} thickness={0.8} roughness={0.02} ior={1.45} iridescence={0.6} iridescenceIOR={1.5} clearcoat={1} envMapIntensity={2} transparent opacity={1 - melt} />
          {balls.map((p, i) => (
            <MarchingCube key={i} strength={mix(0.6, 0.45, merge)} subtract={12} position={p} />
          ))}
        </MarchingCubes>
      )}
      {k > 0.55 && <Card front={front} opacity={smooth(clamp((k - 0.55) / 0.4))} scale={mix(0.6, 1, smooth(clamp((k - 0.55) / 0.45)))} />}
    </group>
  )
}

// ─── 5. Ruban de Möbius : une boucle sans fin, chromée et irisée, qui se déroule et s'aplatit en carte ───
const Mobius = ({ k, t, front }) => {
  const NU = 260
  const NV = 24
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = []
    const uv = []
    const idx = []
    const kk = easeInOut(k)
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * Math.PI * 2
      for (let j = 0; j <= NV; j++) {
        const v = (j / NV - 0.5) * 0.55
        const R = 0.72
        const mx = (R + v * Math.cos(u / 2 + t * 0.4)) * Math.cos(u + t * 0.3)
        const my = (R + v * Math.cos(u / 2 + t * 0.4)) * Math.sin(u + t * 0.3)
        const mz = v * Math.sin(u / 2 + t * 0.4)
        const cx = (j / NV - 0.5) * W
        const cy = (i / NU - 0.5) * H
        pos.push(mix(mx, cx, kk), mix(my, cy, kk), mix(mz, 0, kk))
        uv.push(j / NV, i / NU)
      }
    }
    for (let i = 0; i < NU; i++)
      for (let j = 0; j < NV; j++) {
        const a = i * (NV + 1) + j
        const b = a + NV + 1
        idx.push(a, a + 1, b, b, a + 1, b + 1)
      }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [k, t])
  const print = clamp((k - 0.7) / 0.3)
  return (
    <group rotation={[mix(0.9, 0.08, k), mix(0.4, -0.15, k), 0]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial {...CHROME} roughness={0.08} iridescence={1} iridescenceIOR={1.8} clearcoat={1} side={THREE.DoubleSide} />
      </mesh>
      {print > 0 && (
        <mesh geometry={geo} position-z={0.003}>
          <meshBasicMaterial map={front} transparent opacity={smooth(print)} toneMapped={false} />
        </mesh>
      )}
    </group>
  )
}

// ─── 6. Bassin de mercure : la surface se bombe, la carte sort du métal liquide en faisant des ondes ───
const Mercure = ({ k, t, front }) => {
  const base = useMemo(() => new THREE.PlaneGeometry(9, 9, 260, 260), [])
  const rise = easeInOut(clamp((k - 0.15) / 0.85))
  const geo = useMemo(() => {
    const g = base.clone()
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = base.attributes.position.getX(i)
      const y = base.attributes.position.getY(i)
      const r = Math.hypot(x, y)
      const dome = Math.exp(-r * r * 3) * (0.35 * smooth(clamp(k * 4)) * (1 - rise))
      const ripple = Math.sin(r * 9 - t * 5) * Math.exp(-r * 0.9) * 0.05 * (0.3 + rise)
      p.setZ(i, dome + ripple)
    }
    g.computeVertexNormals()
    return g
  }, [k, t, base, rise])
  return (
    <group>
      <mesh geometry={geo} rotation-x={-Math.PI / 2} position-y={-0.9}>
        <meshPhysicalMaterial {...CHROME} roughness={0.04} clearcoat={1} />
      </mesh>
      {rise > 0 && <Card front={front} position={[0, mix(-1.9, 0.2, rise), 0]} rotation={[0, mix(0.6, -0.15, rise), 0]} emissive={0.04} />}
    </group>
  )
}

// ─── 7. Fibres optiques : des centaines de fils de lumière qui ondulent et se peignent en carte ───
const Fibres = ({ k, t, front }) => {
  const N = 90
  const tubes = useMemo(() => {
    const out = []
    for (let s = 0; s < N; s++) {
      const y0 = (s / (N - 1) - 0.5) * H
      const pts = []
      for (let i = 0; i <= 50; i++) {
        const u = i / 50
        const flow = new THREE.Vector3(mix(-2.4, 2.4, u), y0 * 0.6 + Math.sin(u * 5 + t * 1.6 + s * 0.15) * 0.45 + Math.sin(u * 9 - t + s) * 0.08, Math.cos(u * 4 + t + s * 0.2) * 0.5)
        const card = new THREE.Vector3((u - 0.5) * W, y0, 0)
        const kk = smooth(clamp(k * 1.8 - Math.abs(u - 0.5) * 0.8 - rnd(s) * 0.2))
        pts.push(flow.lerp(card, kk))
      }
      out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, 0.0045, 5, false))
    }
    return out
  }, [k, t])
  return (
    <group rotation={[0.05, mix(0.3, -0.15, k), 0]}>
      {tubes.map((g, s) => {
        const c = new THREE.Color().setHSL(0.55 + (s / N) * 0.2, 1, 0.55)
        return (
          <mesh key={s} geometry={g}>
            <meshBasicMaterial color={[c.r * 3, c.g * 3, c.b * 3]} toneMapped={false} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
          </mesh>
        )
      })}
      {k > 0.8 && <Card front={front} opacity={clamp((k - 0.8) / 0.2)} position-z={-0.01} />}
    </group>
  )
}

// ─── 8. Bulle de savon : une bulle irisée qui tremble, s'aplatit en carte, la carte apparaît dans le film ───
const Bulle = ({ k, t, front }) => {
  const base = useMemo(() => new THREE.SphereGeometry(0.8, 160, 120), [])
  const geo = useMemo(() => {
    const g = base.clone()
    const p = g.attributes.position
    const v = new THREE.Vector3()
    const kk = easeInOut(k)
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(base.attributes.position, i).normalize()
      const wob = Math.sin(v.y * 3 + t * 2.4) * 0.03 + Math.sin(v.x * 2.5 - t * 1.8) * 0.025
      const sphere = v.clone().multiplyScalar(0.8 * (1 + wob))
      const card = new THREE.Vector3(sq(v.x, 0.14) * W * 0.52, sq(v.y, 0.14) * H * 0.52, v.z * 0.04)
      p.setXYZ(i, ...sphere.lerp(card, kk).toArray())
    }
    g.computeVertexNormals()
    return g
  }, [k, t, base])
  return (
    <group rotation={[0.1, mix(0.4, -0.15, k), 0]}>
      <Backlights z={-2.6} />
      {k > 0.55 && <Card front={front} opacity={smooth(clamp((k - 0.55) / 0.4))} />}
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#ffffff" transmission={1} thickness={0.02} roughness={0} ior={1.05} iridescence={1} iridescenceIOR={1.33} iridescenceThicknessRange={[100, 900]} transparent opacity={mix(1, 0.25, smooth(clamp((k - 0.6) / 0.4)))} envMapIntensity={2.4} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

// ─── 9. Aura : des halos de couleur qui tournent, se rapprochent et se condensent en carte lumineuse ───
const Aura = ({ k, t, front }) => {
  const glow = useGlowTexture()
  const conv = smooth(clamp(k * 1.5))
  const ORBS = [
    ['#2f7bff', 1.7],
    ['#8a3dff', 1.5],
    ['#16d4ff', 1.3],
    ['#e3c9a4', 1.1],
    ['#ff4fd8', 1.0],
  ]
  return (
    <group>
      {ORBS.map(([c, s], i) => {
        const a = i * 1.26 + t * (0.6 + i * 0.1)
        const r = mix(0.75, 0.05, conv)
        return (
          <sprite key={i} position={[Math.cos(a) * r, Math.sin(a * 1.2) * r * 1.2, -0.3 - i * 0.05]} scale={[s * mix(1, 0.75, conv), s * mix(1, 1.1, conv), 1]}>
            <spriteMaterial map={glow} color={c} transparent opacity={0.75 * (1 - clamp((k - 0.85) / 0.15) * 0.5)} blending={THREE.AdditiveBlending} depthWrite={false} />
          </sprite>
        )
      })}
      {k > 0.5 && <Card front={front} opacity={smooth(clamp((k - 0.5) / 0.45))} rotation-y={mix(0.4, -0.15, k)} emissive={0.05} />}
    </group>
  )
}

// ─── 10. Lentille de verre : un disque de verre épais qui se déforme en squircle, puis en carte ───
const Lentille = ({ k, t, front }) => {
  const kk = easeInOut(clamp(k * 1.3))
  const geo = useMemo(() => {
    const shape = new THREE.Shape()
    const N = 160
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2
      const c = new THREE.Vector2(Math.cos(a) * 0.72, Math.sin(a) * 0.72)
      // squircle de la taille de la carte
      const e = 0.18
      const s = new THREE.Vector2(sq(Math.cos(a), e) * W * 0.5, sq(Math.sin(a), e) * H * 0.5)
      const p = c.lerp(s, kk)
      i === 0 ? shape.moveTo(p.x, p.y) : shape.lineTo(p.x, p.y)
    }
    const depth = mix(0.08, 0.01, kk)
    const bevel = mix(0.22, 0.02, kk)
    const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 16, curveSegments: 8 })
    g.translate(0, 0, -depth / 2)
    g.computeVertexNormals()
    return g
  }, [kk])
  return (
    <group rotation={[0.12, mix(-0.6, -0.15, k) + Math.sin(t) * 0.05, 0]}>
      <Backlights />
      {k > 0.45 && <Card front={front} opacity={smooth(clamp((k - 0.45) / 0.5))} position-z={-0.03} scale={0.97} />}
      <mesh geometry={geo}>
        <MeshTransmissionMaterial samples={8} resolution={768} thickness={mix(1.4, 0.1, kk)} roughness={0.02} chromaticAberration={0.5} ior={1.5} anisotropy={0.2} color="#eef6ff" />
      </mesh>
    </group>
  )
}

const FORMES = [RubansLED, MetalLiquide, VoileIrise, Gouttes, Mobius, Mercure, Fibres, Bulle, Aura, Lentille]

// Environnement de studio (équirectangulaire) : grandes boîtes à lumière floues, lueurs bleue et violette
const useStudio = () =>
  useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 2048
    c.height = 1024
    const g = c.getContext('2d')
    const bg = g.createLinearGradient(0, 0, 0, 1024)
    bg.addColorStop(0, '#2a3346')
    bg.addColorStop(0.45, '#0d1220')
    bg.addColorStop(0.55, '#090c15')
    bg.addColorStop(1, '#020305')
    g.fillStyle = bg
    g.fillRect(0, 0, 2048, 1024)
    g.filter = 'blur(28px)'
    g.fillStyle = 'rgba(255,255,255,0.95)'
    g.fillRect(250, 120, 1550, 90) // bandeau du haut
    g.fillRect(900, 260, 70, 420) // bandes verticales
    g.fillRect(1900, 300, 70, 360)
    g.fillStyle = 'rgba(255,255,255,0.7)'
    g.fillRect(420, 330, 260, 300) // boîte carrée de face
    g.fillStyle = 'rgba(70,140,255,0.9)'
    g.fillRect(0, 380, 380, 280) // lueur bleue
    g.fillStyle = 'rgba(170,90,255,0.85)'
    g.fillRect(1250, 420, 420, 260) // lueur violette
    g.filter = 'blur(60px)'
    g.fillStyle = 'rgba(120,200,255,0.35)'
    g.fillRect(0, 560, 2048, 60) // horizon
    const tx = new THREE.CanvasTexture(c)
    tx.mapping = THREE.EquirectangularReflectionMapping
    tx.colorSpace = THREE.SRGBColorSpace
    return tx
  }, [])

const Scene = ({ idee, k }) => {
  const studio = useStudio()
  const [front] = useTex('pass-graphite')
  const F = FORMES[idee - 1]
  const t = 1.3 + k * 1.2
  const low = idee === 6
  return (
    <>
      <color attach="background" args={['#03050a']} />
      <Environment map={studio} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <pointLight position={[-2, -1, 2]} intensity={5} color="#2997ff" />
      <Cam pos={low ? [0, 0.55, 4.6] : [0, 0.1, 4.2]} look={low ? [0, -0.2, 0] : [0, 0, 0]} fov={38} />
      <F k={k} t={t} front={front} />
      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.72} luminanceSmoothing={0.25} />
        <Vignette darkness={0.6} offset={0.3} />
      </EffectComposer>
    </>
  )
}

export const Formes = ({ idee = 1, k = 0 }) => {
  const ready = usePreloadTextures()
  const stage = k < 0.25 ? 'Départ' : k < 0.75 ? 'Transformation' : 'Arrivée'
  return (
    <AbsoluteFill style={{ background: '#03050a' }}>
      {ready && (
        <ThreeCanvas width={1080} height={1080} camera={{ fov: 38, near: 0.05, far: 50, position: [0, 0, 4] }} gl={{ antialias: true }}>
          <Scene idee={idee} k={k} />
        </ThreeCanvas>
      )}
      <div style={{ position: 'absolute', left: 44, top: 36, fontFamily, color: '#f5f5f7', fontSize: 44, fontWeight: 650, letterSpacing: '-0.03em' }}>
        <span style={{ color: '#2997ff' }}>{idee}.</span> {IDEES[idee - 1]}
      </div>
      <div style={{ position: 'absolute', left: 44, bottom: 36, fontFamily, color: 'rgba(245,245,247,0.6)', fontSize: 30, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stage}</div>
    </AbsoluteFill>
  )
}
