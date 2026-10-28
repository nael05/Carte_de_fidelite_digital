import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import api from '../api'
import AuthShell from '../components/AuthShell'
import './Auth.css'

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
    <AuthShell variant="pro">
      <div className="auth-state">
        <div className={`auth-state-icon${!state.loading && !state.ok ? ' danger' : ''}`}>
          {state.loading ? <Loader2 className="spin" size={30} /> : state.ok ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
        </div>
        <div className="luxe-auth-header">
          <h1>Confirmation de l'email</h1>
        </div>
        <p>{state.loading ? 'Vérification en cours…' : state.text}</p>
        <Link to="/pro/account" className="btn-luxe-submit">Retour à mon compte</Link>
      </div>
    </AuthShell>
  )
}
