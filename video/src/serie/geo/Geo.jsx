import * as THREE from 'three'
import { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Particles, rnd, spline } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, MUTED, Pass, Phone, Scrim, Shot, Sound, Stage, W, clamp, easeInOut, mix, pr, silk, tex, usePreload } from '../kit'

/* 6. « Ils passent devant chez toi » : la carte qui se rappelle au client quand il passe à 50 m.
   Plans : quartier en maquette blanche au crépuscule, un passant lumineux entre dans le cercle de la boutique →
   son téléphone s'allume (« Maison Lumière est à 50 m »), le pass monte → retour sur la maquette : il entre → fin. */

export const TEX_GEO = ['lock-vide', 'lock-proche', 'pass-graphite', 'pass-back']
const C1 = () => W('ge02', 0) - 0.3
const C2 = () => W('ge04', 0) - 0.35
const FIN = () => W('ge05', 0) - 0.15
export const duree = () => END('ge05') + 2.2

const SHOP = [1.3, 0, 0.0] // vitrine de la boutique, côté rue x = 1
const R50 = 1.7 // « 50 m »

// trajet du passant : il descend la rue x = 1, entre dans le cercle sur « cinquante », puis entre dans la boutique
const walker = t => {
  const a = pr(t, 0, W('ge01', 4), k => k) // jusqu'à la limite du cercle
  const b = pr(t, C2() - 0.2, W('ge04', 1) + 0.4, easeInOut) // il entre
  const z = t < C2() ? mix(-6.2, -R50 + 0.05, a) + Math.max(0, t - W('ge01', 4)) * 0.18 : mix(-R50 + 0.05 + (C2() - W('ge01', 4)) * 0.18, 0, b)
  const x = mix(0.95, SHOP[0] + 0.15, pr(t, W('ge04', 1) - 0.1, W('ge04', 1) + 0.5, easeInOut))
  return [x, 0.06, z]
}

// ─── Maquette ────────────────────────────────────────────────
const City = () => {
  const boxes = useMemo(() => {
    const out = []
    for (let i = -3; i <= 3; i++)
      for (let j = -4; j <= 3; j++) {
        // îlot de 1,6 × 1,6, centré en (i·2, j·2) ; rues de 0,4 entre les îlots
        for (let k = 0; k < 4; k++) {
          const s = i * 37 + j * 11 + k * 5
          const cx = i * 2 + (k % 2 ? 0.4 : -0.4)
          const cz = j * 2 + (k < 2 ? -0.4 : 0.4)
          const h = 0.14 + rnd(s) * 0.5
          out.push({ p: [cx, h / 2, cz], s: [0.72 + rnd(s + 1) * 0.06, h, 0.72 + rnd(s + 2) * 0.06] })
        }
      }
    return out
  }, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0d0e12" roughness={0.9} />
      </mesh>
      {boxes.map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color="#8f95a3" roughness={0.8} envMapIntensity={0.12} />
        </mesh>
      ))}
    </group>
  )
}

const Shop = ({ t }) => {
  const lit = pr(t, W('ge04', 1), W('ge04', 1) + 0.8) // la vitrine s'éclaire quand il entre
  const pulse = (t * 0.7) % 1
  const cross = pr(t, W('ge01', 4) - 0.1, W('ge01', 4) + 0.6) // il franchit le cercle
  const ring = useMemo(() => new THREE.RingGeometry(R50 - 0.025, R50, 96), [])
  const wave = useMemo(() => new THREE.RingGeometry(0.96, 1, 96), [])
  return (
    <group>
      {/* vitrine */}
      <mesh position={[SHOP[0] - 0.03, 0.16, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[0.5, 0.26]} />
        <meshBasicMaterial color={new THREE.Color().lerpColors(new THREE.Color('#3a2a1a'), new THREE.Color('#ffd7a0'), 0.35 + lit * 0.65)} toneMapped={false} />
      </mesh>
      <pointLight position={[SHOP[0] + 0.4, 0.3, 0]} intensity={0.6 + lit * 3} distance={2.5} color="#ffc98a" />
      {/* repère */}
      <mesh position={[SHOP[0] - 0.4, 1.6, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 1.6, 8]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.5} toneMapped={false} />
      </mesh>
      <mesh position={[SHOP[0] - 0.4, 2.45, 0]}>
        <sphereGeometry args={[0.07, 24, 24]} />
        <meshBasicMaterial color={ACCENT} toneMapped={false} />
      </mesh>
      {/* cercle de 50 m et onde */}
      <mesh geometry={ring} rotation-x={-Math.PI / 2} position={[SHOP[0] - 0.4, 0.012, 0]}>
        <meshBasicMaterial color={ACCENT} transparent opacity={0.55 + cross * 0.45} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[SHOP[0] - 0.4, 0.008, 0]}>
        <circleGeometry args={[R50, 96]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0.06 + cross * 0.1} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh geometry={wave} rotation-x={-Math.PI / 2} position={[SHOP[0] - 0.4, 0.014, 0]} scale={R50 * pulse}>
        <meshBasicMaterial color={ACCENT} transparent opacity={(1 - pulse) * 0.5} toneMapped={false} />
      </mesh>
    </group>
  )
}

