import React, { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import api from '../api'
import './ProPanels.css'

// Caisse multi-établissements : l'établissement choisi est envoyé avec chaque opération (en-tête
// X-Establishment-Id) pour attribuer les passages. Un compte équipe rattaché à un établissement n'a pas le choix.
export default function EstablishmentPicker({ user }) {
  const [list, setList] = useState([])
  const [current, setCurrent] = useState(() => localStorage.getItem('establishmentId') || '')

  useEffect(() => {
    if (user?.tier !== 'business') return
    api.get('/pro/establishments').then((r) => setList(r.data.establishments || [])).catch(() => {})
  }, [user?.tier])

  if (list.length === 0) return null

  if (user?.establishment_id) {
    const own = list.find((e) => e.id === user.establishment_id)
    return <div className="ui-note pp2-picker"><MapPin size={15} /><span>Caisse : <strong>{own?.nom || 'votre établissement'}</strong></span></div>
  }

  const change = (e) => {
    const value = e.target.value
    setCurrent(value)
    if (value) localStorage.setItem('establishmentId', value)
    else localStorage.removeItem('establishmentId')
  }

  return (
    <div className="ui-note pp2-picker">
      <MapPin size={15} />
      <label htmlFor="caisse-etablissement">Caisse de l'établissement</label>
      <select id="caisse-etablissement" className="ui-input pp2-select-sm" value={list.some((l) => l.id === current) ? current : ''} onChange={change}>
        <option value="">Non précisé</option>
        {list.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
      </select>
    </div>
  )
}
