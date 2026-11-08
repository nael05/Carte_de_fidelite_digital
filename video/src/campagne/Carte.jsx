import { Odometer, QRCode, StripPhoto } from '../Pass'
import './carte.css'

/* Pass Apple Wallet : même balisage que Card3D (frontend/src/pages/Home.jsx), style copié de Home.css (carte.css).
   QRCode et StripPhoto sont le même code que Home.jsx (ids rendus uniques pour plusieurs cartes à l'écran). */
export const Carte = ({
  width = 380, rx = 0, ry = 0, rz = 0, skin = 'graphite', points = 480, name = 'Maison Lumière', mark = 'L',
  holder = 'CAMILLE', cardId = '2BF10B', scan = null, light = 0.35, perspective = 2400, shadow = 1, style, vars = {}, build,
}) => {
  // build : apparition de chaque élément (0 → 1), pour construire la carte pièce par pièce
  const b = k => (build ? { opacity: build[k] ?? 1, transform: `translateY(${(1 - (build[k] ?? 1)) * 14}px)` } : undefined)
  return (
  <div style={{ perspective, ...style }}>
    <div className={`c3 c3-${skin}`} style={{ '--card-w': `${width}px`, '--mx': light, '--my': 0.3, ...vars, transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
      <div className="c3-edge">{[0, 1, 2, 3, 4, 5, 6].map(i => <span key={i} style={{ '--z': i }} />)}</div>
      <div className="c3-face c3-front" style={{ boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.06), 0 ${40 * shadow}px ${80 * shadow}px -30px rgba(0,0,0,${0.9 * shadow})` }}>
        <div className="c3-foil" />
        <div className="wp-head">
          <div className="wp-logo"><span className="wp-mark" style={build ? { opacity: build.mark ?? 1, transform: `scale(${0.4 + 0.6 * (build.mark ?? 1)})` } : undefined}>{mark}</span><span className="wp-org" style={b('org')}>{name}</span></div>
          <div className="wp-hfield" style={b('points')}><span className="wp-label">POINTS</span><span className="wp-hval"><Odometer value={points} /></span></div>
        </div>
        <div className="wp-strip" style={build ? { background: 'transparent' } : undefined}><div style={build ? { position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - (build.strip ?? 1)) * 100}% 0 0)` } : { position: 'absolute', inset: 0 }}><StripPhoto /></div></div>
        <div className="wp-fields" style={b('fields')}>
          <div className="wp-col"><span className="wp-label">BONJOUR</span><span className="wp-val-lg">{holder}</span></div>
          <div className="wp-col wp-right"><span className="wp-label">DÉTAILS DES RÉCOMPENSES</span><span className="wp-val">Au dos</span></div>
        </div>
        <div className="wp-barcode" style={b('barcode')}>
          <div className="wp-qr">
            <QRCode />
            {scan != null && <span className="c3-scan" style={{ animation: 'none', top: `${2 + scan * 94}%` }} />}
          </div>
          <span className="wp-id">N° Carte : {cardId}</span>
        </div>
      </div>
      <div className="c3-face c3-back">
        <div className="wp-back-row"><span className="wp-back-label">Détails des récompenses</span><span>500 points = 1 café offert</span></div>
        <div className="wp-back-row"><span className="wp-back-label">Solde</span><span>{Math.round(points)} points</span></div>
        <div className="wp-back-row"><span className="wp-back-label">Boutique</span><span>{name}</span></div>
        <div className="wp-back-row wp-toggle"><span>Mises à jour automatiques</span><i /></div>
        <div className="wp-back-row wp-toggle"><span>Autoriser les notifications</span><i /></div>
      </div>
    </div>
  </div>
  )
}

/* Couleurs des quatre matières proposées par le site */
export const SKIN = {
  graphite: { bg: '#1c1c1e', ink: '#ffffff', label: '#e3c9a4' },
  azur: { bg: '#0b3a8f', ink: '#ffffff', label: '#9fd0ff' },
  champagne: { bg: '#dcc39d', ink: '#2b1f12', label: '#7a5530' },
  ivory: { bg: '#f5f5f7', ink: '#1d1d1f', label: '#0071e3' },
}

/* Carte Google Wallet (programme de fidélité) : mise en page de Google Wallet.
   Logo rond et nom du commerce, titre du programme, champs, QR code sur fond blanc, image principale en bas. */
export const CarteGoogle = ({ width = 380, points = 480, holder = 'Camille Roux', name = 'Maison Lumière', mark = 'L', bg = '#1c1c1e', ink = '#fff', rx = 0, ry = 0, rz = 0, perspective = 2400, style }) => {
  const u = width / 380
  return (
    <div style={{ perspective, ...style }}>
      <div style={{ width, borderRadius: 26 * u, background: bg, color: ink, overflow: 'hidden', fontFamily: '"Inter Variable", Roboto, sans-serif', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`, boxShadow: '0 40px 80px -30px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.06)' }}>
        <div style={{ padding: `${20 * u}px ${22 * u}px 0` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 * u }}>
            <div style={{ width: 38 * u, height: 38 * u, borderRadius: '50%', background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', color: '#1d1d1f', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 18 * u }}>{mark}</div>
            <span style={{ fontSize: 16 * u, fontWeight: 500, opacity: 0.92 }}>{name}</span>
          </div>
          <div style={{ fontSize: 25 * u, fontWeight: 500, margin: `${18 * u}px 0 ${16 * u}px`, letterSpacing: '-0.01em' }}>Carte fidélité</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 18 * u }}>
            <div><div style={{ fontSize: 12 * u, opacity: 0.7, marginBottom: 4 * u }}>Points</div><div style={{ fontSize: 22 * u, fontWeight: 500 }}><Odometer value={points} /></div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 12 * u, opacity: 0.7, marginBottom: 4 * u }}>Membre</div><div style={{ fontSize: 17 * u, fontWeight: 500 }}>{holder}</div></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 22 * u }}>
            <div style={{ width: 150 * u, padding: 12 * u, background: '#fff', borderRadius: 14 * u, color: '#000' }}><QRCode /></div>
          </div>
        </div>
        <div style={{ height: 130 * u, position: 'relative' }}><StripPhoto /></div>
      </div>
    </div>
  )
}
