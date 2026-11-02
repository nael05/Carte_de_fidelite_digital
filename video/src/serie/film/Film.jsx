import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { spline } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, MUTED, Pass, Phone, Plate, Scrim, Shot, Sound, Stage, Sweep, W, clamp, easeInOut, mix, pr, silk, tex, usePreload } from '../kit'

/* 3. « Fidelyz en 30 secondes » : le film produit, tout comprendre d'un coup.
   Plans : le pass sort de l'ombre → iPhone (Apple Wallet) et Android (Google Wallet) → « 0 application » →
   le pass change de couleur à chaque mot, puis on le scanne (+20) → la notification sur l'écran verrouillé → fin. */

export const TEX_FILM = ['pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory', 'pass-graphite-500', 'pass-back', 'wallet', 'lock-vide', 'lock-campagne', 'notif-campagne']
const C1 = () => W('fi02', 0) - 0.3
const C2 = () => W('fi03', 0) - 0.3
const C3 = () => W('fi04', 0) - 0.35
const C4 = () => W('fi06', 0) - 0.3
const FIN = () => W('fi07', 0) - 0.15
export const duree = () => END('fi07') + 2.2

// ─── 1. Le pass sort de l'ombre ──────────────────────────────
const Reveal = ({ t }) => {
  const k = silk(t / 3.6)
  return (
    <>
      <Cam pos={spline(t, [[0, [1.6, -0.3, 1.8]], [1.6, [0.9, 0.05, 3.2]], [C1() + 1, [0.1, 0.25, 5.3]]])} look={[0, 0.35, 0]} fov={30} />
      <Pass map={tex('pass-graphite')} back={tex('pass-back')} rotation={[mix(0.5, 0.06, k), mix(-1.25, -0.1, k), mix(0.2, 0, k)]} position={[0, mix(-0.25, 0.05, k), 0]} />
    </>
  )
}

// ─── 2. Apple Wallet, puis Google Wallet ─────────────────────
const Phones = ({ t }) => {
  const a = silk((t - C1()) / 1.4)
  const g = silk((t - W('fi02', 6) + 0.4) / 1.3)
  const pos = spline(t, [
    [C1(), [-0.8, 0.45, 5.6]],
    [W('fi02', 4), [-0.6, 0.45, 5.4]],
    [W('fi02', 6), [0.05, 0.45, 7.4]],
    [C2() + 0.8, [0.3, 0.45, 7.0]],
  ])
  const look = spline(t, [[C1(), [-0.6, 0.45, 0]], [W('fi02', 4), [-0.55, 0.45, 0]], [W('fi02', 6), [0, 0.45, 0]], [C2() + 0.8, [0.15, 0.45, 0]]])
  return (
    <>
      <Cam pos={pos} look={look} fov={30} />
      <Phone screen={tex('wallet')} body="#3a3a3c" position={[-0.58, mix(-2.4, 0, a), 0]} rotation={[0.04, mix(0.6, 0.12, a), 0]} />
      <Phone screen={tex('lock-vide')} glow={0.12} android body="#d4d0c8" position={[0.58, mix(-2.4, 0, g), -0.05]} rotation={[0.04, mix(-0.6, -0.12, g), 0]}>
        <Pass map={tex('pass-graphite')} scale={0.62} position={[0, 0.12, 0.08]} />
      </Phone>
    </>
  )
}

// ─── 4. Couleurs, puis le scan ───────────────────────────────
const SKINS = ['pass-graphite', 'pass-azur', 'pass-champagne', 'pass-ivory']
const Studio = ({ t }) => {
  const swaps = [W('fi04', 2), W('fi04', 3) + 0.25, W('fi04', 4) + 0.3] // « Tes couleurs. En cinq »
  let skin = 0
  swaps.forEach(s => (t >= s ? skin++ : 0))
  const scanAt = W('fi05', 1) // « scan »
  const scanned = t >= W('fi05', 6) // « points »
  const map = t >= W('fi05', 0) - 0.4 ? (scanned ? 'pass-graphite-500' : 'pass-graphite') : SKINS[skin]
  const spin = swaps.reduce((acc, s) => acc + pr(t, s - 0.35, s + 0.35, easeInOut), 0)
  const face = pr(t, W('fi05', 0) - 0.6, W('fi05', 0) + 0.3, easeInOut)
  const ry = Math.PI * 2 * spin + (Math.sin(t * 0.6) * 0.15 - 0.25) * (1 - face)
  const laser = pr(t, scanAt - 0.1, scanAt + 0.7, easeInOut)
  const pos = spline(t, [
    [C3(), [0.6, 0.0, 5.9]],
    [W('fi05', 0), [0.15, 0.1, 5.6]],
    [scanAt + 0.4, [0.05, -0.05, 5.0]],
    [C4() + 0.8, [0, 0.05, 5.4]],
  ])
  const look = spline(t, [[C3(), [0, 0.38, 0]], [W('fi05', 0), [0, 0.38, 0]], [scanAt + 0.4, [0, 0.25, 0]], [C4() + 0.8, [0, 0.35, 0]]])
  return (
    <>
      <Cam pos={pos} look={look} fov={30} />
      <Pass map={tex(map)} back={tex('pass-back')} rotation={[0.05 * (1 - face), ry, 0]} />
      {laser > 0 && laser < 1 && (
        <mesh position={[0, mix(-0.05, -0.62, laser), 0.03]}>
          <planeGeometry args={[0.7, 0.012]} />
          <meshBasicMaterial color={ACCENT} toneMapped={false} transparent opacity={Math.sin(laser * Math.PI)} />
        </mesh>
      )}
    </>
  )
}

