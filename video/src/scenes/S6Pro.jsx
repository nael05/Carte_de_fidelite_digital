import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { BarChart3, MapPin, Palette, ScanLine, Search, Settings, UserPlus, Users } from 'lucide-react'
import { C, Logo, Spot, Type, camera, fontFamily, geo, inE, ioE, lerp, outE, tw } from '../lib'
import { Notif, Odometer, QRCode } from '../Pass'
import { QR_HANDOFF_WIDTH } from './S5Client'

/* Scène 6 — Pilotage commerçant (54 – 70 s)
   Caisse → Clients → Statistiques, glissement horizontal entre les vues,
   puis la carte du quartier et la notification géolocalisée.
   Tout se réduit enfin en un point de lumière. Les 60 premières images sont sous le rideau de la scène 5. */

const WIN = { x: 160, y: 190, w: 1600, h: 820 }
const SIDE = 250
const VIEW_W = WIN.w - SIDE

const NAV = [
  { icon: ScanLine, label: 'Caisse' },
  { icon: Users, label: 'Clients' },
  { icon: UserPlus, label: 'Recruter' },
  { icon: BarChart3, label: 'Statistiques' },
  { icon: Palette, label: 'Design' },
  { icon: Settings, label: 'Réglages' },
]

const CLIENTS = [
  ['Camille R.', 14, 480, 'Aujourd’hui'],
  ['Hugo M.', 9, 310, 'Hier'],
  ['Léa B.', 22, 760, 'Il y a 2 j'],
  ['Nora K.', 5, 120, 'Il y a 4 j'],
  ['Théo D.', 11, 390, 'Il y a 1 sem.'],
  ['Inès F.', 3, 60, 'Il y a 2 sem.'],
]

const Head = ({ eyebrow, title }) => (
  <div style={{ height: 70 }}>
    <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', color: C.blue }}>{eyebrow}</div>
    <div style={{ fontSize: 40, fontWeight: 700, color: C.text, letterSpacing: '-0.035em', marginTop: 6 }}>{title}</div>
  </div>
)

const Card = ({ children, style }) => (
  <div style={{ borderRadius: 24, background: '#161618', border: `1px solid ${C.line}`, ...style }}>{children}</div>
)

