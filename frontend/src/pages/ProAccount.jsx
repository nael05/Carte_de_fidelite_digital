import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ScanLine, Users, TrendingUp, QrCode, Palette, Settings, CircleUser, LogOut, Sun, Moon,
  CreditCard, FileText, UserRound, Trash2, Download, ExternalLink, AlertCircle, CheckCircle2
} from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import AppShell, { PageHead } from '../components/AppShell'
import useTheme from '../utils/useTheme'
import PlanPicker from '../components/PlanPicker'
import PlanBanner from '../components/PlanBanner'
import { TIER_LABELS } from '../utils/usePlans'
import './ProAccount.css'

const FREE_LIMIT = 15

const STATUS_LABELS = {
  free: 'Gratuit',
  active: 'Actif',
  trialing: "Période d'essai",
  past_due: 'Paiement en retard',
  canceled: 'Résilié',
  unpaid: 'Impayé'
}

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const errMsg = (e) => e.response?.data?.error || 'Une erreur est survenue'

function Feedback({ fb }) {
  if (!fb) return null
  const Icon = fb.type === 'ok' ? CheckCircle2 : AlertCircle
  return <div className={`acc-feedback ${fb.type}`}><Icon size={16} /><span>{fb.text}</span></div>
}

function ProfileTab() {
  const [account, setAccount] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [pwd, setPwd] = useState({ old_password: '', new_password: '', confirm: '' })
  const [emailFb, setEmailFb] = useState(null)
  const [pwdFb, setPwdFb] = useState(null)

  useEffect(() => {
    api.get('/pro/account').then(r => setAccount(r.data)).catch(() => {})
  }, [])

  const submitEmail = async (e) => {
    e.preventDefault()
    setEmailFb(null)
    try {
      const r = await api.put('/pro/account/email', { new_email: newEmail })
      setEmailFb({ type: 'ok', text: r.data.message })
      setNewEmail('')
    } catch (err) {
      setEmailFb({ type: 'err', text: errMsg(err) })
    }
  }

  const submitPwd = async (e) => {
    e.preventDefault()
    setPwdFb(null)
    if (pwd.new_password !== pwd.confirm) {
      return setPwdFb({ type: 'err', text: 'Les mots de passe ne correspondent pas' })
    }
    try {
      const r = await api.put('/pro/account/password', {
        old_password: pwd.old_password,
        new_password: pwd.new_password
      })
      setPwdFb({ type: 'ok', text: r.data.message })
      setPwd({ old_password: '', new_password: '', confirm: '' })
    } catch (err) {
      setPwdFb({ type: 'err', text: errMsg(err) })
    }
  }

  return (
    <div className="acc-grid">
      <section className="ui-card">
        <h2 className="ui-card-title">Adresse email</h2>
        <p className="ui-card-sub">Actuelle : <strong className="acc-strong">{account?.email || '…'}</strong></p>
        <form onSubmit={submitEmail} className="acc-form">
          <div className="ui-field">
            <label className="ui-label">Nouvelle adresse email</label>
            <input className="ui-input" type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
            <p className="ui-hint">Un lien de confirmation sera envoyé à la nouvelle adresse (valable 24 h).</p>
          </div>
          <button className="ui-btn" type="submit">Envoyer le lien de confirmation</button>
        </form>
        <Feedback fb={emailFb} />
      </section>

      <section className="ui-card">
        <h2 className="ui-card-title">Mot de passe</h2>
        <form onSubmit={submitPwd} className="acc-form">
          <div className="ui-field">
            <label className="ui-label">Ancien mot de passe</label>
            <input className="ui-input" type="password" required autoComplete="current-password" value={pwd.old_password}
              onChange={e => setPwd({ ...pwd, old_password: e.target.value })} />
          </div>
          <div className="ui-field">
            <label className="ui-label">Nouveau mot de passe <span className="ui-hint">10 caractères min., majuscule, minuscule et chiffre ou caractère spécial</span></label>
            <input className="ui-input" type="password" required minLength={10} autoComplete="new-password" value={pwd.new_password}
              onChange={e => setPwd({ ...pwd, new_password: e.target.value })} />
          </div>
          <div className="ui-field">
            <label className="ui-label">Confirmer le nouveau mot de passe</label>
            <input className="ui-input" type="password" required minLength={10} autoComplete="new-password" value={pwd.confirm}
              onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
          </div>
          <button className="ui-btn" type="submit">Modifier le mot de passe</button>
        </form>
        <Feedback fb={pwdFb} />
      </section>
    </div>
  )
}

