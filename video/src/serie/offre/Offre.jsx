import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { spline } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, MUTED, Pass, Scrim, Shot, Sound, Stage, Sweep, W, clamp, easeInOut, mix, pr, silk, tex, usePreload } from '../kit'

/* 8. « Combien ça coûte ? » : le prix et l'appel à l'action.
   Le pass flotte derrière ; le prix défile jusqu'à 0 € sur « Zéro euro », puis la liste de ce qui est compris
   s'écrit ligne par ligne (offre gratuite du site : jusqu'à 15 clients, Apple et Google Wallet, sans engagement, 5 min). */

export const TEX_OFFRE = ['pass-graphite', 'pass-back']
const FIN = () => W('of05', 0) - 0.15
export const duree = () => END('of05') + 2.6

const Float = ({ t }) => {
  const dim = pr(t, W('of02', 0) - 0.3, W('of02', 0) + 0.5, easeInOut)
  return (
    <>
      <Cam pos={spline(t, [[0, [0.6, 0.2, 4.2]], [W('of02', 0), [0.2, 0.3, 5.2]], [FIN() + 1, [-0.4, 0.2, 6.4]]])} look={[0, mix(0.35, 0.6, dim), 0]} fov={30} />
      <Pass map={tex('pass-graphite')} back={tex('pass-back')} position={[mix(0, 0.55, dim), mix(0, -0.9, dim), -dim * 1.6]} rotation={[0.08, -0.35 + t * 0.12, 0.04]} />
    </>
  )
}

// Prix qui défile verticalement : 29 → 19 → 9 → 0
const STEPS = ['29', '19', '9', '0']
const Price = ({ t }) => {
  const a = W('of02', 0) - 0.55
  const roll = pr(t, a, a + 0.75, k => 1 - Math.pow(1 - k, 4))
  const k = silk((t - a + 0.4) / 0.6)
  const up = pr(t, W('of03', 0) - 0.3, W('of03', 0) + 0.6, easeInOut)
  const out = pr(t, FIN() - 0.4, FIN(), easeInOut)
  if (t < a - 0.4) return null
  const H = 360
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: mix(640, 330, up), display: 'flex', justifyContent: 'center', alignItems: 'baseline', fontFamily, opacity: k * (1 - out), transform: `scale(${mix(1, 0.62, up)})`, transformOrigin: '50% 0' }}>
      <div style={{ height: H, overflow: 'hidden', fontSize: H, fontWeight: 200, letterSpacing: '-0.06em', lineHeight: 1, color: INK }}>
        <div style={{ transform: `translateY(${-roll * (STEPS.length - 1) * H}px)`, filter: roll > 0 && roll < 1 ? `blur(${Math.sin(roll * Math.PI) * 6}px)` : undefined }}>
          {STEPS.map(s => (
            <div key={s} style={{ height: H, textAlign: 'right' }}>{s}</div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 140, fontWeight: 300, color: ACCENT, marginLeft: 16 }}>€</div>
    </div>
  )
}

const ROWS = [
  ['Jusqu’à 15 clients', () => W('of03', 2)],
  ['Apple & Google Wallet', () => W('of03', 4)],
  ['Sans engagement', () => W('of04', 0)],
  ['Prête en 5 minutes', () => W('of04', 4)],
]
const List = ({ t }) => {
  const out = pr(t, FIN() - 0.4, FIN(), easeInOut)
  return (
    <div style={{ position: 'absolute', left: 150, right: 150, top: 690, fontFamily, opacity: 1 - out }}>
      {ROWS.map(([label, at], i) => {
        const k = silk((t - at() + 0.1) / 0.55)
        if (k <= 0) return null
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 26, padding: '30px 0', borderTop: i ? '1px solid rgba(255,255,255,0.1)' : 'none', opacity: k, transform: `translateY(${(1 - k) * 22}px)`, filter: `blur(${(1 - k) * 8}px)` }}>
            <div style={{ width: 52, height: 52, borderRadius: 26, background: ACCENT, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, boxShadow: `0 0 26px rgba(41,151,255,${0.4 * k})` }}>✓</div>
            <div style={{ fontSize: 50, fontWeight: 550, letterSpacing: '-0.03em', color: INK }}>{label}</div>
          </div>
        )
      })}
    </div>
  )
}

export const Offre = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_OFFRE)
  const D = duree()
  const blur = pr(t, W('of02', 0) - 1.0, W('of02', 0) - 0.15, easeInOut)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot t={t} a={0} b={FIN()}>
        <Backdrop y={50} glow={mix(1, 0.6, blur)} />
        <AbsoluteFill style={{ filter: blur > 0.01 ? `blur(${blur * 18}px) brightness(${1 - blur * 0.5})` : undefined }}>
          {ready && <Stage><Float t={t} /></Stage>}
        </AbsoluteFill>
      </Shot>
      <Sweep t={t} at={W('of02', 0) - 0.2} dur={0.9} strength={0.15} />
      <Scrim k={0.8} />

      <Caption t={t} id="of01" top={250} size={70} accent={[1]} />
      <Price t={t} />
      <List t={t} />
      <Caption t={t} id="of03" top={1450} size={40} weight={500} color={MUTED} />
      <Caption t={t} id="of04" top={1450} size={40} weight={500} color={MUTED} out={FIN() - 0.3} />

      <EndCard t={t} at={FIN()} dur={D} line="Gratuit pour commencer." />
      <Finish t={t} />
      <Sound set="offre" son={son} />
    </AbsoluteFill>
  )
}
