import { AbsoluteFill } from 'remotion'
import { fontFamily } from '../lib'
import { Notif, Pass, QRCode } from '../Pass'
import { LockVis, WALLET_STACK, WalletStack } from '../explication/site'
import './textures.css'

/* Images fixes servant de textures aux scènes 3D (rendues par scripts/textures-tt.mjs dans public/tt/tex/).
   Les passes, l'écran verrouillé et la pile Wallet sont les composants du site, à plat et sans ombre. */

const SIZES = {
  pass: [1000, 1580],
  lock: [780, 1688],
  wallet: [780, 1688],
  paper: [1700, 1100],
  notif: [760, 168],
  toast: [640, 104],
  qr: [800, 1000],
}

export const texMetadata = ({ props }) => {
  const [width, height] = SIZES[props.kind] ?? [1000, 1000]
  return { width, height }
}

/* Pass à plat. layer : tout, ou une seule couche pour la vue éclatée (fond, logo, points, détails) ; back : le verso */
const PassTex = ({ skin = 'graphite', points = 480, name = 'Maison Lumière', mark = 'L', layer = 'all', back = false, vide = false, photo, holder }) => (
  <AbsoluteFill className={`tex tex-${layer} ${back ? 'tex-back' : ''} ${vide ? 'tex-vide' : ''}`}>
    <Pass width={1000} skin={skin} points={points} name={name} mark={mark} light={0.35} photo={photo} holder={holder} />
  </AbsoluteFill>
)

/* Écran de téléphone (390 × 844 points, rendu ×2) */
const Screen = ({ children }) => (
  <AbsoluteFill style={{ background: '#000' }}>
    <div style={{ position: 'absolute', width: 390, height: 844, transform: 'scale(2)', transformOrigin: '0 0', overflow: 'hidden' }}>{children}</div>
  </AbsoluteFill>
)

const LockTex = ({ notifs = [], date = 'Lundi 2 novembre' }) => (
  <Screen>
    <LockVis t={100} date={date} notifs={notifs.map(n => ({ ...n, at: 0 }))} />
  </Screen>
)

const WalletTex = ({ last }) => (
  <Screen>
    <div className="fzx" style={{ position: 'absolute', inset: 0, background: '#000', fontFamily }}>
      <div style={{ padding: '62px 22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.03em', color: '#f5f5f7' }}>Cartes</span>
        <span style={{ width: 34, height: 34, borderRadius: 17, background: '#1c1c1e', color: '#2997ff', display: 'grid', placeItems: 'center', fontSize: 26, fontWeight: 400 }}>+</span>
      </div>
      <div style={{ position: 'absolute', left: 22, top: 130 }}>
        {last ? (
          <div style={{ position: 'relative' }}>
            {WALLET_STACK.map((c, k) => (
              <div key={c.name} className="mp" style={{ position: k ? 'absolute' : 'relative', left: 0, top: k * 66 }}>
                <Pass width={346} skin={k === 3 ? last : c.skin} name={c.name} mark={c.mark} points={c.pts} light={0.35} />
              </div>
            ))}
          </div>
        ) : (
          <WalletStack t={100} at={0} width={346} spread={66} />
        )}
      </div>
    </div>
  </Screen>
)

/* Carte de fidélité en papier : carton kraft, neuf tampons sur dix, une tache de café */
const PaperTex = ({ stamps = 9 }) => (
  <AbsoluteFill className="paper">
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <filter id="kraft">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="3" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.12  0 0 0 0.55 0" />
      </filter>
      <filter id="fibres">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.18" numOctaves="2" seed="11" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0.35 -0.05" />
      </filter>
      <filter id="encre">
        <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="2" seed="5" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="9" />
      </filter>
    </svg>
    <svg width="1700" height="1100" style={{ position: 'absolute', inset: 0 }}>
      <rect width="1700" height="1100" filter="url(#kraft)" />
      <rect width="1700" height="1100" filter="url(#fibres)" />
      {/* tache de café */}
      <circle cx="1330" cy="820" r="190" fill="none" stroke="rgba(92,52,18,0.28)" strokeWidth="20" filter="url(#encre)" />
      <circle cx="1330" cy="820" r="170" fill="rgba(92,52,18,0.06)" />
    </svg>
    <div className="paper-head">
      <div className="paper-name">Le Petit Comptoir</div>
      <div className="paper-sub">CARTE DE FIDÉLITÉ</div>
    </div>
    <div className="paper-grid">
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="paper-slot">
          {i < stamps && (
            <div className="paper-stamp" style={{ transform: `rotate(${[-14, 9, -4, 18, -11, 6, -19, 12, -7][i % 9]}deg) translate(${(i * 7) % 11 - 5}px, ${(i * 5) % 9 - 4}px)` }}>
              <span>★</span>
            </div>
          )}
          {i === 9 && <div className="paper-ten">10</div>}
        </div>
      ))}
    </div>
    <div className="paper-foot">10 tampons = 1 café offert</div>
  </AbsoluteFill>
)

/* Notification seule (sort de l'écran en 3D) et bulle de proximité, fond transparent, ×2 */
const NotifTex = ({ title = 'Maison Lumière', body, time = 'maintenant' }) => (
  <AbsoluteFill className="fzx" style={{ fontFamily }}>
    <div style={{ width: 372, transform: 'scale(2)', transformOrigin: '0 0', padding: 4 }}>
      <Notif title={title} body={body} time={time} style={{ background: 'rgba(40, 40, 44, 0.96)' }} />
    </div>
  </AbsoluteFill>
)
const ToastTex = () => (
  <AbsoluteFill className="fzx" style={{ fontFamily, alignItems: 'flex-start' }}>
    <div style={{ transform: 'scale(2)', transformOrigin: '0 0', padding: 4, display: 'inline-block' }}>
      <div className="gv-toast" style={{ position: 'static', whiteSpace: 'nowrap' }}>
        <span className="notif-app sm"><span /><span /><span /></span>
        Maison Lumière est à 50 m
      </div>
    </div>
  </AbsoluteFill>
)

const QrTex = () => (
  <AbsoluteFill className="qr-plaque">
    <div className="qr-t2">Carte de fidélité</div>
    <div className="qr-box"><QRCode /></div>
    <div className="qr-t1">Scanne-moi</div>
  </AbsoluteFill>
)

export const Tex = ({ kind, ...p }) => {
  if (kind === 'qr') return <QrTex />
  if (kind === 'notif') return <NotifTex {...p} />
  if (kind === 'toast') return <ToastTex {...p} />
  if (kind === 'pass') return <PassTex {...p} />
  if (kind === 'lock') return <LockTex {...p} />
  if (kind === 'wallet') return <WalletTex {...p} />
  if (kind === 'paper') return <PaperTex {...p} />
  return null
}
