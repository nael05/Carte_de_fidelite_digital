import * as THREE from 'three'
import { useMemo } from 'react'
import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { Particles, burnShader, rnd, spline, usePaperGeometry } from '../../tt/kit3d'
import { ACCENT, Backdrop, Scrim, Cam, Caption, END, EndCard, Finish, INK, MUTED, Pass, Phone, Shot, Sound, Stage, Sweep, W, clamp, easeInOut, mix, pr, silk, tex, usePreload } from '../kit'

/* 1. « La carte perdue » : une situation que tout commerçant connaît, puis la carte qui ne se perd plus.
   Plans : macro sur la carte papier → elle se désagrège en poussière → le téléphone monte de l'ombre → le pass en sort → récompense. */

export const TEX_PERDUE = ['papier', 'wallet', 'pass-graphite', 'pass-graphite-500', 'pass-back']
const T_FIN = () => W('pa07', 0) - 0.15
export const duree = () => END('pa07') + 2.2

// ─── Plan A + B : la carte papier, puis sa disparition ────────
const Paper = ({ t, burn }) => {
  const geo = usePaperGeometry(1.7, 1.1, 0.35, 3)
  const uniforms = useMemo(() => ({ uBurn: { value: 0 }, uEdge: { value: new THREE.Color('#ffc890') } }), [])
  uniforms.uBurn.value = burn
  const ob = useMemo(() => burnShader(uniforms), [uniforms])
  const map = tex('papier')
  // la carte respire à peine, puis s'éloigne en tournant pendant qu'elle disparaît
  const k = pr(t, W('pa03', 0), END('pa03') + 0.5, easeInOut)
  return (
    <group position={[0, mix(-0.1, 0.1, k), mix(0, -0.6, k)]} rotation={[mix(-0.85, -0.2, k), mix(0.1, -0.25, k), mix(0.06, 0.12, k)]}>
      <mesh geometry={geo}>
        <meshStandardMaterial map={map} roughness={0.92} metalness={0} envMapIntensity={0.18} side={THREE.DoubleSide} onBeforeCompile={ob} customProgramCacheKey={() => 'burn-papier'} />
      </mesh>
    </group>
  )
}

const Dust = ({ t, burn }) => {
  const t0 = W('pa03', 0)
  return (
    <Particles
      count={900}
      size={0.012}
      color="#ffd9b0"
      fn={(i, o) => {
        const u = rnd(i * 1.3)
        const v = rnd(i * 2.7 + 4)
        // instant où le front de combustion passe sur ce point (même loi que le shader, bruit moyen)
        const release = 0.45 * (1 - v) + 0.7 * (0.35 + 0.3 * rnd(i * 5.1))
        const age = (burn - release) * 2.4
        if (age <= 0 || t < t0) {
          o[4] = 0
          return
        }
        const k = pr(t, t0, END('pa03') + 0.5, easeInOut)
        const x0 = (u - 0.5) * 1.7
        const y0 = (v - 0.5) * 1.1 + mix(0, 0.15, k)
        o[0] = x0 + age * (0.25 + rnd(i * 7) * 0.5) + Math.sin(age * 3 + i) * 0.04
        o[1] = y0 + age * (0.35 + rnd(i * 9) * 0.5)
        o[2] = mix(0, -0.6, k) + age * (rnd(i * 11) - 0.3) * 0.8
        o[3] = 0.6 + rnd(i * 13) * 1.4
        o[4] = clamp(1 - age / 2.2) * (age < 0.1 ? age * 10 : 1) * 0.8
      }}
    />
  )
}

const PaperScene = ({ t }) => {
  const burn = mix(-0.05, 1.3, pr(t, W('pa03', 2), END('pa03') + 0.2, k => k * k * (3 - 2 * k)))
  // caméra : rasante sur les tampons, puis recule ; sur « qu'un » elle glisse vers la case vide
  const pos = spline(t, [
    [0, [-0.75, 0.35, 2.3]],
    [2.2, [-0.45, 0.3, 2.0]],
    [W('pa02', 4), [0.2, 0.15, 1.75]],
    [END('pa02') + 0.3, [0.45, 0.05, 1.45]],
    [W('pa03', 2), [0.1, 0.1, 2.9]],
    [END('pa03') + 1, [0, 0.1, 3.8]],
  ])
  const look = spline(t, [
    [0, [-0.35, 0.22, 0]],
    [2.2, [-0.15, 0.15, 0]],
    [W('pa02', 4), [0.35, -0.3, 0]],
    [END('pa02') + 0.3, [0.55, -0.32, 0]],
    [W('pa03', 2), [0, -0.05, 0]],
  ])
  return (
    <>
      <Cam pos={pos} look={look} fov={32} />
      <spotLight position={[0.8, 2.2, 2.2]} angle={0.42} penumbra={0.9} intensity={14} decay={1.2} color="#ffe9d2" />
      <Paper t={t} burn={burn} />
      <Dust t={t} burn={burn} />
    </>
  )
}

