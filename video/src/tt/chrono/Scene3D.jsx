import * as THREE from 'three'
import { useMemo } from 'react'
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Cam, Card, Panel, Phone, RenderOnMount, clamp, easeIn, easeInOut, easeOut, expoOut, mix, rnd, roundedRect, spring, useFaceGeometry, useSlabGeometry, useTex } from '../kit3d'
import { BLEU, Halos, LAQUE, LaqueEnv, Ruban, vague } from '../laque'
import { BEAT, H, affiche } from './temps'

/* « Chrono » : objets en laque noire traversés de rubans LED, un plan par étape, coupes sur les temps. */

const CYAN = [0.25, 2.6, 4.2]
const VIOLET = [2.4, 0.6, 4.6]
const BLUE = [0.3, 1.2, 4.8]
const NOTIF_H = 0.92 * (168 / 760)
const beatPulse = t => (t < H.top ? 0 : Math.exp(-((t - H.top) % BEAT) * 9))

// Cercle (ou contour arrondi) en points 3D, pour les rubans
const circle = (r, n = 160, z = 0) => Array.from({ length: n }, (_, i) => new THREE.Vector3(Math.cos((i / n) * Math.PI * 2 + Math.PI / 2) * r, Math.sin((i / n) * Math.PI * 2 + Math.PI / 2) * r, z))
const contour = (w, h, r, z = 0) => roundedRect(w, h, r).getSpacedPoints(240).slice(0, -1).map(p => new THREE.Vector3(p.x, p.y, z))

// ─── Chronomètre en laque ────────────────────────────────────
const Chronometre = ({ t, progress, press = 0, ...props }) => {
  const ring = useMemo(() => circle(1.12, 200, 0.16), [])
  return (
    <group {...props}>
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[1, 1, 0.26, 96]} />
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
      <mesh position-z={0.131}>
        <circleGeometry args={[0.88, 96]} />
        <meshPhysicalMaterial color="#020203" roughness={0.02} clearcoat={1} metalness={0.3} />
      </mesh>
      {/* graduations */}
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i / 60) * Math.PI * 2
        const big = i % 5 === 0
        return (
          <mesh key={i} position={[Math.sin(a) * 0.8, Math.cos(a) * 0.8, 0.135]} rotation-z={-a}>
            <planeGeometry args={[big ? 0.02 : 0.008, big ? 0.1 : 0.05]} />
            <meshBasicMaterial color={i / 60 <= progress ? [0.4, 2.4, 3.6] : [0.25, 0.25, 0.3]} toneMapped={false} />
          </mesh>
        )
      })}
      {/* aiguille */}
      <mesh position-z={0.14} rotation-z={-progress * Math.PI * 2 * 4}>
        <planeGeometry args={[0.025, 0.75]} />
        <meshBasicMaterial color={[3, 3, 3]} toneMapped={false} />
      </mesh>
      {/* couronne et poussoir */}
      <group position-y={1.0 - press * 0.06}>
        <mesh position-y={0.12}>
          <cylinderGeometry args={[0.11, 0.11, 0.2, 48]} />
          <meshPhysicalMaterial color="#d8dce3" metalness={1} roughness={0.15} />
        </mesh>
        <mesh position-y={0.27}>
          <cylinderGeometry args={[0.17, 0.17, 0.1, 48]} />
          <meshPhysicalMaterial color="#d8dce3" metalness={1} roughness={0.15} />
        </mesh>
      </group>
      <Ruban pts={ring} closed color={CYAN} radius={0.018} draw={progress} />
    </group>
  )
}

// ─── Présentoir de comptoir avec le QR code « imprimé » par un trait de lumière ───
const Presentoir = ({ t, print = 1, ...props }) => {
  const [qr] = useTex('qr')
  const slab = useSlabGeometry(1.0, 1.25, 0.06, 0.05, 0.012)
  const crop = useMemo(() => [0, 1 - print, 1, 1], [print])
  const face = useFaceGeometry(0.94, 1.175 * Math.max(0.001, print), 0.05, crop)
  return (
    <group {...props}>
      <group rotation-x={-0.18}>
        <mesh geometry={slab}>
          <meshPhysicalMaterial {...LAQUE} />
        </mesh>
        {print > 0.001 && <mesh geometry={face} position={[0, (1.175 * (1 - print)) / 2, 0.042]}>
          <meshBasicMaterial map={qr} toneMapped={false} />
        </mesh>}
        {print > 0 && print < 1 && (
          <mesh position={[0, 0.5875 - 1.175 * print, 0.05]}>
            <boxGeometry args={[1.05, 0.012, 0.01]} />
            <meshBasicMaterial color={CYAN} toneMapped={false} />
          </mesh>
        )}
      </group>
      <mesh position={[0, -0.7, -0.15]}>
        <boxGeometry args={[0.9, 0.08, 0.5]} />
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
    </group>
  )
}

