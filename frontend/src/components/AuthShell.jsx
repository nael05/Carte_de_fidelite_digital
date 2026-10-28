import React from 'react'
import { Link } from 'react-router-dom'
import { Bell, ShieldCheck, Store, TrendingUp, Users } from 'lucide-react'

/* QR décoratif (même rendu que sur la page d'accueil) */
function MiniQR() {
  const N = 21
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
  let d = ''
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rnd() > 0.52) d += `M${x} ${y}h1v1h-1z`
  const f = (fx, fy) => `M${fx} ${fy}h7v7h-7zM${fx + 1} ${fy + 1}v5h5v-5zM${fx + 2} ${fy + 2}h3v3h-3z`
  d += f(0, 0) + f(N - 7, 0) + f(0, N - 7)
  return (
    <svg viewBox={`0 0 ${N} ${N}`} shapeRendering="crispEdges" aria-hidden>
      <path d={d} fillRule="evenodd" fill="currentColor" />
    </svg>
  )
}

/* Pass Apple Wallet décoratif, incliné en 3D */
function AuthPass() {
  return (
    <div className="auth-pass-stage" aria-hidden>
      <div className="auth-pass">
        <div className="auth-pass-head">
          <span className="auth-pass-logo"><span>L</span>Maison Lumière</span>
          <span className="auth-pass-field"><em>POINTS</em>480</span>
        </div>
        <div className="auth-pass-strip">
          <span className="auth-pass-cup" />
        </div>
        <div className="auth-pass-fields">
          <span><em>BONJOUR</em><strong>CAMILLE</strong></span>
          <span className="r"><em>RÉCOMPENSE</em>Café offert</span>
        </div>
        <div className="auth-pass-qr"><MiniQR /></div>
      </div>
      <div className="auth-chip">
        <span className="auth-chip-ico"><Bell size={13} /></span>
        <span><strong>+20 points</strong> · Maison Lumière</span>
      </div>
    </div>
  )
}

function AdminVisual() {
  return (
    <div className="auth-admin" aria-hidden>
      <div className="auth-admin-ring"><ShieldCheck size={46} strokeWidth={1.4} /></div>
      <div className="auth-admin-chips">
        <span><Store size={14} /> Commerces</span>
        <span><Users size={14} /> Clients</span>
        <span><TrendingUp size={14} /> Croissance</span>
      </div>
    </div>
  )
}

export default function AuthShell({ variant = 'pro', children, wide = false }) {
  const isAdmin = variant === 'admin'
  return (
    <div className={`auth${wide ? ' auth-wide' : ''}`}>
      <aside className="auth-aside">
        <span className="auth-aura a1" aria-hidden />
        <span className="auth-aura a2" aria-hidden />
        <Link to="/" className="auth-brand">
          <img src="/logo-fidelyz.png" alt="" onError={e => (e.currentTarget.style.visibility = 'hidden')} />
          <span>Fidelyz</span>
        </Link>

        <div className="auth-aside-copy">
          <span className="auth-eyebrow">{isAdmin ? 'Fidelyz Control' : 'Espace Pro'}</span>
          {isAdmin ? (
            <h2>Tout le réseau,<br /><span className="auth-grad">sous contrôle.</span></h2>
          ) : (
            <h2>La fidélité,<br /><span className="auth-grad">dans leur poche.</span></h2>
          )}
          <p>
            {isAdmin
              ? 'Commerçants, abonnements, tarifs et communications : pilotez Fidelyz depuis un seul endroit.'
              : 'Scannez, récompensez, notifiez. Vos cartes Apple Wallet et Google Wallet se gèrent en quelques secondes.'}
          </p>
        </div>

        {isAdmin ? <AdminVisual /> : <AuthPass />}

        <span className="auth-aside-foot">© {new Date().getFullYear()} Fidelyz</span>
      </aside>

      <main className="auth-main">
        <Link to="/" className="auth-brand auth-brand-mobile">
          <img src="/logo-fidelyz.png" alt="" onError={e => (e.currentTarget.style.visibility = 'hidden')} />
          <span>Fidelyz</span>
        </Link>
        <div className="luxe-auth-card">
          {children}
        </div>
      </main>
    </div>
  )
}
