import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Download, Loader2, Lock, UserCheck } from 'lucide-react'
import api from '../api'
import './ProPanels.css'

const errMsg = (e) => e.response?.data?.error || 'Une erreur est survenue'
const day = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : 'Jamais')
const MONTHS = (m) => new Date(`${m}-01`).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })

// Espace de l'offre Business : indicateurs avancés, clients à relancer, exports CSV.
export default function BusinessPanel({ tier }) {
  const navigate = useNavigate()
  const [insights, setInsights] = useState(null)
  const [relaunch, setRelaunch] = useState(null)
  const [days, setDays] = useState(30)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [i, r] = await Promise.all([api.get('/pro/business/insights'), api.get(`/pro/business/relaunch?days=${days}`)])
      setInsights(i.data)
      setRelaunch(r.data)
    } catch (e) {
      setError(errMsg(e))
    }
  }, [days])

  useEffect(() => { if (tier === 'business') load() }, [tier, load])

  const download = async (kind) => {
    setExporting(kind)
    try {
      const res = await api.get(`/pro/business/export/${kind}.csv`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${kind}-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError("Export impossible pour le moment")
    } finally {
      setExporting('')
    }
  }

  if (tier !== 'business') {
    return (
      <section className="ui-card pp2-teaser">
        <span className="ui-icon lg"><Lock size={22} /></span>
        <h2 className="ui-card-title">Fonctions de l'offre Business</h2>
        <p className="ui-card-sub">Indicateurs avancés (taux de retour, meilleurs clients), liste des clients à relancer et exports CSV de vos clients et de vos transactions.</p>
        <button className="ui-btn" onClick={() => navigate('/pro/account')}>Passer à Business</button>
      </section>
    )
  }

  if (error) return <div className="ui-note danger"><AlertCircle size={15} /><span>{error}</span></div>
  if (!insights || !relaunch) return <div className="ui-card"><div className="ui-loading">Chargement…</div></div>

  const maxSignups = Math.max(1, ...insights.signups_by_month.map((s) => s.clients))

  return (
    <div className="pp2-stack">
      <div className="pp2-kpis">
        <div className="ui-card pp2-kpi"><span>Taux de retour</span><strong>{insights.return_rate} %</strong><small>clients venus 2 fois ou plus</small></div>
        <div className="ui-card pp2-kpi"><span>Visites moyennes</span><strong>{insights.avg_visits}</strong><small>par client</small></div>
        <div className="ui-card pp2-kpi"><span>Récompenses (90 j)</span><strong>{insights.rewards_90d}</strong><small>utilisées</small></div>
        <div className="ui-card pp2-kpi"><span>Clients</span><strong>{insights.total_clients}</strong><small>{insights.visited_clients} déjà venus</small></div>
      </div>

      <div className="pp2-two">
        <section className="ui-card">
          <h2 className="ui-card-title">Inscriptions par mois</h2>
          <div className="pp2-bars">
            {insights.signups_by_month.length === 0 && <p className="ui-card-sub">Pas encore d'inscription.</p>}
            {insights.signups_by_month.map((s) => (
              <div key={s.month} className="pp2-bar">
                <span>{MONTHS(s.month)}</span>
                <div><i style={{ width: `${(s.clients / maxSignups) * 100}%` }} /></div>
                <b>{s.clients}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="ui-card">
          <h2 className="ui-card-title">Meilleurs clients</h2>
          {insights.top_clients.length === 0 ? <p className="ui-card-sub">Aucune visite enregistrée.</p> : (
            <ol className="pp2-top">
              {insights.top_clients.map((c) => (
                <li key={c.id}><span>{c.prenom} {c.nom}</span><b>{c.visits} visite{c.visits > 1 ? 's' : ''}</b></li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="ui-card flush">
        <div className="acc-table-head pp2-head">
          <h2 className="ui-card-title"><span className="ui-icon sm"><UserCheck size={16} /></span> Clients à relancer</h2>
          <select className="ui-input pp2-select" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Inactifs depuis">
            {[14, 30, 60, 90].map((d) => <option key={d} value={d}>Sans visite depuis {d} jours</option>)}
          </select>
        </div>
        {relaunch.inactive.length === 0 ? (
          <div className="ui-empty"><p>Aucun client inactif sur cette période. Bravo !</p></div>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead><tr><th>Client</th><th>Points</th><th>Dernière visite</th><th>Contact</th></tr></thead>
              <tbody>
                {relaunch.inactive.map((c) => (
                  <tr key={c.id}>
                    <td>{c.prenom} {c.nom}</td>
                    <td>{c.points}</td>
                    <td>{day(c.last_visit)}</td>
                    <td>{c.marketing_optin ? (c.email || c.telephone || '—') : <span className="ui-hint">Pas d'accord marketing</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {relaunch.near_reward.length > 0 && (
          <div className="pp2-near">
            <strong>Proches d'une récompense ({relaunch.reward_target} points) :</strong>{' '}
            {relaunch.near_reward.map((c) => `${c.prenom} ${c.nom} (${c.points})`).join(', ')}
          </div>
        )}
      </section>

      <section className="ui-card">
        <h2 className="ui-card-title">Exports</h2>
        <p className="ui-card-sub">Fichiers CSV compatibles Excel. Les coordonnées des clients sans accord marketing ne sont pas incluses.</p>
        <div className="pp2-actions">
          <button className="ui-btn secondary" disabled={!!exporting} onClick={() => download('clients')}>
            {exporting === 'clients' ? <Loader2 size={16} className="pro-spin" /> : <Download size={16} />} Clients
          </button>
          <button className="ui-btn secondary" disabled={!!exporting} onClick={() => download('transactions')}>
            {exporting === 'transactions' ? <Loader2 size={16} className="pro-spin" /> : <Download size={16} />} Transactions
          </button>
        </div>
      </section>
    </div>
  )
}
