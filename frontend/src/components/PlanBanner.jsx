import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Lock } from 'lucide-react'
import api from '../api'

// Bandeau d'état de l'offre gratuite : proche de la limite, inscriptions fermées, ou compte verrouillé.
// refreshKey : à changer (ex. nombre de clients) pour recharger l'état.
export default function PlanBanner({ refreshKey }) {
  const [status, setStatus] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    api.get('/pro/status').then(({ data }) => alive && setStatus(data)).catch(() => {})
    return () => { alive = false }
  }, [refreshKey])

  if (!status || status.tier !== 'free' || status.client_limit == null) return null

  const { client_count: count, client_limit: limit } = status
  const goOffers = () => navigate('/pro/account')
  const upgrade = <button className="ui-btn sm" onClick={goOffers}>Voir les offres</button>

  if (status.locked) {
    return (
      <div className="ui-note danger plan-banner">
        <Lock size={16} />
        <span>
          <strong>Compte verrouillé :</strong> vous avez {count} clients pour une limite de {limit} en offre gratuite.
          Vos données sont conservées. Supprimez {count - limit} client{count - limit > 1 ? 's' : ''} ou passez à une offre payante pour reprendre.
        </span>
        {upgrade}
      </div>
    )
  }
  if (count >= limit) {
    return (
      <div className="ui-note warning plan-banner">
        <AlertCircle size={16} />
        <span><strong>Limite atteinte ({count}/{limit}) :</strong> les nouvelles inscriptions sont fermées. Passez à Pro pour accueillir des clients sans limite.</span>
        {upgrade}
      </div>
    )
  }
  if (count >= limit - 3) {
    return (
      <div className="ui-note warning plan-banner">
        <AlertCircle size={16} />
        <span>Offre gratuite : {count}/{limit} clients. Au-delà, les inscriptions se ferment.</span>
        {upgrade}
      </div>
    )
  }
  return null
}
