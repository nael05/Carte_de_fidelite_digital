import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, KeyRound, Loader2, Trash2, UserPlus } from 'lucide-react'
import api from '../api'
import './ProPanels.css'

const errMsg = (e) => e.response?.data?.error || 'Une erreur est survenue'
const ROLE_LABELS = { cashier: 'Caissier', manager: 'Manager' }
const ROLE_HELP = {
  cashier: 'Caisse et consultation des clients uniquement.',
  manager: 'Tout sauf abonnement, facturation, équipe et établissements.'
}
const lastLogin = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'Jamais')

const randomPassword = () => {
  const letters = 'abcdefghijkmnpqrstuvwxyz'
  const pick = (chars, n) => Array.from(crypto.getRandomValues(new Uint32Array(n)), (v) => chars[v % chars.length]).join('')
  return `${pick('ABCDEFGHJKLMNPQRSTUVWXYZ', 2)}${pick(letters, 6)}${pick('23456789', 3)}!`
}

const EMPTY = { nom: '', email: '', role: 'cashier', establishment_id: '', mot_de_passe: '' }

// Comptes équipe (offre Business) : caissiers et managers qui se connectent avec leur propre e-mail.
export default function TeamPanel() {
  const [team, setTeam] = useState(null)
  const [establishments, setEstablishments] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [fb, setFb] = useState(null)
  const [created, setCreated] = useState(null)

  const load = useCallback(async () => {
    try {
      const [t, e] = await Promise.all([api.get('/pro/staff'), api.get('/pro/establishments')])
      setTeam(t.data)
      setEstablishments(e.data.establishments || [])
    } catch (err) {
      setFb({ type: 'err', text: errMsg(err) })
    }
  }, [])
  useEffect(() => { load() }, [load])

  const run = async (fn, okText) => {
    setBusy(true)
    setFb(null)
    try {
      await fn()
      setFb({ type: 'ok', text: okText })
      await load()
      return true
    } catch (e) {
      setFb({ type: 'err', text: errMsg(e) })
      return false
    } finally {
      setBusy(false)
    }
  }

  const create = async (e) => {
    e.preventDefault()
    const snapshot = form
    const ok = await run(() => api.post('/pro/staff', { ...form, establishment_id: form.establishment_id || null }), 'Compte créé')
    if (ok) {
      setCreated({ email: snapshot.email, password: snapshot.mot_de_passe })
      setForm(EMPTY)
    }
  }

  const resetPassword = (member) => {
    const value = window.prompt(`Nouveau mot de passe pour ${member.nom} (10 caractères min., majuscule, minuscule, chiffre ou caractère spécial) :`, randomPassword())
    if (!value) return
    run(() => api.put(`/pro/staff/${member.id}`, { mot_de_passe: value }), `Mot de passe de ${member.nom} modifié`)
      .then((ok) => ok && setCreated({ email: member.email, password: value }))
  }

  const remove = (member) => {
    if (!window.confirm(`Supprimer le compte de ${member.nom} ? Cette personne ne pourra plus se connecter.`)) return
    run(() => api.delete(`/pro/staff/${member.id}`), 'Compte supprimé')
  }

  if (!team) return <div className="ui-card"><div className="ui-loading">Chargement…</div></div>

  return (
    <div className="pp2-stack">
      {fb && (
        <div className={`ui-note ${fb.type === 'ok' ? 'success' : 'danger'}`}>
          {fb.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}<span>{fb.text}</span>
        </div>
      )}
      {created && (
        <div className="ui-note warning">
          <KeyRound size={15} />
          <span>
            Identifiants à transmettre : <strong>{created.email}</strong> / <strong>{created.password}</strong>.
            Ce mot de passe ne sera plus affiché ; la personne se connecte depuis la page de connexion Pro habituelle.
          </span>
          <button className="ui-btn secondary sm" onClick={() => setCreated(null)}>Masquer</button>
        </div>
      )}

      <form className="ui-card" onSubmit={create}>
        <h2 className="ui-card-title"><span className="ui-icon sm"><UserPlus size={16} /></span> Ajouter un membre</h2>
        <p className="ui-card-sub">{team.staff.length}/{team.max} comptes. {ROLE_HELP[form.role]}</p>
        <div className="pp2-form-grid pp2-gap">
          <input className="ui-input" placeholder="Nom" maxLength={100} required value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className="ui-input" type="email" placeholder="E-mail" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="off" />
          <select className="ui-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="ui-input" value={form.establishment_id} onChange={(e) => setForm({ ...form, establishment_id: e.target.value })}>
            <option value="">Tous les établissements</option>
            {establishments.map((est) => <option key={est.id} value={est.id}>{est.nom}</option>)}
          </select>
          <div className="pp2-inline">
            <input className="ui-input" placeholder="Mot de passe initial" required value={form.mot_de_passe} autoComplete="off"
              onChange={(e) => setForm({ ...form, mot_de_passe: e.target.value })} />
            <button className="ui-btn secondary" type="button" onClick={() => setForm({ ...form, mot_de_passe: randomPassword() })}>Générer</button>
          </div>
          <button className="ui-btn" type="submit" disabled={busy || team.staff.length >= team.max}>
            {busy ? <Loader2 size={16} className="pro-spin" /> : <UserPlus size={16} />} Créer le compte
          </button>
        </div>
      </form>

      <section className="ui-card flush">
        <div className="acc-table-head"><h2 className="ui-card-title">Équipe</h2></div>
        {team.staff.length === 0 ? (
          <div className="ui-empty"><p>Aucun membre pour le moment.</p></div>
        ) : (
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead><tr><th>Nom</th><th>Rôle</th><th>Établissement</th><th>Dernière connexion</th><th>Statut</th><th /></tr></thead>
              <tbody>
                {team.staff.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.nom}</strong><br /><span className="ui-hint">{m.email}</span></td>
                    <td>
                      <select className="ui-input pp2-select-sm" value={m.role} disabled={busy}
                        onChange={(e) => run(() => api.put(`/pro/staff/${m.id}`, { role: e.target.value }), 'Rôle modifié')}>
                        {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>{m.establishment_nom || 'Tous'}</td>
                    <td>{lastLogin(m.last_login)}</td>
                    <td>
                      <button className={`ui-badge ${m.actif ? 'accent' : ''} pp2-toggle`} disabled={busy}
                        onClick={() => run(() => api.put(`/pro/staff/${m.id}`, { actif: !m.actif }), m.actif ? 'Compte désactivé' : 'Compte activé')}>
                        {m.actif ? 'Actif' : 'Désactivé'}
                      </button>
                    </td>
                    <td className="acc-td-right pp2-actions">
                      <button className="icon-btn plain" onClick={() => resetPassword(m)} aria-label="Nouveau mot de passe" title="Nouveau mot de passe"><KeyRound size={15} /></button>
                      <button className="icon-btn plain danger" onClick={() => remove(m)} aria-label="Supprimer"><Trash2 size={15} /></button>
                    </td>
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
