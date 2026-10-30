import { AbsoluteFill } from 'remotion'
import { Aurora, C, PHONE, Phone, SCREEN, Words, camera, fontFamily, geo, inE, ioE, lerp, outE, ts, useT } from '../lib'
import { Pass } from '../Pass'
import { Status, WALLET_PASS, WalletIOS, qrCenter } from '../ui'

/* D — Le client (19,6 – 25 s)
   La carte pivotée sur sa tranche réapparaît en téléphone : inscription, ajout au Wallet,
   chronomètre de 10 s. Puis la caméra plonge dans le QR code (repris par la scène E, en caisse). */

export const PH = { x: 1240, y: 540 }
const QR = (() => {
  const q = qrCenter(WALLET_PASS.left, WALLET_PASS.top, WALLET_PASS.width)
  return { x: PH.x - PHONE.w / 2 + PHONE.bezel + q.x, y: PH.y - PHONE.h / 2 + PHONE.bezel + q.y, size: q.size }
})()
export const QR_FILL = 2000 // largeur du QR à la fin de la plongée

const typed = (text, t, a, b) => text.slice(0, Math.round(ts(t, a, b, 0, text.length, x => x)))

const Input = ({ label, value, caret }) => (
  <div style={{ marginTop: 18 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: C.muted, marginBottom: 8 }}>{label}</div>
    <div style={{ height: 52, borderRadius: 14, background: '#1c1c1e', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', fontSize: 18, color: C.text }}>
      {value}
      {caret && <span style={{ width: 2, height: 22, background: C.blue, marginLeft: 2 }} />}
    </div>
  </div>
)

const SignUp = ({ t }) => {
  const press = Math.sin(Math.PI * ts(t, 21.2, 21.38, 0, 1, x => x))
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily, padding: '0 28px' }}>
      <Status />
      <div style={{ marginTop: 100, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 32, color: '#1d1d1f' }}>L</div>
        <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Maison Lumière</div>
        <div style={{ marginTop: 4, fontSize: 14, color: C.muted }}>Programme de fidélité</div>
      </div>
      <div style={{ marginTop: 40, fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Rejoignez le programme</div>
      <div style={{ marginTop: 6, fontSize: 16, color: C.muted }}>Cumulez des points à chaque passage.</div>
      <Input label="Prénom" value={typed('Camille', t, 20.25, 20.6)} caret={t >= 20.1 && t < 20.62} />
      <Input label="E-mail" value={typed('camille@mail.fr', t, 20.65, 21.08)} caret={t >= 20.62 && t < 21.15} />
      <div style={{ marginTop: 30, height: 56, borderRadius: 16, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 600, transform: `scale(${1 - 0.05 * press})`, filter: `brightness(${1 + 0.5 * press})` }}>
        Créer ma carte
      </div>
    </div>
  )
}

const AddPass = ({ t }) => {
  const press = Math.sin(Math.PI * ts(t, 21.72, 21.88, 0, 1, x => x))
  const sheet = ts(t, 21.88, 22.12, 0, 1, ioE)
  const sheetOut = ts(t, 22.46, 22.66, 0, 1, inE)
  const tap = Math.sin(Math.PI * ts(t, 22.3, 22.44, 0, 1, x => x))
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily }}>
      <Status />
      <div style={{ position: 'absolute', left: 38, top: 92 }}>
        <Pass width={340} light={0.4} points={460} />
      </div>
      <div style={{ position: 'absolute', left: 38, top: 92 + 340 * 1.58 + 26, width: 340 }}>
        <div style={{ height: 58, borderRadius: 12, background: '#000', border: '1px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#fff', fontSize: 19, fontWeight: 600, transform: `scale(${1 - 0.05 * press})` }}>
          <span style={{ position: 'relative', width: 30, height: 22, borderRadius: 5, background: '#2c2c2e', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 5, background: C.blue }} />
            <span style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 5, background: C.champagne }} />
            <span style={{ position: 'absolute', left: 0, right: 0, top: 15, height: 5, background: '#f5f5f7' }} />
          </span>
          Ajouter à Apple Wallet
        </div>
        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 15, color: C.muted }}>ou Google Wallet sur Android</div>
      </div>
      <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.5 * sheet * (1 - sheetOut)})` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 56, bottom: 0, borderRadius: '26px 26px 0 0', background: '#1c1c1e', transform: `translateY(${(1 - sheet) * 880 + sheetOut * 880}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 24px', fontSize: 18, color: C.blue }}>
          <span>Annuler</span>
          <span style={{ fontWeight: 700, padding: '2px 10px', margin: '-2px -10px', borderRadius: 8, background: `rgba(41,151,255,${0.3 * tap})` }}>Ajouter</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Pass width={320} light={0.6} points={460} />
        </div>
      </div>
    </div>
  )
}