// ─── 5. La notification ──────────────────────────────────────
const Notif = ({ t }) => {
  const drop = pr(t, W('fi06', 6) - 0.3, W('fi06', 7) + 0.1, easeInOut) // « notification, directement »
  const landed = t >= W('fi06', 7) + 0.1
  return (
    <>
      <Cam pos={spline(t, [[C4(), [-0.9, 0.2, 4.9]], [W('fi06', 6), [-0.3, 0.2, 4.4]], [FIN() + 0.8, [0.15, 0.25, 4.0]]])} look={[0, 0.42, 0]} fov={30} />
      <Phone screen={tex(landed ? 'lock-campagne' : 'lock-vide')} body="#3a3a3c" rotation={[0.04, mix(0.4, 0.1, silk((t - C4()) / 2.5)), 0]} />
      {!landed && drop > 0 && <Plate map={tex('notif-campagne')} w={0.93} h={0.205} r={0.05} position={[0, mix(1.6, 0.72, drop), mix(0.9, 0.08, drop)]} rotation={[mix(-0.5, 0, drop), 0, 0]} opacity={clamp(drop * 3)} />}
    </>
  )
}

// ─── 3. « 0 application » ────────────────────────────────────
const Zero = ({ t }) => {
  const k = silk((t - C2()) / 0.9)
  const z = silk((t - W('fi03', 0)) / 1.2)
  const out = pr(t, C3(), C3() + 0.7, easeInOut)
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', fontFamily, opacity: k * (1 - out) }}>
      <div style={{ fontSize: 560, fontWeight: 200, letterSpacing: '-0.06em', color: INK, lineHeight: 1, transform: `translateY(-60px) scale(${mix(1.12, 1, z)})`, filter: `blur(${(1 - z) * 20}px)`, backgroundImage: `linear-gradient(180deg, #ffffff 30%, ${ACCENT} 140%)`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>0</div>
    </AbsoluteFill>
  )
}

export const Film = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_FILM)
  const D = duree()
  const scanPop = silk((t - W('fi05', 6)) / 0.6) * (1 - pr(t, C4() - 0.3, C4(), easeInOut))
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot t={t} a={0} b={C1()}>
        <Backdrop y={48} glow={silk(t / 2)} />
        {ready && <Stage><Reveal t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C1()} b={C2()}>
        <Backdrop y={50} />
        {ready && <Stage><Phones t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C2()} b={C3()} zoom={0.02}>
        <Backdrop y={48} tint="20, 50, 90" glow={0.7} />
        <Zero t={t} />
      </Shot>
      <Shot t={t} a={C3()} b={C4()}>
        <Backdrop y={50} glow={1.1} />
        {ready && <Stage><Studio t={t} /></Stage>}
      </Shot>
      <Shot t={t} a={C4()} b={FIN()}>
        <Backdrop y={52} />
        {ready && <Stage><Notif t={t} /></Stage>}
      </Shot>
      {[W('fi04', 2), W('fi04', 3) + 0.25, W('fi04', 4) + 0.3].map(s => <Sweep key={s} t={t} at={s - 0.4} dur={0.8} strength={0.16} />)}
      <Scrim k={0.85} />

      <Caption t={t} id="fi01" top={240} size={66} accent={[8, 9]} />
      <Caption t={t} id="fi02" top={240} size={64} accent={[3, 4, 7, 8]} />
      <Caption t={t} id="fi03" top={1240} size={64} accent={[]} />
      <Caption t={t} id="fi04" top={240} size={66} accent={[3]} />
      <Caption t={t} id="fi05" top={240} size={64} accent={[6, 7]} />
      <Caption t={t} id="fi06" top={230} size={60} accent={[6]} out={FIN() - 0.2} />
      {scanPop > 0.001 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 440, display: 'flex', justifyContent: 'center', opacity: scanPop, transform: `translateY(${(1 - scanPop) * 24}px) scale(${mix(0.9, 1, scanPop)})` }}>
          <div style={{ fontFamily, fontSize: 40, fontWeight: 650, color: INK, padding: '18px 36px', borderRadius: 999, background: 'rgba(28,28,30,0.75)', border: '1px solid rgba(255,255,255,0.12)' }}>
            <span style={{ color: ACCENT }}>+20</span> points <span style={{ color: MUTED, fontWeight: 500 }}>· 500 pts</span>
          </div>
        </div>
      )}

      <EndCard t={t} at={FIN()} dur={D} line="Gratuit pour commencer." />
      <Finish t={t} />
      <Sound set="film" son={son} />
    </AbsoluteFill>
  )
}
