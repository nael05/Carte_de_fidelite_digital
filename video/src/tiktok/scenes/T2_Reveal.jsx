import { AbsoluteFill } from 'remotion'
import { C, PHONE, Phone, W, inE, ioE, lerp, outE, springy, ts, useT } from '../../lib'
import { Pass } from '../../Pass'
import { AndroidPhone, WalletGoogle, WalletIOS } from '../../ui'
import { AuroraV, Flash, Pop, Sticker, shake, shakeStyle } from '../kit'

/* 2 — Fidelyz (3,4 – 9,5 s)
   Le téléphone monte du bas pendant que la carte papier part vers le haut. La carte numérique tombe du haut
   dans le Wallet, sur le temps fort de 3,75 s. Un Android glisse devant l'iPhone sur « Google Wallet ».
   Puis les téléphones tombent et la carte jaillit, pour devenir la carte de la scène suivante. */

export const CARD_C = { x: 540, y: 960, w: 600 } // la carte au début de la scène 3
const PH0 = { x: 540, y: 1010, s: 1.3 }
const IP = { x: 390, y: 1060, s: 1.12 }
const AN = { x: 700, y: 1060, s: 1.12 }

export const T2_Reveal = () => {
  const t = useT()
  if (t < 3.3 || t > 9.5) return null

  const enter = ts(t, 3.35, 3.9, 0, 1, outE)
  const drop = springy(t, 3.78, 1.9, 7)
  const sh = shake(t, 3.78, 22)

  const split = ts(t, 7.0, 7.45, 0, 1, ioE)
  const iphone = {
    x: lerp(PH0.x, IP.x, split),
    y: lerp(PH0.y, IP.y, split) + (1 - enter) * 1500,
    s: lerp(PH0.s, IP.s, split),
  }
  const gTime = W('t04', 2) - 0.15 // « Google »
  const android = springy(t, gTime, 1.6, 9)

  // Départ : les téléphones tombent, la carte jaillit vers la scène 3
  const out = ts(t, 8.95, 9.42, 0, 1, ioE)
  const fall = ts(t, 8.95, 9.42, 0, 1, inE)
  const fly = {
    x: lerp(IP.x, CARD_C.x, out),
    y: lerp(IP.y - 4, CARD_C.y, out) - Math.sin(Math.PI * out) * 140,
    w: lerp(360 * IP.s, CARD_C.w, out),
    ry: out * 360,
    rx: Math.sin(Math.PI * out) * 14,
    rz: Math.sin(Math.PI * out) * -8,
  }

  const stickerAt = W('t04', 4) - 0.05

  return (
    <AbsoluteFill>
      <AuroraV t={t} intensity={ts(t, 3.6, 4.1) * (1 - out * 0.4)} hue={1} bare />
      <AbsoluteFill style={shakeStyle(sh)}>
        <AbsoluteFill style={{ transform: `translateY(${fall * 1700}px)`, opacity: 1 - 0.0 }}>
          {/* iPhone */}
          <div style={{ position: 'absolute', left: iphone.x - PHONE.w / 2, top: iphone.y - PHONE.h / 2, transform: `scale(${iphone.s})` }}>
            <Phone>
              <WalletIOS points={460} passStyle={{ transform: `translateY(${(1 - drop) * -760}px)`, opacity: out > 0 ? 0 : 1 }} />
            </Phone>
          </div>
          {/* Android, devant */}
          {t >= gTime - 0.1 && (
            <div style={{ position: 'absolute', left: lerp(1500, AN.x, Math.min(1.08, android)) - PHONE.w / 2, top: AN.y - PHONE.h / 2, transform: `scale(${AN.s}) rotate(${(1 - Math.min(1, android)) * 8}deg)` }}>
              <AndroidPhone>
                <WalletGoogle />
              </AndroidPhone>
            </div>
          )}
        </AbsoluteFill>
      </AbsoluteFill>

      {/* La carte qui jaillit */}
      {out > 0 && (
        <div style={{ position: 'absolute', left: fly.x - fly.w / 2, top: fly.y - (fly.w * 1.58) / 2 }}>
          <Pass width={fly.w} rx={fly.rx} ry={fly.ry} rz={fly.rz} light={0.5} points={460} />
        </div>
      )}

      <Flash t={t} at={3.75} strength={0.5} />
      <div style={{ opacity: 1 - ts(t, 8.85, 8.95, 0, 1, inE) }}>
        <Sticker t={t} at={stickerAt} x={540} y={640} rot={-5} size={54} bg="#fff" fg="#000">
          0 application à installer
        </Sticker>
      </div>

      {/* Légendes */}
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Pop id="t03" size={92} out={6.2} accent={{ 1: C.blue }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: 1 - ts(t, 8.9, 9.1, 0, 1, inE) }}>
        <Pop id="t04" only={[0, 3]} size={112} out={8.3} accent={{ 0: C.blue, 1: C.blue, 2: C.champagne, 3: C.champagne }} />
      </div>
      <div style={{ position: 'absolute', top: 150, width: '100%', display: 'flex', justifyContent: 'center', opacity: 1 - ts(t, 8.9, 9.1, 0, 1, inE) }}>
        <Pop id="t04" only={[4, 5]} size={128} out={9.0} accent={{ 4: C.champagne }} />
      </div>
    </AbsoluteFill>
  )
}
