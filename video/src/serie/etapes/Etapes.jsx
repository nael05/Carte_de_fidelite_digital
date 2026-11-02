import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { spline } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, Kicker, MUTED, Pass, Phone, Plate, Scrim, Shot, Sound, Stage, Sweep, W, clamp, easeInOut, mix, pr, screenTex, silk, tex, usePreload } from '../kit'

/* 5. « Trois étapes » : la démonstration, sur les vrais écrans du tableau de bord (public/explication/ecrans).
   Plans : les trois écrans en éventail → 1. « Ma carte », les couleurs changent, le pass suit → 2. la plaque QR en caisse,
   la page d'inscription, la carte entre dans le Wallet → 3. la page « Caisse », +20 → 5 min, 0 €, 15 clients → fin. */

export const TEX_ETAPES = [
  'ecran:design-graphite', 'ecran:design-azur', 'ecran:design-champagne', 'ecran:design-ivory', 'ecran:join-filled', 'ecran:caisse-points20', 'ecran:caisse-done',
  'pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory', 'pass-back', 'qr', 'wallet',
]
const C1 = () => W('et02', 0) - 0.35
const C2 = () => W('et03', 0) - 0.35
const C3 = () => W('et04', 0) - 0.35
const C4 = () => W('et05', 0) - 0.35
const FIN = () => W('et06', 0) - 0.2
export const duree = () => END('et06') + 2.4

// ─── 0. Les trois écrans en éventail ─────────────────────────
const Fan = ({ t }) => {
  const k = (i) => silk((t - 0.2 - i * 0.25) / 1.4)
  const scr = [screenTex('ecran:design-graphite', 0, 'fan'), screenTex('ecran:join-filled', 0, 'fan'), screenTex('ecran:caisse-points20', 0, 'fan')]
  return (
    <>
      <Cam pos={spline(t, [[0, [0.3, -0.2, 8.2]], [C1() + 1, [-0.2, 0.15, 7.2]]])} look={[0, 0.5, 0]} fov={30} />
      {[-1, 0, 1].map((x, i) => (
        <Phone key={i} screen={scr[i]} body={i === 1 ? '#3a3a3c' : '#bdb7ad'} position={[x * mix(0.2, 1.08, k(i)), mix(-2.6, 0, k(i)) - Math.abs(x) * 0.12, -Math.abs(x) * 0.35]} rotation={[0.05, -x * 0.32, x * -0.04]} />
      ))}
    </>
  )
}

// ─── 1. Ma carte : logo et couleurs ──────────────────────────
const SKINS = ['graphite', 'azur', 'champagne', 'ivory']
const Design = ({ t }) => {
  const swaps = [W('et02', 7), W('et02', 8), W('et02', 9) - 0.05]
  let i = 0
  swaps.forEach(s => (t >= s ? i++ : 0))
  const skin = SKINS[i]
  const p = silk((t - C1()) / 1.6)
  const scroll = mix(0, 220, silk((t - C1()) / 3))
  const spin = swaps.reduce((a, s) => a + pr(t, s - 0.3, s + 0.3, easeInOut), 0)
  return (
    <>
      <Cam pos={spline(t, [[C1(), [0.8, 0.2, 6.6]], [C2() + 0.8, [0.25, 0.3, 6.0]]])} look={[0.1, 0.45, 0]} fov={30} />
      <Phone screen={screenTex(`ecran:design-${skin}`, scroll, 'd')} body="#bdb7ad" position={[-0.4, mix(-2.4, 0, p), 0]} rotation={[0.04, 0.3, 0]} />
      <Pass map={tex(`pass-${skin}`)} back={tex('pass-back')} scale={0.62} position={[0.62, mix(-1.6, -0.12, silk((t - C1() - 0.4) / 1.6)), 0.55]} rotation={[0.05, -0.3 + Math.PI * 2 * spin, 0.02]} />
    </>
  )
}

// ─── 2. QR code, inscription, Wallet ─────────────────────────
const Join = ({ t }) => {
  const plaque = silk((t - C2()) / 1.4)
  const phoneIn = silk((t - W('et03', 8)) / 1.3) // « Tes clients »
  const added = t >= W('et03', 12) + 0.15 // « ajoutent »
  const fly = pr(t, W('et03', 12) - 0.3, W('et03', 14) + 0.2, easeInOut)
  return (
    <>
      <Cam pos={spline(t, [[C2(), [-1.0, 0.3, 6.6]], [W('et03', 8), [-0.5, 0.35, 6.8]], [W('et03', 12), [0.3, 0.4, 6.4]], [C3() + 0.8, [0.45, 0.45, 6.1]]])} look={spline(t, [[C2(), [-0.5, 0.35, 0]], [W('et03', 8), [-0.2, 0.4, 0]], [W('et03', 12), [0.3, 0.45, 0]]])} fov={30} />
      {/* plaque de caisse : socle et cadre */}
      <group position={[-0.55, mix(-2.5, 0.05, plaque), -0.6]} rotation={[0, 0.35, 0]}>
        <mesh position={[0, 0, -0.03]}>
          <boxGeometry args={[1.32, 1.62, 0.05]} />
          <meshPhysicalMaterial color="#1c1c1e" metalness={0.6} roughness={0.3} clearcoat={1} />
        </mesh>
        <Plate map={tex('qr')} w={1.22} h={1.52} r={0.04} position={[0, 0, 0.0]} />
      </group>
      <Phone screen={added ? tex('wallet') : screenTex('ecran:join-filled', 900, 'j')} body="#3a3a3c" position={[0.45, mix(-2.8, -0.05, phoneIn), 0.4]} rotation={[0.05, -0.28, 0]} />
      {fly > 0 && fly < 1 && <Pass map={tex('pass-graphite')} scale={mix(0.6, 0.3, fly)} position={[mix(1.2, 0.45, fly), mix(1.4, -0.2, fly), mix(1.2, 0.48, fly)]} rotation={[0, mix(-1.2, -0.28, fly), 0]} />}
    </>
  )
}

