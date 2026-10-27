import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, ChevronRight, CheckCircle2, Check, Plus, Search, Loader2, X,
  Play, Bell, MapPin, ShieldCheck, Lock, Repeat, Fingerprint, Store, Palette, Send
} from 'lucide-react'
import api from '../api'
import Footer from '../components/Footer'
import './Home.css'

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/* Progression de scroll d'une section haute (0 → 1), écrite en variable CSS --p */
function useScrollProgress(ref, onProgress) {
  const cb = useRef(onProgress)
  cb.current = onProgress
  useEffect(() => {
    const el = ref.current
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const total = r.height - window.innerHeight
      const p = total > 0 ? clamp(-r.top / total) : 0
      el.style.setProperty('--p', p.toFixed(4))
      if (cb.current) cb.current(p)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])
}

/* Compteur animé à l'apparition */
function Counter({ end, suffix = '', duration = 1600 }) {
  const ref = useRef(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      const t0 = performance.now()
      const tick = now => {
        const t = clamp((now - t0) / duration)
        setN(Math.round(end * ease(t)))
        if (t < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.4 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [end, duration])
  return <span ref={ref}>{n.toLocaleString('fr-FR')}{suffix}</span>
}

/* ═══════════ QR code (SVG déterministe) ═══════════ */
function QRCode({ className }) {
  const d = useMemo(() => {
    const N = 25
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const inFinder = (x, y) =>
      (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
    let path = ''
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        if (inFinder(x, y)) continue
        if (rnd() > 0.52) path += `M${x} ${y}h1v1h-1z`
      }
    }
    const finder = (fx, fy) =>
      `M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5zM${fx + 2} ${fy + 2}h3v3h-3z`
    return path + finder(0, 0) + finder(N - 7, 0) + finder(0, N - 7)
  }, [])
  return (
    <svg className={className} viewBox="0 0 25 25" shapeRendering="crispEdges" aria-hidden>
      <path d={d} fillRule="evenodd" fill="currentColor" />
    </svg>
  )
}

/* Bannière (strip image) du pass : photo vue de dessus d'un café sur une table en bois */
function StripPhoto() {
  return (
    <svg className="wp-photo" viewBox="0 0 320 120" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id="spWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b3a22" />
          <stop offset="55%" stopColor="#3f2615" />
          <stop offset="100%" stopColor="#24150b" />
        </linearGradient>
        <filter id="spGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.32" numOctaves="3" seed="8" />
          <feColorMatrix type="matrix" values="0 0 0 0 0.08  0 0 0 0 0.04  0 0 0 0 0.01  0 0 0 1.1 -0.35" />
        </filter>
        <filter id="spBlur6"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="spBlur2"><feGaussianBlur stdDeviation="1.6" /></filter>
        <filter id="spSoft"><feGaussianBlur stdDeviation="0.5" /></filter>
        <radialGradient id="spSaucer" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#ebe6df" />
          <stop offset="100%" stopColor="#c9c1b6" />
        </radialGradient>
        <radialGradient id="spCup" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#e9e4dd" />
          <stop offset="100%" stopColor="#bdb4a8" />
        </radialGradient>
        <radialGradient id="spCoffee" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d9a46a" />
          <stop offset="55%" stopColor="#a5642f" />
          <stop offset="88%" stopColor="#6a3816" />
          <stop offset="100%" stopColor="#3d1f0b" />
        </radialGradient>
        <radialGradient id="spBean" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#7a4523" />
          <stop offset="100%" stopColor="#24120a" />
        </radialGradient>
        <linearGradient id="spSpoon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4f4f6" />
          <stop offset="50%" stopColor="#a9a9b0" />
          <stop offset="100%" stopColor="#e3e3e8" />
        </linearGradient>
        <radialGradient id="spLight" cx="15%" cy="0%" r="90%">
          <stop offset="0%" stopColor="#fff3df" stopOpacity="0.28" />
          <stop offset="60%" stopColor="#fff3df" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="spVignette" cx="50%" cy="50%" r="75%">
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.55" />
        </radialGradient>
      </defs>

      {/* Table */}
      <rect width="320" height="120" fill="url(#spWood)" />
      <rect width="320" height="120" filter="url(#spGrain)" />
      <path d="M0 38 H320 M0 82 H320" stroke="#1a0e06" strokeOpacity="0.5" strokeWidth="1.2" />

      {/* Grains de café */}
      {[[46, 30, -20], [72, 86, 35], [104, 52, 10], [30, 72, 60], [128, 98, -40], [150, 22, 25]].map(([x, y, r], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
          <ellipse cx="2" cy="3" rx="7.5" ry="5.4" fill="#000" opacity="0.45" filter="url(#spBlur2)" />
          <ellipse rx="7.5" ry="5.4" fill="url(#spBean)" />
          <path d="M-6 0 C -2 -2.4, 2 2.4, 6 0" stroke="#160a04" strokeWidth="1.1" fill="none" />
        </g>
      ))}

      {/* Ombre de la tasse */}
      <ellipse cx="232" cy="70" rx="54" ry="52" fill="#000" opacity="0.55" filter="url(#spBlur6)" />

      {/* Soucoupe */}
      <circle cx="224" cy="60" r="50" fill="url(#spSaucer)" />
      <circle cx="224" cy="60" r="38" fill="none" stroke="#000" strokeOpacity="0.07" strokeWidth="2" />

      {/* Cuillère */}
      <g transform="rotate(-38 190 92)">
        <rect x="150" y="89" width="40" height="3.4" rx="1.7" fill="url(#spSpoon)" />
        <ellipse cx="196" cy="90.7" rx="9" ry="5.5" fill="url(#spSpoon)" />
      </g>

      {/* Tasse + anse */}
      <rect x="250" y="53" width="24" height="13" rx="6.5" fill="url(#spCup)" />
      <circle cx="226" cy="58" r="31" fill="#000" opacity="0.25" filter="url(#spBlur2)" />
      <circle cx="224" cy="58" r="30" fill="url(#spCup)" />

      {/* Café + latte art */}
      <circle cx="224" cy="58" r="24.5" fill="url(#spCoffee)" />
      <g filter="url(#spSoft)" fill="none" stroke="#f3e2c8" strokeLinecap="round">
        <path d="M212 70 Q224 64 236 70" strokeWidth="1.6" strokeOpacity="0.55" />
        <path d="M214 74 Q224 69 234 74" strokeWidth="1.3" strokeOpacity="0.4" />
      </g>
      <path
        d="M224 66 C 213 59, 211 50, 217 47.5 C 221 46, 224 49, 224 51.5 C 224 49, 227 46, 231 47.5 C 237 50, 235 59, 224 66 Z"
        fill="#f6e8d2"
        filter="url(#spSoft)"
      />
      <ellipse cx="216" cy="49" rx="6" ry="3" fill="#fff" opacity="0.18" />

      {/* Lumière et vignettage */}
      <rect width="320" height="120" fill="url(#spLight)" />
      <rect width="320" height="120" fill="url(#spVignette)" />
    </svg>
  )
}

/* ═══════════ Pass Apple Wallet en 3D ═══════════
   Même structure que l'aperçu du CardCustomizer :
   en-tête (logo + POINTS), bannière, champs, QR code. */
const SKINS = [
  { id: 'graphite', label: 'Graphite' },
  { id: 'azur', label: 'Bleu nuit' },
  { id: 'champagne', label: 'Champagne' },
  { id: 'ivory', label: 'Ivoire' },
]

function Card3D({
  skin = 'graphite', points = 480, name = 'Maison Lumière', mark = 'L',
  holder = 'CAMILLE', cardId = '2BF10B', scanning = false,
}) {
  return (
    <div className={`c3 c3-${skin}`}>
      <div className="c3-edge" aria-hidden>
        {[0, 1, 2, 3, 4, 5, 6].map(i => <span key={i} style={{ '--z': i }} />)}
      </div>

      <div className="c3-face c3-front">
        <div className="c3-foil" />
        <div className="wp-head">
          <div className="wp-logo">
            <span className="wp-mark">{mark}</span>
            <span className="wp-org">{name}</span>
          </div>
          <div className="wp-hfield">
            <span className="wp-label">POINTS</span>
            <span className="wp-hval">{points}</span>
          </div>
        </div>

        <div className="wp-strip">
          <StripPhoto />
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
            {scanning && <span className="c3-scan" />}
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
          <span>{points} points</span>
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
  )
}

/* ═══════════ Hero — carte qui suit la souris ═══════════ */
function HeroStage() {
  const stageRef = useRef(null)
  const tiltRef = useRef(null)
  const [pts, setPts] = useState(0)

  useEffect(() => {
    const t0 = performance.now() + 700
    let raf
    const tick = now => {
      const t = clamp((now - t0) / 1600)
      setPts(Math.round(480 * ease(t)))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const tilt = tiltRef.current
    if (!tilt) return
    if (reducedMotion()) {
      tilt.style.transform = 'rotateX(14deg) rotateY(-16deg)'
      return
    }
    let tx = 0, ty = 0, cx = 0, cy = 0, raf
    const move = e => {
      tx = clamp(e.clientX / window.innerWidth, 0, 1) - 0.5
      ty = clamp(e.clientY / window.innerHeight, 0, 1) - 0.5
    }
    const loop = () => {
      const sy = clamp(window.scrollY / window.innerHeight, 0, 1.2)
      if (sy < 1.15) {
        cx += (tx - cx) * 0.07
        cy += (ty - cy) * 0.07
        const rx = 14 - cy * 16 + sy * 26
        const ry = -16 + cx * 30
        tilt.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
        tilt.style.setProperty('--mx', (cx + 0.5).toFixed(3))
        tilt.style.setProperty('--my', (cy + 0.5).toFixed(3))
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="hero-stage" ref={stageRef}>
      <div className="hero-halo" aria-hidden />
      <div className="hero-float">
        <div className="hero-tilt" ref={tiltRef}>
          <Card3D skin="graphite" points={pts} />
          <div className="hero-chip chip-a">
            <span className="chip-ico"><Bell size={13} /></span>
            <span><strong>+20 points</strong> · Maison Lumière</span>
          </div>
          <div className="hero-chip chip-b">
            <span className="chip-ico chip-ok"><Check size={13} strokeWidth={3} /></span>
            <span>Ajoutée au Wallet</span>
          </div>
        </div>
      </div>
      <div className="hero-floor" aria-hidden />
    </div>
  )
}

/* ═══════════ Story — section épinglée au scroll ═══════════ */
const STORY = [
  {
    k: 'Personnalisez',
    h: "À l'image de votre commerce.",
    p: "Logo, couleurs, matière, paliers de récompense. Votre carte ressemble à votre enseigne, pas à un template.",
  },
  {
    k: 'Scannez',
    h: 'Un scan. Une seconde.',
    p: "Le client présente sa carte en caisse. Les points sont crédités instantanément et la carte se met à jour dans son téléphone.",
  },
  {
    k: 'Fidélisez',
    h: 'Il revient. Encore.',
    p: "Notifications push directement sur l'écran verrouillé. Une récompense proche, une offre du moment, un rappel au bon endroit.",
  },
]

function Story() {
  const secRef = useRef(null)
  const cardRef = useRef(null)
  const [stage, setStage] = useState(0)
  const [skin, setSkin] = useState(3)
  const [credited, setCredited] = useState(false)

  useScrollProgress(secRef, p => {
    const s = p < 0.34 ? 0 : p < 0.67 ? 1 : 2
    setStage(s)
    let ry = 0
    let rx = 6
    if (s === 0) {
      const t = p / 0.34
      // Ivoire → Champagne → Bleu nuit → Graphite
      setSkin(3 - Math.min(3, Math.floor(t * 4)))
      ry = -24 + t * 24
    } else if (s === 1) {
      setSkin(0)
      // Un tour complet (on aperçoit le dos du pass), puis le scan
      const t = (p - 0.34) / 0.33
      ry = 360 * ease(clamp(t / 0.5))
      rx = 6 - 4 * Math.sin(Math.PI * clamp(t / 0.5))
    } else {
      setSkin(0)
      const t = (p - 0.67) / 0.33
      ry = 360 + 14 * ease(clamp(t / 0.4))
    }
    setCredited(p > 0.34 + 0.33 * 0.75)
    if (cardRef.current) {
      cardRef.current.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`
    }
  })

  return (
    <section className="story" id="story" ref={secRef}>
      <div className="story-sticky">
        <div className="story-w">
          <div className="story-copy">
            {STORY.map((s, i) => (
              <div key={i} className={`story-step${stage === i ? ' on' : ''}`}>
                <span className="story-k"><em>0{i + 1}</em>{s.k}</span>
                <h2>{s.h}</h2>
                <p>{s.p}</p>
              </div>
            ))}
            <div className="story-bar" aria-hidden><span /></div>
          </div>

          <div className="story-stage">
            <div className="story-light" aria-hidden />
            <div className="story-card" ref={cardRef}>
              <Card3D skin={SKINS[skin].id} points={credited ? 480 : 460} scanning={stage === 1} />
            </div>

            <div className={`story-swatches${stage === 0 ? ' on' : ''}`}>
              {SKINS.map((s, i) => (
                <span key={s.id} className={`sw sw-${s.id}${skin === i ? ' on' : ''}`} title={s.label} />
              ))}
              <span className="sw-label">{SKINS[skin].label}</span>
            </div>

            <div className={`story-tag${stage === 1 && credited ? ' on' : ''}`}>
              <span className="chip-ico chip-ok"><Check size={12} strokeWidth={3} /></span>
              +20 points crédités
            </div>

            <div className={`story-notifs${stage === 2 ? ' on' : ''}`}>
              <Notif title="Maison Lumière" body="Plus que 20 points avant votre café offert." time="maintenant" />
              <Notif title="Maison Lumière" body="Votre récompense vous attend en boutique." time="il y a 2 min" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Notif({ title, body, time }) {
  return (
    <div className="notif">
      <span className="notif-app" aria-hidden><span /><span /><span /></span>
      <div className="notif-txt">
        <div className="notif-top"><strong>{title}</strong><span>{time}</span></div>
        <p>{body}</p>
      </div>
    </div>
  )
}

/* ═══════════ Manifeste — mots qui s'allument au scroll ═══════════ */
const MANIFESTO = "Vos clients n'ont rien à télécharger. Leur carte vit déjà dans leur téléphone, à côté de leur carte bancaire. Toujours à jour. Toujours à portée de main."

function Manifesto() {
  const ref = useRef(null)
  useScrollProgress(ref)
  const words = MANIFESTO.split(' ')
  return (
    <section className="manifesto" ref={ref} style={{ '--n': words.length }}>
      <div className="manifesto-sticky">
        <p className="manifesto-txt">
          {words.map((w, i) => (
            <span key={i} style={{ '--i': i }}>{w} </span>
          ))}
        </p>
      </div>
    </section>
  )
}

/* ═══════════ Visuels du bento ═══════════ */
/* Pile de passes comme dans l'app Wallet */
const WALLET_STACK = [
  { skin: 'ivory', name: 'Atelier Nord', mark: 'A', pts: 120 },
  { skin: 'champagne', name: 'Fleurs & Co', mark: 'F', pts: 260 },
  { skin: 'azur', name: 'Le Comptoir', mark: 'C', pts: 90 },
  { skin: 'graphite', name: 'Maison Lumière', mark: 'L', pts: 480 },
]

function WalletVis() {
  return (
    <div className="wv">
      {WALLET_STACK.map((c, k) => (
        <div key={c.name} className="mp" style={{ '--k': k }}>
          <Card3D skin={c.skin} name={c.name} mark={c.mark} points={c.pts} />
        </div>
      ))}
    </div>
  )
}

function LockVis() {
  return (
    <div className="lv">
      <div className="lv-time">9:41</div>
      <div className="lv-date">Mardi 27 octobre</div>
      <div className="lv-stack">
        <Notif title="Maison Lumière" body="+20 points. Plus que 20 avant votre café." time="maintenant" />
        <Notif title="Fleurs & Co" body="Double points ce week-end sur les bouquets." time="10 min" />
        <Notif title="Le Comptoir" body="Votre 10e déjeuner est offert." time="1 h" />
      </div>
    </div>
  )
}

function GeoVis() {
  return (
    <div className="gv">
      <svg className="gv-map" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <path d="M-10 140 C 60 120, 110 160, 180 120 S 290 60, 340 80" />
        <path d="M40 -10 C 60 60, 90 110, 70 210" />
        <path d="M210 -10 C 200 70, 240 120, 230 210" />
        <path d="M-10 60 H 340" className="thin" />
        <path d="M140 -10 V 210" className="thin" />
      </svg>
      <div className="gv-pin">
        <span className="gv-ring" />
        <span className="gv-ring r2" />
        <span className="gv-dot"><MapPin size={14} /></span>
      </div>
      <div className="gv-toast">
        <span className="notif-app sm" aria-hidden><span /><span /><span /></span>
        Maison Lumière est à 50 m
      </div>
    </div>
  )
}

function ChartVis() {
  return (
    <div className="cv">
      <svg viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="cvFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2997ff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2997ff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cvLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5e9cff" />
            <stop offset="100%" stopColor="#e3c9a4" />
          </linearGradient>
        </defs>
        <path className="cv-area" d="M0 100 C 30 95, 50 88, 75 84 S 120 70, 150 66 S 200 48, 225 40 S 270 22, 300 14 V120 H0Z" fill="url(#cvFill)" />
        <path className="cv-line" d="M0 100 C 30 95, 50 88, 75 84 S 120 70, 150 66 S 200 48, 225 40 S 270 22, 300 14" fill="none" stroke="url(#cvLine)" strokeWidth="2.5" />
      </svg>
      <span className="cv-dot" />
    </div>
  )
}

/* ═══════════ FAQ ═══════════ */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>{q}</span>
        <span className="faq-ico"><Plus size={18} /></span>
      </button>
      <div className="faq-body"><p>{a}</p></div>
    </div>
  )
}

const FAQS = [
  {
    q: "Combien de temps pour créer ma première carte ?",
    a: "Moins de 5 minutes. Compte créé, logo importé, couleurs choisies : vos clients peuvent ajouter leur carte immédiatement.",
  },
  {
    q: "Mes clients ont-ils besoin d'une application ?",
    a: "Non. Apple Wallet et Google Wallet sont déjà installés sur leurs smartphones. Aucun téléchargement, aucune création de compte.",
  },
  {
    q: "Puis-je changer d'offre quand je veux ?",
    a: "Oui, sans frais ni engagement. Passage à l'offre supérieure, inférieure ou résiliation en deux clics depuis votre espace pro.",
  },
  {
    q: "Comment les points sont-ils ajoutés ?",
    a: "Vous scannez la carte du client en caisse. Les points sont crédités en moins d'une seconde et la carte se met à jour dans son Wallet.",
  },
  {
    q: "Mes données clients sont-elles sécurisées ?",
    a: "Hébergement en France, chiffrement des données, authentification sécurisée. Conformité RGPD complète avec export et suppression à la demande.",
  },
]

const PLANS = [
  {
    name: 'Starter',
    tagline: 'Pour découvrir',
    m: 0, a: 0,
    feats: ['1 commerce', "Jusqu'à 50 clients", 'Apple & Google Wallet', 'QR code sécurisé', 'Support par email'],
    cta: 'Commencer gratuitement',
  },
  {
    name: 'Pro',
    tagline: 'Pour les commerçants actifs',
    m: 29, a: 23,
    feats: ['1 commerce', 'Clients illimités', 'Personnalisation complète', 'Notifications push Wallet', 'Statistiques avancées', 'Support 7j/7'],
    cta: 'Essai gratuit de 14 jours',
    featured: true,
  },
  {
    name: 'Business',
    tagline: 'Pour les réseaux',
    m: 79, a: 63,
    feats: ["Jusqu'à 5 commerces", 'Clients illimités', 'Marque blanche', 'API & webhooks', 'SLA 99,9 %', 'Interlocuteur dédié'],
    cta: "Contacter l'équipe",
  },
]

/* ═══════════════════ HOME ═══════════════════ */
export default function Home() {
  const navigate = useNavigate()
  const rootRef = useRef(null)
  const [annual, setAnnual] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.toggle('dark-mode', t === 'dark')
  }, [])

  // Apparition des éléments .rv au scroll
  useEffect(() => {
    const els = rootRef.current ? rootRef.current.querySelectorAll('.rv') : []
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target) }
      })
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goPro = () => navigate('/pro/login')

  return (
    <div className="fz" ref={rootRef}>

      {/* ── NAV ── */}
      <header className={`fz-nav${scrolled ? ' scrolled' : ''}`}>
        <div className="fz-nav-w">
          <a href="/" className="fz-brand">
            <img src="/logo-fidelyz.png" alt="" onError={e => (e.target.style.display = 'none')} />
            <span>Fidelyz</span>
          </a>
          <nav className="fz-links">
            <a href="#story">Produit</a>
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="fz-nav-ctas">
            <button className="fz-nav-login" onClick={goPro}>Connexion</button>
            <button className="fz-btn fz-btn-sm" onClick={goPro}>Commencer</button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <span className="aura aura-1" />
          <span className="aura aura-2" />
          <span className="hero-grid" />
        </div>

        <div className="hero-copy">
          <a href="#story" className="hero-pill">
            <span className="hero-pill-tag">Nouveau</span>
            Notifications push sur l'écran verrouillé
            <ChevronRight size={14} />
          </a>
          <h1 className="hero-title">
            <span className="t-silver">La fidélité,</span>
            <span className="t-grad">réinventée.</span>
          </h1>
          <p className="hero-sub">
            Des cartes de fidélité Apple Wallet et Google Wallet à l'image de votre commerce.
            Prêtes en cinq minutes. Sans application.
          </p>
          <div className="hero-ctas">
            <button className="fz-btn" onClick={goPro}>
              Commencer gratuitement
            </button>
            <a href="#film" className="fz-link">
              Regarder le film <ChevronRight size={16} />
            </a>
          </div>
          <div className="hero-trust">
            <span><Lock size={12} /> Sans carte bancaire</span>
            <span><ShieldCheck size={12} /> Paiement Stripe</span>
            <span><Repeat size={12} /> Sans engagement</span>
          </div>
        </div>

        <HeroStage />
      </section>

      {/* ── STATS ── */}
      <section className="stats">
        <div className="stats-w rv">
          {[
            { n: 2400, s: '+', l: 'cartes actives' },
            { n: 98, s: ' %', l: 'de clients satisfaits' },
            { n: 5, s: ' min', l: 'pour lancer sa carte' },
            { n: 0, s: '', l: 'application à installer', fixed: '0' },
          ].map((st, i) => (
            <div className="stat" key={i}>
              <strong>{st.fixed ? st.fixed : <Counter end={st.n} suffix={st.s} />}</strong>
              <span>{st.l}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── STORY (scroll 3D) ── */}
      <Story />

      {/* ── MANIFESTE ── */}
      <Manifesto />

      {/* ── BENTO ── */}
      <section className="bento-sec" id="features">
        <div className="sec-head rv">
          <span className="eyebrow">Fonctionnalités</span>
          <h2 className="sec-title">Tout ce qu'il faut.<br /><span className="t-dim">Rien de superflu.</span></h2>
        </div>

        <div className="bento">
          <article className="tile tile-wallet rv">
            <div className="tile-copy">
              <span className="tile-k">Apple Wallet & Google Wallet</span>
              <h3>Directement dans la poche de vos clients.</h3>
              <p>La carte s'ajoute en un geste, sur iPhone comme sur Android. Elle se met à jour toute seule.</p>
            </div>
            <WalletVis />
          </article>

          <article className="tile tile-lock rv">
            <LockVis />
            <div className="tile-copy">
              <span className="tile-k">Notifications push</span>
              <h3>Sur l'écran verrouillé.</h3>
              <p>Gratuites et illimitées. Aucun SMS, aucun email perdu.</p>
            </div>
          </article>

          <article className="tile tile-geo rv">
            <GeoVis />
            <div className="tile-copy">
              <span className="tile-k">Géolocalisation</span>
              <h3>Au bon endroit, au bon moment.</h3>
              <p>La carte apparaît quand votre client passe devant la boutique.</p>
            </div>
          </article>

          <article className="tile tile-chart rv">
            <div className="tile-copy">
              <span className="tile-k">Statistiques</span>
              <h3>Voyez qui revient.</h3>
            </div>
            <div className="tile-big t-grad">+38 %</div>
            <p className="tile-note">de visites récurrentes en moyenne après 3 mois</p>
            <ChartVis />
          </article>

          <article className="tile tile-zero rv">
            <span className="tile-k">Sans application</span>
            <div className="zero">0</div>
            <h3>téléchargement.<br /><span className="t-dim">Zéro friction.</span></h3>
          </article>

          <article className="tile tile-sec rv">
            <div className="sec-ico"><Fingerprint size={40} strokeWidth={1.4} /></div>
            <span className="tile-k">Confidentialité</span>
            <h3>Vos données restent les vôtres.</h3>
            <div className="chips">
              <span>RGPD</span><span>Hébergé en France</span><span>Chiffré</span>
            </div>
          </article>
        </div>
      </section>

      {/* ── ÉTAPES ── */}
      <section className="steps-sec">
        <div className="sec-head rv">
          <span className="eyebrow">Mise en route</span>
          <h2 className="sec-title">Lancé avant<br /><span className="t-grad">votre prochain café.</span></h2>
        </div>
        <div className="steps">
          {[
            { ico: <Store size={22} />, h: 'Créez votre espace', p: 'Renseignez votre commerce et importez votre logo. Deux minutes.' },
            { ico: <Palette size={22} />, h: 'Dessinez votre carte', p: 'Couleurs, paliers de points, textes de récompense, emplacements.' },
            { ico: <Send size={22} />, h: 'Partagez', p: 'Un lien ou un QR code en caisse. Vos clients ajoutent la carte en un geste.' },
          ].map((s, i) => (
            <div className="step rv" key={i} style={{ '--d': `${i * 0.12}s` }}>
              <div className="step-top">
                <span className="step-ico">{s.ico}</span>
                <span className="step-n">0{i + 1}</span>
              </div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FILM ── */}
      <section className="film-sec" id="film">
        <div className="sec-head rv">
          <span className="eyebrow">Le film</span>
          <h2 className="sec-title">Deux minutes pour<br /><span className="t-dim">tout comprendre.</span></h2>
        </div>
        <div className="film rv">
          <div className="film-glow" aria-hidden />
          <div className="film-frame">
            {/* <video autoPlay muted loop playsInline src="/video/fidelyz-film.mp4" /> */}
            <div className="film-poster" aria-hidden>
              <span className="film-ring" />
              <span className="film-ring r2" />
            </div>
            <button className="film-play" aria-label="Lire le film">
              <Play size={26} fill="currentColor" />
            </button>
            <span className="film-label">Bientôt disponible · 2 min 30</span>
          </div>
        </div>
      </section>

      {/* ── TARIFS ── */}
      <section className="pricing-sec" id="pricing">
        <div className="sec-head rv">
          <span className="eyebrow">Tarifs</span>
          <h2 className="sec-title">Simple. Transparent.<br /><span className="t-dim">Sans surprise.</span></h2>
        </div>

        <div className="seg rv" role="tablist">
          <button className={!annual ? 'on' : ''} onClick={() => setAnnual(false)}>Mensuel</button>
          <button className={annual ? 'on' : ''} onClick={() => setAnnual(true)}>
            Annuel <span className="seg-save">−20 %</span>
          </button>
          <span className={`seg-thumb${annual ? ' right' : ''}`} aria-hidden />
        </div>

        <div className="plans">
          {PLANS.map((p, i) => (
            <div key={p.name} className={`plan rv${p.featured ? ' featured' : ''}`} style={{ '--d': `${i * 0.1}s` }}>
              {p.featured && <span className="plan-badge">Le plus choisi</span>}
              <h3>{p.name}</h3>
              <p className="plan-tag">{p.tagline}</p>
              <div className="plan-price">
                <span className="plan-amt">{annual ? p.a : p.m}</span>
                <span className="plan-cur">€</span>
                <span className="plan-per">/ mois</span>
              </div>
              <p className="plan-ann">
                {annual && p.a > 0 ? `Soit ${(p.a * 12).toLocaleString('fr-FR')} € facturés par an` : p.m === 0 ? 'Gratuit, pour toujours' : 'Facturé mensuellement'}
              </p>
              <button className={`fz-btn plan-cta${p.featured ? '' : ' ghost'}`} onClick={goPro}>
                {p.cta}
              </button>
              <ul>
                {p.feats.map(f => <li key={f}><Check size={15} strokeWidth={2.4} />{f}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <p className="pricing-trust rv">
          <span><Lock size={13} /> Paiement sécurisé par Stripe</span>
          <span><Repeat size={13} /> Résiliable à tout moment</span>
          <span><ShieldCheck size={13} /> Données hébergées en France</span>
        </p>
      </section>

      {/* ── ESPACE CLIENT ── */}
      <section className="client-sec">
        <div className="client rv">
          <div className="client-copy">
            <span className="eyebrow">Espace client</span>
            <h2 className="sec-title sm">Client d'un commerce&nbsp;?</h2>
            <p>Retrouvez votre enseigne et ajoutez votre carte de fidélité à votre Wallet en moins d'une minute.</p>
          </div>
          <div className="client-box">
            <DemoClientAccess />
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="faq-sec" id="faq">
        <div className="sec-head rv">
          <span className="eyebrow">FAQ</span>
          <h2 className="sec-title">Questions fréquentes.</h2>
        </div>
        <div className="faq-list rv">
          {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="final">
        <div className="final-glow" aria-hidden />
        <div className="final-w rv">
          <h2 className="final-title">
            <span className="t-silver">Vos clients reviennent.</span>
            <span className="t-grad">Ils restent.</span>
          </h2>
          <p>Rejoignez les commerçants qui ont dit adieu aux cartes tampons.</p>
          <div className="hero-ctas">
            <button className="fz-btn fz-btn-lg" onClick={goPro}>
              Créer mon espace pro <ArrowRight size={18} />
            </button>
          </div>
          <div className="hero-trust">
            <span><CheckCircle2 size={12} /> Gratuit pour démarrer</span>
            <span><CheckCircle2 size={12} /> Prêt en 5 minutes</span>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

/* ── DemoClientAccess — logique inchangée ── */
function DemoClientAccess() {
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [enterprises, setEnterprises] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (showForm && enterprises.length === 0) {
      fetchEnterprises()
    }
  }, [showForm])

  const fetchEnterprises = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/public/enterprises')
      let data = response.data
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        data = data.value || []
      }
      setEnterprises(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Serveur indisponible')
    } finally {
      setLoading(false)
    }
  }

  const filteredEnterprises = enterprises.filter(ent => {
    const searchLower = searchTerm.toLowerCase().trim()
    if (!searchLower) return true
    return (
      String(ent.id).toLowerCase().includes(searchLower) ||
      (ent.nom || '').toLowerCase().includes(searchLower)
    )
  })

  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)} className="btn-client-start">
        Créer ma carte maintenant
      </button>
    )
  }

  return (
    <div className="demo-form-luxe">
      <div className="demo-form-header">
        <button onClick={() => setShowForm(false)} className="back-link"><X size={16} /></button>
        <h4>Rechercher un commerce</h4>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 size={24} className="spin" /></div>
      ) : (
        <>
          <div className="search-field-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Nom du commerce..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="enterprises-scroll">
            {filteredEnterprises.map((ent) => (
              <div
                key={ent.id}
                className={`ent-item ${selectedId === ent.id ? 'active' : ''}`}
                onClick={() => setSelectedId(ent.id)}
              >
                <span>{ent.nom}</span>
                {selectedId === ent.id && <CheckCircle2 size={16} />}
              </div>
            ))}
            {filteredEnterprises.length === 0 && <p className="no-result">Aucun commerce trouvé</p>}
          </div>

          {selectedId && (
            <button
              onClick={() => window.location.href = `/join/${selectedId}`}
              className="btn-join-final"
            >
              C'est parti !
            </button>
          )}
        </>
      )}
    </div>
  )
}
