import * as THREE from 'three'
import { useMemo } from 'react'
import { ThreeCanvas } from '@remotion/three'
import { useVideoConfig } from 'remotion'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'
import { Cam, PHONE_H, PHONE_W, RenderOnMount, clamp, mix, useFaceGeometry, useSlabGeometry } from '../tt/kit3d'

/* Série « Lumière » : moteur d'éclairage de studio automobile.
   Noir total, barres néon (tube visible + lumière surfacique qui raie les surfaces brillantes), sol miroir, halo (bloom).
   Tout dépend du temps : chaque image se rend seule. */

RectAreaLightUniformsLib.init()
export { Cam }

/* Scène opaque (le bloom a besoin d'un fond dans la 3D) */
export const Lux = ({ children, bloom = 1, threshold = 0.82, fov = 30, bg = '#000', env = 0.35 }) => {
  const { width, height } = useVideoConfig()
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov, near: 0.3, far: 80, position: [0, 0, 6] }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1 }}>
      <color attach="background" args={[bg]} />
      {/* environnement très sombre : seulement deux bandes, pour que le verre et le métal aient quelque chose à refléter */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6 * env} position={[0, 4, -3]} rotation-x={Math.PI / 2.4} scale={[10, 0.6, 1]} />
        <Lightformer form="rect" intensity={1.2 * env} position={[-5, 1, 2]} rotation-y={Math.PI / 2} scale={[0.4, 8, 1]} />
        <Lightformer form="rect" intensity={1.2 * env} position={[5, 1, 2]} rotation-y={-Math.PI / 2} scale={[0.4, 8, 1]} />
      </Environment>
      {children}
      <RenderOnMount />
      {bloom > 0 && (
        <EffectComposer multisampling={4} disableNormalPass>
          <Bloom mipmapBlur intensity={bloom} luminanceThreshold={threshold} luminanceSmoothing={0.2} radius={0.75} />
        </EffectComposer>
      )}
    </ThreeCanvas>
  )
}

/* Barre néon : tube lumineux visible (dans le bloom) + lumière surfacique de même taille qui éclaire et se reflète.
   len : longueur ; power : intensité ; show : opacité du tube (0 = lumière seule, hors champ) */
export const Neon = ({ len = 3, power = 6, color = '#ffffff', show = 1, thick = 0.018, light = true, ...props }) => {
  const c = useMemo(() => new THREE.Color(color), [color])
  return (
    <group {...props}>
      {show > 0.001 && (
        <mesh rotation-z={Math.PI / 2}>
          <capsuleGeometry args={[thick, len, 6, 12]} />
          <meshBasicMaterial color={c.clone().multiplyScalar(2.5 * show)} toneMapped={false} transparent={show < 1} opacity={Math.min(1, show)} />
        </mesh>
      )}
      {light && power > 0.001 && <rectAreaLight width={len} height={0.12} intensity={power} color={color} rotation-x={0} position-z={0.0} lookAt={[0, 0, 1]} />}
    </group>
  )
}

/* Lumière surfacique seule, orientée vers une cible */
export const Softbox = ({ w = 2, h = 1, power = 3, color = '#ffffff', position, target = [0, 0, 0] }) => {
  const ref = useMemo(() => ({ current: null }), [])
  return (
    <rectAreaLight
      ref={l => {
        if (l) l.lookAt(...target)
        ref.current = l
      }}
      width={w}
      height={h}
      intensity={power}
      color={color}
      position={position}
    />
  )
}

/* Sol miroir : copie retournée de la scène sous un sol noir laqué semi-transparent qui s'estompe au loin */
const fadeTex = (() => {
  let t = null
  return () => {
    if (t) return t
    const c = document.createElement('canvas')
    c.width = 4
    c.height = 256
    const g = c.getContext('2d')
    const gr = g.createLinearGradient(0, 0, 0, 256)
    gr.addColorStop(0, 'rgba(0,0,0,1)')
    gr.addColorStop(0.45, 'rgba(0,0,0,0.88)')
    gr.addColorStop(1, 'rgba(0,0,0,0.72)')
    g.fillStyle = gr
    g.fillRect(0, 0, 4, 256)
    t = new THREE.CanvasTexture(c)
    return t
  }
})()
export const Mirror = ({ y = -1.05, children, strength = 1 }) => (
  <>
    {children}
    <group position-y={2 * y} scale={[1, -1, 1]}>
      {children}
    </group>
    <mesh rotation-x={-Math.PI / 2} position-y={y}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial color="#000" transparent opacity={mix(1, 0.74, strength)} alphaMap={fadeTex()} depthWrite={false} />
    </mesh>
    {/* le sol reçoit aussi un peu de lumière (reflets diffus des néons) */}
    <mesh rotation-x={-Math.PI / 2} position-y={y - 0.002}>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color="#050506" roughness={0.35} metalness={0.6} transparent opacity={0.6} depthWrite={false} />
    </mesh>
  </>
)

