import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import ConfirmationToast from './ConfirmationToast'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const AddCallTypeModal = ({ 
  showModal, 
  onClose,
  onCancel,
  newCallType, 
  setNewCallType, 
  onAdd, 
  loading, 
  error, 
  success,
  onAIEnhancementSent
}) => {
  const { t } = useTranslation('common')
  const [currentStep, setCurrentStep] = useState(1)
  const [showConfirmToast, setShowConfirmToast] = useState(false)
  const totalSteps = 6

  // ESC-toiminnallisuus - pitää olla heti useState jälkeen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        showCloseConfirmation()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal])

  if (!showModal) return null

  const steps = [
    { id: 1, label: t('calls.modals.addCallType.steps.basics') },
    { id: 2, label: t('calls.modals.addCallType.steps.content') },
    { id: 3, label: t('calls.modals.addCallType.steps.advanced') },
    { id: 4, label: t('calls.modals.addCallType.steps.summary') },
    { id: 5, label: t('calls.modals.addCallType.steps.textMessages') },
    { id: 6, label: t('calls.modals.addCallType.steps.aiEnhancement') }
  ]

  // Vahvistus ennen sulkemista
  const handleConfirmSave = async () => {
    setShowConfirmToast(false)
    await handleSubmit()
  }

  const handleConfirmDiscard = () => {
    setShowConfirmToast(false)
    const cancelHandler = onCancel || onClose
    cancelHandler()
  }

  const showCloseConfirmation = () => {
    setShowConfirmToast(true)
  }

  // Tyhjän tilan klikkaus
  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      showCloseConfirmation()
    }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (onAdd) {
      await onAdd()
      // onAdd hoitaa toastin/success-viestin CallPanel.jsx:ssä
    } else if (onClose) {
      onClose()
    }
  }

  // Lähetä puhelun tyyppi AI-parannukseen
  const handleAIEnhancement = async () => {
    // Tarkista että call type on tallennettu tietokantaan
    if (!newCallType.id) {
      alert(t('calls.modals.addCallType.saveBeforeAI'))
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/calls/type-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          call_type_id: newCallType.id
        })
      })

      if (!response.ok) {
        // Tarkista onko vastaus JSON vai HTML
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || t('calls.modals.addCallType.sendFailed'))
        } else {
          // Jos vastaus on HTML (404-sivu), endpoint ei löydy
          throw new Error(t('calls.modals.addCallType.apiNotFound', { status: response.status }))
        }
      }

      const result = await response.json()
      alert(t('calls.modals.addCallType.aiSentSuccess'))
      // Merkitse että AI-parannus on lähetetty ja sulje modaali
      if (onAIEnhancementSent) {
        onAIEnhancementSent()
      }
      onClose()
    } catch (error) {
      console.error('AI-parannuksen lähetys epäonnistui:', error)
      alert(t('calls.modals.addCallType.aiSentError', { error: error.message || error }))
    }
  }

  return createPortal(
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container calltype-modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            {t('calls.modals.addCallType.title')}
          </h2>
          <button
            onClick={showCloseConfirmation}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>

        {/* Vaiheindikaattori */}
        <div className="steps-container">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="step-item calltype-step-clickable" onClick={() => setCurrentStep(step.id)}>
                <div className={`step-number ${currentStep >= step.id ? 'active' : ''}`}>
                  {step.id}
                </div>
                <span className={`step-label ${currentStep >= step.id ? 'active' : ''}`}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`step-separator ${currentStep > step.id ? 'active' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="modal-content calltype-modal-content">
          {currentStep === 1 && (
            <div className="form-column calltype-form-column">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.name')}
                  </label>
                  <input
                    type="text"
                    value={newCallType.callType}
                    onChange={e => setNewCallType({ ...newCallType, callType: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.name')}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.status')}
                  </label>
                  <select
                    value={newCallType.status || 'Draft'}
                    onChange={e => setNewCallType({ ...newCallType, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Active">{t('calls.modals.addCallType.statusOptions.active')}</option>
                    <option value="Draft">{t('calls.modals.addCallType.statusOptions.draft')}</option>
                    <option value="Archived">{t('calls.modals.addCallType.statusOptions.archived')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.language')}
                  </label>
                  <select
                    value={newCallType.language || 'fi'}
                    onChange={e => setNewCallType({ ...newCallType, language: e.target.value })}
                    className="form-select"
                  >
                    <option value="en-US">{t('calls.modals.callTypeLanguages.enUS')}</option>
                    <option value="bg">{t('calls.modals.callTypeLanguages.bg')}</option>
                    <option value="cs">{t('calls.modals.callTypeLanguages.cs')}</option>
                    <option value="de-DE">{t('calls.modals.callTypeLanguages.deDE')}</option>
                    <option value="el">{t('calls.modals.callTypeLanguages.el')}</option>
                    <option value="fi">{t('calls.modals.callTypeLanguages.fi')}</option>
                    <option value="fr-FR">{t('calls.modals.callTypeLanguages.frFR')}</option>
                    <option value="es-ES">{t('calls.modals.callTypeLanguages.esES')}</option>
                    <option value="hu">{t('calls.modals.callTypeLanguages.hu')}</option>
                    <option value="it">{t('calls.modals.callTypeLanguages.it')}</option>
                    <option value="fr">{t('calls.modals.callTypeLanguages.fr')}</option>
                    <option value="pt-BR">{t('calls.modals.callTypeLanguages.ptBR')}</option>
                    <option value="nl-NL">{t('calls.modals.callTypeLanguages.nlNL')}</option>
                    <option value="hi">{t('calls.modals.callTypeLanguages.hi')}</option>
                    <option value="zh-CN">{t('calls.modals.callTypeLanguages.zhCN')}</option>
                    <option value="no">{t('calls.modals.callTypeLanguages.no')}</option>
                    <option value="sv-SE">{t('calls.modals.callTypeLanguages.svSE')}</option>
                    <option value="da">{t('calls.modals.callTypeLanguages.da')}</option>
                    <option value="da-DK">{t('calls.modals.callTypeLanguages.daDK')}</option>
                    <option value="id">{t('calls.modals.callTypeLanguages.id')}</option>
                    <option value="ja">{t('calls.modals.callTypeLanguages.ja')}</option>
                    <option value="ko">{t('calls.modals.callTypeLanguages.ko')}</option>
                    <option value="ms">{t('calls.modals.callTypeLanguages.ms')}</option>
                    <option value="ro">{t('calls.modals.callTypeLanguages.ro')}</option>
                    <option value="ru">{t('calls.modals.callTypeLanguages.ru')}</option>
                    <option value="sk">{t('calls.modals.callTypeLanguages.sk')}</option>
                    <option value="tr">{t('calls.modals.callTypeLanguages.tr')}</option>
                    <option value="uk">{t('calls.modals.callTypeLanguages.uk')}</option>
                    <option value="vi">{t('calls.modals.callTypeLanguages.vi')}</option>
                    <option value="th">{t('calls.modals.callTypeLanguages.th')}</option>
                    <option value="pl">{t('calls.modals.callTypeLanguages.pl')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.agentName')}
                  </label>
                  <input
                    type="text"
                    value={newCallType.agent_name || ''}
                    onChange={e => setNewCallType({ ...newCallType, agent_name: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.agentName')}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="calltype-section-divider">
                <h3 className="calltype-section-title">
                  {t('calls.modals.addCallType.fields.callSettings')}
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      {t('calls.modals.addCallType.fields.responseSpeed')}
                    </label>
                    <select
                      value={newCallType.response_speed || '3'}
                      onChange={e => setNewCallType({ ...newCallType, response_speed: e.target.value })}
                      className="form-select"
                    >
                      <option value="1">{t('addCallType.option1sec')}</option>
                      <option value="3">{t('addCallType.option3sec')}</option>
                      <option value="5">{t('addCallType.option5sec')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t('calls.modals.addCallType.fields.initialPause')}
                    </label>
                    <select
                      value={newCallType.initial_pause || '2'}
                      onChange={e => setNewCallType({ ...newCallType, initial_pause: e.target.value })}
                      className="form-select"
                    >
                      <option value="1">{t('addCallType.option1sec')}</option>
                      <option value="2">{t('addCallType.option2sec')}</option>
                      <option value="3">{t('addCallType.option3sec')}</option>
                      <option value="5">{t('addCallType.option5sec')}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="form-column calltype-form-column-sm">
              <div className="form-group">
                <label className="form-label">{t('calls.modals.addCallType.fields.targetAudience')}</label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.targetAudience')}
                </p>
                <input
                  type="text"
                  value={newCallType.target_audience || ''}
                  onChange={e => setNewCallType({ ...newCallType, target_audience: e.target.value })}
                  placeholder={t('calls.modals.addCallType.placeholders.targetAudience')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('calls.modals.addCallType.fields.mainGoal')}</label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.mainGoal')}
                </p>
                <textarea
                  value={newCallType.goals || ''}
                  onChange={e => setNewCallType({ ...newCallType, goals: e.target.value })}
                  placeholder={t('calls.modals.addCallType.placeholders.callGoals')}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('calls.modals.addCallType.fields.toneStyle')}</label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.toneStyle')}
                </p>
                <textarea
                  value={newCallType.style || ''}
                  onChange={e => setNewCallType({ ...newCallType, style: e.target.value })}
                  placeholder={t('calls.modals.addCallType.placeholders.toneStyle')}
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column calltype-form-column-sm">
              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.firstSentence')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.firstSentence')}
                </p>
                <input
                  type="text"
                  value={newCallType.first_line || ''}
                  onChange={e => setNewCallType({ ...newCallType, first_line: e.target.value })}
                  placeholder={t('addCallType.greetingPlaceholder')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.callStart')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.callStart')}
                </p>
                <textarea
                  value={newCallType.intro || ''}
                  onChange={e => setNewCallType({ ...newCallType, intro: e.target.value })}
                  placeholder={t('addCallType.purposeIntroPlaceholder')}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.questions')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.questions')}
                </p>
                <textarea
                  value={newCallType.questions || ''}
                  onChange={e => setNewCallType({ ...newCallType, questions: e.target.value })}
                  placeholder={t('calls.modals.addCallType.placeholders.questions')}
                  rows={8}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.callEnd')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.callEnd')}
                </p>
                <textarea
                  value={newCallType.outro || ''}
                  onChange={e => setNewCallType({ ...newCallType, outro: e.target.value })}
                  placeholder={t('addCallType.closingPlaceholder')}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.addCallType.fields.successfulEnd')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.successfulEnd')}
                </p>
                <p className="calltype-help-text">
                  {t('calls.modals.addCallType.hints.actionPreset')}
                </p>
                <div className="calltype-tag-container">
                  {[
                    { key: 'salesCall', label: t('calls.modals.callTypeActionPresets.salesCall.label'), text: t('calls.modals.callTypeActionPresets.salesCall.text') },
                    { key: 'appointment', label: t('calls.modals.callTypeActionPresets.appointment.label'), text: t('calls.modals.callTypeActionPresets.appointment.text') },
                    { key: 'eventInvite', label: t('calls.modals.callTypeActionPresets.eventInvite.label'), text: t('calls.modals.callTypeActionPresets.eventInvite.text') },
                    { key: 'followUp', label: t('calls.modals.callTypeActionPresets.followUp.label'), text: t('calls.modals.callTypeActionPresets.followUp.text') },
                    { key: 'leadQualification', label: t('calls.modals.callTypeActionPresets.leadQualification.label'), text: t('calls.modals.callTypeActionPresets.leadQualification.text') },
                    { key: 'universal', label: t('calls.modals.callTypeActionPresets.universal.label'), text: t('calls.modals.callTypeActionPresets.universal.text') }
                  ].map((preset) => {
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => {
                          setNewCallType({ 
                            ...newCallType, 
                            action: preset.text || '' // Tallennetaan preset-teksti action-kenttään Supabaseen
                          })
                        }}
                        className="calltype-preset-btn"
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
                <textarea
                  value={newCallType.action || ''}
                  readOnly
                  placeholder={t('calls.modals.callTypeActionPresets.universal.text')}
                  rows={4}
                  className="form-textarea calltype-input-disabled"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="form-column calltype-form-column">
              <div className="calltype-two-col-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.summary')}
                  </label>
                  <textarea
                    value={newCallType.summary || ''}
                    onChange={e => setNewCallType({ ...newCallType, summary: e.target.value })}
                    placeholder={t('addCallType.agentNotesPlaceholder')}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div className="calltype-example-box">
                  <div className="calltype-example-title">{t('calls.modals.callTypeMiniExamples.title')}</div>
                  <div>{t('calls.modals.callTypeMiniExamples.summary')}</div>
                </div>
              </div>
              <div className="calltype-two-col-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.successAssessment')}
                  </label>
                  <textarea
                    value={newCallType.success_assessment || ''}
                    onChange={e => setNewCallType({ ...newCallType, success_assessment: e.target.value })}
                    placeholder={t('calls.modals.addCallType.placeholders.successAssessment')}
                    rows={5}
                    className="form-textarea"
                  />
                </div>
                <div className="calltype-example-box">
                  <div className="calltype-example-title">{t('calls.modals.callTypeMiniExamples.title')}</div>
                  <div>{t('calls.modals.callTypeMiniExamples.successAssessment')}</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="form-column calltype-form-column-sm">
              <div className="calltype-two-col-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.firstSms')}
                  </label>
                  <textarea
                    value={newCallType.first_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setNewCallType({ ...newCallType, first_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.addCallType.placeholders.firstSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea calltype-textarea-fixed"
                  />
                  <div className="calltype-char-count-row">
                    <span className="calltype-char-count">
                      {t('calls.modals.sms.counter', { count: newCallType.first_sms?.length || 0 })}
                    </span>
                    {newCallType.first_sms && newCallType.first_sms.length > 140 && (
                      <span className="calltype-char-warning">
                        ⚠️ {t('calls.modals.sms.longMessage', { parts: newCallType.first_sms.length > 150 ? 2 : 1 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="calltype-example-box">
                  <div className="calltype-example-title">{t('calls.modals.callTypeMiniExamples.title')}</div>
                  <div>{t('calls.modals.callTypeMiniExamples.firstSms')}</div>
                </div>
              </div>

              <div className="calltype-two-col-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.afterCallSms')}
                  </label>
                  <textarea
                    value={newCallType.after_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setNewCallType({ ...newCallType, after_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.addCallType.placeholders.afterCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea calltype-textarea-fixed"
                  />
                  <div className="calltype-char-count-row">
                    <span className="calltype-char-count">
                      {t('calls.modals.sms.counter', { count: newCallType.after_call_sms?.length || 0 })}
                    </span>
                    {newCallType.after_call_sms && newCallType.after_call_sms.length > 140 && (
                      <span className="calltype-char-warning">
                        ⚠️ {t('calls.modals.sms.longMessage', { parts: newCallType.after_call_sms.length > 150 ? 2 : 1 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="calltype-example-box">
                  <div className="calltype-example-title">{t('calls.modals.callTypeMiniExamples.title')}</div>
                  <div>{t('calls.modals.callTypeMiniExamples.afterCallSms')}</div>
                </div>
              </div>

              <div className="calltype-two-col-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.addCallType.fields.missedCallSms')}
                  </label>
                  <textarea
                    value={newCallType.missed_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setNewCallType({ ...newCallType, missed_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.addCallType.placeholders.missedCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea calltype-textarea-fixed"
                  />
                  <div className="calltype-char-count-row">
                    <span className="calltype-char-count">
                      {t('calls.modals.sms.counter', { count: newCallType.missed_call_sms?.length || 0 })}
                    </span>
                    {newCallType.missed_call_sms && newCallType.missed_call_sms.length > 140 && (
                      <span className="calltype-char-warning">
                        ⚠️ {t('calls.modals.sms.longMessage', { parts: newCallType.missed_call_sms.length > 150 ? 2 : 1 })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="calltype-example-box">
                  <div className="calltype-example-title">{t('calls.modals.callTypeMiniExamples.title')}</div>
                  <div>{t('calls.modals.callTypeMiniExamples.missedCallSms')}</div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 6 && (
            <div className="form-column calltype-form-column-sm">
              <div className="calltype-summary-center">
                <h3 className="calltype-summary-title">
                  {t('calls.modals.addCallType.aiEnhancement.title')}
                </h3>
                <p className="calltype-summary-desc">
                  {t('calls.modals.addCallType.aiEnhancement.description')}
                </p>
              </div>
              
              <div className="calltype-ai-benefits-box">
                <div className="calltype-summary-label">
                  {t('calls.modals.addCallType.aiEnhancement.benefits.title')}
                </div>
                <ul className="calltype-summary-list">
                  <li>{t('calls.modals.addCallType.aiEnhancement.benefits.optimize')}</li>
                  <li>{t('calls.modals.addCallType.aiEnhancement.benefits.improve')}</li>
                  <li>{t('calls.modals.addCallType.aiEnhancement.benefits.suggest')}</li>
                </ul>
              </div>
              
              <Button
                onClick={handleAIEnhancement}
                className="calltype-ai-btn"
              >
                {t('calls.modals.addCallType.aiEnhancement.cta')}
              </Button>
            </div>
          )}

        </div>
        
        <div className="modal-actions">
          <div className="modal-actions-left">
            <Button
              type="button"
              onClick={() => {
                const cancelHandler = onCancel || onClose
                cancelHandler()
              }}
              variant="secondary"
            >
              {t('common.cancel')}
            </Button>
            {currentStep > 1 && (
              <Button
                type="button"
                onClick={handlePrevious}
                variant="secondary"
              >
                {t('calls.modals.addCallType.buttons.previous')}
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !newCallType.callType}
            >
              {loading ? t('ui.buttons.saving') : t('common.save')}
            </Button>
            {currentStep < totalSteps && (
              <Button
                type="button"
                onClick={handleNext}
                disabled={!newCallType.callType}
                variant="secondary"
              >
                {t('calls.modals.addCallType.buttons.next')}
              </Button>
            )}
          </div>
        </div>
        
        {error && <div className="modal-error">{error}</div>}
        {success && <div className="modal-success">{success}</div>}
        <ConfirmationToast
          show={showConfirmToast}
          message={t('calls.modals.confirmClose.message', 'Tallenna muutokset?')}
          onSave={handleConfirmSave}
          onDiscard={handleConfirmDiscard}
          saveLabel={t('common.save', 'Tallenna')}
          discardLabel={t('calls.modals.confirmClose.discard', 'Hylkää')}
        />
      </div>
    </div>,
    document.body
  )
}

export default AddCallTypeModal 