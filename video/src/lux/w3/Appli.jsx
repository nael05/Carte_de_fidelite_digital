import * as THREE from 'three'
import { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { burnShader, useFaceGeometry, useSlabGeometry } from '../../tt/kit3d'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Line, MUTED, Montage, ProductTag, W, silk } from '../fx'
import { Cam, Lux, Mirror, Softbox, Pass, PassShot, Phone, PhoneShot, Rig, easeInOut, mix, pr, spline, tex } from '../shots'

/* Vague 3 : « Sans application ». L'icône d'une appli de boulangerie, que personne ne télécharge, se consume en lumière →
   fouet : le pass Fidelyz → plongée : iPhone et Android → iris : dans le Wallet, le pass vient se ranger à côté de la carte bancaire → fin. */

export const TEX = ['pass-pain', 'pass-back', 'wallet', 'lock-vide']
export const duree = () => END('ko05') + 2.4

/* Icône d'application dessinée au canevas, qui se consume (liseré bleu) */
const AppIcon = ({ burn, ...props }) => {
  const map = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 512
    const g = c.getContext('2d')
    const gr = g.createLinearGradient(0, 0, 512, 512)
    gr.addColorStop(0, '#f2b766')
    gr.addColorStop(1, '#b8622a')
    g.fillStyle = gr
    g.fillRect(0, 0, 512, 512)
    g.fillStyle = 'rgba(255,255,255,0.18)'
    g.beginPath()
    g.ellipse(180, 120, 260, 160, -0.4, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff8ee'
    g.font = 'italic 700 300px Georgia, serif'
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.fillText('F', 256, 270)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const geo = useFaceGeometry(1, 1, 0.23)
  const uniforms = useMemo(() => ({ uBurn: { value: 0 }, uEdge: { value: new THREE.Color('#7cc4ff') } }), [])
  uniforms.uBurn.value = burn
  const ob = useMemo(() => burnShader(uniforms), [uniforms])
  if (burn > 1.25) return null
  return (
    <mesh geometry={geo} {...props}>
      <meshStandardMaterial map={map} roughness={0.35} metalness={0.1} onBeforeCompile={ob} customProgramCacheKey={() => 'burn-app'} side={THREE.DoubleSide} />
    </mesh>
  )
}

/* Carte bancaire générique (portrait, comme dans le Wallet) : métal bleu nuit, puce, sans contact */
const Banque = props => {
  const slab = useSlabGeometry(0.98, 1.55, 0.06, 0.016, 0.006)
  const chip = useSlabGeometry(0.15, 0.2, 0.025, 0.006, 0.002)
  return (
    <group {...props}>
      <mesh geometry={slab}>
        <meshPhysicalMaterial color="#3b63b8" metalness={0.45} roughness={0.35} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <mesh geometry={chip} position={[-0.25, 0.4, 0.01]}>
        <meshPhysicalMaterial color="#e3c9a4" metalness={1} roughness={0.2} clearcoat={1} />
      </mesh>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[0.28, 0.42, 0.01]}>
          <torusGeometry args={[0.03 + i * 0.028, 0.006, 8, 32, Math.PI * 0.6]} />
          <meshPhysicalMaterial color="#c9ced8" metalness={1} roughness={0.25} />
        </mesh>
      ))}
    </group>
  )
}

