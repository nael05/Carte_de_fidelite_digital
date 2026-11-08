import { Img, staticFile } from 'remotion'
import { QRCode } from '../Pass'
import { C, SH, SW, clamp, font, spring, ts } from './kit'

/* Carte papier à tampons (carte classique d'un café) : papier crème, 10 cases, `stamps` tampons à l'encre.
   pop : instants d'apparition de chaque tampon (sinon tous visibles). */
export const CartePapier = ({ width = 640, stamps = 9, t = 0, pop, shop = 'Maison Lumière', torn = 0, worn = 0.4, glowLast = 0 }) => {
  const h = width * 0.62, u = width / 640
  return (
    <div style={{ width, height: h, position: 'relative', borderRadius: 14 * u, background: '#f3ead8', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(0,0,0,0.06)', overflow: 'hidden', fontFamily: 'Georgia, "Times New Roman", serif', color: '#5a3a24' }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.55 }}>
        <filter id="papier"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="11" /><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.35 0" /></filter>
        <rect width="100%" height="100%" filter="url(#papier)" />
      </svg>
      {/* usure : coins jaunis, pli */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(120% 90% at 50% 50%, transparent 55%, rgba(150,110,60,${0.35 * worn}))` }} />
      <div style={{ position: 'absolute', left: '61%', top: 0, bottom: 0, width: 2 * u, background: `rgba(120,90,60,${0.25 * worn})`, boxShadow: `0 0 ${6 * u}px rgba(255,255,255,${0.5 * worn})` }} />
      <div style={{ position: 'absolute', left: 34 * u, top: 28 * u, right: 34 * u }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 38 * u, fontStyle: 'italic', fontWeight: 700 }}>{shop}</span>
          <span style={{ fontSize: 17 * u, letterSpacing: '0.12em', fontFamily: font, fontWeight: 600, opacity: 0.7 }}>CARTE DE FIDÉLITÉ</span>
        </div>
        <div style={{ fontSize: 19 * u, marginTop: 6 * u, opacity: 0.75, fontFamily: font }}>Le 10<sup>e</sup> café vous est offert</div>
      </div>
      <div style={{ position: 'absolute', left: 34 * u, right: 34 * u, top: 150 * u, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', rowGap: 22 * u, justifyItems: 'center' }}>
        {[...Array(10)].map((_, i) => {
          const on = i < stamps && (!pop || t >= pop[i])
          const p = pop && on ? clamp((t - pop[i]) / 0.12) : 1
          const r = ((i * 47) % 30) - 15
          const last = i === 9
          return (
            <div key={i} style={{ width: 84 * u, height: 84 * u, borderRadius: '50%', border: `${2.5 * u}px dashed rgba(90,58,36,${last ? 0.6 : 0.35})`, position: 'relative', display: 'grid', placeItems: 'center', boxShadow: last && glowLast ? `0 0 ${40 * glowLast * u}px rgba(255,90,70,${0.8 * glowLast}), inset 0 0 ${20 * glowLast * u}px rgba(255,90,70,${0.5 * glowLast})` : undefined }}>
              {last && !on && <span style={{ fontFamily: font, fontSize: 15 * u, fontWeight: 700, opacity: 0.55, letterSpacing: '0.04em' }}>OFFERT</span>}
              {on && (
                <div style={{ position: 'absolute', inset: 4 * u, borderRadius: '50%', border: `${4 * u}px solid rgba(178,34,52,0.82)`, display: 'grid', placeItems: 'center', transform: `rotate(${r}deg) scale(${1.6 - 0.6 * p})`, opacity: p, mixBlendMode: 'multiply' }}>
                  <svg width={40 * u} height={40 * u} viewBox="0 0 24 24" fill="none" stroke="rgba(178,34,52,0.9)" strokeWidth="2.2" strokeLinecap="round"><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" /><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" /><path d="M8 3c0 1.5 1 1.5 1 3M12 3c0 1.5 1 1.5 1 3" /></svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
      {torn > 0 && <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: 0 }} />}
    </div>
  )
}

/* Téléphone Android (bord fin, caméra perforée), même géométrie d'écran que l'iPhone */
export const Android = ({ x = 540, y = 960, s = 1.6, rx = 0, ry = 0, rz = 0, o = 1, children, persp = 2600 }) => {
  const FW = SW + 22, FH = SH + 22
  return (
    <div style={{ position: 'absolute', left: x - FW / 2, top: y - FH / 2, width: FW, height: FH, transform: `scale(${s})`, opacity: o, perspective: persp }}>
      <div style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d', transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}>
        <div style={{ position: 'absolute', left: '8%', right: '8%', top: '12%', bottom: '-4%', borderRadius: 70, background: 'rgba(0,0,0,0.7)', filter: 'blur(50px)', transform: 'translateZ(-12px)' }} />
        {[...Array(7)].map((_, i) => <div key={i} style={{ position: 'absolute', inset: -3, borderRadius: 58, background: i % 2 ? '#2f3a3f' : '#435057', transform: `translateZ(${-8 + i * 2}px)` }} />)}
        <div style={{ position: 'absolute', right: -6, top: 200, width: 5, height: 120, borderRadius: 3, background: '#56646b' }} />
        <div style={{ position: 'absolute', inset: -3, borderRadius: 58, background: 'linear-gradient(140deg,#7d8b92,#2c3539 40%,#55636a)', transform: 'translateZ(5px)' }} />
        <div style={{ position: 'absolute', inset: 0, borderRadius: 55, background: '#000', transform: 'translateZ(5.2px)' }} />
        <div style={{ position: 'absolute', left: 11, top: 11, width: SW, height: SH, borderRadius: 46, overflow: 'hidden', background: '#000', transform: 'translateZ(5.4px)' }}>
          {children}
          <div style={{ position: 'absolute', left: 0, top: 0, width: SW, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 26px 0', boxSizing: 'border-box', fontFamily: font, color: '#fff', fontSize: 15, fontWeight: 500, zIndex: 30 }}>
            <span>9:41</span>
            <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
              <svg width="14" height="12" viewBox="0 0 14 12"><path d="M7 11 0.5 3.2a10 10 0 0 1 13 0z" fill="#fff" /></svg>
              <svg width="12" height="12" viewBox="0 0 12 12"><path d="M11 1v10H1z" fill="#fff" /></svg>
              <svg width="9" height="14" viewBox="0 0 9 14"><rect x="0.5" y="1.5" width="8" height="12" rx="1.5" fill="#fff" /><rect x="3" y="0" width="3" height="2" fill="#fff" /></svg>
            </span>
          </div>
          <div style={{ position: 'absolute', left: SW / 2 - 9, top: 14, width: 18, height: 18, borderRadius: 9, background: '#000', boxShadow: '0 0 0 2px #111', zIndex: 31 }} />
        </div>
      </div>
    </div>
  )
}

/* Application Google Wallet (Android) : titre et la carte */
export const GoogleWalletApp = ({ children }) => (
  <div style={{ position: 'absolute', inset: 0, background: '#131314', fontFamily: font, color: '#e3e3e3' }}>
    <div style={{ position: 'absolute', top: 58, left: 22, right: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 24, fontWeight: 500 }}>
        <svg width="28" height="28" viewBox="0 0 48 48"><path d="M8 12h32v8H8z" fill="#4285f4" /><path d="M8 20h32v8H8z" fill="#34a853" /><path d="M8 28h32v8H8z" fill="#fbbc04" /><path d="M8 34h32v4a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" fill="#ea4335" /></svg>
        Wallet
      </span>
      <span style={{ width: 34, height: 34, borderRadius: 17, background: '#5e7ce2', display: 'grid', placeItems: 'center', fontSize: 16, color: '#fff', fontWeight: 600 }}>C</span>
    </div>
    {children}
  </div>
)

/* Présentoir de comptoir avec le QR code d'inscription (ce que le commerçant imprime depuis « Recruter ») */
export const Presentoir = ({ width = 420, name = 'Maison Lumière' }) => {
  const u = width / 420
  return (
    <div style={{ width, height: width * 1.42, borderRadius: 26 * u, background: 'linear-gradient(160deg, rgba(255,255,255,0.5), rgba(255,255,255,0.15))', padding: 14 * u, boxSizing: 'border-box', boxShadow: '0 50px 80px -30px rgba(0,0,0,0.7), inset 0 0 0 1.5px rgba(255,255,255,0.6)' }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 16 * u, background: '#111113', color: '#fff', fontFamily: font, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: `${34 * u}px ${28 * u}px`, boxSizing: 'border-box' }}>
        <div style={{ width: 64 * u, height: 64 * u, borderRadius: 16 * u, background: 'linear-gradient(135deg, #f6e4c8, #b8926a)', color: '#1d1d1f', display: 'grid', placeItems: 'center', fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 32 * u }}>L</div>
        <div style={{ fontSize: 30 * u, fontWeight: 700, marginTop: 14 * u, letterSpacing: '-0.02em' }}>{name}</div>
        <div style={{ fontSize: 18 * u, color: C.champagne, marginTop: 4 * u }}>Votre carte de fidélité</div>
        <div style={{ width: 250 * u, height: 250 * u, background: '#fff', borderRadius: 20 * u, padding: 18 * u, boxSizing: 'border-box', marginTop: 26 * u, color: '#000' }}><QRCode /></div>
        <div style={{ fontSize: 17 * u, color: C.muted, marginTop: 22 * u, textAlign: 'center', lineHeight: 1.35 }}>Scannez avec l'appareil photo<br />Apple Wallet · Google Wallet</div>
      </div>
    </div>
  )
}

/* Vue de l'appareil photo iOS qui vise le présentoir : cadre jaune et pastille du lien détecté */
export const VueCamera = ({ t, detect = 0, zoom = 1 }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#2a1d14', fontFamily: font }}>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 50% at 50% 70%, #6b4a2f, #2a1d14)', filter: 'blur(2px)' }} />
    <div style={{ position: 'absolute', left: SW / 2 - 130 * zoom, top: 250 - 40 * (zoom - 1), transform: `scale(${0.62 * zoom}) rotate(${-2 + Math.sin(t * 1.5) * 0.6}deg)`, transformOrigin: '0 0', filter: 'blur(0.4px)' }}><Presentoir /></div>
    {detect > 0 && (
      <>
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => (
          <div key={`${i}${j}`} style={{ position: 'absolute', left: SW / 2 - 92 + i * 154, top: 395 + j * 154, width: 30, height: 30, borderColor: '#ffd60a', borderStyle: 'solid', borderWidth: `${j ? 0 : 4}px ${i ? 4 : 0}px ${j ? 4 : 0}px ${i ? 0 : 4}px`, borderRadius: 8, opacity: detect, transform: `scale(${1.3 - 0.3 * detect})` }} />
        ))}
        <div style={{ position: 'absolute', left: '50%', top: 620, transform: `translateX(-50%) translateY(${(1 - detect) * 20}px)`, opacity: detect, background: '#ffd60a', color: '#000', borderRadius: 14, padding: '9px 16px', fontSize: 15, fontWeight: 600, display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.4"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18" /></svg>
          fidelyzapp.fr
        </div>
      </>
    )}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 200, background: 'rgba(0,0,0,0.85)' }}>
      <div style={{ textAlign: 'center', color: '#ffd60a', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', marginTop: 18 }}>PHOTO</div>
      <div style={{ position: 'absolute', left: SW / 2 - 38, top: 60, width: 76, height: 76, borderRadius: 38, border: '4px solid #fff', boxSizing: 'border-box' }}><div style={{ position: 'absolute', inset: 4, borderRadius: '50%', background: '#fff' }} /></div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 100, background: 'rgba(0,0,0,0.6)' }} />
  </div>
)

/* Boutons officiels « Ajouter à Apple Wallet » / Google Wallet (fichiers du site) */
export const BoutonApple = ({ h = 64 }) => <Img src={staticFile('campagne/apple-wallet-button.png')} style={{ height: h }} />
export const BoutonGoogle = ({ h = 64 }) => <Img src={staticFile('campagne/google-wallet-button.svg')} style={{ height: h }} />

/* Façade de boutique stylisée (store et vitrine), pour les mises en scène */
export const Boutique = ({ width = 420, name = 'Maison Lumière', awning = '#1c1c1e', stripe = '#e3c9a4', lit = 1, sign = '#e3c9a4' }) => {
  const u = width / 420
  return (
    <div style={{ width, height: width * 1.05, position: 'relative', fontFamily: font }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 70 * u, background: '#2a2a2e', borderRadius: `${10 * u}px ${10 * u}px 0 0`, display: 'grid', placeItems: 'center', color: sign, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, fontSize: 32 * u }}>{name}</div>
      <div style={{ position: 'absolute', left: -14 * u, right: -14 * u, top: 70 * u, height: 60 * u, background: `repeating-linear-gradient(90deg, ${awning} 0 ${30 * u}px, ${stripe} ${30 * u}px ${60 * u}px)`, clipPath: `polygon(0 0, 100% 0, 100% 70%, ${96.5}% 100%, ${93}% 70%, 89.5% 100%, 86% 70%, 82.5% 100%, 79% 70%, 75.5% 100%, 72% 70%, 68.5% 100%, 65% 70%, 61.5% 100%, 58% 70%, 54.5% 100%, 51% 70%, 47.5% 100%, 44% 70%, 40.5% 100%, 37% 70%, 33.5% 100%, 30% 70%, 26.5% 100%, 23% 70%, 19.5% 100%, 16% 70%, 12.5% 100%, 9% 70%, 5.5% 100%, 2% 70%, 0 100%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 125 * u, bottom: 0, background: '#1a1a1d', boxShadow: 'inset 0 0 0 2px #2c2c30' }}>
        <div style={{ position: 'absolute', left: 22 * u, top: 30 * u, width: 230 * u, bottom: 22 * u, borderRadius: 6 * u, background: `linear-gradient(180deg, rgba(255,200,130,${0.55 * lit}), rgba(255,170,90,${0.25 * lit}))`, boxShadow: `0 0 ${60 * u * lit}px rgba(255,180,100,${0.35 * lit})` }} />
        <div style={{ position: 'absolute', right: 22 * u, top: 30 * u, width: 120 * u, bottom: 0, borderRadius: `${6 * u}px ${6 * u}px 0 0`, background: '#0d0d0f', boxShadow: 'inset 0 0 0 2px #333' }}>
          <div style={{ position: 'absolute', right: 14 * u, top: '55%', width: 8 * u, height: 8 * u, borderRadius: '50%', background: '#c9a57c' }} />
        </div>
      </div>
    </div>
  )
}
