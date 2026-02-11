import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import Button from '../components/Button'

const MonitoringCreatePostPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation('common')
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [type, setType] = useState('Photo')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Esitäytä kentät location.state-datasta
  useEffect(() => {
    if (location.state) {
      if (location.state.title) {
        setTitle(location.state.title)
      }
      if (location.state.body) {
        setBody(location.state.body)
      }
      if (location.state.sourceUrl) {
        setSourceUrl(location.state.sourceUrl)
      }
    }
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      if (!user?.id) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        throw new Error('Organisaation ID ei löytynyt')
      }

      // Hae company_id users taulusta
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', userId)
        .single()

      if (userError || !userData?.company_id) {
        throw new Error('Company ID ei löytynyt')
      }

      // Lähetä postaus generoitavaksi
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Kirjautuminen vaaditaan')
      }

      const response = await axios.post(
        '/api/ai/generate-ideas',
        {
          idea: title,
          caption: body,
          type: type,
          companyId: userData.company_id,
          userId: userId,
          count: 1,
          action: 'media_monitoring',
          sourceUrl: sourceUrl || null
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (response.data?.success) {
        setSuccess(true)
        // Siirry takaisin mediaseurantaan 2 sekunnin kuluttua
        setTimeout(() => {
          navigate('/monitoring')
        }, 2000)
      } else {
        throw new Error('Postauksen luonti epäonnistui')
      }
    } catch (err) {
      console.error('Error creating post:', err)
      setError(err.response?.data?.error || err.message || 'Postauksen luonti epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="monitoring-create-container">
      <div className="monitoring-create-header">
        <h2>{t('monitoring.create.title')}</h2>
        <p className="monitoring-create-subtitle">{t('monitoring.create.subtitle')}</p>
      </div>

      {success ? (
        <div className="monitoring-create-success">
          <p>{t('monitoring.create.success')}</p>
          <p className="monitoring-create-success-hint">
            {t('monitoring.create.redirecting')}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="monitoring-create-form">
          <div className="form-group">
            <label className="form-label">
              {t('monitoring.create.titleLabel')} <span className="form-required">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
              placeholder={t('monitoring.create.titlePlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('monitoring.create.bodyLabel')}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="form-textarea"
              rows={6}
              placeholder={t('monitoring.create.bodyPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('monitoring.create.sourceUrlLabel')}
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="form-input"
              placeholder={t('monitoring.create.sourceUrlPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {t('monitoring.create.typeLabel')} <span className="form-required">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-select"
              required
            >
              <option value="Photo">Photo</option>
              <option value="Carousel">Carousel</option>
              <option value="Reels">Reels</option>
              <option value="LinkedIn">LinkedIn</option>
            </select>
          </div>

          {error && (
            <div className="monitoring-create-error">
              <p>{error}</p>
            </div>
          )}

          <div className="monitoring-create-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/monitoring')}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
            >
              {loading ? t('common.loading') : t('monitoring.create.submit')}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}

export default MonitoringCreatePostPage
