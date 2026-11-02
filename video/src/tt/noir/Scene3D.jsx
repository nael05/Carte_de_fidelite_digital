import * as THREE from 'three'
import { useMemo } from 'react'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { Cam, Card, Panel, Phone, RenderOnMount, clamp, easeInOut, easeOut, mix, pr, spline, spring, useFaceGeometry, useSlabGeometry, useTex, useTextGeometry } from '../kit3d'
import { Bassin, CHAMPAGNE, CarteBancaire, Halos, LAQUE, LaqueEnv, Morph } from '../laque'
import SERIF from '../fonts/instrument-serif.json'
import { N } from './temps'

/* « Noir » : tout est en laque noire et passe d'une forme à l'autre en redevenant liquide.
   Goutte → bassin → téléphone → carte → carte bancaire → chiffres → téléphone → logo. */

const NOTIF_H = 0.92 * (168 / 760)
const POOL = -1.4

// Caméra : une seule trajectoire continue
const POS = [
  [0, [0, 0.3, 3.3]],
  [1.2, [0, 0.35, 4.0]],
  [2.2, [0, 0.4, 5.2]],
  [4.4, [0, 0.05, 6.4]],
  [7.2, [0.2, 0.05, 5.4]],
  [9.5, [-0.7, 0.25, 5.6]],
  [11.0, [-0.3, 0.2, 5.8]],
  [13.8, [0.3, 0.1, 6.0]],
  [17.2, [0, 0.0, 6.6]],
  [24, [0, 0.15, 5.6]],
]
const LOOK = [
  [0, [0, -0.05, 0]],
  [1.2, [0, -0.8, 0]],
  [2.2, [0, -0.6, 0]],
  [4.4, [0, -0.15, 0]],
  [7.2, [0, -0.1, 0]],
  [11.0, [0, -0.2, 0]],
  [13.8, [0, -0.35, 0]],
  [17.2, [0, -0.2, 0]],
  [24, [0, 0.0, 0]],
]

// Ondes du bassin : impacts et émergences
const RIPPLES = [
  { x: 0, z: 0, at: 0.9, amp: 0.09 },
  { x: 0, z: 0, at: 1.55, amp: 0.05 },
  { x: 0, z: 0, at: 2.45, amp: 0.06 },
  { x: 0, z: 0, at: N.plonge + 0.35, amp: 0.08 },
  { x: 0, z: 0, at: N.chiffres + 0.1, amp: 0.05 },
  { x: 0, z: 0, at: N.coule + 0.35, amp: 0.07 },
  { x: 0, z: 0, at: N.remonte, amp: 0.06 },
]

// Chiffres en laque (Instrument Serif) : chaque chiffre bascule sur lui-même pour passer de 480 à 500
const Digit = ({ from, to, flip, x }) => {
  const gA = useTextGeometry(from, SERIF, { size: 1.05, depth: 0.22, bevel: 0.02, curve: 16 })
  const gB = useTextGeometry(to, SERIF, { size: 1.05, depth: 0.22, bevel: 0.02, curve: 16 })
  const rot = easeInOut(flip) * Math.PI
  return (
    <mesh geometry={rot < Math.PI / 2 ? gA : gB} position-x={x} rotation-x={rot < Math.PI / 2 ? rot : rot - Math.PI}>
      <meshPhysicalMaterial {...LAQUE} />
    </mesh>
  )
}

const Chiffres = ({ t }) => {
  const rise = easeOut(clamp((t - N.chiffres) / 0.6))
  const sink = easeInOut(clamp((t - N.coule) / 0.45))
  const flip = i => clamp((t - N.roule - i * 0.09) / 0.42)
  return (
    <group position-y={mix(POOL - 1.2, -0.35, rise) - sink * 2.2} rotation-y={Math.sin(t * 0.6) * 0.12}>
      <Digit from="4" to="5" x={-0.62} flip={flip(0)} />
      <Digit from="8" to="0" x={0} flip={flip(1)} />
      <Digit from="0" to="0" x={0.62} flip={0} />
    </group>
  )
}

// Icône Fidelyz en laque
const Logo = ({ t }) => {
  const [logo] = useTex('logo-fidelyz.png')
  const slab = useSlabGeometry(1, 1, 0.22, 0.12, 0.04)
  const face = useFaceGeometry(0.86, 0.86, 0.19, [0.184, 0.184, 0.816, 0.816])
  const a = t - N.logo
  return (
    <group position-y={0.35} rotation={[0.08, Math.sin(a * 0.7) * 0.35 - 0.1, 0]}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial {...LAQUE} />
      </mesh>
      <mesh geometry={face} position-z={0.104}>
        <meshPhysicalMaterial map={logo} roughness={0.08} clearcoat={1} emissive="#ffffff" emissiveMap={logo} emissiveIntensity={clamp(a * 2) * 0.35} transparent opacity={clamp(a * 3)} />
      </mesh>
    </group>
  )
}

