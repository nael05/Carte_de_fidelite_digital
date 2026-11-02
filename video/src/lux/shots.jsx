import * as THREE from 'three'
import { useMemo } from 'react'
import { Particles, burnShader, rnd, spline, usePaperGeometry } from '../tt/kit3d'
import { screenTex, tex } from '../serie/kit'
import { Cam, Dust, Lux, Mirror, Neon, Pass, Phone, Softbox, Streaks } from './engine'
import { clamp, easeInOut, mix, pr } from '../tt/kit3d'

/* Série « Lumière » : plans 3D réutilisables. Chaque plan est une scène complète (<Lux>) pilotée par le temps absolu t.
   Éclairage « révélation de voiture » : dans le noir, une barre néon descend devant l'objet et raie le verre et le métal,
   puis deux néons de contour s'allument derrière, et une bande douce au-dessus. */

export { tex, screenTex }
export const BLUE3 = '#5aa9ff'

/* Éclairage commun. sweep : [début, fin] du balayage (barre qui descend), rimAt : allumage des contours */
export const Rig = ({ t, sweep, rimAt = -1, rim = 1, top = 1, z = 1.3, h = [1.9, -1.3], dust = true, warm = false, len = 3.4, center = [0, 0, 0], rimColor, rimColor2 = '#ffffff' }) => {
  const k = sweep ? pr(t, sweep[0], sweep[1], easeInOut) : 1
  const sweeping = sweep && k > 0 && k < 1
  const r = rimAt < 0 ? 1 : pr(t, rimAt, rimAt + 0.5)
  const flick = rimAt >= 0 && t - rimAt < 0.35 && t > rimAt ? (Math.sin((t - rimAt) * 120) > 0 ? 1 : 0.3) : 1
  return (
    <>
      {sweep && (k > 0 && k < 1 ? <Neon len={len} power={22} position={[center[0], mix(h[0], h[1], k), z]} show={Math.sin(k * Math.PI) * 1.3} /> : null)}
      {!sweeping && sweep && k >= 1 && <Neon len={len} power={4} position={[center[0], h[1] - 0.2, z]} show={0} />}
      <Neon len={2.8} power={12 * r * rim * flick} show={0.9 * r * rim * flick} color={rimColor ?? (warm ? '#ffd2a0' : BLUE3)} position={[center[0] - 1.55, center[1] + 0.25, center[2] - 1.1]} rotation={[0, 0.7, Math.PI / 2]} />
      <Neon len={2.8} power={12 * r * rim * flick} show={0.9 * r * rim * flick} color={rimColor2} position={[center[0] + 1.6, center[1] + 0.25, center[2] - 1.0]} rotation={[0, -0.7, Math.PI / 2]} />
      {top > 0 && <Softbox w={3.2} h={0.5} power={2.6 * top * r} position={[center[0], center[1] + 3.2, center[2] + 1.4]} target={center} />}
      {dust && <Dust t={t} center={[center[0], center[1] + 0.4, center[2] + 0.6]} />}
    </>
  )
}

/* Téléphone héros sur sol miroir */
export const PhoneShot = ({ t, screen, glow = 1, body = '#4a4a4f', rot = [0, 0, 0], pos = [0, 0, 0], cam, look, fov = 30, rig, children, android, extra }) => (
  <Lux>
    <Cam pos={cam} look={look ?? [0, 0.15, 0]} fov={fov} />
    <Mirror y={-1.04}>
      <Phone screen={screen} glow={glow} body={body} rotation={rot} position={pos} android={android}>
        {children}
      </Phone>
      {extra}
    </Mirror>
    <Rig t={t} {...rig} />
  </Lux>
)

/* Pass héros sur sol miroir */
export const PassShot = ({ t, map, back, rot = [0, 0, 0], pos = [0, 0, 0], scale = 1, cam, look, fov = 30, rig, extra, glow = 0 }) => (
  <Lux>
    <Cam pos={cam} look={look ?? [0, 0, 0]} fov={fov} />
    <Mirror y={-1.05}>
      <Pass map={map} back={back} rotation={rot} position={pos} scale={scale} glow={glow} />
      {extra}
    </Mirror>
    <Rig t={t} {...rig} />
  </Lux>
)

