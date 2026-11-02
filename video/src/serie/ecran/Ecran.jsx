import { AbsoluteFill } from 'remotion'
import { fontFamily, useT } from '../../lib'
import { spline } from '../../tt/kit3d'
import { ACCENT, Backdrop, Cam, Caption, END, EndCard, Finish, INK, MUTED, Phone, Plate, Scrim, Shot, Sound, Stage, Sweep, W, clamp, easeInOut, mix, pr, screenTex, silk, tex, usePreload } from '../kit'

/* 2. « L'écran de verrouillage » : la notification push, la fonction qui étonne.
   Plans : le téléphone du client s'allume → la vraie page « Campagnes » (téléphone du commerçant) → la notification tombe
   sur l'écran verrouillé → recul : 49 téléphones s'allument en vague → « Pas de SMS, pas d'email » → fin. */

export const TEX_ECRAN = ['lock-vide', 'lock-campagne', 'notif-campagne', 'ecran:campaigns', 'ecran:campaigns-filled', 'ecran:campaigns-sent']
const FIN = () => W('ec06', 0) - 0.15
export const duree = () => END('ec06') + 2.2
const B1 = () => W('ec03', 0) - 0.35 // coupe vers le téléphone du commerçant
const B2 = () => W('ec04', 0) - 0.45 // retour sur le client

// ─── Plan A et C : le téléphone du client, puis la foule de téléphones ───
const COLS = 7
const ROWS = 7
const SX = 1.3
const SY = 2.35
const Crowd = ({ t }) => {
  const wave = W('ec04', 5) - 0.2 // « tous »
  const phones = []
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const x = c - (COLS - 1) / 2
      const y = r - (ROWS - 1) / 2
      if (x === 0 && y === 0) continue
      const d = Math.hypot(x, y * 1.2)
      const on = pr(t, wave + d * 0.14, wave + d * 0.14 + 0.35)
      phones.push(
        <Phone key={`${r}-${c}`} screen={tex(on > 0.5 ? 'lock-campagne' : 'lock-vide')} glow={mix(0.08, 1, on)} body="#2c2c2e" position={[x * SX, y * SY, -Math.abs(Math.sin(x * 1.7 + y)) * 0.6]} rotation={[0, 0, (((x * 3 + y * 5) % 3) - 1) * 0.03]} />
      )
    }
  return <group>{phones}</group>
}

const ClientScene = ({ t, part }) => {
  const wake = pr(t, W('ec02', 1) - 0.2, W('ec02', 1) + 0.5) // « écran »
  const drop = pr(t, W('ec04', 1), W('ec04', 3), easeInOut) // la notification tombe sur « s'affiche ici »
  const landed = t > W('ec04', 3)
  const crowd = t > W('ec04', 4) - 0.6
  const pos =
    part === 'A'
      ? spline(t, [
          [0, [-1.3, -0.6, 4.6]],
          [W('ec01', 5), [-0.8, -0.3, 4.4]],
          [W('ec02', 1), [-0.3, -0.05, 4.2]],
          [B1() + 1, [-0.1, 0, 3.9]],
        ])
      : spline(t, [
          [B2(), [0.5, 0.1, 4.6]],
          [W('ec04', 3), [0.15, 0.05, 4.2]],
          [W('ec04', 4), [0.1, 0, 4.6]],
          [W('ec04', 8), [0.4, -0.6, 13.5]],
          [END('ec05') + 1, [0.2, -1.4, 17]],
        ])
  const look = part === 'A' ? [0, 0.42, 0] : spline(t, [[B2(), [0, 0.4, 0]], [W('ec04', 4), [0, 0.3, 0]], [W('ec04', 8), [0, -0.5, 0]], [END('ec05') + 1, [0, -0.8, 0]]])
  const lock = part === 'A' ? 'lock-vide' : landed ? 'lock-campagne' : 'lock-vide'
  return (
    <>
      <Cam pos={pos} look={look} fov={30} />
      <Phone screen={tex(lock)} glow={part === 'A' ? mix(0.04, 1, wake) : 1} body="#3a3a3c" rotation={[0.04, part === 'A' ? mix(0.5, 0.18, silk(t / 5)) : mix(-0.25, 0, silk((t - B2()) / 1.5)), 0]} />
      {part === 'C' && !landed && t > W('ec04', 0) && (
        <Plate map={tex('notif-campagne')} w={0.93} h={0.205} r={0.05} position={[0, mix(1.6, 0.72, drop), mix(0.9, 0.08, drop)]} rotation={[mix(-0.5, 0, drop), 0, 0]} opacity={clamp(drop * 3)} />
      )}
      {part === 'C' && crowd && <Crowd t={t} />}
    </>
  )
}

