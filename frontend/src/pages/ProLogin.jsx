import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { AlertCircle, Loader2, Eye, EyeOff, Building2, HelpCircle } from 'lucide-react'
import AuthShell from '../components/AuthShell'
import './Auth.css'

function ProLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const navigate = useNavigate()
  const notice = useLocation().state?.notice
  const { login, isAuthenticated, loading: authLoading, role } = useAuth()
  const redirectedRef = useRef(false)
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
    if (authLoading) return
    if (isAuthenticated && role === 'pro' && !redirectedRef.current) {
      redirectedRef.current = true
      navigate('/pro/dashboard')
    }
  }, [authLoading, isAuthenticated, role, navigate])
  useEffect(() => {
    const remembered = localStorage.getItem('rememberedEmail')
    if (remembered) {
      setEmail(remembered)
      setRememberMe(true)
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await api.post('/pro/login', {
        email,
        mot_de_passe: password
      })

      if (response.data.token) {
        login(response.data.token, 'pro', response.data.mustChangePassword)

        if (response.data.companyId) {
          localStorage.setItem('companyId', response.data.companyId)
          localStorage.setItem('companyName', response.data.nom)
        }

        if (response.data.deviceId) {
          localStorage.setItem('deviceId', response.data.deviceId)
        }

        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        const mustChange = response.data.mustChangePassword === true

        if (mustChange) {
          navigate('/pro/secure-password', {
            state: { email, firstTime: true, fromLogin: true }
          })
        } else {
          navigate('/pro/dashboard')
        }
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect')
      } else if (err.response?.status === 403) {
        setError('Compte suspendu')
      } else {
        setError('Problème de connexion')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell variant="pro">
        <div className="luxe-auth-header">
          <h1>Bon retour.</h1>
          <p>Connectez-vous à votre espace Pro.</p>
        </div>

        <form onSubmit={handleSubmit} className="luxe-auth-form">
          {notice && <div className="luxe-alert success"><span>{notice}</span></div>}
          <div className="luxe-form-group">
            <label htmlFor="email">Email professionnel</label>
            <input
              id="email"
              className="luxe-input"
              type="email"
              placeholder="contact@commerce.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <div className="auth-row">
            <label className="auth-check" htmlFor="remember">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Se souvenir de moi
            </label>
            <Link to="/pro/forgot-password" className="auth-link">
              Mot de passe oublié ?
            </Link>
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
              <>Se connecter</>
            )}
          </button>
        </form>

        <div className="luxe-auth-footer">
          <p>Pas encore de compte ? <Link to="/pro/signup">Créer mon espace Pro</Link></p>
        </div>
    </AuthShell>
  )
}

export default ProLogin
