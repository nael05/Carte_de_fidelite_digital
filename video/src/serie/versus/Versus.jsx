import * as THREE from 'three'
import { ThreeCanvas } from '@remotion/three'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { RenderOnMount, usePaperGeometry } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, MUTED, Pass, Plate, Sound, Stage, Studio, Sweep, W, clamp, easeInOut, mix, pr, silk, tex, usePreload } from '../kit'

/* 4. « Papier ou téléphone ? » : écran coupé en deux, trois manches.
   En haut la carte papier (elle part, elle se froisse, elle ne dit rien), en bas le pass (toujours là, à jour, il parle).
   À la fin, la moitié papier s'éteint et le pass prend tout l'écran. */

export const TEX_VERSUS = ['papier', 'pass-graphite', 'pass-graphite-500', 'pass-back', 'notif-campagne']
const SEAM = 960
const FIN = () => END('vs05') + 0.35
export const duree = () => FIN() + 2.6
const EXPAND = () => W('vs05', 0) - 0.5

// ─── Moitié haute : la carte papier ──────────────────────────
const Paper = ({ t }) => {
  const lost = pr(t, W('vs02', 2), W('vs02', 3) + 0.6, k => k * k) // « se perd » : elle s'envole
  const back = silk((t - W('vs03', 0) + 0.2) / 0.8) // elle revient…
  const crumple = pr(t, W('vs03', 2) - 0.1, W('vs03', 2) + 0.9, easeInOut) // … et se froisse sur « s'abîme »
  const geo = usePaperGeometry(1.7, 1.1, 0.25 + crumple * 1.6, 7)
  const gone = t < W('vs03', 0) - 0.2 ? lost : 1 - back
  const dim = pr(t, W('vs04', 4), W('vs04', 6) + 0.5)
  const c = mix(1, 0.72, crumple) * mix(1, 0.6, dim)
  return (
    <group position={[gone * 2.6, gone * 0.6, -gone * 1.2]} rotation={[-0.35 + gone * 0.8, 0.15 + gone * 1.4, 0.05 + gone * 0.9 + Math.sin(t * 0.5) * 0.02]}>
      <mesh geometry={geo}>
        <meshStandardMaterial map={tex('papier')} roughness={0.92} envMapIntensity={0.25} color={new THREE.Color(c, c * 0.96, c * 0.9)} side={THREE.DoubleSide} transparent opacity={1 - gone * 0.8} />
      </mesh>
    </group>
  )
}

// ─── Moitié basse : le pass ──────────────────────────────────
const Digital = ({ t }) => {
  const swap = t >= W('vs03', 8) // « toujours à jour »
  const talk = pr(t, W('vs04', 13) - 0.2, W('vs04', 14) + 0.3, easeInOut) // « tu leur parles »
  const ex = pr(t, EXPAND(), EXPAND() + 1.4, easeInOut)
  const pos = [mix(0.4, 0.1, ex), mix(1.45, 0.35, ex), mix(8.6, 6.6, ex)]
  return (
    <>
      <Cam pos={pos} look={[0, mix(1.32, 0.35, ex), 0]} fov={30} />
      <Pass map={tex(swap ? 'pass-graphite-500' : 'pass-graphite')} back={tex('pass-back')} rotation={[0.04, -0.2 + Math.sin(t * 0.45) * 0.18, 0]} position={[0, 0, 0]} />
      {talk > 0 && <Plate map={tex('notif-campagne')} w={1.35} h={0.3} r={0.07} position={[mix(0.9, 0.15, talk), mix(1.3, 0.55, talk), mix(1.2, 0.45, talk)]} rotation={[0, -0.15, 0]} opacity={clamp(talk * 2)} />}
    </>
  )
}

// Marque de manche : ✕ gris en haut, ✓ bleu en bas
const Mark = ({ t, at, good, top }) => {
  const k = silk((t - at) / 0.5)
  const o = pr(t, EXPAND() - 0.4, EXPAND(), easeInOut)
  if (k <= 0) return null
  return (
    <div style={{ position: 'absolute', left: 64, top, width: 64, height: 64, borderRadius: 32, display: 'grid', placeItems: 'center', fontFamily, fontSize: 36, fontWeight: 700, color: good ? '#fff' : MUTED, background: good ? ACCENT : 'rgba(255,255,255,0.08)', border: good ? 'none' : '1px solid rgba(255,255,255,0.18)', opacity: k * (1 - o), transform: `scale(${mix(0.6, 1, k)})`, boxShadow: good ? `0 0 30px rgba(41,151,255,${0.45 * k})` : undefined }}>
      {good ? '✓' : '✕'}
    </div>
  )
}

