import { useId, useMemo } from 'react'
import './pass.css'

/* QR code déterministe — identique à Home.jsx */
export const QRCode = () => {
  const d = useMemo(() => {
    const N = 25
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    let path = ''
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y)) continue
        if (rnd() > 0.52) path += `M${x} ${y}h1v1h-1z`
      }
    }
    const finder = (fx, fy) => `M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5zM${fx + 2} ${fy + 2}h3v3h-3z`
    return path + finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7)
  }, [])
  return (
    <svg viewBox="0 0 25 25" shapeRendering="crispEdges">
      <path d={d} fillRule="evenodd" fill="currentColor" />
    </svg>
  )
}

/* Bannière du pass : café vu de dessus — identique à Home.jsx (ids uniques par instance) */
export const StripPhoto = () => {
  const u = useId().replace(/:/g, '')
  const id = n => `${u}${n}`
  const url = n => `url(#${u}${n})`
  return (
    <svg className="wp-photo" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={id('Wood')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b3a22" />
          <stop offset="55%" stopColor="#3f2615" />
          <stop offset="100%" stopColor="#24150b" />
        </linearGradient>
        <filter id={id('Grain')} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.32" numOctaves="3" seed="8" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0 0.01  0 0 0 1.1 -0.35" />
        </filter>
        <filter id={id('Blur6')}><feGaussianBlur stdDeviation="6" /></filter>
        <filter id={id('Blur2')}><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id={id('Soft')}><feGaussianBlur stdDeviation="0.5" /></filter>
        <radialGradient id={id('Saucer')} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#ebe6df" />
          <stop offset="100%" stopColor="#c9c1b6" />
        </radialGradient>
        <radialGradient id={id('Cup')} cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#e9e4dd" />
          <stop offset="100%" stopColor="#bdb4a8" />
        </radialGradient>
        <radialGradient id={id('Coffee')} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d9a46a" />
          <stop offset="55%" stopColor="#a5642f" />
          <stop offset="88%" stopColor="#6a3816" />
          <stop offset="100%" stopColor="#3d1f0b" />
        </radialGradient>
        <radialGradient id={id('Bean')} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#7a4523" />
          <stop offset="100%" stopColor="#24120a" />
        </radialGradient>
        <linearGradient id={id('Spoon')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f4f6" />
          <stop offset="50%" stopColor="#a9a9b0" />
          <stop offset="100%" stopColor="#e3e3e8" />
        </linearGradient>
        <radialGradient id={id('Light')} cx="15%" cy="0%" r="90%">
          <stop offset="0%" stopColor="#fff3df" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#fff3df" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('Vignette')} cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      <rect width="320" height="120" fill={url('Wood')} />
      <rect width="320" height="120" filter={url('Grain')} />
      <path d="M0 38 H320 M0 82 H320" stroke="#1a0e06" strokeOpacity="0.5" strokeWidth="1.2" />

      {[[46, 30, -20], [72, 86, 35], [104, 52, 10], [30, 72, 60], [128, 98, -40], [150, 22, 25]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse cx="2" cy="3" rx="7.5" ry="5.4" fill="#000" opacity="0.45" filter={url('Blur2')} />
          <ellipse rx="7.5" ry="5.4" fill={url('Bean')} />
          <path d="M-6 0 C -2 -2.4, 2 2.4, 6 0" stroke="#160a04" strokeWidth="1.1" fill="none" />
        </g>
      ))}

      <ellipse cx="232" cy="70" rx="54" ry="52" fill="#000" opacity="0.55" filter={url('Blur6')} />
      <circle cx="224" cy="60" r="50" fill={url('Saucer')} />
      <circle cx="224" cy="60" r="38" fill="none" stroke="#000" strokeOpacity="0.07" strokeWidth="2" />
      <g transform="rotate(-38 190 92)">
        <rect x="150" y="89" width="40" height="3.4" rx="1.7" fill={url('Spoon')} />
        <ellipse cx="196" cy="90.7" rx="9" ry="5.5" fill={url('Spoon')} />
      </g>
      <rect x="250" y="53" width="24" height="13" rx="6.5" fill={url('Cup')} />
      <circle cx="226" cy="58" r="31" fill="#000" opacity="0.25" filter={url('Blur2')} />
      <circle cx="224" cy="58" r="30" fill={url('Cup')} />
      <circle cx="224" cy="58" r="24.5" fill={url('Coffee')} />
      <g filter={url('Soft')} fill="none" stroke="#f3e2c8" strokeLinecap="round">
        <path d="M212 70 Q224 64 236 70" strokeWidth="1.6" strokeOpacity="0.55" />
        <path d="M214 74 Q224 69 234 74" strokeWidth="1.3" strokeOpacity="0.4" />
      </g>
      <path
        d="M224 66 C 213 59, 211 50, 217 47.5 C 221 46, 224 49, 224 51.5 C 224 49, 227 46, 231 47.5 C 237 50, 235 59, 224 66 Z"
        fill="#f6e8d2"
        filter={url('Soft')}
      />
      <ellipse cx="216" cy="49" rx="6" ry="3" fill="#fff" opacity="0.18" />
      <rect width="320" height="120" fill={url('Light')} />
      <rect width="320" height="120" fill={url('Vignette')} />
    </svg>
  )
}

/* Compteur à rouleaux : chaque chiffre défile comme un odomètre */
export const Odometer = ({ value }) => {
  const v = Math.max(0, value)
  const n = Math.max(1, String(Math.floor(v)).length)
  const places = Array.from({ length: n }, (_, i) => 10 ** (n - 1 - i))
  return (
    <span style={{ display: 'inline-flex' }}>
      {places.map(p => {
        const base = Math.floor(v / p) % 10
        const frac = p === 1 ? v - Math.floor(v) : Math.max(0, (v % p) - (p - 1))
        return (
          <span key={p} style={{ display: 'inline-block', height: '1em', overflow: 'hidden', lineHeight: 1 }}>
            <span style={{ display: 'flex', flexDirection: 'column', transform: `translateY(${-(base + frac)}em)` }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((x, i) => (
                <span key={i} style={{ height: '1em', lineHeight: 1 }}>{x}</span>
              ))}
            </span>
          </span>
        )
      })}
    </span>
  )
}

/* Pass Apple Wallet — même structure que Card3D (Home.jsx) et l'aperçu du CardCustomizer */
export const Pass = ({
  width = 380, rx = 0, ry = 0, rz = 0,
  skin = 'graphite', points = 480, name = 'Maison Lumière', mark = 'L', holder = 'CAMILLE', cardId = '2BF10B',
  scan = null, light = 0.35, strip = 1, stripShift = 0, markScale = 1, markOpacity = 1,
  perspective = 2200, style,
}) => (
  <div style={{ perspective, ...style }}>
    <div
      className={`c3 c3-${skin}`}
      style={{ '--card-w': `${width}px`, '--mx': light, '--my': 0.3, transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)` }}
    >
      <div className="c3-edge">
        {[0, 1, 2, 3, 4, 5, 6].map(i => <span key={i} style={{ '--z': i }} />)}
      </div>

      <div className="c3-face c3-front">
        <div className="c3-foil" />
        <div className="wp-head">
          <div className="wp-logo">
            <span className="wp-mark" style={{ transform: `scale(${markScale})`, opacity: markOpacity }}>{mark}</span>
            <span className="wp-org">{name}</span>
          </div>
          <div className="wp-hfield">
            <span className="wp-label">POINTS</span>
            <span className="wp-hval"><Odometer value={points} /></span>
          </div>
        </div>

        <div className="wp-strip">
          <div
            style={{
              position: 'absolute',
              inset: 0,
              clipPath: `inset(0 ${(1 - strip) * 100}% 0 0)`,
            }}
          >
            <div style={{ position: 'absolute', inset: 0, transform: `translateX(${stripShift}px) scale(1.08)` }}>
              <StripPhoto />
            </div>
          </div>
        </div>

        <div className="wp-fields">
          <div className="wp-col">
            <span className="wp-label">BONJOUR</span>
            <span className="wp-val-lg">{holder}</span>
          </div>
          <div className="wp-col wp-right">
            <span className="wp-label">DÉTAILS DES RÉCOMPENSES</span>
            <span className="wp-val">Au dos</span>
          </div>
        </div>

        <div className="wp-barcode">
          <div className="wp-qr">
            <QRCode />
            {scan != null && <span className="c3-scan" style={{ top: `${2 + scan * 94}%` }} />}
          </div>
          <span className="wp-id">N° Carte : {cardId}</span>
        </div>
      </div>

      <div className="c3-face c3-back">
        <div className="wp-back-row">
          <span className="wp-back-label">Détails des récompenses</span>
          <span>500 points = 1 café offert</span>
        </div>
        <div className="wp-back-row">
          <span className="wp-back-label">Solde</span>
          <span>{Math.round(points)} points</span>
        </div>
        <div className="wp-back-row">
          <span className="wp-back-label">Boutique</span>
          <span>{name}</span>
        </div>
        <div className="wp-back-row wp-toggle">
          <span>Mises à jour automatiques</span><i />
        </div>
        <div className="wp-back-row wp-toggle">
          <span>Autoriser les notifications</span><i />
        </div>
      </div>
    </div>
  </div>
)

export const Notif = ({ title, body, time, style }) => (
  <div className="notif" style={style}>
    <span className="notif-app"><span /><span /><span /></span>
    <div className="notif-txt">
      <div className="notif-top"><strong>{title}</strong><span>{time}</span></div>
      <p>{body}</p>
    </div>
  </div>
)
