import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import Button from './Button'

export default function DueDiligenceForm({ onSuccess, onCancel }) {
  const { t } = useTranslation('common')
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    companySize: '',
    industry: '',
    currentChallenges: '',
    aiExperience: '',
    goals: '',
    timeline: '',
    budget: '',
    additionalInfo: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Tässä voisi olla API-kutsu lomakkeen lähettämiseen
      // const response = await fetch('/api/due-diligence', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // })

      // Simuloidaan onnistunutta lähetystä
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess(true)
      if (onSuccess) onSuccess(formData)
    } catch (err) {
      setError(t('dueDiligenceForm.error.submit'))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="due-diligence-form success">
        <div className="success-message">
          <h3>{t('dueDiligenceForm.success.title')}</h3>
          <p>{t('dueDiligenceForm.success.message')}</p>
          <Button onClick={() => {
            window.location.href = 'https://calendar.app.google/LiXrLDnPEGMb4eoS9'
          }}>
            {t('dueDiligenceForm.success.button')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="due-diligence-form">
      <form onSubmit={handleSubmit} className="form-container">
        <h2 className="form-title">{t('dueDiligenceForm.title')}</h2>
        <p className="form-description">{t('dueDiligenceForm.description')}</p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="form-grid">
          {/* Yrityksen perustiedot */}
          <div className="form-section">
            <h3 className="section-title">{t('dueDiligenceForm.sections.company.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="companyName">{t('dueDiligenceForm.fields.companyName')} *</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPerson">{t('dueDiligenceForm.fields.contactPerson')} *</label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('dueDiligenceForm.fields.email')} *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">{t('dueDiligenceForm.fields.phone')}</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          {/* Yrityksen profiili */}
          <div className="form-section">
            <h3 className="section-title">{t('dueDiligenceForm.sections.profile.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="companySize">{t('dueDiligenceForm.fields.companySize')}</label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">{t('dueDiligenceForm.fields.selectOption')}</option>
                <option value="1-10">1-10 työntekijää</option>
                <option value="11-50">11-50 työntekijää</option>
                <option value="51-200">51-200 työntekijää</option>
                <option value="201-1000">201-1000 työntekijää</option>
                <option value="1000+">1000+ työntekijää</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="industry">{t('dueDiligenceForm.fields.industry')}</label>
              <input
                type="text"
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className="form-input"
                placeholder={t('dueDiligenceForm.fields.industryPlaceholder')}
              />
            </div>
          </div>

          {/* Nykyiset haasteet */}
          <div className="form-section full-width">
            <h3 className="section-title">{t('dueDiligenceForm.sections.challenges.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="currentChallenges">{t('dueDiligenceForm.fields.currentChallenges')}</label>
              <textarea
                id="currentChallenges"
                name="currentChallenges"
                value={formData.currentChallenges}
                onChange={handleInputChange}
                rows={4}
                className="form-textarea"
                placeholder={t('dueDiligenceForm.fields.challengesPlaceholder')}
              />
            </div>
          </div>

          {/* AI-kokemus */}
          <div className="form-section">
            <h3 className="section-title">{t('dueDiligenceForm.sections.aiExperience.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="aiExperience">{t('dueDiligenceForm.fields.aiExperience')}</label>
              <select
                id="aiExperience"
                name="aiExperience"
                value={formData.aiExperience}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">{t('dueDiligenceForm.fields.selectOption')}</option>
                <option value="none">{t('dueDiligenceForm.fields.aiExperienceOptions.none')}</option>
                <option value="basic">{t('dueDiligenceForm.fields.aiExperienceOptions.basic')}</option>
                <option value="intermediate">{t('dueDiligenceForm.fields.aiExperienceOptions.intermediate')}</option>
                <option value="advanced">{t('dueDiligenceForm.fields.aiExperienceOptions.advanced')}</option>
              </select>
            </div>
          </div>

          {/* Tavoitteet ja aikataulu */}
          <div className="form-section">
            <h3 className="section-title">{t('dueDiligenceForm.sections.goals.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="goals">{t('dueDiligenceForm.fields.goals')}</label>
              <textarea
                id="goals"
                name="goals"
                value={formData.goals}
                onChange={handleInputChange}
                rows={3}
                className="form-textarea"
                placeholder={t('dueDiligenceForm.fields.goalsPlaceholder')}
              />
            </div>

            <div className="form-group">
              <label htmlFor="timeline">{t('dueDiligenceForm.fields.timeline')}</label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">{t('dueDiligenceForm.fields.selectOption')}</option>
                <option value="immediate">{t('dueDiligenceForm.fields.timelineOptions.immediate')}</option>
                <option value="1-3months">{t('dueDiligenceForm.fields.timelineOptions.1-3months')}</option>
                <option value="3-6months">{t('dueDiligenceForm.fields.timelineOptions.3-6months')}</option>
                <option value="6-12months">{t('dueDiligenceForm.fields.timelineOptions.6-12months')}</option>
                <option value="12months+">{t('dueDiligenceForm.fields.timelineOptions.12months+')}</option>
              </select>
            </div>
          </div>

          {/* Budjetti */}
          <div className="form-section">
            <h3 className="section-title">{t('dueDiligenceForm.sections.budget.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="budget">{t('dueDiligenceForm.fields.budget')}</label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="">{t('dueDiligenceForm.fields.selectOption')}</option>
                <option value="under-5k">{t('dueDiligenceForm.fields.budgetOptions.under-5k')}</option>
                <option value="5k-15k">{t('dueDiligenceForm.fields.budgetOptions.5k-15k')}</option>
                <option value="15k-50k">{t('dueDiligenceForm.fields.budgetOptions.15k-50k')}</option>
                <option value="50k-100k">{t('dueDiligenceForm.fields.budgetOptions.50k-100k')}</option>
                <option value="100k+">{t('dueDiligenceForm.fields.budgetOptions.100k+')}</option>
                <option value="discuss">{t('dueDiligenceForm.fields.budgetOptions.discuss')}</option>
              </select>
            </div>
          </div>

          {/* Lisätiedot */}
          <div className="form-section full-width">
            <h3 className="section-title">{t('dueDiligenceForm.sections.additional.title')}</h3>
            
            <div className="form-group">
              <label htmlFor="additionalInfo">{t('dueDiligenceForm.fields.additionalInfo')}</label>
              <textarea
                id="additionalInfo"
                name="additionalInfo"
                value={formData.additionalInfo}
                onChange={handleInputChange}
                rows={4}
                className="form-textarea"
                placeholder={t('dueDiligenceForm.fields.additionalInfoPlaceholder')}
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          {onCancel && (
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onCancel}
              className="cancel-button"
            >
              {t('dueDiligenceForm.actions.cancel')}
            </Button>
          )}
          <Button 
            type="submit" 
            loading={loading}
            className="submit-button"
          >
            {loading ? t('dueDiligenceForm.actions.submitting') : t('dueDiligenceForm.actions.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
