import React, { useCallback, useEffect, useState } from 'react'
import api from '../api'
import { AlertCircle, CheckCircle2, Loader2, Send, Tag, Trash2 } from 'lucide-react'
import './AdminBillingPanels.css'

const errMsg = (e) => e.response?.data?.error || 'Une erreur est survenue'
const money = (n, cur = 'eur') => Number(n).toLocaleString('fr-FR', { style: 'currency', currency: cur.toUpperCase() })
const dateFr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—')
const PLAN_LABEL = { monthly: 'Mensuel', yearly: 'Annuel' }

function Notice({ notice }) {
  if (!notice) return null
  const Icon = notice.type === 'ok' ? CheckCircle2 : AlertCircle
  return <div className={`abp-notice ${notice.type}`}><Icon size={16} /> <span>{notice.text}</span></div>
}

/* ───────────── TARIFS ───────────── */
export function AdminPricingPanel() {
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ monthly: '', yearly: '' })
  const [dates, setDates] = useState({})
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/admin/pricing')
      setData(d)
      setForm({ monthly: d.plans.monthly.amount ?? '', yearly: d.plans.yearly.amount ?? '' })
    } catch (e) {
      setNotice({ type: 'err', text: errMsg(e) })
    }
  }, [])
  useEffect(() => { load() }, [load])

  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const body = {}
      for (const plan of ['monthly', 'yearly']) {
        if (Number(form[plan]) !== data.plans[plan].amount) body[plan] = form[plan]
      }
      if (Object.keys(body).length === 0) {
        setNotice({ type: 'err', text: 'Aucun tarif modifié' })
      } else {
        const { data: r } = await api.put('/admin/pricing', body)
        setNotice({ type: 'ok', text: r.message })
        await load()
      }
    } catch (err) {
      setNotice({ type: 'err', text: errMsg(err) })
    } finally {
      setSaving(false)
    }
  }

  const notify = async (change) => {
    const date = change.notified ? undefined : dates[change.id] || change.min_effective_date
    const confirmText = change.notified
      ? `Relancer l'envoi du préavis aux abonnés qui ne l'ont pas encore reçu ?`
      : `Envoyer le préavis à ${change.subscribers} abonné(s) ${PLAN_LABEL[change.plan].toLowerCase()}(s) ?\nNouveau tarif applicable à partir du ${dateFr(date)}.`
    if (!window.confirm(confirmText)) return
    setNotice(null)
    try {
      const { data: r } = await api.post('/admin/pricing/notify', { change_id: change.id, effective_date: date })
      setNotice({ type: r.success ? 'ok' : 'err', text: r.message })
      await load()
    } catch (err) {
      setNotice({ type: 'err', text: errMsg(err) })
    }
  }

  if (!data) return <div className="abp-card"><Loader2 className="spin" size={20} /> Chargement…</div>

  return (
    <div className="abp-stack">
      <header className="ux-view-header">
        <h2>Tarifs des abonnements</h2>
        <p>Les nouveaux tarifs s'appliquent immédiatement aux nouveaux abonnés. Les abonnés actuels doivent être prévenus {data.notice_days} jours à l'avance.</p>
      </header>
      <Notice notice={notice} />

      <div className="abp-grid">
        {['monthly', 'yearly'].map((plan) => {
          const p = data.plans[plan]
          return (
            <div className="abp-card" key={plan}>
              <span className="abp-label">Plan {PLAN_LABEL[plan]}</span>
              <div className="abp-price">{p.configured ? money(p.amount, p.currency) : 'Non configuré'}</div>
              {p.price_id && <code className="abp-code">{p.price_id}</code>}
              {p.error && <span className="abp-error">{p.error}</span>}
            </div>
          )
        })}
      </div>

      <form className="abp-card" onSubmit={save}>
        <h3>Modifier les tarifs</h3>
        <div className="abp-form-row">
          <label>Mensuel (€)
            <input type="number" min="1" max="10000" step="0.01" value={form.monthly} onChange={(e) => setForm({ ...form, monthly: e.target.value })} required />
          </label>
          <label>Annuel (€)
            <input type="number" min="1" max="10000" step="0.01" value={form.yearly} onChange={(e) => setForm({ ...form, yearly: e.target.value })} required />
          </label>
        </div>
        <button className="ux-btn-primary" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={16} /> : 'Enregistrer les nouveaux tarifs'}
        </button>
      </form>

      {data.pending_changes.length > 0 && (
        <div className="abp-card">
          <h3>Changements de tarif à notifier</h3>
          {data.pending_changes.map((c) => (
            <div className="abp-change" key={c.id}>
              <div>
                <strong>{PLAN_LABEL[c.plan]}</strong> : {money(c.old_amount, c.currency)} → <strong>{money(c.new_amount, c.currency)}</strong>
                <span className="abp-muted"> · {c.subscribers} abonné(s) concerné(s)</span>
              </div>
              {c.notified ? (
                <div className="abp-change-actions">
                  <span className="abp-badge ok">Préavis envoyé à {c.notified_count} abonné(s) · applicable le {dateFr(c.effective_date)}</span>
                  <button className="ux-btn-outline small" onClick={() => notify(c)}>Relancer les échecs</button>
                </div>
              ) : (
                <div className="abp-change-actions">
                  <label className="abp-inline">Applicable à partir du
                    <input type="date" min={c.min_effective_date} value={dates[c.id] || c.min_effective_date}
                      onChange={(e) => setDates({ ...dates, [c.id]: e.target.value })} />
                  </label>
                  <button className="ux-btn-primary" onClick={() => notify(c)}><Send size={14} /> Notifier du changement de tarif</button>
                </div>
              )}
              {!c.notified && c.new_amount > c.old_amount && (
                <p className="abp-muted">Augmentation : préavis légal de {data.notice_days} jours minimum (date au plus tôt le {dateFr(c.min_effective_date)}). Le nouveau tarif n'est appliqué aux abonnés qu'après notification.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ───────────── CODES PROMO ───────────── */
const EMPTY_PROMO = {
  code: '', discount_type: 'percent', percent_off: 20, amount_off: 10,
  duration: 'once', duration_in_months: 3, target: 'signup', expires_at: '', max_redemptions: ''
}
const PRESETS = [
  { label: '1 mois offert', values: { discount_type: 'free_period', duration_in_months: 1, code: 'MOISOFFERT' } },
  { label: '-20 %', values: { discount_type: 'percent', percent_off: 20, duration: 'once', code: 'PROMO20' } },
  { label: '-10 €', values: { discount_type: 'amount', amount_off: 10, duration: 'once', code: 'PROMO10' } }
]

export function AdminPromosPanel() {
  const [promos, setPromos] = useState([])
  const [form, setForm] = useState(EMPTY_PROMO)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/promos')
      setPromos(data.promos)
    } catch (e) {
      setNotice({ type: 'err', text: errMsg(e) })
    }
  }, [])
  useEffect(() => { load() }, [load])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice(null)
    try {
      const payload = {
        code: form.code, discount_type: form.discount_type, target: form.target,
        ...(form.discount_type === 'percent' && { percent_off: form.percent_off, duration: form.duration }),
        ...(form.discount_type === 'amount' && { amount_off: form.amount_off, duration: form.duration }),
        ...(form.discount_type === 'free_period' && { duration_in_months: form.duration_in_months }),
        ...(form.duration === 'repeating' && form.discount_type !== 'free_period' && { duration_in_months: form.duration_in_months }),
        ...(form.expires_at && { expires_at: `${form.expires_at}T23:59:59` }),
        ...(form.max_redemptions && { max_redemptions: form.max_redemptions })
      }
      const { data } = await api.post('/admin/promos', payload)
      setNotice({ type: 'ok', text: data.message })
      setForm(EMPTY_PROMO)
      await load()
    } catch (err) {
      setNotice({ type: 'err', text: errMsg(err) })
    } finally {
      setSaving(false)
    }
  }

  const deactivate = async (p) => {
    if (!window.confirm(`Désactiver le code ${p.code} ?`)) return
    try {
      await api.delete(`/admin/promos/${p.id}`)
      await load()
    } catch (err) {
      setNotice({ type: 'err', text: errMsg(err) })
    }
  }

  const describe = (p) => {
    if (p.discount_type === 'free_period') return `${p.duration_in_months || 1} mois offert${(p.duration_in_months || 1) > 1 ? 's' : ''}`
    const v = p.percent_off !== null ? `-${p.percent_off} %` : `-${money(p.amount_off)}`
    const d = p.duration === 'forever' ? 'à vie' : p.duration === 'repeating' ? `pendant ${p.duration_in_months} mois` : '1 fois'
    return `${v} ${d}`
  }

  return (
    <div className="abp-stack">
      <header className="ux-view-header">
        <h2>Codes promo</h2>
        <p>Créés directement dans Stripe (coupon + code promotionnel).</p>
      </header>
      <Notice notice={notice} />

      <form className="abp-card" onSubmit={submit}>
        <div className="abp-presets">
          <span className="abp-label">Modèles rapides</span>
          {PRESETS.map((p) => (
            <button type="button" key={p.label} className="ux-btn-outline small" onClick={() => setForm({ ...EMPTY_PROMO, ...p.values })}>
              <Tag size={13} /> {p.label}
            </button>
          ))}
        </div>

        <div className="abp-form-row">
          <label>Code
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="BIENVENUE20" required pattern="[A-Za-z0-9_-]{3,32}" />
          </label>
          <label>Type de remise
            <select value={form.discount_type} onChange={set('discount_type')}>
              <option value="percent">Pourcentage</option>
              <option value="amount">Montant fixe</option>
              <option value="free_period">Période offerte</option>
            </select>
          </label>
          {form.discount_type === 'percent' && (
            <label>Remise (%)
              <input type="number" min="1" max="100" step="1" value={form.percent_off} onChange={set('percent_off')} required />
            </label>
          )}
          {form.discount_type === 'amount' && (
            <label>Remise (€)
              <input type="number" min="0.01" step="0.01" value={form.amount_off} onChange={set('amount_off')} required />
            </label>
          )}
          {form.discount_type === 'free_period' && (
            <label>Mois offerts
              <input type="number" min="1" max="12" step="1" value={form.duration_in_months} onChange={set('duration_in_months')} required />
            </label>
          )}
        </div>

        <div className="abp-form-row">
          <label>Cible
            <select value={form.target} onChange={set('target')}>
              <option value="signup">Inscription (nouveaux)</option>
              <option value="renewal">Renouvellement (existants)</option>
            </select>
          </label>
          {form.discount_type !== 'free_period' && (
            <label>Durée
              <select value={form.duration} onChange={set('duration')}>
                <option value="once">Une fois</option>
                <option value="repeating">Plusieurs mois</option>
                <option value="forever">Pour toujours</option>
              </select>
            </label>
          )}
          {form.discount_type !== 'free_period' && form.duration === 'repeating' && (
            <label>Nombre de mois
              <input type="number" min="1" max="36" step="1" value={form.duration_in_months} onChange={set('duration_in_months')} required />
            </label>
          )}
          <label>Expire le (facultatif)
            <input type="date" min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} value={form.expires_at} onChange={set('expires_at')} />
          </label>
          <label>Utilisations max (facultatif)
            <input type="number" min="1" step="1" value={form.max_redemptions} onChange={set('max_redemptions')} />
          </label>
        </div>

        <button className="ux-btn-primary" type="submit" disabled={saving}>
          {saving ? <Loader2 className="spin" size={16} /> : 'Créer le code promo'}
        </button>
      </form>

      <div className="abp-card">
        <h3>Codes créés</h3>
        {promos.length === 0 ? (
          <p className="abp-muted">Aucun code pour le moment.</p>
        ) : (
          <div className="abp-table-wrap">
            <table className="abp-table">
              <thead><tr><th>Code</th><th>Remise</th><th>Cible</th><th>Utilisations</th><th>Expire</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id}>
                    <td><code>{p.code}</code></td>
                    <td>{describe(p)}</td>
                    <td>{p.target === 'signup' ? 'Inscription' : 'Renouvellement'}</td>
                    <td>{p.times_redeemed ?? '—'}{p.max_redemptions ? ` / ${p.max_redemptions}` : ''}</td>
                    <td>{dateFr(p.expires_at)}</td>
                    <td><span className={`abp-badge ${p.active ? 'ok' : 'off'}`}>{p.active ? 'Actif' : 'Inactif'}</span></td>
                    <td>{p.active && <button className="ux-btn-icon red" title="Désactiver" onClick={() => deactivate(p)}><Trash2 size={15} /></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

/* ───────────── E-MAILS ───────────── */
const TEMPLATES = [
  { label: 'Bienvenue', subject: 'Bienvenue sur Fidelyz', message: "Bienvenue sur Fidelyz ! Votre espace est prêt : personnalisez votre carte, configurez vos récompenses et invitez vos premiers clients.\nN'hésitez pas à nous écrire si vous avez la moindre question." },
  { label: 'Nouveauté', subject: 'Du nouveau sur Fidelyz', message: "Nous venons de déployer une nouvelle fonctionnalité sur Fidelyz.\nConnectez-vous à votre espace pour la découvrir." },
  { label: 'Maintenance', subject: 'Maintenance programmée de Fidelyz', message: "Une courte maintenance est programmée prochainement. Le service pourra être momentanément indisponible ; vos données et cartes clients ne sont pas affectées." },
  { label: 'Paiement à régulariser', subject: 'Action requise : paiement de votre abonnement', message: "Nous n'avons pas pu prélever le paiement de votre abonnement Fidelyz. Merci de mettre à jour votre moyen de paiement depuis votre espace (Mon compte, puis Facturation) afin d'éviter toute interruption de service." }
]
const SEGMENTS = [
  { value: 'all', label: 'Tous les abonnés (actifs, essai, impayé en cours)' },
  { value: 'active', label: 'Abonnés actifs' },
  { value: 'trialing', label: 'En essai' },
  { value: 'past_due', label: 'Paiement en retard' },
  { value: 'unpaid', label: 'Inscription non finalisée' },
  { value: 'canceled', label: 'Abonnement résilié' }
]

export function AdminMailPanel({ enterprises = [], initialCompanyId = '' }) {
  const [mode, setMode] = useState('single')
  const [companyId, setCompanyId] = useState(initialCompanyId)
  const [segment, setSegment] = useState('all')
  const [count, setCount] = useState(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => { if (initialCompanyId) { setCompanyId(initialCompanyId); setMode('single') } }, [initialCompanyId])
  useEffect(() => {
    if (mode !== 'broadcast') return
    setCount(null)
    api.get('/admin/email/recipients', { params: { segment } })
      .then((r) => setCount(r.data.count))
      .catch(() => setCount(null))
  }, [mode, segment])

  const applyTemplate = (t) => { setSubject(t.subject); setMessage(t.message) }

  const send = async (e) => {
    e.preventDefault()
    setNotice(null)
    if (mode === 'broadcast' && !window.confirm(`Envoyer cet e-mail à ${count ?? 'tous les'} destinataire(s) ?`)) return
    setSending(true)
    try {
      const { data } = mode === 'single'
        ? await api.post('/admin/email/single', { entreprise_id: companyId, subject, message })
        : await api.post('/admin/email/broadcast', { segment, subject, message })
      setNotice({ type: data.success ? 'ok' : 'err', text: data.message })
      if (data.success) { setSubject(''); setMessage('') }
    } catch (err) {
      setNotice({ type: 'err', text: errMsg(err) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="abp-stack">
      <header className="ux-view-header">
        <h2>E-mails aux commerçants</h2>
        <p>Chaque envoi est enregistré dans le journal des e-mails.</p>
      </header>
      <Notice notice={notice} />

      <form className="abp-card" onSubmit={send}>
        <div className="abp-presets">
          <button type="button" className={`ux-btn-outline small${mode === 'single' ? ' abp-on' : ''}`} onClick={() => setMode('single')}>Un commerçant</button>
          <button type="button" className={`ux-btn-outline small${mode === 'broadcast' ? ' abp-on' : ''}`} onClick={() => setMode('broadcast')}>Email groupé</button>
        </div>

        {mode === 'single' ? (
          <label className="abp-field">Entreprise
            <select value={companyId} onChange={(e) => setCompanyId(e.target.value)} required>
              <option value="">Sélectionner…</option>
              {enterprises.map((c) => <option key={c.id} value={c.id}>{c.nom} — {c.email}</option>)}
            </select>
          </label>
        ) : (
          <label className="abp-field">Destinataires
            <select value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <span className="abp-muted">{count === null ? '…' : `${count} destinataire(s)`}</span>
          </label>
        )}

        <div className="abp-presets">
          <span className="abp-label">Modèles</span>
          {TEMPLATES.map((t) => (
            <button type="button" key={t.label} className="ux-btn-outline small" onClick={() => applyTemplate(t)}>{t.label}</button>
          ))}
        </div>

        <label className="abp-field">Objet
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} required />
        </label>
        <label className="abp-field">Message
          <textarea rows={8} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={10000} required />
        </label>

        <button className="ux-btn-primary" type="submit" disabled={sending || (mode === 'broadcast' && count === 0)}>
          {sending ? <Loader2 className="spin" size={16} /> : <><Send size={14} /> {mode === 'single' ? 'Envoyer' : 'Envoyer à tous'}</>}
        </button>
      </form>
    </div>
  )
}
