import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, Loader2, Megaphone, Send, Clock } from 'lucide-react'
import api from '../api'
import './ProPanels.css'

const errMsg = (e) => e.response?.data?.error || 'Une erreur est survenue'
const fmt = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—')

const SEGMENTS = [
  { id: 'all', label: 'Tous les clients' },
  { id: 'active', label: 'Clients avec des points' },
  { id: 'inactive', label: 'Clients sans points' }
]

// Campagnes de notifications : l'envoi est encadré côté serveur (quota mensuel, délai entre deux campagnes,
// accord marketing, une campagne maximum par client et par semaine, pas d'envoi de nuit).
export default function CampaignsPanel() {
  const navigate = useNavigate()
  const [quota, setQuota] = useState(null)
  const [history, setHistory] = useState([])
  const [form, setForm] = useState({ title: '', message: '', segment: 'all' })
  const [sending, setSending] = useState(false)
  const [fb, setFb] = useState(null)

  const load = useCallback(async () => {
    try {
      const [q, h] = await Promise.all([api.get('/pro/notifications/quota'), api.get('/pro/notifications/history?limit=10')])
      setQuota(q.data)
      setHistory(h.data.notifications || [])
    } catch (e) {
      setFb({ type: 'err', text: errMsg(e) })
    }
  }, [])
  useEffect(() => { load() }, [load])

  const send = async (e) => {
    e.preventDefault()
    if (!window.confirm('Envoyer cette campagne ? Elle comptera dans votre quota du mois.')) return
    setSending(true)
    setFb(null)
    try {
      const { data } = await api.post('/pro/notifications/send', {
        title: form.title,
        message: form.message,
        target_type: form.segment === 'all' ? 'all' : 'segment',
        target_segment: form.segment === 'all' ? null : form.segment
      })
      setFb({ type: 'ok', text: data.message })
      setForm({ title: '', message: '', segment: 'all' })
    } catch (err) {
      setFb({ type: 'err', text: errMsg(err) })
    } finally {
      setSending(false)
      load()
    }
  }

  if (!quota) return <div className="ui-card"><div className="ui-loading">Chargement…</div></div>

  const locked = quota.limit === 0
  const blocked = quota.suspended || quota.remaining === 0 || !!quota.next_allowed_at

  return (
    <div className="pp2-stack">
      <section className="ui-card">
        <div className="pp2-quota">
          <div>
            <span className="page-eyebrow">Ce mois-ci</span>
            <div className="pp2-big">{quota.used} <span>/ {quota.limit} campagne{quota.limit > 1 ? 's' : ''}</span></div>
          </div>
          <ul className="pp2-rules">
            <li><Clock size={14} /> {quota.min_hours_between} h minimum entre deux campagnes</li>
            <li><Clock size={14} /> Un client reçoit au plus une campagne tous les {quota.client_cooldown_days} jours</li>
            <li><Clock size={14} /> Pas d'envoi entre {quota.quiet_hours.from} h et {quota.quiet_hours.to} h</li>
            <li><CheckCircle2 size={14} /> Uniquement les clients ayant accepté de recevoir des offres</li>
          </ul>
        </div>
        {locked && (
          <div className="ui-note warning pp2-gap">
            <AlertCircle size={15} />
            <span>Les campagnes sont réservées aux offres Pro et Business.</span>
            <button type="button" className="ui-btn sm" onClick={() => navigate('/pro/account')}>Voir les offres</button>
          </div>
        )}
        {!locked && quota.next_allowed_at && (
          <div className="ui-note pp2-gap"><Clock size={15} /><span>Prochaine campagne possible à partir du {fmt(quota.next_allowed_at)}.</span></div>
        )}
        {!locked && quota.quiet_now && (
          <div className="ui-note pp2-gap"><Clock size={15} /><span>Envoi impossible la nuit : réessayez après {quota.quiet_hours.to} h (heure de Paris).</span></div>
        )}
      </section>

      <form className="ui-card" onSubmit={send}>
        <h2 className="ui-card-title"><span className="ui-icon sm"><Megaphone size={16} /></span> Nouvelle campagne</h2>
        <div className="ui-field pp2-gap">
          <label className="ui-label">Titre <span className="ui-hint">{form.title.length}/60</span></label>
          <input className="ui-input" maxLength={60} required value={form.title} disabled={locked}
            onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex : -20 % ce week-end" />
        </div>
        <div className="ui-field pp2-gap">
          <label className="ui-label">Message <span className="ui-hint">{form.message.length}/200</span></label>
          <textarea className="ui-input" rows={3} maxLength={200} required value={form.message} disabled={locked}
            onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Votre message, court et utile." />
        </div>
        <div className="ui-field pp2-gap">
          <label className="ui-label">Destinataires</label>
          <select className="ui-input" value={form.segment} disabled={locked} onChange={(e) => setForm({ ...form, segment: e.target.value })}>
            {SEGMENTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        {fb && (
          <div className={`ui-note ${fb.type === 'ok' ? 'success' : 'danger'} pp2-gap`}>
            {fb.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}<span>{fb.text}</span>
          </div>
        )}
        <div className="pp2-gap">
          <button className="ui-btn" type="submit" disabled={sending || locked || blocked}>
            {sending ? <Loader2 size={16} className="pro-spin" /> : <Send size={16} />} Envoyer la campagne
          </button>
        </div>
      </form>

      <section className="ui-card flush">
        <div className="acc-table-head"><h2 className="ui-card-title">Dernières campagnes</h2></div>
        {history.length === 0 ? (
          <div className="ui-empty"><p>Aucune campagne envoyée pour le moment.</p></div>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead><tr><th>Date</th><th>Titre</th><th>Destinataires</th></tr></thead>
              <tbody>
                {history.map((n) => (
                  <tr key={n.id}><td>{fmt(n.sent_at || n.created_at)}</td><td>{n.title}</td><td>{n.recipients_count ?? 0}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
