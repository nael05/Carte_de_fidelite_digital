import * as THREE from 'three'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { RenderOnMount, usePaperGeometry } from '../../tt/kit3d'
import { Sound, usePreload } from '../../serie/kit'
import { ACCENT, END, EndCard, Finish, INK, Kicker, Line, Montage, W, silk } from '../fx'
import { Cam, Lux, NotifDrop, PassShot, PhoneShot, Rig, easeInOut, mix, pr, spline, tex } from '../shots'

/* 4. « Papier ou téléphone ? » (série Lumière) : un duel en trois manches.
   Ouverture en écran partagé, puis chaque manche alterne la carte papier (lumière chaude) et Fidelyz (néon froid), en coups de fouet. */

export const TEX = ['papier', 'pass-graphite', 'pass-graphite-500', 'pass-back', 'wallet', 'lock-vide', 'lock-campagne', 'notif-campagne']
export const duree = () => END('lv05') + 2.4
const WARM = '#ffcf9e'

/* Carte papier sous un projecteur chaud : fall (0 → 1 elle tombe dans le noir), crumple, dim */
const PaperMesh = ({ t, fall = 0, crumple = 0, dim = 0 }) => {
  const geo = usePaperGeometry(1.7, 1.1, 0.25 + crumple * 1.7, 7)
  const c = mix(1, 0.7, crumple) * mix(1, 0.45, dim)
  return (
    <group position={[fall * 0.6, -fall * fall * 3.2, -fall * 0.6]} rotation={[-0.5 + fall * 1.6, 0.15 + fall * 1.1, 0.05 + fall * 0.8 + Math.sin(t * 0.5) * 0.02]}>
      <mesh geometry={geo}>
        <meshStandardMaterial map={tex('papier')} roughness={0.9} envMapIntensity={0.1} color={new THREE.Color(c, c * 0.95, c * 0.88)} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
const PaperScene = ({ t, cam, ...p }) => (
  <>
    <Cam pos={cam ?? [0.2, 0.5, 3.4]} look={[0, 0.0, 0]} fov={30} />
    <spotLight position={[0.4, 2.6, 1.4]} angle={0.4} penumbra={1} intensity={7} decay={1.3} color={WARM} />
    <PaperMesh t={t} {...p} />
  </>
)
const PaperShot = props => (
  <Lux bloom={0.6} env={0.1}>
    <PaperScene {...props} />
  </Lux>
)

export const Versus = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX)
  const C0 = W('lv02', 0) - 0.4
  const C1 = W('lv02', 4) - 0.3
  const C2 = W('lv03', 0) - 0.35
  const C3 = W('lv03', 3) - 0.3
  const C4 = W('lv04', 0) - 0.35
  const C5 = W('lv04', 5) - 0.3
  const C6 = W('lv05', 0) - 0.45
  const shots = [
    {
      // ouverture : écran partagé, papier en haut, téléphone en bas
      a: 0,
      b: C0,
      tr: 'liquid',
      render: t =>
        ready && (
          <AbsoluteFill>
            <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 960, overflow: 'hidden' }}>
              <ThreeCanvas width={1080} height={960} camera={{ fov: 30, near: 0.3, far: 40, position: [0, 0.4, 3.4] }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
                <color attach="background" args={['#000']} />
                <ambientLight intensity={0.05} />
                <PaperScene t={t} cam={[0.15 + Math.sin(t * 0.4) * 0.15, 0.45, 3.3]} />
                <RenderOnMount />
              </ThreeCanvas>
            </div>
            <div style={{ position: 'absolute', left: 0, top: 960, width: 1080, height: 960, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: -480, width: 1080, height: 1920 }}>
                <PhoneShot t={t} screen={tex('wallet')} rot={[0, -0.25 + Math.sin(t * 0.4) * 0.1, 0]} cam={[0.3, 0.2, 7.4]} look={[0, 0.1, 0]} rig={{ sweep: [0.4, 2.4], rimAt: 1.6 }} />
              </div>
            </div>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 958, height: 3, background: '#fff', boxShadow: '0 0 20px 4px rgba(255,255,255,0.7), 0 0 80px 20px rgba(41,151,255,0.35)' }} />
          </AbsoluteFill>
        ),
    },
    { a: C0, b: C1, tr: 'whip', render: t => ready && <PaperShot t={t} fall={pr(t, W('lv02', 2) - 0.1, W('lv02', 3) + 0.7, k => k * k)} cam={spline(t, [[C0, [0.3, 0.6, 3.6]], [C1 + 0.5, [0.1, 0.3, 4.2]]])} /> },
    {
      a: C1,
      b: C2,
      tr: 'whip',
      render: t =>
        ready && <PhoneShot t={t} screen={tex('wallet')} rot={[0, -0.2 + Math.sin(t * 0.5) * 0.06, 0]} cam={spline(t, [[C1, [-0.6, 0.2, 6.4]], [C2 + 0.6, [0.2, 0.2, 6.0]]])} look={[0, 0.12, 0]} rig={{ sweep: [C1 + 0.2, C1 + 1.8], rimAt: -1 }} />,
    },
    { a: C2, b: C3, tr: 'whip', render: t => ready && <PaperShot t={t} crumple={pr(t, W('lv03', 2) - 0.3, W('lv03', 2) + 0.9, easeInOut)} cam={spline(t, [[C2, [-0.3, 0.6, 3.8]], [C3 + 0.5, [0.2, 0.5, 3.4]]])} /> },
    {
      a: C3,
      b: C4,
      tr: 'whip',
      render: t => {
        const up = t >= W('lv03', 7)
        const glow = Math.max(0, 1 - Math.abs(t - W('lv03', 7)) * 3) * 0.5
        return ready && <PassShot t={t} map={tex(up ? 'pass-graphite-500' : 'pass-graphite')} back={tex('pass-back')} glow={glow} rot={[0.04, -0.3 + Math.sin(t * 0.6) * 0.12, 0]} cam={spline(t, [[C3, [0.6, 0.2, 5.2]], [C4 + 0.6, [-0.2, 0.2, 5.6]]])} look={[0, 0.2, 0]} rig={{ sweep: [W('lv03', 5) - 0.3, W('lv03', 8) + 0.2], rimAt: -1, z: 1 }} />
      },
    },
    { a: C4, b: C5, tr: 'iris', render: t => ready && <PaperShot t={t} crumple={1} dim={pr(t, W('lv04', 3), W('lv04', 4) + 0.4)} cam={spline(t, [[C4, [0.2, 0.7, 3.6]], [C5 + 0.6, [0, 0.9, 4.4]]])} /> },
    {
      a: C5,
      b: C6,
      tr: 'streak',
      render: t => {
        const at = W('lv04', 6) + 0.1
        return (
          ready && (
            <PhoneShot t={t} screen={tex(t >= at ? 'lock-campagne' : 'lock-vide')} glow={1 + Math.max(0, 1 - Math.abs(t - at) * 2.5) * 0.4} rot={[0.02, 0.15, 0]} cam={spline(t, [[C5, [-0.4, 0.35, 4.8]], [C6 + 0.6, [0.1, 0.4, 4.3]]])} look={[0, 0.42, 0]} rig={{ rimAt: -1 }}>
              <NotifDrop t={t} at={at} map={tex('notif-campagne')} />
            </PhoneShot>
          )
        )
      },
    },
    { a: C6, b: 99, render: t => <EndCard t={t} at={C6 + 0.3} dur={duree()} line="Fais revenir tes clients." /> },
  ]
  // « PAPIER » / « FIDELYZ » : quel camp est à l'écran
  const paper = [[C0, C1], [C2, C3], [C4, C5]]
  const digi = [[C1, C2], [C3, C4], [C5, C6]]
  const mark = (on, txt, color) => on.map(([a, b], i) => <Kicker key={txt + i} t={t} at={a + 0.25} out={b - 0.1} text={txt} top={172} color={color} />)
  const q = silk((t - W('lv04', 3)) / 0.6) * (1 - pr(t, C5 - 0.2, C5 + 0.2, easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Montage t={t} shots={shots} />
      {q > 0.001 && <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily, fontSize: 380, fontWeight: 150, color: '#fff', opacity: q * 0.9, filter: `blur(${(1 - q) * 20}px)`, textShadow: `0 0 50px ${WARM}` }}>?</div></AbsoluteFill>}
      <Finish t={t} />
      {t < C0 + 0.3 && (
        <>
          <Kicker t={t} at={0.4} out={C0 - 0.2} text="Papier" top={810} color={WARM} />
          <Kicker t={t} at={0.6} out={C0 - 0.2} text="Fidelyz" top={1010} color={ACCENT} />
        </>
      )}
      {mark(paper, 'Papier', WARM)}
      {mark(digi, 'Fidelyz', ACCENT)}
      <Line t={t} id="lv01" top={250} size={62} accent={[5]} blue={[8, 9]} />
      <Line t={t} id="lv02" top={260} size={70} to={3} out={C1 - 0.1} />
      <Line t={t} id="lv02" top={260} size={70} from={4} blue={[6]} />
      <Line t={t} id="lv03" top={260} size={68} to={2} out={C3 - 0.1} />
      <Line t={t} id="lv03" top={260} size={62} from={3} blue={[3]} accent={[5, 7, 8]} />
      <Line t={t} id="lv04" top={260} size={68} to={4} out={C5 - 0.1} />
      <Line t={t} id="lv04" top={250} size={60} from={5} blue={[5]} accent={[7, 8]} />
      <Sound set="lversus" son={son} />
    </AbsoluteFill>
  )
}
