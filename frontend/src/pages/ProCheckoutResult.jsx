import React, { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import './Auth.css'
import './ProSignup.css'

function useDarkTheme() {
  useEffect(() => {
    const dark = (localStorage.getItem('theme') || 'dark') === 'dark'
    document.documentElement.classList.toggle('dark-mode', dark)
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [])
}

export function ProCheckoutSuccess() {
  useDarkTheme()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const [state, setState] = useState(sessionId ? 'loading' : 'error')

  useEffect(() => {
    if (!sessionId) return
    api.post('/pro/checkout/success', { session_id: sessionId })
      .then(() => setState('ok'))
      .catch(() => setState('error'))
  }, [sessionId])

  return (
    <AuthShell variant="pro">
      <div className="auth-state">
        {state === 'loading' && (
          <>
            <div className="auth-state-icon"><Loader2 className="spin" size={30} /></div>
            <div className="luxe-auth-header">
              <h1>Un instant…</h1>
              <p>Vérification de votre paiement.</p>
            </div>
          </>
        )}
        {state === 'ok' && (
          <>
            <div className="auth-state-icon"><CheckCircle2 size={30} /></div>
            <div className="luxe-auth-header"><h1>Bienvenue sur Fidelyz</h1></div>
            <p>
              Votre inscription est confirmée. L’activation de votre espace prend quelques secondes :
              un e-mail récapitulatif vous est envoyé et vous pouvez déjà vous connecter avec votre e-mail et votre mot de passe.
            </p>
            <Link to="/pro/login" className="btn-luxe-submit">Accéder à mon espace</Link>
          </>
        )}
        {state === 'error' && (
          <>
            <div className="auth-state-icon danger"><XCircle size={30} /></div>
            <div className="luxe-auth-header"><h1>Paiement non confirmé</h1></div>
            <p>
              Nous n’avons pas pu confirmer votre paiement. Si vous avez été débité, votre compte sera activé automatiquement ;
              sinon vous pouvez recommencer.
            </p>
            <Link to="/pro/signup" className="btn-luxe-submit">Réessayer l’inscription</Link>
          </>
        )}
      </div>
    </AuthShell>
  )
}

export function ProCheckoutCancel() {
  useDarkTheme()
  return (
    <AuthShell variant="pro">
      <div className="auth-state">
        <div className="auth-state-icon warning"><XCircle size={30} /></div>
        <div className="luxe-auth-header"><h1>Inscription interrompue</h1></div>
        <p>Vous avez quitté la page de paiement : aucun montant n’a été prélevé. Vous pouvez reprendre quand vous voulez.</p>
        <Link to="/pro/signup" className="btn-luxe-submit">Reprendre l’inscription</Link>
      </div>
    </AuthShell>
  )
}
