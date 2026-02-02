import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ResetPassword() {
  const { t } = useTranslation('common')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isValidSession, setIsValidSession] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const handleTokenVerification = async () => {
      try {
        // Tarkista onko token_hash URL:ssa
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')

        if (token_hash && type === 'recovery') {
          // Verify OTP recovery tokenille
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'recovery'
          })
          
          if (error) {
            console.error('Error verifying recovery token:', error.message)
            setMessage(t('auth.invalidLink'))
            setIsVerifying(false)
            return
          }
          
          if (data.session) {
            setIsValidSession(true)
            setMessage(t('auth.setNewPassword'))
          }
        } else {
          // Fallback: tarkista onko sessio jo olemassa
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            setIsValidSession(true)
          } else {
            setMessage(t('auth.invalidLink'))
          }
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        setMessage(t('auth.unexpectedError'))
      } finally {
        setIsVerifying(false)
      }
    }

    handleTokenVerification()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setIsValidSession(true)
          setMessage(t('auth.setNewPassword'))
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [searchParams])

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage(t('auth.passwordsDontMatch'))
      return
    }
    
    if (password.length < 6) {
      setMessage(t('auth.passwordTooShort'))
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage(t('auth.passwordUpdated'))
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (error) {
      setMessage(t('auth.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  if (isVerifying) {
    return (
      <div className="auth-container">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-300">{t('auth.verifyingRecovery')}</p>
        </div>
      </div>
    )
  }

  if (!isValidSession) {
    return (
      <div className="auth-container">
        <div className="text-center">
          <h2 className="auth-title">{t('auth.invalidLinkTitle')}</h2>
          <p className="text-gray-300 mb-6">
            {message || t('auth.invalidLink')}
          </p>
          <button
            onClick={() => navigate('/signin')}
            className="auth-button"
          >
            {t('auth.backToSignin')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <h2 className="auth-title">{t('auth.setNewPassword')}</h2>
      
      <form onSubmit={handlePasswordReset} className="auth-form">
        <div className="auth-form-group">
          <label htmlFor="password" className="auth-label">
            {t('auth.newPassword')}
          </label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="auth-input password"
            placeholder={t('auth.min6chars')}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            tabIndex={-1}
            aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            className="auth-password-toggle"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            )}
          </button>
        </div>
        
        <div className="auth-form-group">
          <label htmlFor="confirmPassword" className="auth-label">
            {t('auth.confirmNewPassword')}
          </label>
          <input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="auth-input password"
            placeholder={t('auth.confirmNewPasswordPlaceholder')}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(v => !v)}
            tabIndex={-1}
            aria-label={showConfirmPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            className="auth-password-toggle"
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={2} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width={24} height={24}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              </svg>
            )}
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="auth-button"
        >
          {loading ? t('auth.updatingPassword') : t('auth.updatePassword')}
        </button>
        
        {message && (
          <div className={message.includes('onnistuneesti') ? 'auth-success' : 'auth-error'}>
            {message}
          </div>
        )}
      </form>
    </div>
  )
}