import React, { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Copy, Loader2, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import api from '../api'
import './ProPanels.css'

const errMsg = (e) => e.response?.data?.error || 'Une erreur est survenue'

// Établissements (offre Business) : un lien d'inscription par point de vente et des chiffres par établissement.
export default function EstablishmentsPanel() {
  const [data, setData] = useState(null)
  const [form, setForm] = useState({ nom: '', adresse: '' })
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [fb, setFb] = useState(null)
  const companyId = localStorage.getItem('companyId')

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/pro/establishments')
      setData(d)
    } catch (e) {
      setFb({ type: 'err', text: errMsg(e) })
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
    if (await run(() => api.post('/pro/establishments', form), 'Établissement créé')) setForm({ nom: '', adresse: '' })
  }

  const save = async (e) => {
    e.preventDefault()
    if (await run(() => api.put(`/pro/establishments/${editing.id}`, { nom: editing.nom, adresse: editing.adresse }), 'Établissement mis à jour')) setEditing(null)
  }

  const remove = (est) => {
    if (!window.confirm(`Supprimer « ${est.nom} » ? Ses clients et son historique sont conservés, sans établissement.`)) return
    run(() => api.delete(`/pro/establishments/${est.id}`), 'Établissement supprimé')
  }

  const copyLink = async (est) => {
    const url = `${window.location.origin}/join/${companyId}?etab=${est.id}`
    try {
      await navigator.clipboard.writeText(url)
      setFb({ type: 'ok', text: `Lien d'inscription de « ${est.nom} » copié` })
    } catch {
      window.prompt("Copiez ce lien d'inscription :", url)
    }
  }

  if (!data) return <div className="ui-card"><div className="ui-loading">Chargement…</div></div>

  const list = data.establishments

  return (
    <div className="pp2-stack">
      {fb && (
        <div className={`ui-note ${fb.type === 'ok' ? 'success' : 'danger'}`}>
          {fb.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}<span>{fb.text}</span>
        </div>
      )}

      <form className="ui-card" onSubmit={create}>
        <h2 className="ui-card-title"><span className="ui-icon sm"><MapPin size={16} /></span> Ajouter un établissement</h2>
        <p className="ui-card-sub">Chaque point de vente a son lien d'inscription : vos clients y sont rattachés et vous suivez son activité. {list.length}/{data.max}</p>
        <div className="pp2-row pp2-gap">
          <input className="ui-input" placeholder="Nom (ex : Boutique Centre-ville)" maxLength={100} required value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })} />
          <input className="ui-input" placeholder="Adresse (facultatif)" maxLength={255} value={form.adresse}
            onChange={(e) => setForm({ ...form, adresse: e.target.value })} />
          <button className="ui-btn" type="submit" disabled={busy || list.length >= data.max}>
            {busy ? <Loader2 size={16} className="pro-spin" /> : <Plus size={16} />} Ajouter
          </button>
        </div>
      </form>

      {list.length === 0 ? (
        <div className="ui-card"><div className="ui-empty"><p>Aucun établissement pour le moment.</p></div></div>
      ) : (
        <div className="pp2-cards">
          {list.map((est) => (
            <section key={est.id} className="ui-card pp2-est">
              {editing?.id === est.id ? (
                <form onSubmit={save} className="pp2-stack">
                  <input className="ui-input" maxLength={100} required value={editing.nom} onChange={(e) => setEditing({ ...editing, nom: e.target.value })} />
                  <input className="ui-input" maxLength={255} value={editing.adresse || ''} placeholder="Adresse" onChange={(e) => setEditing({ ...editing, adresse: e.target.value })} />
                  <div className="pp2-actions">
                    <button className="ui-btn sm" type="submit" disabled={busy}>Enregistrer</button>
                    <button className="ui-btn secondary sm" type="button" onClick={() => setEditing(null)}>Annuler</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="pp2-est-head">
                    <div>
                      <strong>{est.nom}</strong>
                      {est.adresse && <span className="ui-hint">{est.adresse}</span>}
                    </div>
                    <div className="pp2-actions">
                      <button className="icon-btn plain" onClick={() => setEditing({ ...est })} aria-label="Modifier"><Pencil size={15} /></button>
                      <button className="icon-btn plain danger" onClick={() => remove(est)} aria-label="Supprimer"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <dl className="pp2-stats">
                    <div><dt>Clients</dt><dd>{est.clients}</dd></div>
                    <div><dt>Passages (30 j)</dt><dd>{est.passages_30d}</dd></div>
                    <div><dt>Points (30 j)</dt><dd>{est.points_30d}</dd></div>
                  </dl>
                  <button className="ui-btn secondary sm" onClick={() => copyLink(est)}><Copy size={14} /> Copier le lien d'inscription</button>
                </>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
