import * as THREE from 'three'
import { useMemo } from 'react'
import { Environment, Lightformer, MeshReflectorMaterial } from '@react-three/drei'
import { clamp, mix, noise1, smooth, useSlabGeometry } from './kit3d'

/* Laque noire : matériau, éclairage, morphing liquide entre formes, bassin, ruban LED.
   Partagé par les vidéos « Noir » et « Chrono ». */

export const LAQUE = { color: '#040405', metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6 }
export const CHAMPAGNE = '#e3c9a4'
export const BLEU = '#2997ff'

// L'éclairage du premier essai : grand panneau blanc au-dessus, panneau bleu à gauche, anneau champagne à droite
export const LaqueEnv = ({ blue = 2, top = 4 }) => (
  <Environment resolution={256} frames={1}>
    <Lightformer form="rect" intensity={top} position={[0, 5, -2]} scale={[10, 2, 1]} />
    <Lightformer form="rect" intensity={blue} color={BLEU} position={[-5, 0, 0]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
    <Lightformer form="rect" intensity={2.4} color={CHAMPAGNE} position={[5, 1, 2]} rotation-y={-Math.PI / 2.4} scale={[3, 4, 1]} />
    <Lightformer form="rect" intensity={1.2} position={[0, -1, 5]} scale={[6, 1, 1]} />
    <Lightformer form="rect" intensity={1.6} position={[-2, 2, -5]} scale={[0.4, 6, 1]} />
    <Lightformer form="rect" intensity={1.6} position={[2.5, 2, -5]} scale={[0.4, 6, 1]} />
  </Environment>
)

// Halos flous derrière la scène : les objets noirs se découpent dessus
const useGlow = () =>
  useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const g = c.getContext('2d')
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128)
    gr.addColorStop(0, 'rgba(255,255,255,1)')
    gr.addColorStop(0.4, 'rgba(255,255,255,0.35)')
    gr.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = gr
    g.fillRect(0, 0, 256, 256)
    return new THREE.CanvasTexture(c)
  }, [])
export const Halos = ({ z = -5, items = [[-1.6, 1.4, 6, BLEU, 0.45], [1.9, -0.6, 5, CHAMPAGNE, 0.22], [0, 3, 5, '#5a4dff', 0.25]] }) => {
  const glow = useGlow()
  return (
    <group position-z={z}>
      {items.map(([x, y, s, c, o], i) => (
        <sprite key={i} position={[x, y, 0]} scale={[s, s, 1]}>
          <spriteMaterial map={glow} color={c} transparent opacity={o} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
        </sprite>
      ))}
    </group>
  )
}

// ─── Morphing liquide ────────────────────────────────────────
/* Formes « superellipsoïdes » : demi-tailles (hx, hy, hz) et exposants (e : arrondi en plan, ez : en épaisseur).
   e = 1 donne une sphère ; plus e est petit, plus la forme est carrée. */
export const SHAPES = {
  goutte: { hx: 0.2, hy: 0.24, hz: 0.2, e: 1, ez: 1 },
  bulle: { hx: 0.62, hy: 0.62, hz: 0.62, e: 1, ez: 1 },
  telephone: { hx: 0.49, hy: 1.0, hz: 0.045, e: 0.13, ez: 0.55 },
  carte: { hx: 0.5, hy: 0.79, hz: 0.014, e: 0.12, ez: 0.55 },
  logo: { hx: 0.5, hy: 0.5, hz: 0.07, e: 0.22, ez: 0.55 },
  galet: { hx: 0.62, hy: 0.36, hz: 0.42, e: 0.6, ez: 0.8 },
}
const sq = (a, e) => Math.sign(a) * Math.pow(Math.abs(a), e)
const shapePoint = (s, v, out) => out.set(sq(v.x, s.e) * s.hx, sq(v.y, s.e) * s.hy, sq(v.z, s.ez) * s.hz)

/* Passe de la forme a à la forme b (p de 0 à 1) en devenant liquide au milieu : la surface ondule, gonfle, puis se refige.
   wobble : amplitude de l'ondulation ; t : temps (pour l'animation de la surface). */