/* Tunnel de lumière : le pass file à travers des traits néon (vitesse, transition) */
export const TunnelShot = ({ t, a, map, dur = 2 }) => {
  const k = clamp((t - a) / dur)
  return (
    <Lux bloom={1.3}>
      <Cam pos={[Math.sin(t * 0.7) * 0.15, 0, 4.5]} look={[0, 0, 0]} fov={34} roll={Math.sin(t * 0.8) * 0.06 + k * 0.25} />
      <Streaks t={t} speed={2.4} alpha={Math.min(1, (t - a) * 3)} />
      {map && <Pass map={map} scale={0.85} position={[0, 0, mix(-8, 1.2, easeInOut(k))]} rotation={[0.1, k * Math.PI * 2 + 0.3, 0.15]} />}
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 3]} intensity={6} color="#cfe6ff" />
    </Lux>
  )
}

/* Carte papier qui se consume (liseré chaud), poussière qui s'envole */
export const PaperShot = ({ t, burnFrom, burnTo, cam, look }) => {
  const burn = mix(-0.05, 1.3, pr(t, burnFrom, burnTo, k => k * k * (3 - 2 * k)))
  const geo = usePaperGeometry(1.7, 1.1, 0.35, 3)
  const uniforms = useMemo(() => ({ uBurn: { value: 0 }, uEdge: { value: new THREE.Color('#ffb070') } }), [])
  uniforms.uBurn.value = burn
  const ob = useMemo(() => burnShader(uniforms), [uniforms])
  return (
    <Lux bloom={0.9} threshold={0.8} env={0.12}>
      <Cam pos={cam} look={look} fov={32} />
      <group rotation={[-0.85, 0.1, 0.06]} position={[0, -0.1, 0]}>
        <mesh geometry={geo}>
          <meshStandardMaterial map={tex('papier')} roughness={0.9} envMapIntensity={0.1} side={THREE.DoubleSide} onBeforeCompile={ob} customProgramCacheKey={() => 'burn-lux'} />
        </mesh>
      </group>
      <spotLight position={[0.5, 2.6, 1.2]} angle={0.32} penumbra={1} intensity={6} decay={1.3} color="#ffd9b8" />
      <Neon len={3} power={5} color="#ffb070" show={0} position={[0, 1.6, 1.6]} />
      <Particles
        count={700}
        size={0.013}
        color="#ffc890"
        fn={(i, o) => {
          const u = rnd(i * 1.3)
          const v = rnd(i * 2.7 + 4)
          const release = 0.45 * (1 - v) + 0.7 * (0.35 + 0.3 * rnd(i * 5.1))
          const age = (burn - release) * 2.4
          if (age <= 0) return (o[4] = 0)
          // la carte est inclinée (rotation x −0,85) : y local → y·cos, z·sin
          const ly = (v - 0.5) * 1.1
          o[0] = (u - 0.5) * 1.7 + age * (0.2 + rnd(i * 7) * 0.5)
          o[1] = -0.1 + ly * Math.cos(0.85) + age * (0.45 + rnd(i * 9) * 0.6)
          o[2] = -ly * Math.sin(0.85) + age * (rnd(i * 11) - 0.2) * 0.6
          o[3] = 0.6 + rnd(i * 13) * 1.4
          o[4] = clamp(1 - age / 2.2) * 0.9
        }}
      />
    </Lux>
  )
}

/* Notification qui tombe sur l'écran verrouillé (plaque 3D), puis l'écran prend la version avec notification */
export const NotifDrop = ({ t, at, map, w = 0.93, h = 0.205 }) => {
  const k = pr(t, at - 0.5, at, easeInOut)
  if (t >= at || k <= 0) return null
  return (
    <mesh position={[0, mix(1.7, 0.72, k), mix(1.2, 0.075, k)]} rotation={[mix(-0.6, 0, k), 0, 0]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={map} transparent opacity={clamp(k * 3)} toneMapped={false} />
    </mesh>
  )
}

/* Foule de téléphones qui s'allument en vague autour du téléphone central */
export const Crowd = ({ t, wave, on = 'lock-campagne', off = 'lock-vide', cols = 7, rows = 7 }) => {
  const out = []
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = c - (cols - 1) / 2
      const y = r - (rows - 1) / 2
      if (x === 0 && y === 0) continue
      const d = Math.hypot(x, y * 1.2)
      const k = pr(t, wave + d * 0.13, wave + d * 0.13 + 0.3)
      out.push(<Phone key={`${r}-${c}`} screen={tex(k > 0.5 ? on : off)} glow={mix(0.05, 1, k)} position={[x * 1.3, y * 2.35, -Math.abs(Math.sin(x * 1.7 + y)) * 0.6]} />)
    }
  return <group>{out}</group>
}

export { Cam, Lux, Mirror, Neon, Pass, Phone, Softbox, Streaks, Dust, spline, mix, pr, clamp, easeInOut }
