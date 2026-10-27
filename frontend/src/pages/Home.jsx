import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, Play, CheckCircle2, ChevronDown, Search,
  Loader2, X, CreditCard, Smartphone, BarChart3, Bell,
  Zap, Shield, Users, Repeat, Lock, Star, ChevronRight,
  Sparkles
} from 'lucide-react'
import api from '../api'
import Footer from '../components/Footer'
import './Home.css'

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

function Counter({ end, suffix = '', duration = 1600 }) {
  const [n, setN] = useState(0)
  const [ref, visible] = useInView(0.3)
  useEffect(() => {
    if (!visible) return
    let cur = 0; const step = end / (duration / 16)
    const t = setInterval(() => { cur += step; if (cur >= end) { setN(end); clearInterval(t) } else setN(Math.floor(cur)) }, 16)
    return () => clearInterval(t)
  }, [visible])
  return <span ref={ref}>{n.toLocaleString('fr-FR')}{suffix}</span>
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`faq-row${open ? ' open' : ''}`} onClick={() => setOpen(o => !o)}>
      <div className="faq-q"><span>{q}</span><ChevronDown size={18} /></div>
      <div className="faq-a"><p>{a}</p></div>
    </div>
  )
}

const FAQS = [
  { q: "Combien de temps pour créer ma première carte ?", a: "Moins de 5 minutes. Vous créez votre compte, renseignez votre commerce, choisissez les couleurs — la carte est prête à distribuer via un lien ou QR code." },
  { q: "Mes clients doivent-ils télécharger une application ?", a: "Non. Les cartes s'intègrent nativement dans Apple Wallet et Google Wallet, déjà présents sur tous les smartphones. Zéro friction pour vos clients." },
  { q: "Puis-je changer d'offre à tout moment ?", a: "Oui, sans frais ni engagement. Vous upgradez, downgradez ou résiliez depuis votre espace pro en deux clics." },
  { q: "Comment les points sont-ils attribués ?", a: "Via un QR code sécurisé affiché sur votre tableau de bord. Votre client scanne, les points sont crédités instantanément et la carte Wallet se met à jour." },
  { q: "Mes données clients sont-elles protégées ?", a: "Hébergement en France, chiffrement AES-256, authentification JWT, conformité RGPD complète. Export et suppression disponibles à la demande." },
]

const PLANS = [
  { name: 'Starter', price: { m: 0, a: 0 }, label: 'Gratuit pour toujours', features: ['1 commerce', "Jusqu'à 50 clients", 'Carte Apple & Google Wallet', 'QR Code de scan', 'Support email'], cta: 'Commencer gratuitement', ghost: true },
  { name: 'Pro', price: { m: 29, a: 23 }, label: 'Le plus populaire', badge: true, features: ['1 commerce', 'Clients illimités', 'Carte 100% personnalisée', 'Push Wallet natif', 'Analytics & historique', 'Support prioritaire 7j/7'], cta: 'Essai gratuit 14 jours', ghost: false },
  { name: 'Business', price: { m: 79, a: 63 }, label: 'Multi-sites & réseau', features: ["Jusqu'à 5 commerces", 'Clients illimités', 'White-label complet', 'API & Webhooks', 'SLA 99,9% garanti', 'Account manager dédié'], cta: 'Parler à l\'équipe', ghost: true },
]

const FEATURES = [
  {
    tag: 'Native Wallet',
    title: 'Directement dans le téléphone,\nsans aucune app',
    body: "Vos cartes s'intègrent dans Apple Wallet et Google Wallet. Vos clients n'ont rien à installer — la carte est là, visible à chaque ouverture du téléphone.",
    icon: <Smartphone size={22} />,
    color: '#7C3AED',
    points: ['Compatible iPhone & Android', 'Mise à jour en temps réel', 'Accessible hors ligne'],
  },
  {
    tag: 'Scan & Points',
    title: 'Attribution de points\nen moins d\'une seconde',
    body: "Un QR code affiché sur votre dashboard. Le client scanne, les points sont crédités, la carte se met à jour instantanément — même sans connexion côté client.",
    icon: <Zap size={22} />,
    color: '#DB2777',
    points: ['QR Code sécurisé & unique', 'Crédit instantané', 'Historique complet'],
  },
  {
    tag: 'Analytics',
    title: 'Mesurez ce qui compte\npour votre commerce',
    body: "Taux de rétention, visites, récompenses distribuées, clients actifs — toutes vos métriques de fidélité au même endroit, sans Excel.",
    icon: <BarChart3 size={22} />,
    color: '#0891B2',
    points: ['Dashboard temps réel', 'Export CSV', 'Comparaison périodes'],
  },
]