// Icône Fidelyz en laque
const Logo = ({ t, ...props }) => {
  const [logo] = useTex('logo-fidelyz.png')
  const slab = useSlabGeometry(1, 1, 0.22, 0.12, 0.04)
  const face = useFaceGeometry(0.86, 0.86, 0.19, [0.184, 0.184, 0.816, 0.816])
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
      <mesh geometry={face} position-z={0.104}>
        <meshPhysicalMaterial map={logo} roughness={0.08} clearcoat={1} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

// Rubans qui traversent le fond de chaque plan
const Fond = ({ t, k = 1 }) => (
  <group position-z={-1.6}>
    <Ruban pts={vague(t, { y: 1.6, amp: 0.4, phase: 0, len: 9 })} color={BLUE} radius={0.012} halo={0.08 * k} />
    <Ruban pts={vague(t * 1.2, { y: -1.7, amp: 0.5, phase: 2, len: 9 })} color={VIOLET} radius={0.012} halo={0.08 * k} />
  </group>
)

const DUST = new Float32Array(Array.from({ length: 240 }, (_, i) => (rnd(i) - 0.5) * (i % 3 === 2 ? 4 : 7)))

export const Scene3D = ({ t }) => {
  const [vide, noir, azur, or, back, lock, walletNoir, notif] = useTex('pass-noir-vide', 'pass-noir', 'pass-noir-azur', 'pass-noir-or', 'pass-noir-back', 'lock-vide', 'wallet-noir', 'notif-offre')
  const pulse = beatPulse(t)
  const kick = [H.top, H.un, H.deux, H.trois, H.bonus, H.stop, H.fin].reduce((m, h) => (t >= h ? Math.max(m, Math.exp(-(t - h) * 9)) : m), 0)

  let cam = { pos: [0, 0, 6], look: [0, 0, 0], roll: 0 }
  let scene = null

  if (t < H.un) {
    // 0. Accroche : le chronomètre, la couronne s'enfonce sur « Top chrono »
    const press = t >= H.top - 0.12 && t < H.top + 0.2 ? Math.sin(((t - (H.top - 0.12)) / 0.32) * Math.PI) : 0
    const burst = t >= H.top ? t - H.top : -1
    cam = { pos: [Math.sin(t * 0.4) * 0.5, 0.2, mix(6.0, 6.9, easeOut(clamp(t / 2.6)))], look: [0, -0.12, 0], roll: Math.sin(t * 0.5) * 0.04 }
    scene = (
      <>
        <Chronometre t={t} progress={clamp((affiche(t) % 60) / 60)} press={press} rotation={[0.15, Math.sin(t * 0.7) * 0.35, 0]} position-y={0.2} scale={1 + pulse * 0.03} />
        {burst >= 0 &&
          [CYAN, VIOLET, BLUE].map((c, i) => (
            <Ruban key={i} pts={circle(1.2 + i * 0.15, 160, 0.2)} closed color={c} radius={0.01} draw={1} halo={0.15 * Math.exp(-burst * 2)} />
          ))}
      </>
    )
  } else if (t < H.deux) {
    // 1. Ton logo, tes couleurs
    const a = t - H.un
    const stamp = expoOut(clamp((t - (H.logo - 0.25)) / 0.25))
    const map = t < H.logo ? vide : t < H.couleurs ? noir : [azur, or, noir][Math.min(2, Math.floor((t - H.couleurs) / (BEAT * 0.75)))]
    const ring = t >= H.logo ? t - H.logo : -1
    cam = { pos: [mix(0.8, -0.2, easeOut(clamp(a / 1.8))), 0.15, 6.0], look: [0, -0.38, 0], roll: -0.05 }
    scene = (
      <>
        <Card front={map} back={back} edge="#000" rotation={[0.05, mix(-0.6, 0.15, easeOut(clamp(a / 0.8))), 0]} scale={1 + pulse * 0.02} />
        {t < H.logo && (
          <mesh position={[mix(2.2, -0.36, stamp), mix(2.6, 0.67, stamp), mix(1.5, 0.03, stamp)]} rotation-z={(1 - stamp) * 3}>
            <planeGeometry args={[0.14, 0.14]} />
            <meshBasicMaterial color={[3, 2.4, 1.6]} toneMapped={false} />
          </mesh>
        )}
        {ring >= 0 && ring < 0.6 && (
          <mesh position={[-0.36, 0.67, 0.03]} scale={0.1 + ring * 2}>
            <ringGeometry args={[0.9, 1, 64]} />
            <meshBasicMaterial color={CYAN} transparent opacity={1 - ring / 0.6} toneMapped={false} />
          </mesh>
        )}
        {t >= H.couleurs && <Ruban pts={contour(1.04, 1.62, 0.06, 0.02)} closed color={[azur, or, noir].indexOf(map) === 1 ? [3.6, 2.4, 0.6] : CYAN} radius={0.01} draw={clamp((t - H.couleurs) / 0.35)} />}
      </>
    )
  } else if (t < H.trois) {
    // 2. Tu imprimes ton QR code
    const a = t - H.deux
    cam = { pos: [mix(-1.2, 0.4, easeOut(clamp(a / 2))), 0.5, 5.6], look: [0, -0.6, 0], roll: 0.04 }
    scene = <Presentoir t={t} print={easeInOut(clamp((t - H.imprime) / 0.6))} rotation-y={mix(0.5, 0.1, easeOut(clamp(a / 1.5)))} scale={1 + pulse * 0.02} />
  } else if (t < H.bonus) {
    // 3. Ils scannent, la carte arrive dans leur Wallet
    const a = t - H.trois
    const phoneIn = easeOut(clamp(a / 0.8))
    const fly = easeInOut(clamp((t - H.carte) / 0.7))
    const inWallet = t >= H.carte + 0.7
    const beam = t >= H.scan && t < H.carte + 0.7
    const push = easeInOut(clamp((t - H.wallet + 0.3) / 0.8))
    const qrPos = [-0.75, -0.55, 0]
    const phonePos = [mix(2.6, 0.62, phoneIn), mix(0.6, 0.35, phoneIn), 0.6]
    cam = { pos: [mix(0, 0.5, push), mix(0.2, 0.3, push), mix(6.6, 5.4, push)], look: [mix(0, 0.55, push), mix(-0.32, -0.12, push), 0], roll: 0 }
    scene = (
      <>
        <Presentoir t={t} print={1} position={qrPos} rotation-y={0.45} scale={0.75} />
        <Phone screen={inWallet ? walletNoir : lock} body="#050506" metal={0.2} rough={0.08} glow={inWallet ? 1 : 0.35} position={phonePos} rotation={[0.05, -0.45 + push * 0.4, -0.08 + push * 0.08]} scale={0.85} />
        {beam && <Ruban pts={[new THREE.Vector3(...qrPos).add(new THREE.Vector3(0.1, 0.25, 0.1)), new THREE.Vector3(phonePos[0] - 0.2, phonePos[1] - 0.1, 0.62)]} color={CYAN} radius={0.012 + Math.sin(t * 40) * 0.003} />}
        {t >= H.carte && t < H.carte + 0.75 && (
          <Card front={noir} back={back} position={[mix(qrPos[0], phonePos[0], fly), mix(qrPos[1], phonePos[1], fly) + Math.sin(fly * Math.PI) * 0.9, mix(0.3, 0.65, fly)]} rotation={[0, fly * Math.PI * 2, mix(0.2, -0.08, fly)]} scale={mix(0.5, 0.25, fly)} />
        )}
      </>
    )
  } else if (t < H.stop) {
    // Bonus : une offre s'affiche sur l'écran
    const a = t - H.bonus
    const drop = easeOut(clamp((t - H.offre) / 0.6))
    const land = spring(t, H.offre + 0.6, 2, 7)
    const trail = t >= H.offre && t < H.offre + 0.7
    cam = { pos: [Math.sin(a * 0.6) * 0.6, 0.1, mix(7.4, 6.8, easeOut(clamp(a / 3)))], look: [0, -0.3, 0], roll: -0.04 }
    scene = (
      <>
        <Phone screen={lock} body="#050506" metal={0.2} rough={0.08} rotation={[0.04, Math.sin(a) * 0.15, 0.03]} scale={1 + pulse * 0.015}>
          {t >= H.offre && <Panel map={notif} w={0.92} h={NOTIF_H} position={[0, mix(2.4, 0.43, drop), 0.07 + (1 - clamp(land)) * 0.2]} scale={0.88 * (1 + Math.max(0, 1 - land) * 0.15)} />}
        </Phone>
        {trail && <Ruban pts={[new THREE.Vector3(0, 3, 0.2), new THREE.Vector3(0, mix(2.4, 0.5, drop), 0.15)]} color={VIOLET} radius={0.02} />}
        {t >= H.ecran && t < H.ecran + 0.8 && (
          <mesh position-z={0.1} scale={0.6 + (t - H.ecran) * 3}>
            <ringGeometry args={[0.95, 1, 96]} />
            <meshBasicMaterial color={CYAN} transparent opacity={1 - (t - H.ecran) / 0.8} toneMapped={false} />
          </mesh>
        )}
      </>
    )
  } else if (t < H.fin) {
    // Stop : le chronomètre s'arrête
    const a = t - H.stop
    const flash = Math.exp(-a * 3)
    cam = { pos: [0, 0.1, mix(5.4, 6.6, easeOut(clamp(a / 1.2)))], look: [0, 0.12, 0], roll: 0 }
    scene = (
      <>
        <Chronometre t={t} progress={1} press={a < 0.3 ? Math.sin((a / 0.3) * Math.PI) : 0} rotation={[0.1, Math.sin(a * 1.2) * 0.2, 0]} position-y={0.75} scale={0.8} />
        {[CYAN, VIOLET].map((c, i) => (
          <Ruban key={i} pts={circle(0.95 + i * 0.12 + a * 0.4, 160, 0.2).map(v => v.add(new THREE.Vector3(0, 0.75, 0)))} closed color={c} radius={0.01} halo={0.2 * flash} />
        ))}
      </>
    )
  } else {
    // Fin : le logo, entouré d'un ruban LED
    const a = t - H.fin
    const k = spring(t, H.fin, 1.2, 6)
    cam = { pos: [Math.sin(a * 0.4) * 0.4, 0.4, 5.4], look: [0, 0.1, 0], roll: 0 }
    scene = (
      <>
        <Logo t={t} position-y={0.75} rotation={[0.1, mix(Math.PI, 0, clamp(k)) + Math.sin(a * 0.9) * 0.2, 0]} scale={clamp(k) * 1.1} />
        <group position-y={0.75}>
          <Ruban pts={contour(1.42, 1.42, 0.32, 0)} closed color={CYAN} radius={0.012} draw={easeOut(clamp(a / 0.7))} />
          <Ruban pts={contour(1.6, 1.6, 0.38, -0.1)} closed color={VIOLET} radius={0.01} start={0} draw={easeOut(clamp((a - 0.15) / 0.8))} />
        </group>
      </>
    )
  }

  return (
    <>
      <color attach="background" args={['#020308']} />
      <LaqueEnv />
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <pointLight position={[-2, 0, 2]} intensity={6} color={BLEU} />
      <Halos items={[[-1.8, 1.6, 6, BLEU, 0.35], [1.9, -1.0, 5, '#7a3dff', 0.3]]} />
      <Cam pos={cam.pos} look={cam.look} fov={36} roll={cam.roll} />
      {t >= H.top && <Fond t={t} k={1 + pulse} />}
      {scene}
      {/* poussières lumineuses */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={80} array={DUST} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.02} color="#9fd0ff" transparent opacity={0.5} />
      </points>
      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.7} luminanceSmoothing={0.2} />
        <ChromaticAberration offset={[kick * 0.008, kick * 0.002]} radialModulation={false} />
        <Vignette darkness={0.55} offset={0.3} />
      </EffectComposer>
    </>
  )
}
