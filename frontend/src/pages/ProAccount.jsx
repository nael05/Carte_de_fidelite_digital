import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import './ProAccount.css'

const STATUS_LABELS = {
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
  return <div className={`acc-feedback ${fb.type}`}>{fb.text}</div>
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
      <section className="acc-card">
        <h3>Adresse email</h3>
        <p className="acc-muted">Actuelle : <strong>{account?.email || '…'}</strong></p>
        <form onSubmit={submitEmail}>
          <label>Nouvelle adresse email</label>
          <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <p className="acc-muted">Un lien de confirmation sera envoyé à la nouvelle adresse (valable 24 h).</p>
          <button className="acc-btn primary" type="submit">Envoyer le lien de confirmation</button>
        </form>
        <Feedback fb={emailFb} />
      </section>

      <section className="acc-card">
        <h3>Mot de passe</h3>
        <form onSubmit={submitPwd}>
          <label>Ancien mot de passe</label>
          <input type="password" required autoComplete="current-password" value={pwd.old_password}
            onChange={e => setPwd({ ...pwd, old_password: e.target.value })} />
          <label>Nouveau mot de passe (8 caractères min.)</label>
          <input type="password" required minLength={8} autoComplete="new-password" value={pwd.new_password}
            onChange={e => setPwd({ ...pwd, new_password: e.target.value })} />
          <label>Confirmer le nouveau mot de passe</label>
          <input type="password" required minLength={8} autoComplete="new-password" value={pwd.confirm}
            onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
          <button className="acc-btn primary" type="submit">Modifier le mot de passe</button>
        </form>
        <Feedback fb={pwdFb} />
      </section>
    </div>
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

  if (!sub) return <div className="acc-card">Chargement…</div>

  const item = sub.stripe_subscription?.items?.[0]
  const otherPlan = sub.plan === 'yearly' ? 'monthly' : 'yearly'

  return (
    <div className="acc-grid">
      <section className="acc-card">
        <h3>Mon abonnement</h3>
        <dl className="acc-dl">
          <dt>Plan</dt><dd>{sub.plan === 'yearly' ? 'Annuel' : 'Mensuel'}</dd>
          <dt>Tarif</dt><dd>{item ? `${item.amount.toFixed(2)} ${item.currency.toUpperCase()}` : '—'}</dd>
          <dt>Statut</dt><dd><span className={`acc-badge ${sub.status}`}>{STATUS_LABELS[sub.status] || sub.status}</span></dd>
          <dt>{sub.cancel_at_period_end ? 'Fin de l\'abonnement' : 'Prochain renouvellement'}</dt>
          <dd>{fmtDate(sub.current_period_end)}</dd>
        </dl>

        {sub.cancel_at_period_end && (
          <div className="acc-feedback warn">
            Résiliation programmée : vous conservez 100 % des accès jusqu'au {fmtDate(sub.current_period_end)}.
          </div>
        )}
        <Feedback fb={fb} />
      </section>

      <section className="acc-card">
        <h3>Changer de formule</h3>
        <p className="acc-muted">Le changement est facturé au prorata par Stripe.</p>
        <button className="acc-btn" disabled={busy}
          onClick={() => run(() => api.post('/pro/subscription/switch-plan', { new_plan: otherPlan }))}>
          Passer au plan {otherPlan === 'yearly' ? 'annuel' : 'mensuel'}
        </button>

        <h3 style={{ marginTop: 24 }}>Code promo</h3>
        <p className="acc-muted">Appliqué au prochain renouvellement.</p>
        <form className="acc-inline" onSubmit={e => { e.preventDefault(); run(() => api.post('/pro/subscription/apply-promo', { code_promo: promo })) }}>
          <input value={promo} onChange={e => setPromo(e.target.value)} placeholder="CODE" required />
          <button className="acc-btn" type="submit" disabled={busy}>Appliquer</button>
        </form>
      </section>

      <section className="acc-card">
        <h3>Résiliation</h3>
        {sub.cancel_at_period_end ? (
          <>
            <p className="acc-muted">Vous pouvez réactiver votre abonnement avant son échéance.</p>
            <button className="acc-btn primary" disabled={busy}
              onClick={() => run(() => api.post('/pro/subscription/reactivate'))}>
              Réactiver mon abonnement
            </button>
          </>
        ) : !confirmCancel ? (
          <>
            <p className="acc-muted">Sans engagement : vos accès restent complets jusqu'à la fin de la période payée.</p>
            <button className="acc-btn danger" onClick={() => setConfirmCancel(true)}>Résilier mon abonnement</button>
          </>
        ) : (
          <>
            <p>Confirmer la résiliation à l'échéance du {fmtDate(sub.current_period_end)} ?</p>
            <div className="acc-inline">
              <button className="acc-btn danger" disabled={busy}
                onClick={() => run(() => api.post('/pro/subscription/cancel')).then(() => setConfirmCancel(false))}>
                Confirmer la résiliation
              </button>
              <button className="acc-btn" onClick={() => setConfirmCancel(false)}>Annuler</button>
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
      <section className="acc-card">
        <h3>Moyen de paiement et coordonnées</h3>
        <p className="acc-muted">Mettez à jour votre carte bancaire et vos coordonnées de facturation sur le portail sécurisé Stripe.</p>
        <button className="acc-btn primary" onClick={openPortal}>Ouvrir le portail Stripe</button>
        <Feedback fb={fb} />
      </section>

      <section className="acc-card acc-wide">
        <h3>Historique des factures</h3>
        {data.invoices.length === 0 ? (
          <p className="acc-muted">Aucune facture pour le moment.</p>
        ) : (
          <table className="acc-table">
            <thead><tr><th>Date</th><th>Montant</th><th>Statut</th><th /></tr></thead>
            <tbody>
              {data.invoices.map(inv => (
                <tr key={inv.id}>
                  <td>{fmtDate(inv.date)}</td>
                  <td>{inv.amount.toFixed(2)} {inv.currency}</td>
                  <td>{inv.status}</td>
                  <td><button className="acc-btn small" onClick={() => downloadPdf(inv.id)}>Télécharger le PDF</button></td>
                </tr>
              ))}
            </tbody>
          </table>
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
    <section className="acc-card">
      <h3>Supprimer mon compte</h3>
      <p className="acc-muted">
        Votre abonnement Stripe est résilié immédiatement et vos données personnelles ainsi que celles de vos clients
        sont supprimées ou anonymisées conformément au RGPD. Cette action est définitive.
      </p>
      <form onSubmit={submit}>
        <label>Confirmez avec votre mot de passe</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
        <button className="acc-btn danger" type="submit">Supprimer définitivement mon compte</button>
      </form>
      <Feedback fb={fb} />
    </section>
  )
}

const TABS = [
  { id: 'profil', label: 'Profil', Component: ProfileTab },
  { id: 'abonnement', label: 'Abonnement', Component: SubscriptionTab },
  { id: 'facturation', label: 'Facturation', Component: BillingTab },
  { id: 'suppression', label: 'Supprimer le compte', Component: DeleteTab }
]

export default function ProAccount() {
  const [tab, setTab] = useState('abonnement')
  const Active = TABS.find(t => t.id === tab).Component

  return (
    <div className="acc-page">
      <header className="acc-header">
        <h1>Mon compte</h1>
        <Link to="/pro/dashboard" className="acc-link">← Retour au tableau de bord</Link>
      </header>
      <nav className="acc-tabs">
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>
      <Active />
    </div>
  )
}