export const Appli = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C1 = W('ko02', 0) - 0.4
  const C2 = W('ko03', 0) - 0.35
  const C3 = W('ko04', 0) - 0.35
  const C4 = W('ko05', 0) - 0.45
  const burn = mix(-0.05, 1.3, pr(t, W('ko01', 5) - 0.1, C1 + 0.2, k => k * k * (3 - 2 * k))) // « Personne ne la télécharge »
  const shots = [
    {
      a: 0,
      b: C1,
      tr: 'whip',
      render: t =>
        ready && (
          <Lux bloom={1.2}>
            <Cam pos={spline(t, [[0, [0.5, 0.2, 4.4]], [C1 + 0.6, [0, 0.1, 5.2]]])} look={[0, 0.05, 0]} fov={30} />
            <Mirror y={-0.95}>
              <AppIcon burn={burn} rotation={[0.05, mix(-0.5, 0.15, pr(t, 0, C1, easeInOut)), 0]} position={[0, 0.1, 0]} />
            </Mirror>
            <Rig t={t} rimAt={0.05} sweep={[0.1, 1.6]} z={1} />
          </Lux>
        ),
    },
    {
      a: C1,
      b: C2,
      tr: 'zoom',
      render: t => ready && <PassShot t={t} map={tex('pass-pain')} back={tex('pass-back')} rot={[0.04, mix(-0.9, -0.15, pr(t, C1, C2, easeInOut)), 0]} cam={spline(t, [[C1, [0.5, 0.15, 5.6]], [C2 + 0.6, [0.1, 0.15, 6.0]]])} look={[0, -0.05, 0]} rig={{ sweep: [C1 + 0.2, C1 + 1.8], rimAt: C1 + 0.4, rimColor: '#ffbf7a', z: 1 }} />,
    },
    {
      a: C2,
      b: C3,
      tr: 'iris',
      render: t =>
        ready && (
          <PhoneShot
            t={t}
            screen={tex('lock-vide')}
            glow={0.2}
            pos={[-0.6, 0, 0]}
            rot={[0, 0.22, 0]}
            cam={spline(t, [[C2, [-0.4, 0.2, 8.0]], [C3 + 0.6, [0.3, 0.2, 7.4]]])}
            look={[0, 0.15, 0]}
            rig={{ rimAt: -1 }}
            extra={
              <group position={[0.6, 0, -0.05]} rotation={[0, -0.22, 0]}>
                <Phone screen={tex('lock-vide')} glow={0.1} android body="#c9c4bb">
                  <Pass map={tex('pass-pain')} scale={0.6} position={[0, 0.1, 0.085]} />
                </Phone>
              </group>
            }
          >
            <Pass map={tex('pass-pain')} scale={0.6} position={[0, 0.1, 0.085]} />
          </PhoneShot>
        ),
    },
    {
      a: C3,
      b: C4,
      tr: 'streak',
      render: t => {
        const k = pr(t, W('ko04', 6) - 0.5, W('ko04', 12) + 0.2, easeInOut) // « Juste à côté de leur carte bancaire »
        return (
          ready && (
            <Lux>
              <Cam pos={spline(t, [[C3, [0.5, 0.5, 8.6]], [C4 + 0.6, [0.05, 0.35, 8.0]]])} look={[0, 0.05, 0]} fov={30} />
              <Mirror y={-1.05}>
                <Banque position={[-0.58, 0, 0]} rotation={[0.04, 0.22, 0]} />
                <Pass map={tex('pass-pain')} back={tex('pass-back')} position={[mix(2.2, 0.58, k), mix(0.5, 0.0, k), mix(1.0, 0.05, k)]} rotation={[0.04, mix(-0.9, -0.22, k), 0]} scale={0.98} />
              </Mirror>
              <Softbox w={4} h={1.4} power={5} position={[0, 1.4, 3.4]} target={[0, 0, 0]} />
              <Rig t={t} rimAt={-1} sweep={[W('ko04', 6) - 0.2, W('ko04', 12) + 0.4]} z={1.1} />
            </Lux>
          )
        )
      },
    },
    { a: C4, b: 99, render: t => <EndCard t={t} at={C4 + 0.3} dur={duree()} line="Gratuit pour commencer." /> },
  ]
  const store = silk((t - 0.5) / 0.6) * (1 - pr(t, W('ko01', 5) + 0.2, W('ko01', 8), easeInOut))
  const dl = pr(t, 0.9, W('ko01', 5), k => k) // la barre de téléchargement… qui n'avance pas
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      <Finish t={t} />
      {store > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, fontFamily, opacity: store }}>
          <div style={{ fontSize: 44, fontWeight: 650, color: INK }}>Le Fournil</div>
          <div style={{ fontSize: 28, color: MUTED }}>Application de fidélité · 0 téléchargement</div>
          <div style={{ width: 220, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.12)', overflow: 'hidden' }}>
            <div style={{ width: `${dl * 4}%`, height: '100%', background: ACCENT }} />
          </div>
        </div>
      )}
      <Line t={t} id="ko01" top={250} size={62} accent={[1]} blue={[5, 6, 7, 8]} />
      <Line t={t} id="ko02" top={230} size={60} blue={[0]} accent={[3, 4, 5, 6]} />
      <ProductTag t={t} at={W('ko02', 6)} out={C2 - 0.1} top={1520} />
      <Line t={t} id="ko03" top={240} size={62} blue={[3, 4, 6, 7]} />
      <Line t={t} id="ko04" top={240} size={60} accent={[5]} blue={[11, 12]} />
      <Sound set="mappli" son={son} />
    </AbsoluteFill>
  )
}