export default function Home() {
  const navigate = useNavigate()
  const [annual, setAnnual] = useState(false)
  const [heroRef, heroVis] = useInView(0.05)
  const [featRef, featVis] = useInView()
  const [pricRef, pricVis] = useInView()

  useEffect(() => {
    const t = localStorage.getItem('theme') || 'dark'
    document.documentElement.classList.toggle('dark-mode', t === 'dark')
  }, [])

  return (
    <div className="hn">
      <div className="hn-grain" aria-hidden />
      <div className="hn-glow-1" aria-hidden />
      <div className="hn-glow-2" aria-hidden />

      {/* NAV */}
      <nav className="hn-nav">
        <div className="hn-nav-w">
          <a className="hn-logo" href="/">
            <img src="/logo-fidelyz.png" alt="Fidelyz" />
            <span>Fidelyz</span>
          </a>
          <div className="hn-nav-links">
            <a href="#features">Fonctionnalités</a>
            <a href="#pricing">Tarifs</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="hn-nav-right">
            <button className="hn-btn-ghost-sm" onClick={() => navigate('/pro/login')}>Se connecter</button>
            <button className="hn-btn-pill" onClick={() => navigate('/pro/login')}>Essai gratuit <ArrowRight size={14} /></button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className={`hn-hero${heroVis ? ' vis' : ''}`} ref={heroRef}>
        <div className="hn-hero-inner">
          <div className="hn-hero-tag">
            <Sparkles size={13} /> Fidélité digitale — Apple & Google Wallet
          </div>
          <h1 className="hn-h1">
            Vos clients reviennent.<br />
            <em>Encore. Et encore.</em>
          </h1>
          <p className="hn-hero-sub">
            Créez et distribuez des cartes de fidélité digitales en 5 minutes.
            Sans application, sans carte plastique, sans friction.
          </p>
          <div className="hn-hero-ctas">
            <button className="hn-btn-primary lg" onClick={() => navigate('/pro/login')}>
              Créer mon espace pro gratuitement <ArrowRight size={18} />
            </button>
            <a href="#features" className="hn-btn-ghost lg">Découvrir le produit</a>
          </div>
          <div className="hn-hero-trust">
            <span><CheckCircle2 size={13} /> Sans carte bancaire</span>
            <span><CheckCircle2 size={13} /> Sans engagement</span>
            <span><CheckCircle2 size={13} /> Paiement Stripe</span>
          </div>
        </div>

        {/* VIDEO PLACEHOLDER — remplacer src par la vidéo motion design */}
        <div className="hn-video-wrap">
          <div className="hn-video-frame">
            <div className="hn-video-inner">
              <div className="hn-video-overlay">
                <div className="hn-play-btn">
                  <Play size={28} fill="white" />
                </div>
                <p className="hn-video-label">Voir comment ça marche</p>
              </div>
              {/* <video autoPlay muted loop playsInline src="/video/fidelyz-demo.mp4" /> */}
            </div>
          </div>
          <div className="hn-video-glow" aria-hidden />
        </div>
      </section>

      {/* STATS */}
      <div className="hn-stats-strip">
        <div className="hn-stats-w">
          {[
            { n: 2400, suf: '+', label: 'Cartes actives' },
            { n: 98, suf: '%', label: 'Taux de rétention' },
            { n: 5, suf: ' min', label: 'Pour démarrer' },
            { n: 99, suf: '.9%', label: 'Uptime garanti' },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className="hn-stat-sep" />}
              <div className="hn-stat">
                <strong><Counter end={s.n} suffix={s.suf} /></strong>
                <span>{s.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features" className={`hn-features${featVis ? ' vis' : ''}`} ref={featRef}>
        <div className="hn-section-head">
          <div className="hn-label">Fonctionnalités</div>
          <h2>Tout ce dont vous avez besoin,<br /><span className="hn-grad">rien de superflu</span></h2>
        </div>
        {FEATURES.map((f, i) => (
          <div key={i} className={`hn-feat-row${i % 2 === 1 ? ' rev' : ''}`} style={{ '--fi': i }}>
            <div className="hn-feat-text">
              <div className="hn-feat-tag" style={{ color: f.color, borderColor: f.color + '33', background: f.color + '0F' }}>
                {f.icon} {f.tag}
              </div>
              <h3>{f.title.split('\n').map((l, j) => <React.Fragment key={j}>{l}{j === 0 && <br />}</React.Fragment>)}</h3>
              <p>{f.body}</p>
              <ul className="hn-feat-pts">
                {f.points.map((pt, pi) => <li key={pi}><CheckCircle2 size={14} style={{ color: f.color }} />{pt}</li>)}
              </ul>
            </div>
            <div className="hn-feat-visual" style={{ '--fc': f.color }}>
              <div className="hn-feat-card">
                <div className="hn-feat-card-icon" style={{ background: f.color + '18', color: f.color }}>{f.icon}</div>
                <div className="hn-feat-card-lines">
                  <div className="hn-line w80" />
                  <div className="hn-line w55" />
                  <div className="hn-line w70" />
                </div>
                <div className="hn-feat-card-badge" style={{ background: f.color + '20', color: f.color }}>
                  <CheckCircle2 size={12} /> Actif
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* HOW IT WORKS */}
      <section className="hn-how">
        <div className="hn-section-head">
          <div className="hn-label">Démarrage</div>
          <h2>Prêt en <span className="hn-grad">3 étapes</span></h2>
        </div>
        <div className="hn-steps">
          {[
            { n: '1', title: 'Créez votre espace', body: 'Inscrivez-vous gratuitement. Renseignez votre commerce, uploadez votre logo et choisissez vos couleurs.' },
            { n: '2', title: 'Configurez vos règles', body: 'Définissez les paliers de points, les récompenses et le message affiché sur la carte de vos clients.' },
            { n: '3', title: 'Distribuez & fidélisez', body: 'Partagez le lien ou le QR code. Vos clients ajoutent la carte en un tap. Vous gérez tout depuis le dashboard.' },
          ].map((s, i) => (
            <div key={i} className="hn-step" style={{ '--si': i }}>
              <div className="hn-step-n">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className={`hn-pricing${pricVis ? ' vis' : ''}`} ref={pricRef}>
        <div className="hn-section-head">
          <div className="hn-label">Tarifs</div>
          <h2>Simple, <span className="hn-grad">transparent</span></h2>
          <p className="hn-pricing-sub">Commencez gratuitement, évoluez quand vous êtes prêt.</p>
        </div>

        <div className="hn-toggle-wrap">
          <span className={!annual ? 'active' : ''}>Mensuel</span>
          <button className={`hn-toggle${annual ? ' on' : ''}`} onClick={() => setAnnual(a => !a)}>
            <span />
          </button>
          <span className={annual ? 'active' : ''}>Annuel <strong className="hn-save">−20%</strong></span>
        </div>

        <div className="hn-plans">
          {PLANS.map((p, i) => (
            <div key={i} className={`hn-plan${p.badge ? ' featured' : ''}`}>
              {p.badge && <div className="hn-plan-badge">⭐ Le plus populaire</div>}
              <div className="hn-plan-top">
                <h3>{p.name}</h3>
                <p>{p.label}</p>
              </div>
              <div className="hn-plan-price">
                <span className="hn-price-cur">€</span>
                <span className="hn-price-n">{annual ? p.price.a : p.price.m}</span>
                <span className="hn-price-per">/mois</span>
              </div>
              {annual && p.price.a > 0 && (
                <p className="hn-plan-annual">Facturé {(p.price.a * 12).toLocaleString('fr-FR')} €/an</p>
              )}
              <ul className="hn-plan-feats">
                {p.features.map((f, fi) => <li key={fi}><CheckCircle2 size={14} />{f}</li>)}
              </ul>
              <button
                className={p.ghost ? 'hn-plan-cta ghost' : 'hn-plan-cta'}
                onClick={() => navigate('/pro/login')}
              >
                {p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="hn-pricing-note">
          <Lock size={13} /> Sans engagement &nbsp;&middot;&nbsp;
          <Shield size={13} /> Paiement sécurisé Stripe &nbsp;&middot;&nbsp;
          <Repeat size={13} /> Résiliable à tout moment
        </div>
      </section>

      {/* CLIENT WIDGET */}
      <section className="hn-client">
        <div className="hn-client-inner">
          <div className="hn-client-text">
            <div className="hn-label">Espace client</div>
            <h2>Vous êtes client<br /><span className="hn-grad">d'un commerce ?</span></h2>
            <p>Trouvez votre commerce et obtenez votre carte de fidélité digitale en moins de 60 secondes.</p>
          </div>
          <div className="hn-client-widget">
            <DemoClientAccess />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="hn-faq">
        <div className="hn-section-head">
          <div className="hn-label">FAQ</div>
          <h2>Questions <span className="hn-grad">fréquentes</span></h2>
        </div>
        <div className="hn-faq-list">
          {FAQS.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="hn-final">
        <div className="hn-final-inner">
          <h2>Prêt à fidéliser<br /><span className="hn-grad">vos clients ?</span></h2>
          <p>Rejoignez les commerçants qui ont abandonné les cartes tampons pour toujours.</p>
          <button className="hn-btn-primary lg" onClick={() => navigate('/pro/login')}>
            Créer mon espace pro — c'est gratuit <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function DemoClientAccess() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { if (open && !list.length) load() }, [open])

  async function load() {
    setLoading(true); setError('')
    try {
      const r = await api.get('/public/enterprises')
      let d = r.data
      if (d && !Array.isArray(d)) d = d.value || []
      setList(Array.isArray(d) ? d : [])
    } catch { setError('Serveur indisponible') }
    finally { setLoading(false) }
  }

  const filtered = list.filter(e => {
    const s = search.toLowerCase()
    return !s || String(e.id).toLowerCase().includes(s) || (e.nom || '').toLowerCase().includes(s)
  })

  if (!open) return (
    <div className="hn-widget-idle">
      <div className="hn-widget-icon"><CreditCard size={28} /></div>
      <div>
        <p className="hn-widget-title">Obtenez votre carte</p>
        <p className="hn-widget-sub">Recherchez votre commerce favori</p>
      </div>
      <button className="hn-btn-primary" onClick={() => setOpen(true)}>
        Commencer <ArrowRight size={15} />
      </button>
    </div>
  )

  return (
    <div className="hn-widget-form">
      <div className="hn-wf-head">
        <button className="hn-wf-back" onClick={() => setOpen(false)}><X size={16} /></button>
        <span>Rechercher un commerce</span>
      </div>
      {loading ? (
        <div className="hn-wf-loader"><Loader2 size={22} className="spin" /></div>
      ) : (
        <>
          <div className="hn-wf-search">
            <Search size={14} />
            <input autoFocus placeholder="Nom du commerce…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="hn-wf-list">
            {filtered.map(e => (
              <div key={e.id} className={`hn-wf-item${selected === e.id ? ' sel' : ''}`} onClick={() => setSelected(e.id)}>
                <span>{e.nom}</span>
                {selected === e.id && <CheckCircle2 size={14} />}
              </div>
            ))}
            {!filtered.length && <p className="hn-wf-empty">Aucun commerce trouvé</p>}
          </div>
          {selected && (
            <button className="hn-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => window.location.href = `/join/${selected}`}>
              Obtenir ma carte <ArrowRight size={15} />
            </button>
          )}
          {error && <p className="hn-wf-err">{error}</p>}
        </>
      )}
    </div>
  )
}
