import { AbsoluteFill } from 'remotion'
import { Users } from 'lucide-react'
import { Aurora, C, PHONE, Phone, W, Words, fontFamily, geo, ioE, lerp, outE, ts, useT } from '../lib'
import { Composer, LockScreen, MiniPhone } from '../ui'
import { TOAST } from './E_Caisse'

/* F — Notifications push (29,6 – 40,6 s), le moment fort
   La confirmation de caisse s'étire en fenêtre d'envoi. « Envoyer » : la fenêtre se resserre
   en notification et tombe dans l'écran verrouillé d'un client (offre, nouveauté, récompense).
   La caméra recule : ce téléphone n'est qu'un parmi des centaines, et la vague de notifications
   les allume tous, du centre vers les bords. « Ils reviennent » : les téléphones deviennent
   des points qui convergent vers la boutique (scène G). */

const BOX = { x: 470, y: 300, w: 980, h: 540 }
export const LOCK = { x: 1240, y: 560 } // centre du téléphone du client
const BANNER = { x: LOCK.x - PHONE.w / 2 + PHONE.bezel + 14, y: LOCK.y - PHONE.h / 2 + PHONE.bezel + 300, w: PHONE.w - 2 * PHONE.bezel - 28, h: 78 }

const COLS = 17
const ROWS = 11
const GAP = { x: 560, y: 1020 }
export const GRID_S = 0.15 // échelle de la grille vue de loin
export const PIN = { x: 960, y: 560 }

const NOTIFS = [
  { title: 'Maison Lumière', body: 'Happy hour : −20 % sur toutes les boissons jusqu’à 18 h.' },
  { title: 'Maison Lumière', body: 'Nouveauté : la tarte citron meringuée est arrivée.' },
  { title: 'Maison Lumière', body: 'Votre café offert vous attend. Passez quand vous voulez !' },
]

const smooth = x => x * x * (3 - 2 * x)

