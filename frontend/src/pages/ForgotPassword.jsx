import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api'
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import './Auth.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const navigate = useNavigate()
  useEffect(() => {
    const savedTheme = localStorage.getItem('fidelyz-theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/pro/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell variant="pro">
        <div className="auth-state">
          <div className="auth-state-icon"><CheckCircle2 size={30} /></div>
          <div className="luxe-auth-header">
            <h1>Vérifiez vos emails</h1>
            <p>Si un compte existe pour <strong>{email}</strong>, vous allez recevoir un lien de réinitialisation.</p>
          </div>
          <Link to="/pro/login" className="btn-luxe-submit">
            Retour à la connexion
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell variant="pro">
        <Link to="/pro/login" className="back-link">
          <ArrowLeft size={15} /> Connexion
        </Link>
        <div className="luxe-auth-header">
          <h1>Mot de passe oublié ?</h1>
          <p>Entrez votre email : nous vous envoyons un lien pour en choisir un nouveau.</p>
        </div>

        <form onSubmit={handleSubmit} className="luxe-auth-form">
          <div className="luxe-form-group">
            <label htmlFor="email">Email professionnel</label>
            <input
              id="email"
              className="luxe-input"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          {error && (
            <div className="luxe-alert error">
              <AlertCircle size={18} /> <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-luxe-submit"
            disabled={loading || !email}
          >
            {loading ? (
              <Loader2 className="spin" size={20} />
            ) : (
              <>Envoyer le lien</>
            )}
          </button>
        </form>
    </AuthShell>
  )
}

export default ForgotPassword