function FreeOffers({ sub, busy, run }) {
  const [tier, setTier] = useState('pro')
  const [interval, setInterval] = useState('monthly')
  const [promo, setPromo] = useState('')
  const limit = sub.client_limit
  const pct = Math.min(100, Math.round((sub.client_count / limit) * 100))

  const checkout = () => run(async () => {
    const r = await api.post('/pro/subscription/checkout', {
      tier,
      plan: interval,
      ...(promo.trim() && { code_promo: promo.trim() })
    })
    window.location.href = r.data.checkout_url
    return { data: { message: 'Redirection vers le paiement sécurisé…' } }
  })

  return (
    <>
      <section className="ui-card acc-plan">
        <div className="acc-plan-top">
          <span className="page-eyebrow">Mon abonnement</span>
          <span className={`ui-badge ${sub.locked ? 'danger' : ''}`}><span className="dot" />{sub.locked ? 'Verrouillé' : 'Gratuit'}</span>
        </div>
        <div className="acc-plan-name">Fidelyz Gratuit</div>
        <div className="acc-plan-price">{sub.client_count} <span>/ {limit} clients</span></div>
        <div className="acc-meter" role="progressbar" aria-valuenow={sub.client_count} aria-valuemax={limit}>
          <span className={sub.locked ? 'over' : pct >= 80 ? 'warn' : ''} style={{ width: `${pct}%` }} />
        </div>
        {sub.locked ? (
          <div className="ui-note danger acc-gap">
            <AlertCircle size={15} />
            <span>
              Compte verrouillé : supprimez {sub.client_count - limit} client{sub.client_count - limit > 1 ? 's' : ''} (vos données sont conservées)
              ou passez à une offre payante pour reprendre.
            </span>
          </div>
        ) : sub.client_count >= limit ? (
          <div className="ui-note warning acc-gap">
            <AlertCircle size={15} />
            <span>Limite atteinte : les nouvelles inscriptions sont fermées jusqu'à votre passage à une offre payante.</span>
          </div>
        ) : null}
      </section>

      <section className="ui-card acc-wide">
        <h2 className="ui-card-title">Passer à une offre payante</h2>
        <p className="ui-card-sub">Clients illimités, sans engagement. Paiement sécurisé par Stripe.</p>
        <div className="acc-gap">
          <PlanPicker
            tiers={['pro', 'business']}
            tier={tier}
            interval={interval}
            onChange={({ tier: t, interval: i }) => { setTier(t); setInterval(i) }}
            disabled={busy}
          />
        </div>
        <div className="acc-inline acc-gap">
          <input className="ui-input" value={promo} onChange={e => setPromo(e.target.value)} placeholder="Code promo (facultatif)" />
          <button className="ui-btn" disabled={busy} onClick={checkout}>
            Passer à {TIER_LABELS[tier]} {interval === 'yearly' ? 'annuel' : 'mensuel'}
          </button>
        </div>
      </section>
    </>
  )
}