export const F_Push = () => {
  const t = useT()
  if (t < 29.6 || t > 40.75) return null

  // 1. La confirmation devient la fenêtre d'envoi
  const grow = ts(t, 29.6, 30.3, 0, 1, ioE)
  const press = Math.sin(Math.PI * ts(t, 32.68, 32.86, 0, 1, x => x))
  const shrink = ts(t, 32.86, 33.25, 0, 1, ioE)
  const box = {
    x: lerp(lerp(TOAST.x, BOX.x, grow), BANNER.x, shrink),
    y: lerp(lerp(TOAST.y, BOX.y, grow), BANNER.y, shrink),
    w: lerp(lerp(TOAST.w, BOX.w, grow), BANNER.w, shrink),
    h: lerp(lerp(TOAST.h, BOX.h, grow), BANNER.h, shrink),
    r: lerp(lerp(31, 30, grow), 22, shrink),
  }
  const content = ts(t, 30.05, 30.6, 0, 1, x => x) * (1 - ts(t, 32.86, 33.0))
  const boxOut = ts(t, 33.12, 33.3)

  // 2. Le téléphone du client, puis le recul de la caméra
  const phoneIn = ts(t, 32.8, 33.2, 0, 1, outE)
  const notifs = [
    { ...NOTIFS[0], at: 33.15 },
    { ...NOTIFS[1], at: W('v09', 3) - 0.08 },
    { ...NOTIFS[2], at: W('v09', 5) - 0.08 },
  ]
  const pull = ts(t, 35.0, 36.05, 0, 1, ioE)
  const scale = geo(pull, 1, GRID_S)
  const tilt = ts(t, 35.25, 36.3, 0, 52, ioE) * (1 - ts(t, 39.35, 40.2, 0, 1, ioE))
  const cx = lerp(LOCK.x, PIN.x, pull)
  const cy = lerp(LOCK.y, PIN.y, pull)
  const drift = ts(t, 36, 39.6, 0, 1, x => x)
  const spin = drift * -10

  // 3. Vague, puis convergence vers la boutique
  const wave0 = W('v09', 7) - 0.04
  const toDot = ts(t, 39.15, 39.7, 0, 1, ioE)
  const converge = ts(t, 39.55, 40.55, 0, 1, x => smooth(x))
  const seeAll = ts(t, 40.4, 40.7)

  const phones = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gx = c - (COLS - 1) / 2
      const gy = r - (ROWS - 1) / 2
      if (gx === 0 && gy === 0) continue
      const d = Math.hypot(gx, gy * 1.4)
      const a = wave0 + d * 0.06
      phones.push({ gx, gy, lit: ts(t, a, a + 0.18), banner: ts(t, a + 0.06, a + 0.32, 0, 1, outE), d })
    }
  }

  const pulse = 0.5 + 0.5 * Math.sin((t - 38.6) * 9)
  const seen = ts(t, W('v10', 0), W('v10', 2) + 0.2) * (1 - toDot)

  return (
    <AbsoluteFill>
      {/* Le fond s'efface pour laisser apparaître le quartier (scène G, en dessous) */}
      <AbsoluteFill style={{ opacity: 1 - ts(t, 39.3, 39.9) }}>
        <Aurora t={t} intensity={0.8} hue={4} />
      </AbsoluteFill>

      {/* Le monde : le téléphone du client au centre d'une grille de téléphones */}
      <AbsoluteFill style={{ perspective: 1800, perspectiveOrigin: `${PIN.x}px ${PIN.y}px`, opacity: 1 - seeAll }}>
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            width: 0,
            height: 0,
            transformStyle: 'preserve-3d',
            transform: `rotateX(${tilt}deg) rotateZ(${spin}deg) scale(${scale})`,
          }}
        >
          {pull > 0 &&
            phones.map(({ gx, gy, lit, banner }, i) => {
              const k = 1 - converge
              const x = gx * GAP.x * k
              const y = gy * GAP.y * k
              return (
                <div key={i} style={{ position: 'absolute', left: x - PHONE.w / 2, top: y - PHONE.h / 2 }}>
                  {toDot < 1 && (
                    <div style={{ transform: `scale(${1 - toDot})`, opacity: ts(t, 35.0, 35.45) * (1 - toDot * 0.5) }}>
                      <MiniPhone lit={lit} banner={banner * (1 - seen * 0.25 + seen * 0.25 * pulse)} />
                    </div>
                  )}
                  {toDot > 0 && (
                    <div style={{ position: 'absolute', left: PHONE.w / 2 - 70, top: PHONE.h / 2 - 70, width: 140, height: 140, borderRadius: 70, background: i % 3 ? C.champagne : C.blue, opacity: toDot * (1 - ts(converge, 0.85, 1)), boxShadow: `0 0 120px ${i % 3 ? 'rgba(227,201,164,0.8)' : 'rgba(41,151,255,0.8)'}`, transform: `scale(${toDot})` }} />
                  )}
                </div>
              )
            })}
          {/* Le téléphone du client */}
          {phoneIn > 0 && (
            <div style={{ position: 'absolute', left: -PHONE.w / 2, top: -PHONE.h / 2, opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 120}px) scale(${(0.92 + 0.08 * phoneIn) * (1 - toDot)})` }}>
              <Phone>
                <LockScreen t={t} notifs={notifs} />
              </Phone>
            </div>
          )}
          {toDot > 0 && (
            <div style={{ position: 'absolute', left: -70, top: -70, width: 140, height: 140, borderRadius: 70, background: C.blue, transform: `scale(${toDot})`, boxShadow: '0 0 120px rgba(41,151,255,0.9)', opacity: 1 - ts(converge, 0.85, 1) }} />
          )}
        </div>
      </AbsoluteFill>

      {/* Fenêtre d'envoi, qui se resserre en notification */}
      {boxOut < 1 && (
        <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, background: lerp(0, 1, shrink) > 0.5 ? 'rgba(44,44,48,0.92)' : 'rgba(22,22,24,0.96)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 50px 120px -30px rgba(0,0,0,0.95)', overflow: 'hidden', opacity: 1 - boxOut }}>
          {grow < 0.4 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', fontFamily, opacity: 1 - grow / 0.4 }}>
              <div style={{ width: 26, height: 26, borderRadius: 13, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>✓</div>
              <div style={{ fontSize: 19, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>+20 points ajoutés</div>
            </div>
          )}
          {content > 0 && (
            <div style={{ position: 'absolute', left: 0, top: 0, width: BOX.w, height: BOX.h }}>
              <Composer t={t} typedFrom={30.55} typedTo={31.85} press={press} content={content} />
            </div>
          )}
        </div>
      )}

      {/* Texte */}
      <div style={{ position: 'absolute', top: 120, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v08" size={68} weight={650} out={32.55} accent={{ 4: C.champagne, 5: C.champagne }} />
      </div>
      <div style={{ position: 'absolute', left: 130, top: 360 }}>
        <Words id="v09" only={[0, 5]} size={72} maxWidth={720} out={34.95} accent={{ 1: C.blue, 3: C.blue, 5: C.champagne }} />
      </div>
      <div style={{ position: 'absolute', top: 70, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v09" only={[6, 11]} size={64} weight={650} out={38.35} accent={{ 9: C.blue, 10: C.blue, 11: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 70, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v10" size={80} weight={700} out={40.45} accent={{ 3: C.champagne, 4: C.champagne }} />
      </div>
      {/* Compteur d'envoi */}
      {(() => {
        const p = ts(t, 36.5, 36.85, 0, 1, outE) * (1 - ts(t, 38.4, 38.7))
        const n = Math.round(ts(t, 36.0, 37.2, 0, 248, x => x))
        if (p <= 0) return null
        return (
          <div style={{ position: 'absolute', top: 940, width: '100%', display: 'flex', justifyContent: 'center', opacity: p, transform: `translateY(${(1 - p) * 20}px)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderRadius: 999, background: 'rgba(28,28,30,0.85)', border: `1px solid ${C.line}`, fontFamily, fontSize: 26, fontWeight: 600, color: C.text }}>
              <Users size={24} color={C.blue} />
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{n}</span> clients notifiés
            </div>
          </div>
        )
      })()}
    </AbsoluteFill>
  )
}
