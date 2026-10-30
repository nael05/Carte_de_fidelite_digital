import { AbsoluteFill } from 'remotion'
import { Bell, Users } from 'lucide-react'
import { C, PHONE, Phone, W, fontFamily, geo, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { LockScreen, MiniPhone } from '../../ui'
import { AuroraV, Flash, Pop, Ring, shake, shakeStyle } from '../kit'

/* 5 — Notifications push (15 – 21,9 s), le moment fort
   Le tableau d'envoi monte du bas. Sur « push » : impact. Le message se tape, « Envoyer » :
   la fenêtre se resserre en notification et tombe sur l'écran verrouillé d'un client.
   Deux autres arrivent. La caméra recule : ce téléphone n'est qu'un parmi des centaines,
   la vague de notifications les allume tous, puis ils deviennent des points qui rejoignent la boutique. */

const PH = { x: 540, y: 1010, s: 1.3 }
export const PIN = { x: 540, y: 860 }
const BOX = { x: 60, y: 600, w: 960, h: 760 }
const BANNER = {
  x: PH.x - (PHONE.w * PH.s) / 2 + 26 * PH.s,
  y: PH.y - (PHONE.h * PH.s) / 2 + 312 * PH.s,
  w: 388 * PH.s,
  h: 78 * PH.s,
}
const MSG = 'Happy hour : −20 % sur toutes les boissons jusqu’à 18 h.'
const NOTIFS = [
  { title: 'Maison Lumière', body: 'Happy hour : −20 % sur toutes les boissons jusqu’à 18 h.' },
  { title: 'Maison Lumière', body: 'Nouveauté : la tarte citron meringuée est arrivée.' },
  { title: 'Maison Lumière', body: 'Ton café offert t’attend. Passe quand tu veux !' },
]

const COLS = 11
const ROWS = 15
const GAP = { x: 560, y: 1020 }

const Composer = ({ t, press, content }) => {
  const n = Math.round(ts(t, 17.85, 19.0, 0, MSG.length, x => x))
  const k = i => ({ opacity: ts(content, 0.05 + i * 0.1, 0.3 + i * 0.1, 0, 1, x => x) })
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: BOX.w, height: BOX.h, padding: '48px 44px', fontFamily, color: C.text, opacity: content }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...k(0) }}>
        <div style={{ width: 88, height: 88, borderRadius: 26, background: 'rgba(41,151,255,0.18)', color: C.blue, display: 'grid', placeItems: 'center' }}><Bell size={46} /></div>
        <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.04em' }}>Notification</div>
        <div style={{ marginLeft: 'auto', fontSize: 26, color: C.muted }}>Maison Lumière</div>
      </div>
      <div style={{ marginTop: 40, height: 290, borderRadius: 28, background: '#1c1c1e', border: `1px solid ${C.line}`, padding: '30px 34px', fontSize: 49, lineHeight: 1.22, fontWeight: 600, letterSpacing: '-0.02em', ...k(1) }}>
        {MSG.slice(0, n)}
        {t >= 17.5 && t < 19.05 && <span style={{ display: 'inline-block', width: 4, height: 54, background: C.blue, marginLeft: 3, verticalAlign: 'middle', opacity: Math.sin(t * 14) > 0 ? 1 : 0.2 }} />}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 34, flexWrap: 'wrap', ...k(2) }}>
        <div style={{ padding: '14px 26px', borderRadius: 999, background: 'rgba(41,151,255,0.16)', color: C.blue, fontSize: 30, fontWeight: 700 }}>Tous les clients · 248</div>
        <div style={{ padding: '14px 26px', borderRadius: 999, background: '#1c1c1e', color: C.muted, fontSize: 30, fontWeight: 600 }}>Apple + Google Wallet</div>
      </div>
      <div style={{ position: 'absolute', left: 44, right: 44, bottom: 44, height: 118, borderRadius: 32, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', transform: `scale(${1 - 0.05 * press})`, filter: `brightness(${1 + 0.6 * press})`, ...k(3) }}>
        Envoyer à 248 clients
      </div>
    </div>
  )
}

