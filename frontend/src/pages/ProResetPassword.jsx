import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { validatePassword, PASSWORD_RULES } from '../utils/passwordValidator'
import api from '../api'
import { AlertCircle, Eye, EyeOff, Loader2, CheckCircle2, Circle } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import './Auth.css'

import usePageTitle from '../utils/usePageTitle'

function ProResetPassword() {
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
  const { token, updateMustChangePassword } = useAuth()
  useEffect(() => {
    const savedTheme = localStorage.getItem('fidelyz-theme')
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])
  useEffect(() => {
    const fromProLogin = location.state?.fromLogin

    if (!token && !fromProLogin) {
      navigate('/pro/login')
    }
  }, [token, navigate, location])

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

      const validation = validatePassword(newPassword)
      if (!validation.isValid) {
        setError(`Le mot de passe ne respecte pas les critères`)
        setLoading(false)
        return
      }

      await api.put('/pro/change-password', { newPassword })
      updateMustChangePassword(false)
      setSuccess(true)

      setTimeout(() => {
        navigate('/pro/dashboard')
      }, 2000)
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Session expirée. Reconnexion requise.')
        setTimeout(() => navigate('/pro/login'), 2000)
      } else {
        setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe')
      }
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
            <p>Votre compte est sécurisé.</p>
          </div>
          <span className="auth-note"><Loader2 size={14} className="spin" /> Redirection vers votre espace…</span>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell variant="pro">
        <div className="luxe-auth-header">
          <h1>Sécurisez votre compte</h1>
          <p>Choisissez votre mot de passe personnel pour remplacer le mot de passe temporaire.</p>
        </div>

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
              'Valider le mot de passe'
            )}
          </button>
        </form>
    </AuthShell>
  )
}

export default ProResetPassword
