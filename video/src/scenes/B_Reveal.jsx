import { AbsoluteFill } from 'remotion'
import { Aurora, C, Logo, MBlur, PHONE, Phone, W, Words, fontFamily, inE, ioE, lerp, outE, springy, ts, useT } from '../lib'
import { Pass } from '../Pass'
import { AndroidPhone, WALLET_PASS, WalletGoogle, WalletIOS } from '../ui'
import { HERO } from './A_Hook'

/* B — Fidelyz (8 – 14 s)
   La carte arrivée sur le temps fort se pose dans un iPhone qui monte du bas du cadre.
   Un téléphone Android glisse de derrière l'iPhone : la même carte, dans Google Wallet.
   Puis la carte jaillit de l'iPhone et vient se placer au centre du studio (scène C). */

export const STUDIO = { x: 960, y: 540, w: 420 }

const SPLIT = 0.84 // échelle des deux téléphones côte à côte
const IPHONE_SPLIT_X = 700
const ANDROID_X = 1220

export const B_Reveal = () => {
  const t = useT()
  if (t < 8 || t > 14.1) return null

  // Marque
  const logo = springy(t, 7.98, 1.8, 7)
  const brandOut = ts(t, 9.1, 9.4, 0, 1, inE)
  const word = 'Fidelyz'

  // iPhone qui monte, puis se range à gauche
  const rise = ts(t, 9.15, 9.85, 0, 1, outE)
  const split = ts(t, 11.3, 11.9, 0, 1, ioE)
  const phoneX = lerp(960, IPHONE_SPLIT_X, split)
  const phoneS = lerp(1, SPLIT, split)
  const phoneY = lerp(540 + 1000, 540, rise)

  // Android qui sort de derrière
  const andr = ts(t, W('v04', 5) - 0.3, W('v04', 5) + 0.25, 0, 1, outE)

  // Sortie : les téléphones reculent, la carte jaillit vers le studio
  const out = ts(t, 13.45, 14.0, 0, 1, ioE)
  const back = { transform: `translateY(${out * 90}px) scale(${1 - out * 0.12})`, opacity: 1 - out, filter: out > 0 ? `blur(${out * 10}px)` : undefined }

  // Vol de la carte : du héros vers l'écran de l'iPhone (9,25 → 9,95), puis de l'écran vers le studio
  const into = ts(t, 9.4, 10.1, 0, 1, ioE)
  const inScreen = { x: phoneX + (WALLET_PASS.left + WALLET_PASS.width / 2 - PHONE.w / 2 + 12) * phoneS, y: phoneY + (WALLET_PASS.top + (WALLET_PASS.width * 1.58) / 2 - PHONE.h / 2 + 12) * phoneS, w: WALLET_PASS.width * phoneS }
  let fly = null
  if (t < 10.1) {
    fly = {
      x: lerp(HERO.x, inScreen.x, into),
      y: lerp(HERO.y, inScreen.y, into) - Math.sin(Math.PI * into) * 90,
      w: lerp(HERO.w, inScreen.w, into),
      ry: lerp(-10, 0, into) + Math.sin(t * 2.2) * 3 * (1 - into),
      rx: lerp(4, 0, into),
      rz: Math.sin(Math.PI * into) * -6,
    }
  } else if (t >= 13.45) {
    fly = {
      x: lerp(inScreen.x, STUDIO.x, out),
      y: lerp(inScreen.y, STUDIO.y, out) - Math.sin(Math.PI * out) * 60,
      w: lerp(inScreen.w, STUDIO.w, out),
      ry: Math.sin(Math.PI * out) * -24,
      rx: Math.sin(Math.PI * out) * 8,
      rz: 0,
    }
  }
  const walletUi = ts(t, 9.85, 10.2)
  const passBlur = t >= 13.45 ? Math.sin(Math.PI * out) * 6 : t < 10.1 ? Math.sin(Math.PI * into) * 5 : 0

  return (
    <AbsoluteFill>
      <Aurora t={t} intensity={0.9 - out * 0.3} />

      {/* Marque Fidelyz */}
      <div style={{ position: 'absolute', left: 150, top: 300, display: 'flex', alignItems: 'center', gap: 34, opacity: 1 - brandOut, transform: `translateY(${-brandOut * 70}px)`, filter: brandOut ? `blur(${brandOut * 12}px)` : undefined }}>
        <div style={{ transform: `scale(${logo}) rotate(${(1 - logo) * -25}deg)` }}>
          <Logo size={150} />
        </div>
        <div style={{ fontFamily, fontSize: 168, fontWeight: 700, letterSpacing: '-0.055em', color: C.text, lineHeight: 1 }}>
          {[...word].map((ch, i) => {
            const p = ts(t, 8.02 + i * 0.035, 8.32 + i * 0.035, 0, 1, outE)
            return (
              <span key={i} style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'top' }}>
                <span style={{ display: 'inline-block', transform: `translateY(${(1 - p) * 110}%)` }}>{ch}</span>
              </span>
            )
          })}
        </div>
      </div>

      <AbsoluteFill style={back}>
      {/* Android, derrière l'iPhone */}
      {andr > 0 && (
        <div style={{ position: 'absolute', left: lerp(IPHONE_SPLIT_X, ANDROID_X, andr) - PHONE.w / 2, top: 540 - PHONE.h / 2, transform: `perspective(1600px) scale(${SPLIT}) rotateY(${(1 - andr) * 25}deg)` }}>
          <AndroidPhone>
            <WalletGoogle />
          </AndroidPhone>
        </div>
      )}

      {/* iPhone */}
      {rise > 0 && (
        <div style={{ position: 'absolute', left: phoneX - PHONE.w / 2, top: phoneY - PHONE.h / 2, transform: `scale(${phoneS})` }}>
          <Phone>
            <div style={{ position: 'absolute', inset: 0, opacity: walletUi }}>
              <WalletIOS passStyle={{ opacity: fly ? 0 : 1 }} />
            </div>
          </Phone>
        </div>
      )}
      </AbsoluteFill>

      {/* Libellés sous les téléphones */}
      {[
        ['Apple Wallet', IPHONE_SPLIT_X, W('v04', 1)],
        ['Google Wallet', ANDROID_X, W('v04', 5)],
      ].map(([label, x, at]) => {
        const p = ts(t, at - 0.1, at + 0.3, 0, 1, outE)
        return (
          <div key={label} style={{ position: 'absolute', left: x - 200, width: 400, top: 540 + (PHONE.h * SPLIT) / 2 + 26, textAlign: 'center', fontFamily, fontSize: 30, fontWeight: 600, color: C.text, opacity: p * (1 - out), transform: `translateY(${(1 - p) * 20}px)` }}>
            {label}
          </div>
        )
      })}

      {/* La carte en vol */}
      {fly && (
        <div style={{ position: 'absolute', left: fly.x - fly.w / 2, top: fly.y - (fly.w * 1.58) / 2 }}>
          <MBlur id="passFlyBlur" x={passBlur} y={passBlur * 0.6} />
          <div style={{ filter: passBlur ? 'url(#passFlyBlur)' : undefined }}>
            <Pass width={fly.w} rx={fly.rx} ry={fly.ry} rz={fly.rz} light={0.5} points={480} />
          </div>
        </div>
      )}

      {/* Texte */}
      <div style={{ position: 'absolute', left: 150, top: 560 }}>
        <Words id="v03" only={[2, 10]} size={66} maxWidth={560} out={11.15} accent={{ 7: C.champagne }} />
      </div>
      <div style={{ position: 'absolute', top: 54, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Words id="v04" size={54} weight={600} out={13.4} accent={{ 1: C.blue, 2: C.blue, 5: C.champagne, 6: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}