// ─── Plan B : la page « Campagnes » sur le téléphone du commerçant ───
const MerchantScene = ({ t }) => {
  const k = t - B1()
  const scroll = mix(0, 980, silk((k - 0.2) / 1.6))
  const filled = pr(t, W('ec03', 3), W('ec03', 5) + 0.3) // « écris ton offre »
  const sent = t > END('ec03') + 0.15
  const pos = spline(t, [
    [B1(), [1.5, 0.9, 4.4]],
    [B1() + 1.6, [0.8, 0.35, 4.0]],
    [B2() + 0.8, [0.45, 0.15, 3.7]],
  ])
  return (
    <>
      <Cam pos={pos} look={[0, 0.32, 0]} fov={30} />
      <Phone screen={screenTex(sent ? 'ecran:campaigns-sent' : filled > 0.5 ? 'ecran:campaigns-filled' : 'ecran:campaigns', sent ? 980 : scroll, sent ? 's' : filled > 0.5 ? 'f' : 'e')} body="#bdb7ad" rotation={[0.08, -0.35, 0.05]} />
    </>
  )
}

// Mot barré, gris : « SMS », « email »
const Struck = ({ t, at, children, top }) => {
  const k = silk((t - at + 0.05) / 0.5)
  const line = pr(t, at + 0.25, at + 0.7, easeInOut)
  const o = pr(t, END('ec05') + 0.2, END('ec05') + 0.6, easeInOut)
  if (k <= 0 || o >= 1) return null
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: k * (1 - o), filter: `blur(${(1 - k) * 10 + o * 10}px)`, transform: `translateY(${(1 - k) * 18}px)` }}>
      <div style={{ position: 'relative', fontFamily, fontSize: 190, fontWeight: 700, letterSpacing: '-0.05em', color: mix(1, 0.4, line) > 0.7 ? INK : MUTED, transition: 'none' }}>
        {children}
        <div style={{ position: 'absolute', left: -20, top: '54%', height: 10, borderRadius: 5, width: `calc(${line * 100}% + ${line * 40}px)`, background: ACCENT, boxShadow: `0 0 24px ${ACCENT}` }} />
      </div>
    </div>
  )
}

export const Ecran = ({ son = true }) => {
  const t = useT()
  const ready = usePreload(TEX_ECRAN)
  const D = duree()
  const blur = pr(t, W('ec05', 0) - 0.3, W('ec05', 0) + 0.6, easeInOut)
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Shot t={t} a={0} b={B1()} outT={0.8}>
        <Backdrop y={52} glow={0.4 + 0.6 * pr(t, W('ec02', 1) - 0.2, W('ec02', 1) + 0.6)} />
        {ready && (
          <Stage>
            <ClientScene t={t} part="A" />
          </Stage>
        )}
      </Shot>
      <Shot t={t} a={B1()} b={B2()} inT={0.8} outT={0.8}>
        <Backdrop y={48} tint="48, 46, 42" />
        {ready && (
          <Stage>
            <MerchantScene t={t} />
          </Stage>
        )}
      </Shot>
      <Shot t={t} a={B2()} b={FIN()} inT={0.8}>
        <AbsoluteFill style={{ filter: blur > 0.001 ? `blur(${blur * 14}px) brightness(${1 - blur * 0.55})` : undefined }}>
          <Backdrop y={50} />
          {ready && (
            <Stage>
              <ClientScene t={t} part="C" />
            </Stage>
          )}
        </AbsoluteFill>
      </Shot>
      <Sweep t={t} at={W('ec04', 3) - 0.3} dur={0.8} strength={0.18} />
      <Scrim k={0.9} />

      <Caption t={t} id="ec01" top={250} size={66} accent={[5, 6, 7, 8]} />
      <Caption t={t} id="ec02" top={250} size={84} accent={[1, 2, 3]} out={B1() - 0.1} />
      <Caption t={t} id="ec03" top={230} size={64} accent={[1]} />
      <Caption t={t} id="ec04" top={230} size={64} accent={[5, 6]} to={3} out={W('ec04', 4) - 0.48} />
      <Caption t={t} id="ec04" top={230} size={64} accent={[5, 6]} from={4} />
      {t > W('ec04', 4) - 0.2 && t < END('ec04') + 0.6 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1480, textAlign: 'center', fontFamily, fontSize: 34, fontWeight: 500, color: MUTED, opacity: silk((t - W('ec04', 4)) / 0.6) * (1 - pr(t, END('ec04'), END('ec04') + 0.5)) }}>
          Notification envoyée à <span style={{ color: INK, fontWeight: 650 }}>164 clients</span>
        </div>
      )}
      <Struck t={t} at={W('ec05', 2)} top={640}>SMS</Struck>
      <Struck t={t} at={W('ec05', 6)} top={900}>Email</Struck>
      <Caption t={t} id="ec05" top={1260} size={50} weight={500} color={MUTED} />

      <EndCard t={t} at={FIN()} dur={D} line="Fais revenir tes clients." />
      <Finish t={t} />
      <Sound set="ecran" son={son} />
    </AbsoluteFill>
  )
}