function SubscriptionTab() {
  const [sub, setSub] = useState(null)
  const [promo, setPromo] = useState('')
  const [fb, setFb] = useState(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
    api.get('/pro/subscription').then(r => setSub(r.data)).catch(e => setFb({ type: 'err', text: errMsg(e) }))
  }, [])
  useEffect(load, [load])

  const run = async (fn) => {
    setBusy(true)
    setFb(null)
    try {
      const r = await fn()
      setFb({ type: 'ok', text: r.data.message })
      load()
    } catch (err) {
      setFb({ type: 'err', text: errMsg(err) })
    } finally {
      setBusy(false)
    }
  }

  if (!sub) return (
    <div className="ui-card">
      <div className="ui-loading">Chargement…</div>
      <Feedback fb={fb} />
    </div>
  )

  if (sub.tier === 'free') {
    return (
      <div className="acc-grid">
        <FreeOffers sub={sub} busy={busy} run={run} />
        <div className="acc-wide"><Feedback fb={fb} /></div>
      </div>
    )
  }

  const item = sub.stripe_subscription?.items?.[0]
  const otherPlan = sub.plan === 'yearly' ? 'monthly' : 'yearly'
  const otherTier = sub.tier === 'business' ? 'pro' : 'business'
  const tierLabel = TIER_LABELS[sub.tier] || 'Pro'
  const statusTone = ['active', 'trialing'].includes(sub.status) ? 'accent' : ['past_due', 'unpaid'].includes(sub.status) ? 'danger' : ''
  const overFree = sub.total_clients > FREE_LIMIT

  return (
    <div className="acc-grid">
      <section className="ui-card acc-plan">
        <div className="acc-plan-top">
          <span className="page-eyebrow">Mon abonnement</span>
          <span className={`ui-badge ${statusTone}`}><span className="dot" />{STATUS_LABELS[sub.status] || sub.status}</span>
        </div>
        <div className="acc-plan-name">Fidelyz {tierLabel} · {sub.plan === 'yearly' ? 'Annuel' : 'Mensuel'}</div>
        <div className="acc-plan-price">
          {item ? <>{item.amount.toFixed(2)} <span>{item.currency.toUpperCase()} / {sub.plan === 'yearly' ? 'an' : 'mois'}</span></> : '—'}
        </div>
        <div className="acc-plan-meta">
          {sub.cancel_at_period_end ? "Fin de l'abonnement" : 'Prochain renouvellement'} : <strong>{fmtDate(sub.current_period_end)}</strong>
        </div>

        {sub.cancel_at_period_end && (
          <div className="ui-note warning acc-gap">
            <AlertCircle size={15} />
            <span>
              Résiliation programmée : vous conservez 100 % des accès jusqu'au {fmtDate(sub.current_period_end)}.
              {overFree && ` Passé cette date, votre compte gratuit sera verrouillé tant que vous aurez plus de ${FREE_LIMIT} clients (vous en avez ${sub.total_clients}).`}
            </span>
          </div>
        )}
        <Feedback fb={fb} />
      </section>

      <section className="ui-card">
        <h2 className="ui-card-title">Changer de formule</h2>
        <p className="ui-card-sub">Le changement est facturé au prorata par Stripe.</p>
        <div className="acc-stack acc-gap">
          <button className="ui-btn secondary" disabled={busy}
            onClick={() => run(() => api.post('/pro/subscription/switch-plan', { new_plan: otherPlan }))}>
            Passer au plan {otherPlan === 'yearly' ? 'annuel (-20 %)' : 'mensuel'}
          </button>
          <button className="ui-btn secondary" disabled={busy}
            onClick={() => run(() => api.post('/pro/subscription/switch-plan', { new_tier: otherTier }))}>
            {otherTier === 'business' ? 'Passer à Business' : 'Revenir à Pro'}
          </button>
        </div>

        <div className="acc-divider" />

        <h2 className="ui-card-title">Code promo</h2>
        <p className="ui-card-sub">Appliqué au prochain renouvellement.</p>
        <form className="acc-inline acc-gap" onSubmit={e => { e.preventDefault(); run(() => api.post('/pro/subscription/apply-promo', { code_promo: promo })) }}>
          <input className="ui-input" value={promo} onChange={e => setPromo(e.target.value)} placeholder="CODE" required />
          <button className="ui-btn secondary" type="submit" disabled={busy}>Appliquer</button>
        </form>
      </section>

      <section className="ui-card acc-wide">
        <h2 className="ui-card-title">Résiliation</h2>
        {sub.cancel_at_period_end ? (
          <>
            <p className="ui-card-sub">Vous pouvez réactiver votre abonnement avant son échéance.</p>
            <button className="ui-btn acc-gap" disabled={busy}
              onClick={() => run(() => api.post('/pro/subscription/reactivate'))}>
              Réactiver mon abonnement
            </button>
          </>
        ) : !confirmCancel ? (
          <>
            <p className="ui-card-sub">Sans engagement : vos accès restent complets jusqu'à la fin de la période payée. Votre compte repasse ensuite en offre gratuite ({FREE_LIMIT} clients maximum).</p>
            <button className="ui-btn danger acc-gap" onClick={() => setConfirmCancel(true)}>Résilier mon abonnement</button>
          </>
        ) : (
          <>
            <p className="ui-card-sub">Confirmer la résiliation à l'échéance du {fmtDate(sub.current_period_end)} ?</p>
            {overFree && (
              <div className="ui-note warning acc-gap">
                <AlertCircle size={15} />
                <span>
                  Vous avez {sub.total_clients} clients : après l'échéance, votre compte sera verrouillé (données conservées)
                  tant que vous n'aurez pas supprimé {sub.total_clients - FREE_LIMIT} client{sub.total_clients - FREE_LIMIT > 1 ? 's' : ''} ou repris un abonnement.
                </span>
              </div>
            )}
            <div className="acc-inline acc-gap">
              <button className="ui-btn danger-solid" disabled={busy}
                onClick={() => run(() => api.post('/pro/subscription/cancel')).then(() => setConfirmCancel(false))}>
                Confirmer la résiliation
              </button>
              <button className="ui-btn secondary" onClick={() => setConfirmCancel(false)}>Annuler</button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function BillingTab() {
  const [data, setData] = useState({ invoices: [], total: 0 })
  const [fb, setFb] = useState(null)

  useEffect(() => {
    api.get('/pro/billing/invoices').then(r => setData(r.data)).catch(e => setFb({ type: 'err', text: errMsg(e) }))
  }, [])

  const openPortal = async () => {
    try {
      const r = await api.get('/pro/subscription/portal-link')
      window.location.href = r.data.portal_url
    } catch (err) {
      setFb({ type: 'err', text: errMsg(err) })
    }
  }

  const downloadPdf = async (id) => {
    try {
      const r = await api.get(`/pro/billing/invoices/${id}/pdf`, { maxRedirects: 0, validateStatus: s => s < 400 })
      if (r.data?.pdf_url) window.open(r.data.pdf_url, '_blank', 'noopener')
    } catch (err) {
      setFb({ type: 'err', text: errMsg(err) })
    }
  }

  return (
    <div className="acc-grid">
      <section className="ui-card acc-wide acc-portal">
        <span className="ui-icon lg"><CreditCard size={22} /></span>
        <div className="acc-portal-text">
          <h2 className="ui-card-title">Moyen de paiement et coordonnées</h2>
          <p className="ui-card-sub">Mettez à jour votre carte bancaire et vos coordonnées de facturation sur le portail sécurisé Stripe.</p>
        </div>
        <button className="ui-btn" onClick={openPortal}><ExternalLink size={16} /> Ouvrir le portail Stripe</button>
        <Feedback fb={fb} />
      </section>

      <section className="ui-card flush acc-wide">
        <div className="acc-table-head">
          <h2 className="ui-card-title">Historique des factures</h2>
        </div>
        {data.invoices.length === 0 ? (
          <div className="ui-empty">
            <span className="ui-icon lg neutral"><FileText size={22} /></span>
            <p>Aucune facture pour le moment.</p>
          </div>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead><tr><th>Date</th><th>Montant</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {data.invoices.map(inv => (
                  <tr key={inv.id}>
                    <td>{fmtDate(inv.date)}</td>
                    <td><strong>{inv.amount.toFixed(2)} {inv.currency}</strong></td>
                    <td><span className={`ui-badge ${inv.status === 'paid' ? 'accent' : ''}`}>{inv.status === 'paid' ? 'Payée' : inv.status}</span></td>
                    <td className="acc-td-right"><button className="ui-btn secondary sm" onClick={() => downloadPdf(inv.id)}><Download size={14} /> PDF</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function DeleteTab() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [fb, setFb] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!window.confirm('Cette action est irréversible. Supprimer définitivement votre compte ?')) return
    try {
      await api.delete('/pro/account', { data: { password } })
      logout?.()
      localStorage.clear()
      navigate('/', { replace: true })
    } catch (err) {
      setFb({ type: 'err', text: errMsg(err) })
    }
  }

  return (
    <section className="ui-card acc-danger">
      <span className="ui-icon lg danger"><Trash2 size={22} /></span>
      <h2 className="ui-card-title">Supprimer mon compte</h2>
      <p className="ui-card-sub">
        Votre abonnement Stripe est résilié immédiatement et vos données personnelles ainsi que celles de vos clients
        sont supprimées ou anonymisées conformément au RGPD. Cette action est définitive.
      </p>
      <form onSubmit={submit} className="acc-form">
        <div className="ui-field">
          <label className="ui-label">Confirmez avec votre mot de passe</label>
          <input className="ui-input" type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
        <button className="ui-btn danger-solid" type="submit">Supprimer définitivement mon compte</button>
      </form>
      <Feedback fb={fb} />
    </section>
  )
}

const TABS = [
  { id: 'abonnement', label: 'Abonnement', icon: CreditCard, Component: SubscriptionTab },
  { id: 'facturation', label: 'Facturation', icon: FileText, Component: BillingTab },
  { id: 'profil', label: 'Profil', icon: UserRound, Component: ProfileTab },
  { id: 'suppression', label: 'Suppression', icon: Trash2, Component: DeleteTab }
]

import usePageTitle from '../utils/usePageTitle'

export default function ProAccount() {
  usePageTitle("Mon compte | Fidelyz", { noindex: true })
  const [tab, setTab] = useState('abonnement')
  const [darkMode, setDarkMode] = useTheme()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const Active = TABS.find(t => t.id === tab).Component
  const companyName = localStorage.getItem('companyName') || 'Mon commerce'

  const goDashboard = (id) => navigate(`/pro/dashboard?tab=${id}`)
  const handleLogout = () => { logout(); navigate('/pro/login') }

  const sections = [
    {
      items: [
        { id: 'scanner', icon: ScanLine, label: 'Caisse' },
        { id: 'clients', icon: Users, label: 'Clients' },
        { id: 'stats', icon: TrendingUp, label: 'Statistiques' },
      ]
    },
    {
      label: 'Mon programme',
      items: [
        { id: 'register', icon: QrCode, label: 'Recruter' },
        { id: 'design', icon: Palette, label: 'Ma carte' },
        { id: 'settings', icon: Settings, label: 'Réglages' },
      ]
    }
  ]

  const footItems = [
    { id: 'account', icon: CircleUser, label: 'Mon compte', onClick: () => {} },
    { id: 'theme', icon: darkMode ? Sun : Moon, label: darkMode ? 'Thème clair' : 'Thème sombre', onClick: () => setDarkMode(!darkMode) },
    { id: 'logout', icon: LogOut, label: 'Déconnexion', onClick: handleLogout, danger: true },
  ]

  return (
    <AppShell
      brandTitle={companyName}
      brandSub="Espace Pro · Fidelyz"
      sections={sections}
      active="account"
      onSelect={goDashboard}
      footItems={footItems}
      tabbarIds={['scanner', 'clients', 'register', 'design', 'settings']}
      topbarActions={
        <>
          <button className="icon-btn" onClick={() => setDarkMode(!darkMode)} aria-label="Changer de thème">
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="icon-btn danger" onClick={handleLogout} aria-label="Déconnexion"><LogOut size={17} /></button>
        </>
      }
    >
      <PageHead
        onBack={() => navigate('/pro/dashboard')}
        backLabel="Tableau de bord"
        eyebrow={<><CircleUser size={14} /> {companyName}</>}
        title="Mon compte"
        sub="Abonnement, factures et informations de connexion."
      />
      <div className="ui-seg acc-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <t.icon size={15} /> <span>{t.label}</span>
          </button>
        ))}
      </div>
      <PlanBanner />
      <div className="acc-body" key={tab}>
        <Active />
      </div>
    </AppShell>
  )
}
