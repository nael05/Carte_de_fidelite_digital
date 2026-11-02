import * as THREE from 'three'
import { useMemo } from 'react'
import { ThreeCanvas } from '@remotion/three'
import { Environment, Lightformer, MarchingCube, MarchingCubes } from '@react-three/drei'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { fontFamily } from '../../lib'
import { Cam, RenderOnMount, clamp, easeInOut, mix, roundedRect, smooth, useFaceGeometry, useSlabGeometry, useTex, usePreloadTextures } from '../kit3d'

/* Noir laqué : formes lisses, noires et brillantes, reflets blancs nets, liseré bleu, touche champagne.
   Quatre variantes animées (5 s, 1080 × 1920) : la forme seule, sa transformation, la carte. */

export const VARIANTES = ['Nœud laqué', 'Obsidienne', 'Gouttes laquées', 'Ruban laqué']
export const DUREE_LAQUE = 5

const W = 1
const H = 1.58
const LAQUE = { color: '#040405', metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6 }

// La carte en laque noire, logo Fidelyz incrusté
const CarteLaquee = ({ opacity = 1, ...props }) => {
  const [logo] = useTex('logo-fidelyz.png')
  const slab = useSlabGeometry(W, H, 0.06, 0.03, 0.012)
  const tile = useFaceGeometry(0.26, 0.26, 0.06, [0.184, 0.184, 0.816, 0.816])
  const t = opacity < 1
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial {...LAQUE} transparent={t} opacity={opacity} />
      </mesh>
      <mesh geometry={tile} position={[-0.3, 0.6, 0.0285]}>
        <meshPhysicalMaterial map={logo} roughness={0.1} clearcoat={1} transparent={t} opacity={opacity} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

const OUT = roundedRect(W, H, 0.06).getSpacedPoints(500)

// 1. Nœud laqué : un nœud noir brillant qui se dénoue et se pose sur le contour de la carte
const Noeud = ({ t }) => {
  const k = easeInOut(clamp((t - 1.3) / 2))
  const geo = useMemo(() => {
    const pts = []
    for (let i = 0; i <= 400; i++) {
      const u = i / 400
      const a = u * Math.PI * 2 + t * 0.5
      const p = 2, q = 3
      const r = 0.55 * (2 + Math.cos(q * a)) * 0.45
      const kp = new THREE.Vector3(r * Math.cos(p * a), r * Math.sin(p * a), 0.55 * Math.sin(q * a) * 0.45)
      const o = OUT[Math.min(499, Math.floor(u * 499))]
      pts.push(kp.lerp(new THREE.Vector3(o.x, o.y, 0), smooth(clamp(k * 1.4 - (1 - u) * 0.4))))
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 800, mix(0.12, 0.018, k), 32, true)
  }, [t, k])
  const fill = clamp((t - 3.0) / 0.7)
  return (
    <group rotation={[mix(0.5, 0.15, k), mix(t * 0.4, -0.35 + Math.sin(t) * 0.08, k), mix(0.2, -0.05, k)]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
      {fill > 0 && <CarteLaquee opacity={smooth(fill)} position-z={-0.005} />}
    </group>
  )
}

// 2. Obsidienne : la carte noire en biais, un nœud laqué qui orbite et passe derrière
const Obsidienne = ({ t }) => {
  const knot = useMemo(() => new THREE.TorusKnotGeometry(0.42, 0.13, 320, 48, 2, 3), [])
  const a = t * 0.9
  return (
    <group>
      <CarteLaquee rotation={[0.35, -0.55 + Math.sin(t * 0.6) * 0.15, 0.32]} position={[0, 0.35, 0]} scale={1.15} />
      <mesh geometry={knot} position={[Math.cos(a) * 0.9, -1.0 + Math.sin(a * 2) * 0.12, Math.sin(a) * 0.9]} rotation={[t * 0.7, t * 0.5, 0.3]}>
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
    </group>
  )
}

// 3. Gouttes laquées : des gouttes d'encre noire qui fusionnent puis se figent en carte
const Gouttes = ({ t }) => {
  const merge = smooth(clamp((t - 0.6) / 2.2))
  const melt = clamp((t - 2.7) / 0.8)
  return (
    <group rotation={[0.1, -0.25, 0]}>
      {melt < 1 && (
        <MarchingCubes resolution={80} maxPolyCount={80000} enableUvs={false} scale={1.7 * (1 - melt * 0.4)}>
          <meshPhysicalMaterial {...LAQUE} transparent opacity={1 - melt} />
          {[0, 1, 2, 3, 4].map(i => {
            const a = i * 1.26 + t * (0.7 + i * 0.1)
            const r = mix(0.34, 0.03, merge)
            return <MarchingCube key={i} strength={0.55} subtract={12} position={[Math.cos(a) * r, Math.sin(a * 1.3) * r * 1.2, Math.sin(a) * r * 0.5]} />
          })}
        </MarchingCubes>
      )}
      {t > 2.7 && <CarteLaquee opacity={smooth(clamp((t - 2.7) / 0.8))} scale={mix(0.7, 1, smooth(clamp((t - 2.7) / 1.2)))} rotation-y={Math.sin(t) * 0.15} />}
    </group>
  )
}

// 4. Ruban laqué : un large ruban noir brillant qui ondule et s'enroule en carte
const Ruban = ({ t }) => {
  const k = easeInOut(clamp((t - 1.2) / 2.2))
  const geo = useMemo(() => {
    const NU = 300
    const NV = 10
    const pos = []
    const idx = []
    for (let i = 0; i <= NU; i++) {
      const u = i / NU
      const a = u * Math.PI * 4 + t * 1.1
      const cx = Math.sin(a * 0.5) * 0.7
      const cy = (u - 0.5) * 2.6
      const cz = Math.cos(a * 0.5) * 0.5
      const tw = a * 0.6
      for (let j = 0; j <= NV; j++) {
        const v = (j / NV - 0.5) * 0.32
        const free = [cx + Math.cos(tw) * v, cy + Math.sin(tw) * v * 0.3, cz + Math.sin(tw) * v]
        const card = [(j / NV - 0.5) * W, (u - 0.5) * H, 0]
        pos.push(mix(free[0], card[0], k), mix(free[1], card[1], k), mix(free[2], card[2], k))
      }
    }
    for (let i = 0; i < NU; i++)
      for (let j = 0; j < NV; j++) {
        const a = i * (NV + 1) + j
        const b = a + NV + 1
        idx.push(a, a + 1, b, b, a + 1, b + 1)
      }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    g.setIndex(idx)
    g.computeVertexNormals()
    return g
  }, [t, k])
  const fill = clamp((t - 3.2) / 0.6)
  return (
    <group rotation={[0.12, mix(0.3, -0.3, k) + Math.sin(t * 0.7) * 0.05, 0.05]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial {...LAQUE} side={THREE.DoubleSide} transparent opacity={1 - fill} />
      </mesh>
      {fill > 0 && <CarteLaquee opacity={smooth(fill)} />}
    </group>
  )
}

const VARIANTS = [Noeud, Obsidienne, Gouttes, Ruban]

const Scene = ({ variante, t }) => {
  const V = VARIANTS[variante - 1]
  return (
    <>
      <color attach="background" args={['#05070c']} />
      {/* même éclairage que le premier essai : grand panneau blanc au-dessus, panneau bleu à gauche, anneau champagne */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 5, -2]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={2} color="#2997ff" position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={3} color="#e3c9a4" position={[5, 1, 2]} scale={2} />
        <Lightformer form="rect" intensity={1.5} position={[0, -1, 5]} scale={[6, 1, 1]} />
      </Environment>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 4, 5]} intensity={2} />
      <Cam pos={[0, 0.05, mix(5.2, 4.7, t / DUREE_LAQUE)]} look={[0, 0, 0]} fov={36} />
      <V t={t} />
      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.85} luminanceSmoothing={0.15} />
        <Vignette darkness={0.55} offset={0.3} />
      </EffectComposer>
    </>
  )
}

export const Laque = ({ variante = 1 }) => {
  const ready = usePreloadTextures()
  const t = useCurrentFrame() / 30
  return (
    <AbsoluteFill style={{ background: '#05070c' }}>
      {ready && (
        <ThreeCanvas width={1080} height={1920} camera={{ fov: 36, near: 0.05, far: 50, position: [0, 0, 6] }} gl={{ antialias: true }}>
          <Scene variante={variante} t={t} />
        </ThreeCanvas>
      )}
      <div style={{ position: 'absolute', left: 60, top: 70, fontFamily, color: 'rgba(245,245,247,0.85)', fontSize: 46, fontWeight: 650, letterSpacing: '-0.03em' }}>
        <span style={{ color: '#2997ff' }}>{String.fromCharCode(64 + variante)}.</span> {VARIANTES[variante - 1]}
      </div>
    </AbsoluteFill>
  )
}