export const Scene3D = ({ t }) => {
  const [vide, noir, azur, or, back, lock, notif] = useTex('pass-noir-vide', 'pass-noir', 'pass-noir-azur', 'pass-noir-or', 'pass-noir-back', 'lock-vide', 'notif-offre')
  const p = spline(t, POS)
  const l = spline(t, LOOK)

  // 1. la goutte tombe, rebondit
  const fall = clamp(t / 0.9)
  const dropY = t < 0.9 ? mix(0.55, POOL + 0.15, fall * fall) : t < 1.55 ? POOL + 0.15 + Math.sin(((t - 0.9) / 0.65) * Math.PI) * 0.9 : -10
  const dropScale = t < 0.9 ? [1.6, 2.1, 1.6] : [0.7, 0.9, 0.7]

  // carte : texture selon le moment (vierge, logo, couleurs)
  const cardMap = t < N.logo0 ? vide : t < N.couleurs ? noir : t < N.couleurs + 0.28 ? azur : t < N.couleurs + 0.56 ? or : noir
  const out = easeInOut(clamp((t - N.drop) / 0.8)) // la carte sort de l'écran
  const fan = easeInOut(clamp((t - N.wallet) / 1.0))
  const bank = spring(t, N.bancaire - 0.25, 1.2, 6)

  return (
    <>
      <color attach="background" args={['#030407']} />
      <fog attach="fog" args={['#030407', 7, 16]} />
      <LaqueEnv />
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <spotLight position={[mix(-3, 3, (t % 6) / 6), 3, 3]} angle={0.4} penumbra={0.7} intensity={25} color={CHAMPAGNE} />
      <Cam pos={p} look={l} fov={36} />

      <Halos />
      <Bassin t={t} ripples={RIPPLES} y={POOL} />

      {/* goutte qui tombe */}
      {t < 1.55 && (
        <mesh position-y={dropY} scale={dropScale}>
          <sphereGeometry args={[0.16, 64, 48]} />
          <meshPhysicalMaterial {...LAQUE} />
        </mesh>
      )}

      {/* le liquide remonte et devient téléphone */}
      {t >= 2.35 && t < N.telephone && <Morph a="goutte" b="telephone" p={clamp((t - 2.35) / (N.telephone - 2.35))} t={t} position-y={mix(POOL, 0, easeOut(clamp((t - 2.35) / 1.4)))} />}
      {t >= N.telephone && t < N.drop + 1.6 && (
        <Phone screen={lock} body="#050506" metal={0.2} rough={0.08} glow={clamp((t - N.drop) * 3)} position-y={-easeInOut(clamp((t - N.drop - 0.5) / 1.1)) * 4.2} />
      )}

      {/* la carte noire sort de l'écran, prend son logo, ses couleurs, puis rejoint la carte bancaire */}
      {t >= N.drop && t < N.fond && (
        <group position={[mix(0, -0.35, fan), mix(mix(0.1, 0.15, out), 0.25, fan), mix(0.07, 0.9, out) + fan * 0.3]} rotation={[mix(0, -0.1, out), mix(0, Math.PI * 2, out) + Math.sin(t * 0.7) * 0.12 * out + fan * 0.25, fan * 0.08]} scale={mix(0.85, 1, out)}>
          <Card front={cardMap} back={back} edge="#000" />
        </group>
      )}
      {t >= N.bancaire - 0.3 && t < N.fond + 0.5 && (
        <CarteBancaire position={[mix(3, 0.3, clamp(bank)) + (t > N.fond ? (t - N.fond) * 6 : 0), -0.95, 0.75]} rotation={[0.25, -0.35, 0.14]} scale={0.7} />
      )}

      {/* la carte redevient liquide et plonge dans le bassin */}
      {t >= N.fond && t < N.plonge + 0.4 && (
        <Morph a="carte" b="goutte" p={clamp((t - N.fond) / (N.plonge + 0.4 - N.fond))} t={t} position={[mix(-0.35, 0, clamp((t - N.fond) / 0.4)), mix(0.25, POOL, easeInOut(clamp((t - N.plonge) / 0.4))), 0]} />
      )}

      {/* chiffres qui sortent du bassin */}
      {t >= N.chiffres && t < N.coule + 0.5 && <Chiffres t={t} />}

      {/* le liquide remonte en téléphone, la notification tombe comme une goutte */}
      {t >= N.remonte && t < N.telephone2 && <Morph a="goutte" b="telephone" p={clamp((t - N.remonte) / (N.telephone2 - N.remonte))} t={t} position-y={mix(POOL, 0, easeOut(clamp((t - N.remonte) / 0.7)))} />}
      {t >= N.telephone2 && t < N.fonte && (
        <Phone screen={lock} body="#050506" metal={0.2} rough={0.08} glow={clamp((t - N.telephone2) * 3) * (1 + 0.25 * Math.exp(-Math.max(0, t - N.dit) * 3) * (t > N.dit ? 1 : 0))}>
          {t >= N.notif && (
            <Panel map={notif} w={0.92} h={NOTIF_H} position={[0, mix(1.6, 0.43, easeOut(clamp((t - N.notif) / 0.35))), 0.07 + Math.max(0, 1 - spring(t, N.notif + 0.3, 2, 7)) * 0.1]} scale={0.88 * (1 + Math.max(0, 1 - spring(t, N.notif + 0.3, 2, 7)) * 0.1)} />
          )}
        </Phone>
      )}

      {/* le téléphone fond et devient le logo */}
      {t >= N.fonte && t < N.logo && <Morph a="telephone" b="logo" p={clamp((t - N.fonte) / (N.logo - N.fonte))} t={t} position-y={mix(0, 0.35, clamp((t - N.fonte) / (N.logo - N.fonte)))} />}
      {t >= N.logo && <Logo t={t} />}

      <RenderOnMount />
      <EffectComposer multisampling={4} disableNormalPass>
        <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.82} luminanceSmoothing={0.15} />
        <Vignette darkness={0.6} offset={0.28} />
      </EffectComposer>
    </>
  )
}