const Caisse = ({ f }) => {
  const ring = tw(f, 82, 112, 0, 1, ioE)
  const ok = tw(f, 112, 126)
  const pts = tw(f, 118, 148, 460, 480)
  const toast = tw(f, 120, 138, 0, 1, ioE) * (1 - tw(f, 196, 210))
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 48 }}>
      <Head eyebrow="ENCAISSER" title="Caisse" />
      <div style={{ position: 'absolute', left: 48, top: 160, width: 440, height: 440, borderRadius: 28, overflow: 'hidden', background: 'radial-gradient(circle at 50% 40%, #26262a, #0c0c0e)' }}>
        <div style={{ position: 'absolute', left: 110, top: 110, width: 220, height: 220, padding: 18, borderRadius: 18, background: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <QRCode />
        </div>
        {[[0, 0, 0], [1, 0, 90], [1, 1, 180], [0, 1, 270]].map(([x, y, r], i) => (
          <div key={i} style={{ position: 'absolute', left: 70 + x * 260, top: 70 + y * 260, width: 40, height: 40, borderTop: '4px solid #fff', borderLeft: '4px solid #fff', borderTopLeftRadius: 14, transform: `rotate(${r}deg)`, transformOrigin: '20px 20px', opacity: 0.85 }} />
        ))}
        <svg width="440" height="440" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="220" cy="220" r="196" fill="none" stroke={C.blue} strokeWidth="5" strokeLinecap="round" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - ring} transform="rotate(-90 220 220)" style={{ filter: 'drop-shadow(0 0 10px rgba(41,151,255,0.8))' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, background: `rgba(41,151,255,${0.18 * ok * (1 - tw(f, 130, 160))})` }} />
      </div>

      <Card style={{ position: 'absolute', left: 540, top: 160, width: 760, height: 440, padding: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 68, height: 68, borderRadius: 34, background: 'linear-gradient(135deg, #2997ff, #0b3a8f)', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, color: '#fff' }}>C</div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.text, letterSpacing: '-0.03em' }}>Camille R.</div>
            <div style={{ fontSize: 17, color: C.muted, marginTop: 4 }}>Carte 2BF10B · cliente depuis mars</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 50 }}>
          <div style={{ fontSize: 120, fontWeight: 600, color: C.text, letterSpacing: '-0.05em', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            <Odometer value={pts} />
          </div>
          <div style={{ fontSize: 26, color: C.muted }}>points</div>
        </div>
        <div style={{ marginTop: 34, height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div style={{ width: `${(pts / 500) * 100}%`, height: '100%', borderRadius: 5, background: `linear-gradient(90deg, ${C.blue}, ${C.champagne})` }} />
        </div>
        <div style={{ marginTop: 14, fontSize: 18, color: C.muted }}>
          Plus que {500 - Math.round(pts)} points avant le café offert
        </div>
      </Card>

      <div style={{ position: 'absolute', right: 48, top: 48, opacity: toast, transform: `translateY(${(1 - toast) * -24}px)`, display: 'flex', alignItems: 'center', gap: 12, padding: '14px 22px', borderRadius: 999, background: '#1c1c1e', border: `1px solid ${C.line}`, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
        <div style={{ width: 26, height: 26, borderRadius: 13, background: C.blueBtn, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 15, fontWeight: 700 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: C.text }}>+20 points ajoutés</div>
      </div>
    </div>
  )
}

const Clients = ({ f }) => (
  <div style={{ position: 'absolute', inset: 0, padding: 48 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <Head eyebrow="VOTRE CLIENTÈLE" title="Clients" />
      <div style={{ width: 360, height: 50, borderRadius: 14, background: '#1c1c1e', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', color: C.muted, fontSize: 17 }}>
        <Search size={18} /> Rechercher un client
      </div>
    </div>
    <Card style={{ marginTop: 34, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', padding: '18px 30px', fontSize: 14, fontWeight: 700, letterSpacing: '0.08em', color: C.muted, borderBottom: `1px solid ${C.line}` }}>
        <span>CLIENT</span><span>VISITES</span><span>POINTS</span><span>DERNIER PASSAGE</span>
      </div>
      {CLIENTS.map(([n, v, p, d], i) => {
        const t = tw(f, 226 + i * 5, 250 + i * 5)
        return (
          <div key={n} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr', alignItems: 'center', padding: '17px 30px', fontSize: 19, color: C.text, borderBottom: i < 5 ? `1px solid ${C.line}` : 'none', opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 14, fontWeight: 600 }}>
              <span style={{ width: 38, height: 38, borderRadius: 19, background: i % 2 ? '#2c2c2e' : 'rgba(41,151,255,0.18)', color: i % 2 ? C.champagne : C.blue, display: 'grid', placeItems: 'center', fontSize: 16, fontWeight: 700 }}>{n[0]}</span>
              {n}
            </span>
            <span style={{ color: C.muted }}>{v}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{p}</span>
            <span style={{ color: C.muted }}>{d}</span>
          </div>
        )
      })}
    </Card>
  </div>
)

const LINE = 'M0 100 C 30 95, 50 88, 75 84 S 120 70, 150 66 S 200 48, 225 40 S 270 22, 300 14'
// Point de la courbe à t = 0,82 du dernier segment (coordonnées du viewBox 300 × 120)
// et sa position à l'écran : vue Statistiques, carte du graphique en haut à 316 px.
const DOT = { vx: 284.7, vy: 18.5 }
const DOT_GLOBAL = { x: WIN.x + SIDE + 48 + (DOT.vx / 300) * (VIEW_W - 96), y: WIN.y + 316 + 90 + (DOT.vy / 120) * 290 }
const QR_GLOBAL = { x: WIN.x + SIDE + 48 + 110 + 110, y: WIN.y + 160 + 110 + 110 }

const Stats = ({ f }) => {
  const kpi = tw(f, 314, 356)
  const draw = tw(f, 320, 384, 0, 1, ioE)
  const area = tw(f, 350, 390)
  const K = [
    ['Clients actifs', 248],
    ['Passages ce mois', 1204],
    ['Récompenses offertes', 86],
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, padding: 48 }}>
      <Head eyebrow="PERFORMANCE" title="Statistiques" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 34 }}>
        {K.map(([l, v]) => (
          <Card key={l} style={{ padding: '26px 30px', height: 144 }}>
            <div style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>{l}</div>
            <div style={{ fontSize: 54, fontWeight: 700, color: C.text, letterSpacing: '-0.04em', marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(v * kpi).toLocaleString('fr-FR')}
            </div>
          </Card>
        ))}
      </div>
      <Card style={{ marginTop: 20, height: 380, padding: 30, position: 'relative', overflow: 'hidden' }}>
        <div style={{ fontSize: 16, color: C.muted, fontWeight: 600 }}>Passages, 6 derniers mois</div>
        <svg viewBox="0 0 300 120" preserveAspectRatio="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: 290 }}>
          <defs>
            <linearGradient id="s6Fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2997ff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#2997ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="s6Line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5e9cff" />
              <stop offset="100%" stopColor="#e3c9a4" />
            </linearGradient>
          </defs>
          <path d={`${LINE} V120 H0Z`} fill="url(#s6Fill)" opacity={area} />
          <path d={LINE} fill="none" stroke="url(#s6Line)" strokeWidth="0.9" pathLength="1" strokeDasharray="1" strokeDashoffset={1 - draw} />
        </svg>
        {/* Dernier point de la courbe : la caméra y plonge, il devient l'épingle de la boutique */}
        <div
          style={{
            position: 'absolute',
            left: `calc(${(DOT.vx / 300) * 100}% - 5px)`,
            top: 90 + (DOT.vy / 120) * 290 - 5,
            width: 10,
            height: 10,
            borderRadius: 5,
            background: C.blueBtn,
            boxShadow: '0 0 0 3px rgba(41,151,255,0.25), 0 0 14px rgba(41,151,255,0.9)',
            opacity: tw(f, 376, 388),
          }}
        />
      </Card>
    </div>
  )
}

const Dashboard = ({ f }) => {
  const viewPos = tw(f, 210, 238, 0, 1, ioE) + tw(f, 300, 328, 0, 1, ioE)
  const hl = interpolate(viewPos, [0, 1, 2], [0, 1, 3])
  return (
    <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, borderRadius: 26, overflow: 'hidden', background: C.surface, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 60px 140px -40px rgba(0,0,0,0.95)', fontFamily }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: SIDE, borderRight: `1px solid ${C.line}`, padding: '28px 18px', background: '#0c0c0d' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px' }}>
          <Logo size={38} style={{ boxShadow: 'none' }} />
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: C.text, letterSpacing: '-0.02em' }}>Fidelyz</div>
            <div style={{ fontSize: 13, color: C.muted }}>Maison Lumière</div>
          </div>
        </div>
        <div style={{ position: 'relative', marginTop: 36 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: hl * 52, height: 46, borderRadius: 12, background: 'rgba(41,151,255,0.14)' }} />
          {NAV.map(({ icon: Icon, label }, i) => {
            const on = Math.max(0, 1 - Math.abs(hl - i))
            return (
              <div key={label} style={{ position: 'relative', height: 46, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px', fontSize: 17, fontWeight: 600, color: on > 0.5 ? C.blue : 'rgba(245,245,247,0.7)' }}>
                <Icon size={20} strokeWidth={2} />
                {label}
              </div>
            )
          })}
        </div>
      </div>
      <div style={{ position: 'absolute', left: SIDE, top: 0, width: VIEW_W, height: WIN.h, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${-viewPos * VIEW_W}px)` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: VIEW_W, height: WIN.h }}><Caisse f={f} /></div>
          <div style={{ position: 'absolute', left: VIEW_W, top: 0, width: VIEW_W, height: WIN.h }}><Clients f={f} /></div>
          <div style={{ position: 'absolute', left: VIEW_W * 2, top: 0, width: VIEW_W, height: WIN.h }}><Stats f={f} /></div>
        </div>
      </div>
    </div>
  )
}

const Geo = ({ f, dark }) => {
  const fence = tw(f, 424, 446)
  const walk = tw(f, 424, 464, 0, 1, ioE)
  const px = lerp(360, 770, walk)
  const py = lerp(860, 650, walk)
  const lit = tw(f, 462, 470)
  const toast = tw(f, 464, 482, 0, 1, ioE)
  const icon = tw(f, 414, 430)
  const world = 1 - dark
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: '#050608', opacity: world * tw(f, 412, 430) }} />
      <AbsoluteFill style={{ opacity: world * tw(f, 412, 436) }}>
      <svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <g fill="none" strokeLinecap="round">
          <path d="M-10 140 C 60 120, 110 160, 180 120 S 290 60, 340 80" stroke="rgba(180,190,210,0.12)" strokeWidth="9" />
          <path d="M40 -10 C 60 60, 90 110, 70 210" stroke="rgba(180,190,210,0.12)" strokeWidth="9" />
          <path d="M210 -10 C 200 70, 240 120, 230 210" stroke="rgba(180,190,210,0.12)" strokeWidth="9" />
          <path d="M-10 60 H 340 M140 -10 V 210 M-10 175 H 340 M285 -10 V 210" stroke="rgba(180,190,210,0.06)" strokeWidth="3" />
          <path d="M-10 140 C 60 120, 110 160, 180 120 S 290 60, 340 80" stroke="rgba(227,201,164,0.14)" strokeWidth="0.6" />
        </g>
      </svg>
      <div style={{ position: 'absolute', left: 960 - 270, top: 540 - 270, width: 540, height: 540, borderRadius: '50%', border: `2px dashed rgba(41,151,255,${0.55 * fence})`, background: `rgba(41,151,255,${0.07 * fence})`, transform: `scale(${0.85 + 0.15 * fence})` }} />
      {[0, 1].map(i => {
        const t = ((f + i * 40) % 80) / 80
        return <div key={i} style={{ position: 'absolute', left: 960 - 30 - t * 90, top: 540 - 30 - t * 90, width: 60 + t * 180, height: 60 + t * 180, borderRadius: '50%', border: '2px solid rgba(41,151,255,0.6)', opacity: (1 - t) * fence }} />
      })}
      <div style={{ position: 'absolute', left: 960 + 46, top: 540 - 18, fontFamily, fontSize: 24, fontWeight: 600, color: C.text, opacity: tw(f, 430, 446) }}>Maison Lumière</div>

      {/* Le client qui passe */}
      <div style={{ position: 'absolute', left: px - 46, top: py - 96, width: 92, height: 192, borderRadius: 22, padding: 5, background: 'linear-gradient(135deg, #a1a1a6, #3a3a3e 40%, #6e6e73)', boxShadow: '0 20px 40px rgba(0,0,0,0.7)' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: 17, background: lit ? `rgba(27,43,77,${lit})` : '#000', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', left: 6, right: 6, top: 40, height: 26, borderRadius: 7, background: 'rgba(60,60,64,0.9)', opacity: lit }} />
        </div>
      </div>

      <div style={{ position: 'absolute', left: 960 - 300, top: 120, width: 600, opacity: toast, transform: `translateY(${(1 - toast) * -60}px) scale(1.5)`, transformOrigin: 'top center' }}>
        <Notif title="Maison Lumière" body="Vous êtes à 50 m. Votre café offert vous attend." time="maintenant" />
      </div>
      </AbsoluteFill>

      {/* L'épingle : née du point de la courbe, elle devient le point de lumière de la scène 7 */}
      <div
        style={{
          position: 'absolute',
          left: 960 - lerp(28, 6, dark),
          top: 540 - lerp(28, 6, dark),
          width: lerp(56, 12, dark),
          height: lerp(56, 12, dark),
          borderRadius: '50%',
          background: C.blueBtn,
          display: 'grid',
          placeItems: 'center',
          color: '#fff',
          boxShadow: `0 0 30px rgba(41,151,255,${0.8 * world})`,
        }}
      >
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#fff8ec', boxShadow: '0 0 24px 8px rgba(227,201,164,0.8)', opacity: dark }} />
        <div style={{ position: 'relative', display: 'grid', opacity: icon * world }}>
          <MapPin size={28} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

// La scène commence à 53,2 s, dans le QR code du client : les temps restent comptés depuis 52 s
const OFF = 36

export const S6Pro = () => {
  const f = useCurrentFrame() + OFF

  // Entrée : la caméra ressort du QR code, qui est maintenant celui du scanner
  const pull = tw(f, OFF + 2, OFF + 50, 0, 1, ioE)
  const camIn = camera(QR_GLOBAL.x, QR_GLOBAL.y, geo(pull, QR_HANDOFF_WIDTH / 184, 1), 1 - pull)

  // Vers la carte : la caméra plonge dans le dernier point de la courbe ;
  // le point se centre d'abord, puis le tableau de bord s'éteint autour de lui
  const dive = tw(f, 378, 410, 0, 1, ioE)
  const dotS = geo(dive, 1, 22)
  const camDot = camera(DOT_GLOBAL.x, DOT_GLOBAL.y, dotS, Math.min(1, dive * 1.5))
  const dashOut = interpolate(dive, [0.72, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  // La carte du quartier ressort de ce point (devenu l'épingle), puis la lumière s'éteint autour d'elle
  const geoIn = f >= 412
  const geoPull = tw(f, 412, 452, 0, 1, ioE)
  const drift = lerp(1, 1.35, tw(f, 470, 540, 0, 1, t => t))
  const dark = tw(f, 510, 536, 0, 1, ioE)

  return (
    <AbsoluteFill style={{ background: C.black, opacity: tw(f, OFF, OFF + 3) }}>
      {!geoIn && (
        <AbsoluteFill style={{ ...(f < 300 ? camIn : camDot), opacity: 1 - dashOut, filter: dive > 0.2 && dive < 1 ? `blur(${Math.sin(Math.PI * dive) * 4}px)` : undefined }}>
          <Spot x={960} y={200} size={1800} color="rgba(255,255,255,0.05)" />
          <Dashboard f={f} />
        </AbsoluteFill>
      )}
      {!geoIn && dashOut > 0 && (
        <div style={{ position: 'absolute', left: 960 - 5 * dotS, top: 540 - 5 * dotS, width: 10 * dotS, height: 10 * dotS, borderRadius: '50%', background: C.blueBtn, boxShadow: '0 0 30px rgba(41,151,255,0.8)', opacity: dashOut }} />
      )}
      {geoIn && (
        <AbsoluteFill style={{ transform: `scale(${geo(geoPull, 220 / 56, 1) * drift})`, transformOrigin: '960px 540px' }}>
          <Geo f={f} dark={dark} />
        </AbsoluteFill>
      )}

      <div style={{ position: 'absolute', left: 160, top: 76, opacity: 1 - dive }}>
        <Type at={62 - OFF + 24} out={204 - OFF} size={56}>Vous encaissez, vous scannez.</Type>
      </div>
      <div style={{ position: 'absolute', left: 160, top: 76, opacity: 1 - dive }}>
        <Type at={214 - OFF} out={372 - OFF} size={56}>Vous suivez vos clients et vos chiffres.</Type>
      </div>
      <div style={{ position: 'absolute', top: 900, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Type at={430 - OFF} out={498 - OFF} size={56}>Au bon moment, près de votre boutique.</Type>
      </div>
    </AbsoluteFill>
  )
}
