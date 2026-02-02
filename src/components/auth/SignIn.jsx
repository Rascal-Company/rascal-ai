import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function SignIn({ onClose, onForgotClick }) {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [pendingSuccess, setPendingSuccess] = useState(false)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (pendingSuccess && user && !authLoading) {
      console.log('[SignIn] Navigating to dashboard, user:', user.email)
      navigate('/dashboard')
      setPendingSuccess(false) // Reset after navigation
    }
  }, [pendingSuccess, user, authLoading, navigate])
  
  // Timeout varmuuden vuoksi - jos kirjautuminen kestää liian kauan
  useEffect(() => {
    if (pendingSuccess && !user && !authLoading) {
      // Jos odotetaan mutta käyttäjää ei tule, resetoidaan
      const timeout = setTimeout(() => {
        console.warn('[SignIn] Timeout waiting for user, resetting')
        setPendingSuccess(false)
        setLoading(false)
      }, 15000) // 15 sekuntia
      
      return () => clearTimeout(timeout)
    }
  }, [pendingSuccess, user, authLoading])

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
      } else {
        setPendingSuccess(true)
      }
    } catch (error) {
      setError('Kirjautuminen epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fullscreen-login-container">
      <div className="login-sidebar">
        <div className="login-photo-container">
          <img src="/login-photo.png" alt="Rascal AI" className="login-photo" />
          <div className="login-photo-overlay"></div>
        </div>
      </div>
      <div className="login-main-content">
        <div className="auth-container">
          {onClose && (
            <button
              onClick={onClose}
              className="auth-close-btn"
              aria-label={t('auth.close')}
            >
              ×
            </button>
          )}
          <h2 className="auth-title">{t('auth.signIn')}</h2>
      <form onSubmit={handleSignIn} className="auth-form">
        <div className="auth-form-group">
          <label htmlFor="email" className="auth-label">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="auth-input"
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="username"
          />
        </div>
        <div className="auth-form-group">
          <label htmlFor="password" className="auth-label">
            {t('auth.password')}
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="auth-input password"
            placeholder={t('auth.passwordPlaceholder')}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            className="auth-password-toggle"
          >
            {showPassword ? (
              // Auki silmä (eye open)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
              </svg>
            ) : (
              // Suljettu silmä (eye closed)
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.956 9.956 0 012.223-3.592m3.34-2.591A9.956 9.956 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.973 9.973 0 01-4.043 5.306M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            )}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="auth-button"
        >
          {loading ? t('auth.signingIn') : t('auth.signIn')}
        </button>
        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}
      </form>
      <div className="auth-links">
        <div>
          {onForgotClick ? (
            <a href="#" className="auth-link" onClick={e => { e.preventDefault(); onForgotClick(); }}>
              {t('auth.forgotPassword')}
            </a>
          ) : (
            <Link to="/forgot-password" className="auth-link">
              {t('auth.forgotPassword')}
            </Link>
          )}
        </div>
      </div>
        </div>
      </div>
    </div>
  )
}