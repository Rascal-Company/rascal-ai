import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'

export default function ForgotPassword({ onClose }) {
  const { t } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Tarkista sähköpostisi salasanan palautuslinkki!')
      }
    } catch (error) {
      setMessage('Odottamaton virhe tapahtui')
    } finally {
      setLoading(false)
    }
  }

  const isError = message.toLowerCase().includes('virhe') || message.toLowerCase().includes('error')

  return (
    <div className="bg-[#23262B] text-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.25)] p-8 relative max-w-[400px] w-full">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-transparent border-none text-[28px] text-slate-300 cursor-pointer transition-colors duration-200 hover:text-green-400"
          aria-label={t('auth.close')}
        >
          ×
        </button>
      )}
      <h2 className="text-[26px] font-bold mb-[18px] text-center text-white">{t('auth.sendReset')}</h2>
      <p className="text-slate-300 text-center mb-[18px] text-[15px]">
        {t('auth.resetDesc') || 'Syötä sähköpostiosoitteesi, niin lähetämme sinulle linkin salasanan palautusta varten.'}
      </p>
      <form onSubmit={handleResetPassword} className="flex flex-col gap-[18px]">
        <div>
          <label htmlFor="email" className="block mb-1.5 font-medium text-slate-300">
            {t('auth.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full py-3 px-3.5 border border-gray-700 rounded-lg bg-[#181B20] text-white text-[15px] outline-none mb-0.5"
            placeholder={t('auth.emailPlaceholder')}
            autoComplete="email"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 border-none rounded-lg bg-amber-400 text-[#181B20] font-bold text-base transition-colors duration-200 mt-1 ${
            loading ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer hover:bg-amber-300'
          }`}
        >
          {loading ? t('auth.sendingReset') : t('auth.sendReset')}
        </button>
        {message && (
          <div className={`p-2.5 rounded-lg text-sm mt-0.5 ${
            isError
              ? 'bg-[#3b1d1d] border border-red-600 text-red-400'
              : 'bg-[#1e3a1e] border border-green-500 text-green-500'
          }`}>
            {message}
          </div>
        )}
      </form>
      <div className="mt-[18px] text-center">
        <p className="text-[15px] text-slate-300">
          {t('auth.rememberPassword')}{' '}
          <a href="#" className="text-green-400 underline" onClick={onClose}>
            {t('auth.login')}
          </a>
        </p>
      </div>
    </div>
  )
}