// ─── 3. La caisse ────────────────────────────────────────────
const Caisse = ({ t }) => {
  const p = silk((t - C3()) / 1.4)
  const done = t >= W('et04', 8) // « points »
  return (
    <>
      <Cam pos={spline(t, [[C3(), [0.9, -0.1, 5.4]], [C4() + 0.8, [0.2, 0.2, 4.8]]])} look={[0, 0.42, 0]} fov={30} />
      <Phone screen={screenTex(done ? 'ecran:caisse-done' : 'ecran:caisse-points20', 0, 'c')} body="#bdb7ad" position={[0, mix(-2.4, 0, p), 0]} rotation={[0.05, mix(-0.5, -0.12, p), 0]} />
    </>
  )
}

// ─── 4. Les chiffres ─────────────────────────────────────────
const Figure = ({ t, at, big, unit, label, top }) => {
  const k = silk((t - at) / 0.7)
  const o = pr(t, FIN() - 0.3, FIN() + 0.2, easeInOut)
  if (k <= 0) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily, opacity: k * (1 - o), filter: `blur(${(1 - k) * 14}px)`, transform: `translateY(${(1 - k) * 30}px)` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{ fontSize: 230, fontWeight: 200, letterSpacing: '-0.06em', color: INK, lineHeight: 1 }}>{big}</span>
        <span style={{ fontSize: 76, fontWeight: 500, letterSpacing: '-0.03em', color: ACCENT }}>{unit}</span>
      </div>
      <div style={{ fontSize: 36, fontWeight: 500, color: MUTED, marginTop: 8 }}>{label}</div>
    </div>
  )
}

export const Etapes = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_ETAPES)
  const D = duree()
  const plus = silk((t - W('et04', 8)) / 0.6) * (1 - pr(t, C4() - 0.3, C4(), easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot t={t} a={0} b={C1()}>
        <Backdrop y={52} glow={silk(t / 1.5)} />
        {ready && <Stage><Fan t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C1()} b={C2()}>
        <Backdrop y={52} tint="44, 44, 52" />
        {ready && <Stage><Design t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C2()} b={C3()}>
        <Backdrop y={52} />
        {ready && <Stage><Join t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C3()} b={C4()}>
        <Backdrop y={50} tint="44, 44, 52" />
        {ready && <Stage><Caisse t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C4()} b={FIN()} zoom={0.02}>
        <Backdrop y={48} tint="20, 50, 90" glow={0.6} />
      </Shot>
      {[W('et02', 7), W('et02', 8), W('et02', 9) - 0.05].map(s => <Sweep key={s} t={t} at={s - 0.4} dur={0.8} strength={0.14} />)}
      <Scrim k={0.9} />

      <Kicker t={t} at={0.25} out={C1() - 0.4} text="En trois étapes" top={170} />
      <Kicker t={t} at={C1() + 0.1} out={C2() - 0.3} text="Étape 1" top={170} color={ACCENT} />
      <Kicker t={t} at={C2() + 0.1} out={C3() - 0.3} text="Étape 2" top={170} color={ACCENT} />
      <Kicker t={t} at={C3() + 0.1} out={C4() - 0.3} text="Étape 3" top={170} color={ACCENT} />
      <Caption t={t} id="et01" top={250} size={64} accent={[5, 6]} />
      <Caption t={t} id="et02" top={250} size={60} from={1} accent={[4, 9]} />
      <Caption t={t} id="et03" top={250} size={56} from={1} to={7} accent={[4, 5]} out={W('et03', 8) - 0.15} />
      <Caption t={t} id="et03" top={250} size={56} from={8} accent={[12, 13, 14]} />
      <Caption t={t} id="et04" top={250} size={60} from={1} accent={[8, 9]} />
      <Caption t={t} id="et05" top={250} size={60} accent={[2, 3, 4]} out={FIN() - 0.2} />
      {plus > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 420, textAlign: 'center', fontFamily, fontSize: 40, fontWeight: 650, color: INK, opacity: plus, transform: `translateY(${(1 - plus) * 20}px)` }}>
          <span style={{ color: ACCENT }}>+20 points</span> pour Camille
        </div>
      )}
      <Figure t={t} at={W('et05', 2) - 0.1} big="5" unit="min" label="pour tout mettre en place" top={560} />
      <Figure t={t} at={W('et05', 4) - 0.1} big="0" unit="€" label="jusqu’à 15 clients" top={990} />

      <EndCard t={t} at={FIN()} dur={D} line="Fais revenir tes clients." />
      <Finish t={t} />
      <Sound set="etapes" son={son} />
    </AbsoluteFill>
  )
}