const Walker = ({ t }) => {
  const p = walker(t)
  const inside = t > W('ge04', 1) + 0.5
  return (
    <>
      {!inside && (
        <mesh position={p}>
          <sphereGeometry args={[0.08, 24, 24]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      )}
      <Particles
        count={40}
        size={0.14}
        color="#ffffff"
        fn={(i, o) => {
          const q = walker(t - i * 0.05)
          o[0] = q[0]
          o[1] = q[1]
          o[2] = q[2]
          o[3] = i === 0 ? 3 : 1.2 * (1 - i / 40)
          o[4] = inside ? 0 : i === 0 ? 0.9 : (1 - i / 40) * 0.5
        }}
      />
    </>
  )
}

const CityScene = ({ t, part }) => {
  const pos =
    part === 'A'
      ? spline(t, [[0, [3.2, 12.5, -10.5]], [C1() + 1, [4.2, 10.5, -6.0]]])
      : spline(t, [[C2(), [-4.6, 8.5, 5.0]], [W('ge04', 1) + 0.6, [-3.4, 6.2, 3.4]], [FIN() + 1, [-3.2, 6.6, 3.0]]])
  const look = part === 'A' ? spline(t, [[0, [0.9, 0, -0.9]], [C1() + 1, [0.9, 0, -0.2]]]) : [1.0, 0, -0.2]
  return (
    <>
      <Cam pos={pos} look={look} fov={30} />
      <hemisphereLight args={['#7f95d6', '#07070a', 0.3]} />
      <directionalLight position={[-6, 8, -4]} intensity={0.45} color="#c9d6ff" />
      <City />
      <Shop t={t} />
      <Walker t={t} />
    </>
  )
}

// ─── Le téléphone du passant ─────────────────────────────────
const PhoneScene = ({ t }) => {
  const wake = pr(t, W('ge02', 4) - 0.3, W('ge02', 4) + 0.3) // « rappelle »
  const out = pr(t, W('ge03', 1) - 0.2, W('ge03', 2) + 0.6, easeInOut) // « carte s'affiche »
  return (
    <>
      <Cam pos={spline(t, [[C1(), [-0.8, 0.0, 5.4]], [W('ge03', 0), [-0.2, 0.3, 5.6]], [C2() + 0.8, [0.2, 0.45, 6.4]]])} look={[0, mix(0.42, 0.5, out), mix(0, 0.6, out)]} fov={30} />
      <Phone screen={tex(wake > 0.5 ? 'lock-proche' : 'lock-vide')} glow={mix(0.06, 1, wake) * mix(1, 0.45, out)} body="#3a3a3c" position={[0, -out * 0.5, -out * 0.8]} rotation={[0.05, mix(0.35, 0.12, silk((t - C1()) / 2)), 0]} />
      {out > 0.001 && <Pass map={tex('pass-graphite')} back={tex('pass-back')} scale={mix(0.5, 0.85, out)} position={[0, mix(0.2, 0.55, out), mix(0.12, 1.0, out)]} rotation={[mix(-0.3, 0.04, out), -0.12 + Math.sin(t * 0.7) * 0.08, 0]} />}
    </>
  )
}

export const Geo = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_GEO)
  const D = duree()
  const dist = Math.max(0, Math.round((-walker(t)[2] - 0) * 30))
  const badge = silk((t - 0.6) / 0.6) * (1 - pr(t, C1() - 0.4, C1(), easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot t={t} a={0} b={C1()}>
        <Backdrop y={60} tint="30, 40, 70" glow={0.6} />
        {ready && <Stage><CityScene t={t} part="A" /></Stage>}
      </Shot>
      <Shot t={t} a={C1()} b={C2()}>
        <Backdrop y={52} />
        {ready && <Stage><PhoneScene t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C2()} b={FIN()}>
        <Backdrop y={60} tint="30, 40, 70" glow={0.6} />
        {ready && <Stage><CityScene t={t} part="C" /></Stage>}
      </Shot>
      <Scrim k={0.9} />

      {badge > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1470, display: 'flex', justifyContent: 'center', opacity: badge }}>
          <div style={{ fontFamily, fontSize: 34, fontWeight: 600, color: INK, padding: '16px 30px', borderRadius: 999, background: 'rgba(28,28,30,0.72)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', gap: 14, alignItems: 'center' }}>
            <span style={{ width: 12, height: 12, borderRadius: 6, background: ACCENT, boxShadow: `0 0 16px ${ACCENT}` }} />
            Maison Lumière <span style={{ color: MUTED, fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>· {Math.max(50, dist)} m</span>
          </div>
        </div>
      )}
      <Caption t={t} id="ge01" top={240} size={62} accent={[4, 5]} />
      <Caption t={t} id="ge02" top={240} size={66} accent={[4]} />
      <Caption t={t} id="ge03" top={240} size={62} accent={[7, 8]} />
      <Caption t={t} id="ge04" top={240} size={62} accent={[1]} out={FIN() - 0.2} />

      <EndCard t={t} at={FIN()} dur={D} line="La carte qui se rappelle à eux." />
      <Finish t={t} />
      <Sound set="geo" son={son} />
    </AbsoluteFill>
  )
}