export const T5_Push = () => {
  const t = useT()
  if (t < 14.95 || t > 21.95) return null

  // Tableau d'envoi
  const rise = springy(t, 15.35, 1.7, 8)
  const press = Math.sin(Math.PI * ts(t, 18.95, 19.13, 0, 1, x => x))
  const shrink = ts(t, 19.1, 19.5, 0, 1, ioE)
  const content = ts(t, 15.7, 16.1, 0, 1, x => x) * (1 - ts(t, 19.08, 19.2))
  const boxOut = ts(t, 19.42, 19.55)
  const box = {
    x: lerp(BOX.x, BANNER.x, shrink),
    y: lerp(BOX.y + (1 - Math.min(1.05, rise)) * 1300, BANNER.y, shrink),
    w: lerp(BOX.w, BANNER.w, shrink),
    h: lerp(BOX.h, BANNER.h, shrink),
    r: lerp(48, 24, shrink),
  }

  // Impact « push »
  const tPush = W('t07', 4)
  const sh = shake(t, tPush, 30, 0.45)
  const bell = springy(t, tPush, 2.3, 9)

  // Téléphone du client
  const phoneIn = ts(t, 18.9, 19.4, 0, 1, outE)
  const notifs = [
    { ...NOTIFS[0], at: 19.45 },
    { ...NOTIFS[1], at: 19.78 },
    { ...NOTIFS[2], at: 20.08 },
  ]

  // Recul de caméra et vague
  const pull = ts(t, 20.5, 21.35, 0, 1, ioE)
  const scale = geo(pull, 1, 0.17)
  const tilt = ts(t, 20.7, 21.35, 0, 38, ioE)
  const cx = lerp(PH.x, PIN.x, pull)
  const cy = lerp(PH.y, PIN.y, pull)
  const wave0 = 20.78
  const toDot = ts(t, 21.38, 21.7, 0, 1, ioE)
  const converge = ts(t, 21.38, 21.85, 0, 1, x => x * x * (3 - 2 * x))
  const bg = 1 - ts(t, 21.35, 21.75)

  const phones = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const gx = c - (COLS - 1) / 2
      const gy = r - (ROWS - 1) / 2
      if (gx === 0 && gy === 0) continue
      const a = wave0 + Math.hypot(gx, gy * 1.25) * 0.055
      phones.push({ gx, gy, lit: ts(t, a, a + 0.15), banner: ts(t, a + 0.05, a + 0.3, 0, 1, outE) })
    }
  }
  const count = Math.round(ts(t, 20.85, 21.45, 0, 248, x => x))
  const chip = ts(t, 20.8, 21.1, 0, 1, outE) * (1 - ts(t, 21.4, 21.6))

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: bg }}>
        <AuroraV t={t} intensity={0.9 * ts(t, 14.95, 15.5)} hue={4.1} bare />
      </AbsoluteFill>

      <AbsoluteFill style={shakeStyle(sh)}>
        {/* Le monde : le téléphone du client au centre d'une grille de téléphones */}
        <AbsoluteFill style={{ perspective: 1900, perspectiveOrigin: `${PIN.x}px ${PIN.y}px` }}>
          <div style={{ position: 'absolute', left: cx, top: cy, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `rotateX(${tilt}deg) scale(${scale})` }}>
            {pull > 0 &&
              phones.map(({ gx, gy, lit, banner }, i) => {
                const k = 1 - converge
                return (
                  <div key={i} style={{ position: 'absolute', left: gx * GAP.x * k - PHONE.w / 2, top: gy * GAP.y * k - PHONE.h / 2 }}>
                    {toDot < 1 && (
                      <div style={{ transform: `scale(${1 - toDot})`, opacity: ts(t, 20.5, 20.95) }}>
                        <MiniPhone lit={lit} banner={banner} />
                      </div>
                    )}
                    {toDot > 0 && (
                      <div style={{ position: 'absolute', left: PHONE.w / 2 - 80, top: PHONE.h / 2 - 80, width: 160, height: 160, borderRadius: 80, background: i % 3 ? C.champagne : C.blue, opacity: toDot * (1 - ts(converge, 0.88, 1)), boxShadow: `0 0 130px ${i % 3 ? 'rgba(227,201,164,0.8)' : 'rgba(41,151,255,0.8)'}`, transform: `scale(${toDot})` }} />
                    )}
                  </div>
                )
              })}
            {phoneIn > 0 && toDot < 1 && (
              <div style={{ position: 'absolute', left: -PHONE.w / 2, top: -PHONE.h / 2, opacity: phoneIn, transform: `translateY(${(1 - phoneIn) * 1400 / scale}px) scale(${PH.s * (1 - toDot)})`, transformOrigin: '50% 50%' }}>
                <Phone>
                  <LockScreen t={t} notifs={notifs} />
                </Phone>
              </div>
            )}
          </div>
        </AbsoluteFill>

        {/* Tableau d'envoi, qui se resserre en notification */}
        {boxOut < 1 && t >= 15.35 && (
          <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, borderRadius: box.r, background: shrink > 0.5 ? 'rgba(44,44,48,0.92)' : 'rgba(22,22,24,0.97)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 60px 140px -30px rgba(0,0,0,0.95)', overflow: 'hidden', opacity: 1 - boxOut }}>
            <Composer t={t} press={press} content={content} />
          </div>
        )}

        {/* La cloche « push » */}
        {t >= tPush && t < 19.0 && (
          <div style={{ position: 'absolute', left: 870 - 90, top: 600 - 90, width: 180, height: 180, borderRadius: 90, background: `linear-gradient(135deg, ${C.blue}, #0b3a8f)`, display: 'grid', placeItems: 'center', color: '#fff', transform: `scale(${Math.max(0, bell)}) rotate(${Math.sin((t - tPush) * 22) * 14 * Math.exp(-(t - tPush) * 3)}deg)`, boxShadow: '0 30px 80px rgba(41,151,255,0.6)' }}>
            <Bell size={96} strokeWidth={2.4} />
          </div>
        )}
      </AbsoluteFill>

      <Ring t={t} at={tPush} x={870} y={600} size={900} width={6} />
      <Ring t={t} at={tPush + 0.12} x={870} y={600} size={1300} width={4} color="rgba(41,151,255,0.5)" />
      <Flash t={t} at={tPush} color={C.blue} strength={0.4} />
      <Flash t={t} at={19.45} strength={0.18} />

      {/* Compteur d'envoi */}
      {chip > 0 && (
        <div style={{ position: 'absolute', left: 540, top: 1400, transform: `translate(-50%, -50%) scale(${chip})`, display: 'flex', alignItems: 'center', gap: 18, padding: '20px 40px', borderRadius: 999, background: 'rgba(28,28,30,0.9)', border: `1px solid ${C.line}`, fontFamily, fontSize: 54, fontWeight: 800, color: C.text, letterSpacing: '-0.03em' }}>
          <Users size={50} color={C.blue} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{count}</span> clients notifiés
        </div>
      )}

      {/* Légendes */}
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t07" size={116} out={17.45} accent={{ 3: C.champagne, 4: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t08" only={[0, 3]} size={116} out={18.75} accent={{ 3: C.champagne }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t08" only={[4, 8]} size={104} out={20.5} accent={{ 5: C.blue, 8: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t08" only={[9, 9]} size={190} out={21.5} accent={{ 9: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}