/* Chronomètre : 10 secondes compressées dans le temps de l'inscription */
const Stopwatch = ({ t }) => {
  const p = ts(t, 20.2, 22.7, 0, 1, x => x)
  const s = Math.floor(p * 10)
  const done = ts(t, 22.7, 23.0)
  const r = 38
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 22, fontFamily }}>
      <svg width="96" height="96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="7" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={C.blue} strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - p} transform="rotate(-90 48 48)" style={{ filter: `drop-shadow(0 0 ${8 * done}px rgba(41,151,255,0.9))` }} />
      </svg>
      <div>
        <div style={{ fontSize: 64, fontWeight: 600, color: C.text, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>00:{String(s).padStart(2, '0')}</div>
        <div style={{ fontSize: 20, color: C.muted, marginTop: 8 }}>Inscription et ajout au Wallet</div>
      </div>
    </div>
  )
}

export const D_Signup = () => {
  const t = useT()
  if (t < 19.62 || t > 25.05) return null

  const flipIn = ts(t, 19.66, 20.05, 0, 1, outE)
  const ry = lerp(-90, 0, flipIn)
  const sc = lerp(0.8, 1, flipIn)

  const slide = ts(t, 21.4, 21.66, 0, 1, ioE)
  const toWallet = ts(t, 22.6, 22.8)
  const badge = ts(t, 22.75, 23.05, 0, 1, outE) * (1 - ts(t, 23.9, 24.1))

  // Plongée dans le QR code
  const dive = ts(t, 24.25, 25.0, 0, 1, x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2))
  const cam = camera(QR.x, QR.y, geo(dive, 1, QR_FILL / QR.size), Math.min(1, dive * 1.6))
  const textOut = ts(t, 24.0, 24.35)

  return (
    <AbsoluteFill>
      <Aurora t={t} intensity={0.7 * (1 - dive)} hue={2} />
      <AbsoluteFill style={dive > 0 ? cam : undefined}>
        <div style={{ position: 'absolute', left: PH.x - PHONE.w / 2, top: PH.y - PHONE.h / 2, transform: `perspective(2000px) rotateY(${ry}deg) scale(${sc})` }}>
          <Phone>
            {toWallet < 1 && (
              <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-slide * SCREEN.w}px)` }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: SCREEN.w, height: SCREEN.h, overflow: 'hidden' }}><SignUp t={t} /></div>
                <div style={{ position: 'absolute', left: SCREEN.w, top: 0, width: SCREEN.w, height: SCREEN.h, overflow: 'hidden' }}><AddPass t={t} /></div>
              </div>
            )}
            {toWallet > 0 && (
              <div style={{ position: 'absolute', inset: 0, opacity: toWallet }}>
                <WalletIOS points={460} badge={badge} passStyle={{ transform: `translateY(${(1 - ts(t, 22.6, 22.95, 0, 1, outE)) * -60}px)` }} />
              </div>
            )}
          </Phone>
        </div>
      </AbsoluteFill>

      <div style={{ position: 'absolute', left: 130, top: 290, opacity: 1 - textOut }}>
        <Words id="v06" size={66} maxWidth={760} accent={{ 4: C.blue, 5: C.blue }} />
        <div style={{ marginTop: 70, opacity: ts(t, 20.15, 20.5), transform: `translateY(${(1 - ts(t, 20.15, 20.6, 0, 1, outE)) * 20}px)` }}>
          <Stopwatch t={t} />
        </div>
      </div>
    </AbsoluteFill>
  )
}
