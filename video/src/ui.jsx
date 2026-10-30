import { Bell, Coffee } from 'lucide-react'
import { C, PHONE, fontFamily, ioE, ts } from './lib'
import { Notif, Pass, QRCode } from './Pass'

/* Éléments d'interface partagés entre les scènes (écrans de téléphone, cartes, notifications) */

export const Status = ({ color = '#fff' }) => (
  <div style={{ position: 'absolute', left: 34, top: 22, fontFamily, fontSize: 17, fontWeight: 600, color }}>9:41</div>
)

// Position du pass dans l'écran Wallet (iOS) et de son QR code : utile aux plongées de caméra
export const WALLET_PASS = { left: 28, top: 150, width: 360 }
export const qrCenter = (left, top, width) => ({ x: left + width / 2, y: top + width * 1.2003, size: width * 0.4664 })

export const WalletIOS = ({ points = 480, skin = 'graphite', badge = 0, passStyle }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#000', fontFamily }}>
    <Status />
    <div style={{ position: 'absolute', left: 28, top: 64, fontSize: 34, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Wallet</div>
    <div style={{ position: 'absolute', right: 28, top: 70, width: 32, height: 32, borderRadius: 16, background: '#1c1c1e', color: C.blue, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 500 }}>+</div>
    <div style={{ position: 'absolute', left: 28, top: 118, width: 360, height: 120, borderRadius: 18, background: 'linear-gradient(135deg, #e9e9ee, #b7b7bf)' }} />
    <div style={{ position: 'absolute', left: 28, top: 134, width: 360, height: 120, borderRadius: 18, background: 'linear-gradient(135deg, #0b3a8f, #2997ff)' }} />
    <div style={{ position: 'absolute', left: WALLET_PASS.left, top: WALLET_PASS.top, ...passStyle }}>
      <Pass width={WALLET_PASS.width} skin={skin} light={0.5} points={points} />
    </div>
    {badge > 0 && (
      <div style={{ position: 'absolute', left: 0, right: 0, top: 742, display: 'flex', justifyContent: 'center', opacity: badge, transform: `translateY(${(1 - badge) * 16}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: '#1c1c1e', color: C.text, fontSize: 17, fontWeight: 600 }}>
          <span style={{ width: 22, height: 22, borderRadius: 11, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13 }}>✓</span>
          Carte ajoutée
        </div>
      </div>
    )}
  </div>
)

/* Pass au format Google Wallet (Android) */
export const GooglePass = ({ width = 360, points = 480 }) => {
  const k = width / 360
  return (
    <div style={{ width, borderRadius: 26 * k, background: '#1c1c1e', padding: 22 * k, fontFamily, color: '#fff', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 * k }}>
        <div style={{ width: 40 * k, height: 40 * k, borderRadius: 20 * k, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', color: '#1d1d1f', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 20 * k }}>L</div>
        <div style={{ fontSize: 17 * k, fontWeight: 600 }}>Maison Lumière</div>
      </div>
      <div style={{ marginTop: 22 * k, fontSize: 28 * k, fontWeight: 500, letterSpacing: '-0.01em' }}>Carte de fidélité</div>
      <div style={{ display: 'flex', gap: 40 * k, marginTop: 20 * k }}>
        <div>
          <div style={{ fontSize: 13 * k, color: C.champagne, fontWeight: 600 }}>Points</div>
          <div style={{ fontSize: 26 * k, marginTop: 4 * k }}>{Math.round(points)}</div>
        </div>
        <div>
          <div style={{ fontSize: 13 * k, color: C.champagne, fontWeight: 600 }}>Titulaire</div>
          <div style={{ fontSize: 26 * k, marginTop: 4 * k }}>Camille</div>
        </div>
      </div>
      <div style={{ margin: `${26 * k}px auto 0`, width: 196 * k, padding: 14 * k, borderRadius: 18 * k, background: '#fff', color: '#000' }}>
        <QRCode />
      </div>
      <div style={{ textAlign: 'center', marginTop: 10 * k, fontSize: 13 * k, color: 'rgba(255,255,255,0.6)' }}>2BF10B</div>
    </div>
  )
}

export const WalletGoogle = () => (
  <div style={{ position: 'absolute', inset: 0, background: '#0e0e10', fontFamily }}>
    <Status />
    <div style={{ position: 'absolute', left: 28, top: 66, fontSize: 26, fontWeight: 500, color: '#fff' }}>Google Wallet</div>
    <div style={{ position: 'absolute', left: 28, top: 128 }}>
      <GooglePass width={360} />
    </div>
  </div>
)

/* Téléphone Android : cadre graphite, caméra perforée */
export const AndroidPhone = ({ children, style }) => (
  <div style={{ position: 'relative', width: PHONE.w, height: PHONE.h, ...style }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: 58, background: 'linear-gradient(160deg, #4a4a50 0%, #1d1d20 35%, #2e2e33 70%, #55555c 100%)', boxShadow: '0 60px 120px -40px rgba(0,0,0,0.95), inset 0 0 0 1.5px rgba(255,255,255,0.18)' }} />
    <div style={{ position: 'absolute', inset: PHONE.bezel, borderRadius: 48, overflow: 'hidden', background: '#000' }}>
      {children}
      <div style={{ position: 'absolute', top: 18, left: '50%', width: 22, height: 22, marginLeft: -11, borderRadius: 11, background: '#000', boxShadow: 'inset 0 0 0 2px #1a1a1a' }} />
    </div>
  </div>
)

/* Écran verrouillé : les notifications arrivent par le haut et poussent les précédentes */
export const LockScreen = ({ t, notifs = [], scale = 1 }) => {
  const H = 96
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily, background: 'radial-gradient(120% 70% at 30% 0%, #1b2b4d 0%, #070b14 55%, #000 100%)' }}>
      <div style={{ position: 'absolute', left: -120, bottom: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(227,201,164,0.22), transparent)' }} />
      <div style={{ position: 'absolute', top: 78, width: '100%', textAlign: 'center', color: 'rgba(245,245,247,0.85)', fontSize: 19, fontWeight: 600 }}>Vendredi 30 octobre</div>
      <div style={{ position: 'absolute', top: 96, width: '100%', textAlign: 'center', color: '#f5f5f7', fontSize: 104, fontWeight: 700, letterSpacing: '-0.03em' }}>9:41</div>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 300, transform: `scale(${scale})`, transformOrigin: 'top center' }}>
        {notifs.map((n, i) => {
          const p = ts(t, n.at, n.at + 0.35, 0, 1, ioE)
          if (p <= 0) return null
          // décalage vers le bas causé par les notifications plus récentes
          const push = notifs.slice(i + 1).reduce((s, m) => s + ts(t, m.at, m.at + 0.35, 0, 1, ioE) * (H + 8), 0)
          return (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: push, opacity: p, transform: `translateY(${(1 - p) * -50}px) scale(${0.94 + 0.06 * p})`, transformOrigin: 'top center' }}>
              <Notif title={n.title} body={n.body} time={n.time ?? 'maintenant'} />
            </div>
          )
        })}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: '50%', width: 140, height: 5, marginLeft: -70, borderRadius: 3, background: 'rgba(255,255,255,0.7)' }} />
    </div>
  )
}

/* Téléphone simplifié pour les plans larges (écran éteint ou allumé avec une notification) */
export const MiniPhone = ({ lit = 0, banner = 0 }) => (
  <div style={{ position: 'relative', width: PHONE.w, height: PHONE.h }}>
    <div style={{ position: 'absolute', inset: 0, borderRadius: 76, background: 'linear-gradient(135deg, #8e8e93 0%, #3a3a3e 30%, #2c2c2e 76%, #8e8e93 100%)' }} />
    <div style={{ position: 'absolute', inset: PHONE.bezel, borderRadius: 64, overflow: 'hidden', background: '#030304' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: lit, background: 'radial-gradient(120% 70% at 30% 0%, #24427a 0%, #0a1222 55%, #000 100%)' }} />
      <div style={{ position: 'absolute', top: 96, width: '100%', textAlign: 'center', color: '#f5f5f7', fontSize: 104, fontWeight: 700, fontFamily, opacity: lit * 0.9 }}>9:41</div>
      <div style={{ position: 'absolute', left: 14, right: 14, top: 300, height: 96, borderRadius: 22, background: 'rgba(60,60,66,0.92)', opacity: banner, transform: `translateY(${(1 - banner) * -40}px)`, boxShadow: banner ? `0 0 ${60 * banner}px rgba(41,151,255,${0.5 * banner})` : 'none' }}>
        <div style={{ position: 'absolute', left: 14, top: 26, width: 44, height: 44, borderRadius: 11, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)' }} />
        <div style={{ position: 'absolute', left: 72, top: 28, width: 180, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.85)' }} />
        <div style={{ position: 'absolute', left: 72, top: 54, width: 290, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.45)' }} />
      </div>
    </div>
  </div>
)

/* Carte de fidélité en papier (accroche) : 10 cases, 6 tampons */
export const PAPER = { w: 620, h: 388 }
export const PaperCard = ({ inkFade = 0 }) => (
  <div style={{ position: 'relative', width: PAPER.w, height: PAPER.h, borderRadius: 16, overflow: 'hidden', background: '#efe6d3', fontFamily, color: '#5a3b24', boxShadow: 'inset 0 0 0 1px rgba(90,59,36,0.15)' }}>
    <svg width={PAPER.w} height={PAPER.h} style={{ position: 'absolute', inset: 0, opacity: 0.55, mixBlendMode: 'multiply' }}>
      <filter id="paperNoise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.32  0 0 0 0.35 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paperNoise)" />
    </svg>
    <div style={{ position: 'absolute', left: 40, top: 34, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 38, letterSpacing: '-0.01em' }}>Maison Lumière</div>
    <div style={{ position: 'absolute', left: 42, top: 88, fontSize: 14, fontWeight: 700, letterSpacing: '0.24em', opacity: 0.7 }}>CARTE DE FIDÉLITÉ</div>
    <div style={{ position: 'absolute', right: 40, top: 40, opacity: 0.75 }}><Coffee size={40} strokeWidth={1.6} /></div>
    {Array.from({ length: 10 }, (_, i) => {
      const x = 40 + (i % 5) * 112
      const y = 140 + Math.floor(i / 5) * 102
      const stamped = i < 6
      const fade = Math.min(1, Math.max(0, inkFade * 1.6 - i * 0.12))
      return (
        <div key={i} style={{ position: 'absolute', left: x, top: y, width: 84, height: 84, borderRadius: 42, border: '2px dashed rgba(90,59,36,0.35)' }}>
          {stamped && (
            <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '3px solid #9a4a3a', color: '#9a4a3a', display: 'grid', placeItems: 'center', transform: `rotate(${(i * 37) % 30 - 15}deg)`, opacity: 0.85 * (1 - fade), filter: `blur(${fade * 2}px)` }}>
              <Coffee size={30} strokeWidth={2.2} />
            </div>
          )}
        </div>
      )
    })}
    <div style={{ position: 'absolute', left: 42, bottom: 22, fontSize: 15, fontWeight: 600, opacity: 0.65 }}>10 tampons = 1 café offert</div>
  </div>
)

/* Fenêtre d'envoi d'une notification (espace pro) */
export const Composer = ({ t, typedFrom, typedTo, press = 0, content = 1 }) => {
  const msg = 'Happy hour : −20 % sur toutes les boissons jusqu’à 18 h.'
  const n = Math.round(ts(t, typedFrom, typedTo, 0, msg.length, x => x))
  const fade = k => ({ opacity: ts(content, 0.2 + k * 0.12, 0.6 + k * 0.12, 0, 1, x => x) })
  return (
    <div style={{ position: 'absolute', inset: 0, padding: '40px 48px', fontFamily, color: C.text }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...fade(0) }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(41,151,255,0.16)', color: C.blue, display: 'grid', placeItems: 'center' }}><Bell size={26} /></div>
        <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em' }}>Nouvelle notification</div>
        <div style={{ marginLeft: 'auto', fontSize: 17, color: C.muted }}>Maison Lumière</div>
      </div>
      <div style={{ marginTop: 34, fontSize: 15, fontWeight: 600, color: C.muted, ...fade(1) }}>Message</div>
      <div style={{ marginTop: 10, height: 132, borderRadius: 18, background: '#1c1c1e', border: `1px solid ${C.line}`, padding: '20px 22px', fontSize: 26, lineHeight: 1.35, ...fade(1) }}>
        {msg.slice(0, n)}
        {t >= typedFrom - 0.3 && t < typedTo + 0.4 && <span style={{ display: 'inline-block', width: 2, height: 30, background: C.blue, marginLeft: 2, verticalAlign: 'middle' }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 28, ...fade(2) }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: C.muted, marginRight: 6 }}>Destinataires</div>
        <div style={{ padding: '9px 16px', borderRadius: 999, background: 'rgba(41,151,255,0.14)', color: C.blue, fontSize: 17, fontWeight: 600 }}>Tous les clients · 248</div>
        <div style={{ padding: '9px 16px', borderRadius: 999, background: '#1c1c1e', color: C.muted, fontSize: 17, fontWeight: 600 }}>Apple et Google Wallet</div>
      </div>
      <div style={{ position: 'absolute', right: 48, bottom: 40, height: 60, padding: '0 34px', borderRadius: 18, background: C.blueBtn, color: '#fff', display: 'flex', alignItems: 'center', fontSize: 21, fontWeight: 600, transform: `scale(${1 - 0.06 * press})`, filter: `brightness(${1 + 0.4 * press})`, ...fade(3) }}>
        Envoyer à 248 clients
      </div>
    </div>
  )
}

