import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../api'

export default function ProConfirmEmail() {
  const [params] = useSearchParams()
  const [state, setState] = useState({ loading: true, ok: false, text: '' })

  useEffect(() => {
    const token = params.get('token')
    if (!token) return setState({ loading: false, ok: false, text: 'Lien invalide' })
    api.post('/pro/account/confirm-email', { token })
      .then(r => setState({ loading: false, ok: true, text: r.data.message }))
      .catch(e => setState({ loading: false, ok: false, text: e.response?.data?.error || 'Erreur' }))
  }, [params])

  return (
    <div style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center', padding: 16 }}>
      <h2>Confirmation de l'email</h2>
      <p style={{ color: state.loading ? '#6b7280' : state.ok ? '#065f46' : '#991b1b' }}>
        {state.loading ? 'Vérification en cours…' : state.text}
      </p>
      <Link to="/pro/account">Retour à mon compte</Link>
    </div>
  )
}
