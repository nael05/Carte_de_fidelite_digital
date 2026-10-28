import { validatePassword, PASSWORD_RULES } from '../utils/passwordValidator'
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import api from '../api'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, Circle, ArrowLeft } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import './Auth.css'

import usePageTitle from '../utils/usePageTitle'

function PublicResetPassword() {
  usePageTitle("Nouveau mot de passe | Fidelyz", { noindex: true })
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  const queryParams = new URLSearchParams(location.search)
  const token = queryParams.get('token')
  useEffect(() => {
    const savedTheme = localStorage.getItem('fidelyz-theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode')
    } else {
      document.documentElement.classList.remove('dark-mode')
    }
  }, [])

  useEffect(() => {
    if (!token) {
      setError('Lien de réinitialisation invalide ou manquant.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (newPassword !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas')
        setLoading(false)
        return
      }
      if (!validatePassword(newPassword).isValid) {
        setError('Le mot de passe ne respecte pas les critères de sécurité')
        setLoading(false)
        return
      }

      await api.post('/pro/reset-password', { token, newPassword })
      setSuccess(true)

      setTimeout(() => {
        navigate('/pro/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la réinitialisation')
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
            <h1>Mot de passe mis à jour</h1>
            <p>Votre nouveau mot de passe est maintenant actif.</p>
          </div>
          <span className="auth-note"><Loader2 size={14} className="spin" /> Redirection vers la connexion…</span>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell variant="pro">
        <div className="luxe-auth-header">
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un mot de passe robuste pour sécuriser votre espace.</p>
        </div>

        {!token ? (
          <div className="luxe-alert error">
             <AlertCircle size={18} /> <span>{error}</span>
             <Link to="/pro/forgot-password">Demander un nouveau lien</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="luxe-auth-form">
            <div className="luxe-form-group">
              <label htmlFor="newPassword">Nouveau mot de passe</label>
              <input
                id="newPassword"
                className="luxe-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn" aria-label="Afficher ou masquer le mot de passe"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="luxe-form-group">
              <label htmlFor="confirmPassword">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                className="luxe-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn" aria-label="Afficher ou masquer le mot de passe"
                onClick={() => setShowConfirm(!showConfirm)}
                tabIndex="-1"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {newPassword && (
              <div className="luxe-criteria-box">
                <span className="luxe-criteria-title">Votre mot de passe doit contenir</span>
                <ul className="luxe-criteria-list">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(newPassword)
                    return (
                      <li key={rule.id} className={`luxe-criteria-item ${ok ? 'valid' : ''}`}>
                        {ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {rule.label}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {error && (
              <div className="luxe-alert error">
                <AlertCircle size={18} /> <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-luxe-submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? (
                <Loader2 className="spin" size={20} />
              ) : (
                'Enregistrer'
              )}
            </button>
          </form>
        )}
    </AuthShell>
  )
}

export default PublicResetPassword