export const Morph = ({ a, b, p, t, wobble = 0.12, ...props }) => {
  const base = useMemo(() => new THREE.SphereGeometry(1, 180, 140), [])
  const geo = useMemo(() => {
    const g = base.clone()
    const pos = g.attributes.position
    const v = new THREE.Vector3()
    const pa = new THREE.Vector3()
    const pb = new THREE.Vector3()
    const A = SHAPES[a]
    const B = SHAPES[b]
    const k = smooth(clamp(p))
    const melt = Math.sin(Math.PI * clamp(p)) // 0 aux extrémités, 1 au milieu
    const size = mix(Math.max(A.hx, A.hy) * 0.8, Math.max(B.hx, B.hy) * 0.8, k)
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(base.attributes.position, i).normalize()
      shapePoint(A, v, pa)
      shapePoint(B, v, pb)
      pa.lerp(pb, k)
      const n = Math.sin(v.x * 2.3 + t * 2.1) * Math.sin(v.y * 1.9 + t * 1.6) + Math.sin(v.z * 2.7 - t * 1.3 + v.y * 1.5) * 0.6
      const blob = v.clone().multiplyScalar(size * (1 + n * wobble))
      pa.lerp(blob, melt * 0.85)
      pos.setXYZ(i, pa.x, pa.y, pa.z)
    }
    g.computeVertexNormals()
    return g
  }, [a, b, p, t, wobble, base])
  return (
    <mesh geometry={geo} {...props}>
      <meshPhysicalMaterial {...LAQUE} />
    </mesh>
  )
}

// ─── Bassin de laque liquide, avec des ondes ─────────────────
/* ripples : [{ x, z, at, amp }] ; chaque onde part de (x, z) à l'instant at */
export const Bassin = ({ t, ripples = [], y = -1.4, size = 14, reflect = true }) => {
  const base = useMemo(() => new THREE.PlaneGeometry(size, size, 220, 220), [size])
  const geo = useMemo(() => {
    const g = base.clone()
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = base.attributes.position.getX(i)
      const z = -base.attributes.position.getY(i)
      let h = 0
      for (const r of ripples) {
        const a = t - r.at
        if (a <= 0) continue
        const d = Math.hypot(x - r.x, z - r.z)
        const front = a * 1.6
        if (d > front + 0.3) continue
        h += Math.sin(d * 9 - a * 9) * Math.exp(-d * 0.9) * Math.exp(-a * 0.8) * r.amp * smooth(clamp((front + 0.3 - d) / 0.6))
      }
      p.setZ(i, h)
    }
    g.computeVertexNormals()
    return g
  }, [t, base, ripples])
  return (
    <mesh geometry={geo} rotation-x={-Math.PI / 2} position-y={y}>
      {reflect ? (
        <MeshReflectorMaterial blur={[260, 80]} resolution={768} mixBlur={0.7} mixStrength={2.2} roughness={0.2} depthScale={0.6} minDepthThreshold={0.3} maxDepthThreshold={1.4} color="#040405" metalness={0.6} mirror={0.75} />
      ) : (
        <meshPhysicalMaterial {...LAQUE} />
      )}
    </mesh>
  )
}

// ─── Carte bancaire noire (puce champagne, sans contact) ─────
export const CarteBancaire = props => {
  const slab = useSlabGeometry(1.42, 0.9, 0.06, 0.02, 0.008)
  const chip = useSlabGeometry(0.2, 0.15, 0.025, 0.006, 0.002)
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
      <mesh geometry={chip} position={[-0.45, 0.05, 0.012]}>
        <meshPhysicalMaterial color={CHAMPAGNE} metalness={1} roughness={0.22} clearcoat={1} />
      </mesh>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0.52, 0.22, 0.012]} rotation-z={-Math.PI / 2}>
          <torusGeometry args={[0.035 + i * 0.03, 0.006, 8, 32, Math.PI * 0.6]} />
          <meshPhysicalMaterial color="#9a9aa0" metalness={1} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

// ─── Ruban LED : tube lumineux + halo, dessiné en partie (draw de 0 à 1) ───
export const Ruban = ({ pts, color = [0.3, 1.6, 4.5], radius = 0.014, draw = 1, start = 0, closed = false, halo = 0.12 }) => {
  const { core, glow } = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pts, closed)
    const seg = Math.max(64, pts.length * 4)
    return { core: new THREE.TubeGeometry(curve, seg, radius, 10, closed), glow: new THREE.TubeGeometry(curve, seg, radius * 3.6, 10, closed) }
  }, [pts, radius, closed])
  // n'affiche qu'une portion du tube (les triangles suivent le chemin)
  for (const g of [core, glow]) {
    const n = g.index.count
    const a = Math.floor((clamp(start) * n) / 6) * 6
    const b = Math.floor((clamp(draw) * n) / 6) * 6
    g.setDrawRange(a, Math.max(0, b - a))
  }
  return (
    <group>
      <mesh geometry={core}>
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh geometry={glow}>
        <meshBasicMaterial color={color} transparent opacity={halo} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

// Trajectoire fluide pour un ruban (vague qui traverse l'écran)
export const vague = (t, { y = 0, z = 0.5, amp = 0.5, freq = 1.4, len = 6, phase = 0, n = 120 } = {}) => {
  const out = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    out.push(new THREE.Vector3((u - 0.5) * len, y + Math.sin(u * freq * Math.PI * 2 + t * 2 + phase) * amp + noise1(u * 3 + phase) * 0.1, z + Math.cos(u * freq * Math.PI + t + phase) * 0.4))
  }
  return out
}
