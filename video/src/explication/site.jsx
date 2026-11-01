import { MapPin } from 'lucide-react'
import { fontFamily, springy, ts } from '../lib'
import { Notif, Pass } from '../Pass'
import './site.css'

/* Visuels de la page d'accueil du site (frontend/src/pages/Home.jsx) : LockVis, GeoVis, WalletVis.
   Mêmes textes, mêmes classes ; seules les apparitions sont animées image par image. */

/* Écran verrouillé : chaque notification a son instant d'arrivée (`at`) */
export const LockVis = ({ t, notifs, date = 'Mardi 27 octobre' }) => (
  <div className="fzx lock-bg" style={{ fontFamily }}>
    <div className="lv" style={{ padding: '58px 16px 0' }}>
      <div className="lv-time">9:41</div>
      <div className="lv-date">{date}</div>
      <div className="lv-stack">
        {notifs.map((n, i) => {
          const a = springy(t, n.at, 2, 10)
          if (t < n.at) return null
          return (
            <div key={i} style={{ opacity: Math.min(1, a * 1.6) * (n.dim ? 0.6 : 1), transform: `translateY(${-24 * (1 - Math.min(1, a))}px) scale(${(0.92 + 0.08 * Math.min(1.04, a)) * (n.dim ? 0.95 : 1)})` }}>
              <Notif title={n.title} body={n.body} time={n.time} />
            </div>
          )
        })}
      </div>
    </div>
  </div>
)

/* Carte du quartier avec la boutique ; `toast` = progression de la bulle « … est à 50 m » */
export const GeoVis = ({ t, width = 320, height = 210, toast = 0, walker = null }) => (
  <div className="fzx gv" style={{ width, height, fontFamily }}>
    <svg className="gv-map" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice">
      <path d="M-10 140 C 60 120, 110 160, 180 120 S 290 60, 340 80" />
      <path d="M40 -10 C 60 60, 90 110, 70 210" />
      <path d="M210 -10 C 200 70, 240 120, 230 210" />
      <path d="M-10 60 H 340" className="thin" />
      <path d="M140 -10 V 210" className="thin" />
    </svg>
    {walker && (
      <div style={{ position: 'absolute', left: `${walker.x}%`, top: `${walker.y}%`, width: 14, height: 14, marginLeft: -7, marginTop: -7, borderRadius: 7, background: '#e3c9a4', boxShadow: '0 0 0 4px rgba(227,201,164,0.25), 0 0 16px rgba(227,201,164,0.9)', opacity: walker.o }} />
    )}
    <div className="gv-pin">
      {[0, 1].map(i => {
        const k = ((t + i * 1.3) % 2.6) / 2.6
        const e = 1 - Math.pow(1 - k, 2.2)
        return <span key={i} className="gv-ring" style={{ transform: `scale(${1 + 3.2 * e})`, opacity: 0.9 * (1 - k) }} />
      })}
      <span className="gv-dot"><MapPin size={14} /></span>
    </div>
    <div style={{ position: 'absolute', left: '50%', bottom: 14, transform: `translateX(-50%) translateY(${(1 - Math.min(1, toast)) * 12}px) scale(${0.85 + 0.15 * Math.min(1.05, toast)})`, opacity: Math.min(1, toast * 1.5) }}>
      <div className="gv-toast">
        <span className="notif-app sm"><span /><span /><span /></span>
        Maison Lumière est à 50 m
      </div>
    </div>
  </div>
)

/* Pile de passes comme dans l'app Wallet (WALLET_STACK de Home.jsx) ; spread = écart entre les cartes */
export const WALLET_STACK = [
  { skin: 'ivory', name: 'Atelier Nord', mark: 'A', pts: 120 },
  { skin: 'champagne', name: 'Fleurs & Co', mark: 'F', pts: 260 },
  { skin: 'azur', name: 'Le Comptoir', mark: 'C', pts: 90 },
  { skin: 'graphite', name: 'Maison Lumière', mark: 'L', pts: 480 },
]
export const WalletStack = ({ t, at, width = 280, spread = 54 }) => (
  <div style={{ position: 'relative', width, height: spread * 3 + width * 1.58 }}>
    {WALLET_STACK.map((c, k) => {
      const a = springy(t, at + k * 0.09, 2, 9)
      return (
        <div key={c.name} className="mp" style={{ position: 'absolute', left: 0, top: k * spread, opacity: Math.min(1, a * 1.5), transform: `translateY(${(1 - Math.min(1, a)) * 160}px)` }}>
          <Pass width={width} skin={c.skin} name={c.name} mark={c.mark} points={c.pts} light={0.35} />
        </div>
      )
    })}
  </div>
)

/* Fond doux commun : noir, deux lueurs */
export const Glow = ({ t, hue = 0, intensity = 1, warm = 0 }) => {
  const a = t * 0.45 + hue
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left: 540 + Math.cos(a) * 240 - 700, top: 620 + Math.sin(a * 1.3) * 200 - 700, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(closest-side, ${warm ? 'rgba(255,90,60,0.22)' : 'rgba(41,151,255,0.24)'}, transparent)`, opacity: intensity }} />
      <div style={{ position: 'absolute', left: 540 - Math.cos(a * 0.8) * 280 - 620, top: 1380 - Math.sin(a) * 180 - 620, width: 1240, height: 1240, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(227,201,164,0.16), transparent)', opacity: intensity }} />
    </div>
  )
}

export const appear = (t, at, dur = 0.35) => ts(t, at, at + dur)