/* Téléphone haut de gamme : titane brossé, verre noir, écran lumineux (glow), îlot */
export const Phone = ({ screen, glow = 1, body = '#4a4a4f', android = false, children, ...props }) => {
  const slab = useSlabGeometry(PHONE_W, PHONE_H, 0.15, 0.075, 0.03)
  const glass = useFaceGeometry(PHONE_W - 0.05, PHONE_H - 0.05, 0.13)
  const disp = useFaceGeometry(PHONE_W - 0.07, PHONE_H - 0.07, 0.12)
  const island = useFaceGeometry(0.27, 0.075, 0.0375)
  const g = clamp(glow, 0, 1.6)
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial color={body} metalness={1} roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh geometry={glass} position-z={0.061}>
        <meshPhysicalMaterial color="#000" roughness={0.02} metalness={0.1} clearcoat={1} clearcoatRoughness={0} reflectivity={1} />
      </mesh>
      {screen && g > 0.001 && (
        <mesh geometry={disp} position-z={0.068} renderOrder={2}>
          <meshBasicMaterial map={screen} toneMapped={false} transparent opacity={Math.min(1, g * 1.4)} color={new THREE.Color(g * 0.92, g * 0.92, g * 0.92)} polygonOffset polygonOffsetFactor={-4} polygonOffsetUnits={-4} />
        </mesh>
      )}
      {android ? (
        <mesh position={[0, PHONE_H / 2 - 0.09, 0.072]} renderOrder={3}>
          <circleGeometry args={[0.028, 24]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      ) : (
        <mesh geometry={island} position={[0, PHONE_H / 2 - 0.1, 0.072]} renderOrder={3}>
          <meshBasicMaterial color="#000" polygonOffset polygonOffsetFactor={-6} polygonOffsetUnits={-6} />
        </mesh>
      )}
      {children}
    </group>
  )
}

/* Pass Wallet : recto texturé et vernis (les néons s'y reflètent), tranche métal */
export const Pass = ({ map, back, opacity = 1, glow = 0, ...props }) => {
  const face = useFaceGeometry(1, 1.58, 0.05)
  const slab = useSlabGeometry(1, 1.58, 0.05, 0.014, 0.005)
  const tr = opacity < 1
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial color="#2a2a2e" metalness={1} roughness={0.2} clearcoat={1} transparent={tr} opacity={opacity} />
      </mesh>
      <mesh geometry={face} position-z={0.0122}>
        <meshPhysicalMaterial map={map} roughness={0.28} metalness={0.05} clearcoat={1} clearcoatRoughness={0.04} transparent={tr} opacity={opacity} emissive="#ffffff" emissiveMap={map} emissiveIntensity={0.12 + glow} />
      </mesh>
      {back && (
        <mesh geometry={face} position-z={-0.0122} rotation-y={Math.PI}>
          <meshPhysicalMaterial map={back} roughness={0.28} clearcoat={1} transparent={tr} opacity={opacity} emissive="#ffffff" emissiveMap={back} emissiveIntensity={0.12 + glow} />
        </mesh>
      )}
    </group>
  )
}

/* Poussière dans le faisceau : particules lentes, visibles seulement près de la lumière */
export const Dust = ({ t, count = 260, box = [4, 4, 3], center = [0, 0, 0], color = '#cfe2ff', size = 0.012, strength = 0.6 }) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3))
    return g
  }, [count])
  const p = geo.attributes.position
  for (let i = 0; i < count; i++) {
    const r = k => {
      const x = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453
      return x - Math.floor(x)
    }
    p.setXYZ(i, center[0] + (r(1) - 0.5) * box[0] + Math.sin(t * 0.2 + i) * 0.05, center[1] + (((r(2) + t * 0.01 * (0.5 + r(4))) % 1) - 0.5) * box[1], center[2] + (r(3) - 0.5) * box[2])
  }
  p.needsUpdate = true
  return (
    <points geometry={geo} frustumCulled={false}>
      <pointsMaterial size={size} color={color} transparent opacity={strength} toneMapped={false} depthWrite={false} sizeAttenuation />
    </points>
  )
}

/* Tunnel de lumière : traits néon qui filent vers la caméra (transition « vitesse ») */
export const Streaks = ({ t, speed = 1, count = 120, color = '#9fd0ff', z0 = -30, z1 = 6, alpha = 1 }) => {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const r = k => {
          const x = Math.sin(i * 91.7 + k * 13.1) * 43758.5453
          return x - Math.floor(x)
        }
        const a = r(1) * Math.PI * 2
        const rad = 0.6 + r(2) * 2.6
        return { x: Math.cos(a) * rad, y: Math.sin(a) * rad * 1.6, off: r(3), len: 0.6 + r(4) * 2.2, w: r(5) < 0.2 ? 0.012 : 0.006, hue: r(6) }
      }),
    [count]
  )
  if (alpha <= 0.001) return null
  return (
    <group>
      {items.map((s, i) => {
        const z = z0 + (((s.off + t * speed * 0.35) % 1) * (z1 - z0))
        return (
          <mesh key={i} position={[s.x, s.y, z]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[s.w, s.w, s.len * speed, 4, 1, true]} />
            <meshBasicMaterial color={new THREE.Color(s.hue < 0.75 ? color : '#ffffff').multiplyScalar(2 * alpha)} toneMapped={false} transparent opacity={alpha} />
          </mesh>
        )
      })}
    </group>
  )
}
