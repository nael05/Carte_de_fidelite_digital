import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { AlertCircle, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import './Auth.css'

function AdminLogin() {
  const [identifiant, setIdentifiant] = useState('')
  const [mot_de_passe, setMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login, isAuthenticated, isAdmin } = useAuth()
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark-mode')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark-mode')
      document.documentElement.setAttribute('data-theme', 'light')
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated && isAdmin()) {
      navigate('/master-admin-secret/dashboard')
    }
  }, [isAuthenticated, isAdmin, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/admin/login', { identifiant, mot_de_passe })
      login(response.data.token, 'admin')
      navigate('/master-admin-secret/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell variant="admin">
        <div className="luxe-auth-header">
          <h1>Accès administrateur</h1>
          <p>Espace sécurisé de gestion de Fidelyz.</p>
        </div>

        <form onSubmit={handleSubmit} className="luxe-auth-form">
          <div className="luxe-form-group">
            <label htmlFor="identifiant">Identifiant</label>
            <input
              id="identifiant"
              className="luxe-input"
              type="text"
              placeholder="Nom d'utilisateur"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div className="luxe-form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className="luxe-input"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={mot_de_passe}
              onChange={(e) => setMotDePasse(e.target.value)}
              disabled={loading}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <div className="luxe-alert error">
              <AlertCircle size={18} /> <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn-luxe-submit"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="spin" size={20} />
            ) : (
              <>Accéder au système</>
            )}
          </button>
        </form>

        <div className="luxe-auth-footer">
          <p className="muted">Connexion chiffrée · accès réservé</p>
        </div>
    </AuthShell>
  )
}

export default AdminLogin