// ─── Plan C : le téléphone, puis le pass qui en sort ──────────
const PhoneScene = ({ t }) => {
  const t0 = W('pa04', 0) - 0.35
  const rise = silk((t - t0) / 1.9)
  const on = pr(t, W('pa04', 2), W('pa04', 4) + 0.3)
  const out = pr(t, W('pa05', 0) - 0.2, W('pa05', 0) + 1.3, easeInOut) // le pass sort du téléphone
  const back = pr(t, W('pa05', 0), W('pa05', 0) + 1.4, easeInOut) // le téléphone recule
  const swap = t >= W('pa06', 2) - 0.05 // 500 points
  const turn = pr(t, W('pa06', 0) - 0.4, W('pa06', 2), easeInOut)
  const sway = Math.sin((t - W('pa05', 0)) * 0.7) * 0.12 * clamp(out * 2 - 1)
  const pos = spline(t, [
    [t0, [0.9, -0.6, 5.4]],
    [W('pa04', 7), [0.35, 0.05, 5.0]],
    [W('pa05', 0), [0.25, 0.15, 5.0]],
    [W('pa05', 0) + 1.5, [-0.45, 0.35, 6.6]],
    [W('pa06', 0), [0.3, 0.45, 5.9]],
    [END('pa06') + 0.6, [0.05, 0.45, 5.5]],
  ])
  const look = spline(t, [
    [t0, [0, 0.1, 0]],
    [W('pa04', 7), [0, 0.15, 0]],
    [W('pa05', 0) + 1.5, [0, 0.62, 1.1]],
    [END('pa06') + 0.6, [0, 0.62, 1.15]],
  ])
  return (
    <>
      <Cam pos={pos} look={look} fov={30} />
      <Phone
        screen={tex('wallet')}
        glow={on * mix(1, 0.35, back)}
        body="#3a3a3c"
        position={[0, mix(-3.2, 0, rise) - back * 0.9, -back * 0.9]}
        rotation={[mix(0.35, 0.05, rise) + back * 0.2, mix(-0.9, -0.12, rise) + back * 0.25, mix(0.12, 0, rise)]}
      />
      {out > 0.001 && (
        <Pass
          map={tex(swap ? 'pass-graphite-500' : 'pass-graphite')}
          back={tex('pass-back')}
          scale={mix(0.55, 0.92, out)}
          position={[0, mix(-0.1, 0.55, out), mix(0.12, 1.15, out)]}
          rotation={[mix(-0.25, 0.04, out) + Math.sin(t * 0.8) * 0.02, sway + mix(0, -0.1, turn) + Math.PI * 2 * turn, 0]}
        />
      )}
    </>
  )
}

export const CartePerdue = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_PERDUE)
  const D = duree()
  const cut = W('pa04', 0) - 0.5
  const reward = silk((t - W('pa06', 2) - 0.25) / 0.7) * (1 - pr(t, T_FIN() - 0.3, T_FIN(), easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot t={t} a={0} b={cut} outT={0.9}>
        <Backdrop y={50} tint="60, 46, 34" glow={1 - pr(t, W('pa03', 3), END('pa03'), easeInOut) * 0.7} />
        {ready && (
          <Stage warm>
            <PaperScene t={t} />
          </Stage>
        )}
      </Shot>
      <Shot t={t} a={cut} b={T_FIN()} inT={1.4} zoom={0.02}>
        <Backdrop y={52} glow={pr(t, cut, cut + 2)} />
        {ready && (
          <Stage>
            <PhoneScene t={t} />
          </Stage>
        )}
      </Shot>
      <Scrim />
      <Sweep t={t} at={W('pa06', 2) - 0.35} dur={0.9} strength={0.22} />

      {/* Légendes */}
      <Caption t={t} id="pa01" top={300} size={92} weight={600} tokens={['« J’ai', 'perdu', 'ma', 'carte. »']} out={END('pa01') + 0.45} />
      <Caption t={t} id="pa02" top={300} size={66} accent={[5]} />
      <Caption t={t} id="pa03" top={1150} size={64} from={0} accent={[]} style={{ color: INK }} />
      <Caption t={t} id="pa04" top={230} size={64} accent={[1]} />
      <Caption t={t} id="pa05" top={230} size={64} />
      <Caption t={t} id="pa06" top={230} size={62} accent={[2]} out={T_FIN() - 0.2} />
      {reward > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1460, display: 'flex', justifyContent: 'center', opacity: reward, transform: `translateY(${(1 - reward) * 20}px)`, filter: `blur(${(1 - reward) * 8}px)` }}>
          <div style={{ fontFamily, fontSize: 36, fontWeight: 600, color: INK, padding: '18px 34px', borderRadius: 999, background: 'rgba(28,28,30,0.72)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ width: 14, height: 14, borderRadius: 7, background: ACCENT, boxShadow: `0 0 18px ${ACCENT}` }} />
            Récompense débloquée <span style={{ color: MUTED, fontWeight: 500 }}>· café offert</span>
          </div>
        </div>
      )}

      <EndCard t={t} at={T_FIN()} dur={D} line="Fais revenir tes clients." />
      <Finish t={t} />
      <Sound set="perdue" son={son} />
    </AbsoluteFill>
  )
}