const Label = ({ t, text, top, color, out }) => {
  const k = silk((t - 0.3) / 0.8) * (1 - pr(t, out, out + 0.5, easeInOut))
  return <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily, fontSize: 24, fontWeight: 600, letterSpacing: '0.34em', color, opacity: k }}>{text}</div>
}

export const Versus = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_VERSUS)
  const D = duree()
  const ex = pr(t, EXPAND(), EXPAND() + 1.4, easeInOut)
  const topK = 1 - ex
  const R = [W('vs02', 3), W('vs02', 6), W('vs03', 2), W('vs03', 6), W('vs04', 6), W('vs04', 14)]
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {/* moitié basse (canevas plein écran, découpé) */}
      <AbsoluteFill style={{ clipPath: `inset(${SEAM * topK}px 0 0 0)` }}>
        <Backdrop y={mix(74, 50, ex)} glow={0.9} />
        {ready && (
          <Stage>
            <Digital t={t} />
          </Stage>
        )}
      </AbsoluteFill>
      {/* moitié haute */}
      {topK > 0.001 && (
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: SEAM, overflow: 'hidden', opacity: topK, filter: ex > 0.01 ? `blur(${ex * 14}px)` : undefined }}>
          <AbsoluteFill style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 52%, rgba(70,54,38,0.55) 0%, rgba(0,0,0,0) 75%), #000' }} />
          {ready && (
            <ThreeCanvas width={1080} height={SEAM} camera={{ fov: 30, near: 0.4, far: 40, position: [0, 0.3, 3.3] }} gl={{ antialias: true, alpha: true }}>
              <Studio warm />
              <Cam pos={[0.15 + Math.sin(t * 0.3) * 0.1, 0.55, 3.35]} look={[0, 0.02, 0]} fov={30} />
              <spotLight position={[0.6, 2.2, 2.2]} angle={0.5} penumbra={0.9} intensity={10} decay={1.2} color="#ffe9d2" />
              <Paper t={t} />
              <RenderOnMount />
            </ThreeCanvas>
          )}
          {/* « ? » : le papier ne dit rien de tes clients */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontFamily, fontSize: 300, fontWeight: 200, color: INK, opacity: silk((t - W('vs04', 6)) / 0.6) * 0.85, filter: `blur(${(1 - silk((t - W('vs04', 6)) / 0.6)) * 16}px)` }}>?</div>
        </div>
      )}
      {/* couture */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: SEAM * topK, height: 1, background: `rgba(255,255,255,${0.18 * topK})` }} />
      <Label t={t} text="PAPIER" top={150} color={MUTED} out={EXPAND() - 0.4} />
      <Label t={t} text="FIDELYZ" top={SEAM + 40} color={ACCENT} out={EXPAND() - 0.4} />

      {/* légendes : la phrase « papier » au-dessus de la couture, la phrase « Fidelyz » en dessous */}
      <Caption t={t} id="vs01" top={SEAM - 110} size={60} style={{ background: 'rgba(0,0,0,0.0)' }} />
      <Caption t={t} id="vs02" top={undefined} size={56} to={3} out={END('vs02') + 0.2} style={{ top: 'auto', bottom: 1920 - SEAM + 40 }} />
      <Caption t={t} id="vs02" top={SEAM + 95} size={56} from={4} accent={[6]} out={END('vs02') + 0.2} />
      <Caption t={t} id="vs03" top={undefined} size={56} to={2} out={END('vs03') + 0.2} style={{ top: 'auto', bottom: 1920 - SEAM + 40 }} />
      <Caption t={t} id="vs03" top={SEAM + 95} size={56} from={3} accent={[6, 8, 9, 10]} out={END('vs03') + 0.2} />
      <Caption t={t} id="vs04" top={undefined} size={52} to={9} out={END('vs04') + 0.2} style={{ top: 'auto', bottom: 1920 - SEAM + 40 }} />
      <Caption t={t} id="vs04" top={SEAM + 95} size={52} from={10} accent={[11, 14]} out={END('vs04') + 0.2} />
      <Caption t={t} id="vs05" top={250} size={76} accent={[3, 4]} out={FIN()} />

      {R.map((at, i) => <Mark key={i} t={t} at={at} good={i % 2 === 1} top={i % 2 ? SEAM + 20 : 128} />)}
      <Sweep t={t} at={W('vs03', 8) - 0.35} dur={0.8} strength={0.14} />

      <EndCard t={t} at={FIN()} dur={D} line="Fais revenir tes clients." />
      <Finish t={t} />
      <Sound set="versus" son={son} />
    </AbsoluteFill>
  )
}
