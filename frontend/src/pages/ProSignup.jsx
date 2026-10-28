import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api'
import { AlertCircle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import PlanPicker from '../components/PlanPicker'
import './Auth.css'
import './ProSignup.css'

const PASSWORD_RULES = [
  { test: (p) => p.length >= 6, label: '6 caractères minimum' },
  { test: (p) => /[A-Z]/.test(p), label: 'Une majuscule' },
  { test: (p) => /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(p), label: 'Un chiffre ou un caractère spécial' }
]

import usePageTitle from '../utils/usePageTitle'

function ProSignup() {
  usePageTitle("Créer mon espace | Fidelyz")
  const [params] = useSearchParams()
  const [form, setForm] = useState({
    nom: '', raison_sociale: '', email: '', mot_de_passe: '', siret_tva: '', adresse: ''
  })
  const navigate = useNavigate()
  const [tier, setTier] = useState(['free', 'pro', 'business'].includes(params.get('tier')) ? params.get('tier') : 'pro')
  const [plan, setPlan] = useState(params.get('plan') === 'yearly' ? 'yearly' : 'monthly')
  const paid = tier !== 'free'
  const [promoCode, setPromoCode] = useState('')
  const [promo, setPromo] = useState(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const dark = (localStorage.getItem('theme') || 'dark') === 'dark'
    document.documentElement.classList.toggle('dark-mode', dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [])

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })
  const passwordOk = PASSWORD_RULES.every((r) => r.test(form.mot_de_passe))

  const checkPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromo(null)
    try {
      const { data } = await api.post('/pro/validate-promo', { code_promo: promoCode.trim() })
      setPromo({ valid: true, ...data })
    } catch (err) {
      setPromo({ valid: false, error: err.response?.data?.error || 'Code invalide' })
    } finally {
      setPromoLoading(false)
    }
  }

  const promoSummary = () => {
    if (!promo?.valid) return null
    if (promo.free_month) return 'Code valide : 1 mois offert (0 € prélevé aujourd’hui)'
    if (promo.percent_off) return `Code valide : -${promo.percent_off} %`
    if (promo.amount_off) return `Code valide : -${promo.amount_off} €`
    return 'Code valide'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!passwordOk) return setError('Le mot de passe ne respecte pas les règles indiquées')
    if (paid && promoCode.trim() && !promo?.valid) return setError('Vérifiez votre code promo ou retirez-le')
    setLoading(true)
    try {
      const { data } = await api.post('/pro/signup', {
        ...form,
        tier,
        ...(paid && { plan }),
        ...(paid && promoCode.trim() && { code_promo: promoCode.trim() })
      })
      if (data.free) {
        navigate('/pro/login', { replace: true, state: { notice: 'Compte gratuit créé : connectez-vous.' } })
        return
      }
      window.location.href = data.checkout_url
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de démarrer l\u2019inscription')
      setLoading(false)
    }
  }

  return (
    <AuthShell variant="pro" wide>
        <div className="luxe-auth-header">
          <h1>Créer mon espace Pro</h1>
          <p>{paid ? 'Paiement sécurisé par Stripe. Résiliable à tout moment.' : 'Gratuit, sans carte bancaire.'}</p>
        </div>

        <form onSubmit={handleSubmit} className="luxe-auth-form">
          <PlanPicker
            tier={tier}
            interval={plan}
            onChange={({ tier: t, interval }) => { setTier(t); setPlan(interval) }}
            disabled={loading}
          />

          <div className="signup-grid">
            <div className="luxe-form-group">
              <label htmlFor="nom">Votre nom</label>
              <input id="nom" className="luxe-input" value={form.nom} onChange={set('nom')} required disabled={loading} autoComplete="name" />
            </div>
            <div className="luxe-form-group">
              <label htmlFor="raison_sociale">Raison sociale</label>
              <input id="raison_sociale" className="luxe-input" value={form.raison_sociale} onChange={set('raison_sociale')} required disabled={loading} autoComplete="organization" />
            </div>
          </div>

          <div className="luxe-form-group">
            <label htmlFor="email">Email professionnel</label>
            <input id="email" className="luxe-input" type="email" value={form.email} onChange={set('email')} required disabled={loading} autoComplete="email" />
          </div>

          <div className="luxe-form-group">
            <label htmlFor="mot_de_passe">Mot de passe</label>
            <input
              id="mot_de_passe"
              className="luxe-input"
              type={showPassword ? 'text' : 'password'}
              value={form.mot_de_passe}
              onChange={set('mot_de_passe')}
              required
              disabled={loading}
              autoComplete="new-password"
            />
            <button type="button" className="password-toggle-btn" aria-label="Afficher ou masquer le mot de passe" onClick={() => setShowPassword(!showPassword)} tabIndex="-1">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.mot_de_passe && (
            <ul className="signup-rules">
              {PASSWORD_RULES.map((r) => (
                <li key={r.label} className={r.test(form.mot_de_passe) ? 'ok' : ''}>{r.label}</li>
              ))}
            </ul>
          )}

          {paid && (
            <>
              <div className="luxe-form-group">
                <label htmlFor="siret_tva">SIRET ou numéro de TVA</label>
                <input id="siret_tva" className="luxe-input" value={form.siret_tva} onChange={set('siret_tva')} required disabled={loading} />
              </div>

              <div className="luxe-form-group">
                <label htmlFor="adresse">Adresse de facturation</label>
                <input id="adresse" className="luxe-input" value={form.adresse} onChange={set('adresse')} required disabled={loading} autoComplete="street-address" />
              </div>
            </>
          )}

          {paid && <div className="luxe-form-group">
            <label htmlFor="promo">Code promo (facultatif)</label>
            <div className="signup-promo">
              <input
                id="promo"
                className="luxe-input"
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromo(null) }}
                disabled={loading}
                autoCapitalize="characters"
              />
              <button type="button" className="signup-promo-btn" onClick={checkPromo} disabled={loading || promoLoading || !promoCode.trim()}>
                {promoLoading ? <Loader2 className="spin" size={16} /> : 'Appliquer'}
              </button>
            </div>
            {promo?.valid && <p className="signup-promo-ok"><CheckCircle2 size={14} /> {promoSummary()}</p>}
            {promo && !promo.valid && <p className="signup-promo-err">{promo.error}</p>}
          </div>}

          <label className="signup-consent">
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
            <span>
              J’accepte les <Link to="/mentions-legales" target="_blank">conditions et mentions légales</Link>.
              {paid
                ? ' L’abonnement se renouvelle automatiquement et se résilie à tout moment depuis mon espace.'
                : ' L’offre gratuite est limitée à 15 clients.'}
            </span>
          </label>

          {error && (
            <div className="luxe-alert error">
              <AlertCircle size={18} /> <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn-luxe-submit" disabled={loading || !accepted}>
            {loading ? <Loader2 className="spin" size={20} /> : <>{paid ? 'Continuer vers le paiement' : 'Créer mon espace gratuit'}</>}
          </button>
        </form>

        <div className="luxe-auth-footer">
          <p>Déjà inscrit ? <Link to="/pro/login">Se connecter</Link></p>
        </div>
    </AuthShell>
  )
}

export default ProSignup
