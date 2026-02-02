import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import ConfirmationToast from './ConfirmationToast'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'

const EditCallTypeModal = ({ 
  showModal, 
  onClose, 
  onCancel,
  editingCallType, 
  setEditingCallType, 
  onSave,
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

  if (!showModal || !editingCallType) return null

  const steps = [
    { id: 1, label: t('calls.modals.editCallType.steps.basics') },
    { id: 2, label: t('calls.modals.editCallType.steps.content') },
    { id: 3, label: t('calls.modals.editCallType.steps.advanced') },
    { id: 4, label: t('calls.modals.editCallType.steps.summary') },
    { id: 5, label: t('calls.modals.editCallType.steps.textMessages') },
    { id: 6, label: t('calls.modals.editCallType.steps.aiEnhancement') }
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
    if (onSave) {
      await onSave()
      // onSave hoitaa toastin ja sulkee modaalin CallPanel.jsx:ssä
    } else if (onClose) {
      onClose()
    }
  }

  // Lähetä puhelun tyyppi AI-parannukseen
  const handleAIEnhancement = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/calls/type-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({
          call_type_id: editingCallType.id
        })
      })

      if (!response.ok) {
        // Tarkista onko vastaus JSON vai HTML
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          throw new Error(errorData.error || t('calls.modals.editCallType.alerts.sendFailed'))
        } else {
          // Jos vastaus on HTML (404-sivu), endpoint ei löydy
          throw new Error(t('calls.modals.editCallType.alerts.apiNotFound', { status: response.status }))
        }
      }

      const result = await response.json()
      alert(t('calls.modals.editCallType.alerts.aiSentSuccess'))
      // Merkitse että AI-parannus on lähetetty ja sulje modaali
      if (onAIEnhancementSent) {
        onAIEnhancementSent()
      }
      onClose()
    } catch (error) {
      console.error('AI-parannuksen lähetys epäonnistui:', error)
      alert(t('calls.modals.editCallType.alerts.aiSentError', { error: error.message || error }))
    }
  }

  return createPortal(
    <div className="modal-overlay modal-overlay--light" onClick={handleOverlayClick}>
      <div className="modal-container edit-call-type-modal calltype-modal-container">
        <div className="modal-header">
          <h2 className="modal-title">
            {t('calls.modals.editCallType.title')}
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

        {/* Sisältö */}
        <div className="modal-content calltype-modal-content">
          {currentStep === 1 && (
            <div className="form-column calltype-form-column">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.name')}
                  </label>
                  <input
                    type="text"
                    value={editingCallType.name || editingCallType.callType || editingCallType.label || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.status')}
                  </label>
                  <select
                    value={editingCallType.status || 'Active'}
                    onChange={e => setEditingCallType({ ...editingCallType, status: e.target.value })}
                    className="form-select"
                  >
                    <option value="Active">{t('calls.modals.editCallType.statusOptions.active')}</option>
                    <option value="Draft">{t('calls.modals.editCallType.statusOptions.draft')}</option>
                    <option value="Archived">{t('calls.modals.editCallType.statusOptions.archived')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.language')}
                  </label>
                  <select
                    value={editingCallType.language || 'fi'}
                    onChange={e => setEditingCallType({ ...editingCallType, language: e.target.value })}
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
                    {t('calls.modals.editCallType.fields.agentName')}
                  </label>
                  <input
                    type="text"
                    value={editingCallType.agent_name || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, agent_name: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="calltype-section-divider">
                <h3 className="calltype-section-title">
                  {t('calls.modals.editCallType.fields.callSettings')}
                </h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      {t('calls.modals.editCallType.fields.responseSpeed')}
                    </label>
                    <select
                      value={editingCallType.response_speed || '3'}
                      onChange={e => setEditingCallType({ ...editingCallType, response_speed: e.target.value })}
                      className="form-select"
                    >
                      <option value="1">{t('addCallType.option1sec')}</option>
                      <option value="3">{t('addCallType.option3sec')}</option>
                      <option value="5">{t('addCallType.option5sec')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      {t('calls.modals.editCallType.fields.initialPause')}
                    </label>
                    <select
                      value={editingCallType.initial_pause || '2'}
                      onChange={e => setEditingCallType({ ...editingCallType, initial_pause: e.target.value })}
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
            <div className="form-column calltype-form-column">
              <div className="form-group">
                <label className="form-label">{t('calls.modals.editCallType.fields.targetAudience')}</label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.targetAudience')}
                </p>
                <input
                  type="text"
                  value={editingCallType.target_audience || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, target_audience: e.target.value })}
                  placeholder={t('calls.modals.editCallType.placeholders.targetAudience')}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('calls.modals.editCallType.fields.mainGoal')}</label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.mainGoal')}
                </p>
                <textarea
                  value={editingCallType.goals || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, goals: e.target.value })}
                  placeholder={t('calls.modals.editCallType.placeholders.mainGoal')}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('calls.modals.editCallType.fields.toneStyle')}</label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.toneStyle')}
                </p>
                <textarea
                  value={editingCallType.style || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, style: e.target.value })}
                  placeholder={t('calls.modals.editCallType.placeholders.toneStyle')}
                  rows={3}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="form-column calltype-form-column">
              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.firstSentence')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.firstSentence')}
                </p>
                <input
                  type="text"
                  value={editingCallType.first_line || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, first_line: e.target.value })}
                  className="form-input"
                  placeholder={t('calls.modals.editCallType.placeholders.firstSentence')}
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.callStart')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.callStart')}
                </p>
                <textarea
                  value={editingCallType.intro || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, intro: e.target.value })}
                  placeholder={t('calls.modals.editCallType.placeholders.callStart')}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.questions')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.questions')}
                </p>
                <textarea
                  value={editingCallType.questions || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, questions: e.target.value })}
                  placeholder={t('calls.modals.editCallType.placeholders.questions')}
                  rows={8}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.callEnd')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.callEnd')}
                </p>
                <textarea
                  value={editingCallType.outro || ''}
                  onChange={e => setEditingCallType({ ...editingCallType, outro: e.target.value })}
                  placeholder={t('calls.modals.editCallType.placeholders.callEnd')}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('calls.modals.editCallType.fields.successfulEnd')}
                </label>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.successfulEnd')}
                </p>
                <p className="calltype-help-text">
                  {t('calls.modals.editCallType.hints.actionPreset')}
                </p>
                <div className="calltype-tag-container">
                  {['salesCall', 'appointment', 'eventInvite', 'followUp', 'leadQualification', 'universal'].map((presetKey) => (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => {
                        setEditingCallType({
                          ...editingCallType,
                          action: t(`calls.modals.callTypeActionPresets.${presetKey}.text`)
                        })
                      }}
                      className="calltype-preset-btn"
                    >
                      {t(`calls.modals.callTypeActionPresets.${presetKey}.label`)}
                    </button>
                  ))}
                </div>
                <textarea
                  value={editingCallType.action || ''}
                  readOnly
                  placeholder={t('calls.modals.editCallType.placeholders.successfulEnd')}
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
                    {t('calls.modals.editCallType.fields.summary')}
                  </label>
                  <textarea
                    value={editingCallType.summary || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, summary: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.summary')}
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
                    {t('calls.modals.editCallType.fields.successAssessment')}
                  </label>
                  <textarea
                    value={editingCallType.success_assessment || ''}
                    onChange={e => setEditingCallType({ ...editingCallType, success_assessment: e.target.value })}
                    placeholder={t('calls.modals.editCallType.placeholders.successAssessment')}
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
            <div className="form-column calltype-form-column">
              <div className="calltype-two-col-grid">
                <div className="form-group">
                  <label className="form-label">
                    {t('calls.modals.editCallType.fields.firstSms')}
                  </label>
                  <textarea
                    value={editingCallType.first_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, first_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.editCallType.placeholders.firstSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea calltype-textarea-fixed"
                  />
                  <div className="calltype-char-count-row">
                    <span className="calltype-char-count">
                      {t('calls.modals.sms.counter', { count: editingCallType.first_sms?.length || 0 })}
                    </span>
                    {editingCallType.first_sms && editingCallType.first_sms.length > 140 && (
                      <span className="calltype-char-warning">
                        ⚠️ {t('calls.modals.sms.longMessage', { parts: editingCallType.first_sms.length > 150 ? 2 : 1 })}
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
                    {t('calls.modals.editCallType.fields.afterCallSms')}
                  </label>
                  <textarea
                    value={editingCallType.after_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, after_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.editCallType.placeholders.afterCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea calltype-textarea-fixed"
                  />
                  <div className="calltype-char-count-row">
                    <span className="calltype-char-count">
                      {t('calls.modals.sms.counter', { count: editingCallType.after_call_sms?.length || 0 })}
                    </span>
                    {editingCallType.after_call_sms && editingCallType.after_call_sms.length > 140 && (
                      <span className="calltype-char-warning">
                        ⚠️ {t('calls.modals.sms.longMessage', { parts: editingCallType.after_call_sms.length > 150 ? 2 : 1 })}
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
                    {t('calls.modals.editCallType.fields.missedCallSms')}
                  </label>
                  <textarea
                    value={editingCallType.missed_call_sms || ''}
                    onChange={e => {
                      const value = e.target.value
                      if (value.length <= 160) {
                        setEditingCallType({ ...editingCallType, missed_call_sms: value })
                      }
                    }}
                    placeholder={t('calls.modals.editCallType.placeholders.missedCallSms')}
                    rows={4}
                    maxLength={160}
                    className="form-textarea calltype-textarea-fixed"
                  />
                  <div className="calltype-char-count-row">
                    <span className="calltype-char-count">
                      {t('calls.modals.sms.counter', { count: editingCallType.missed_call_sms?.length || 0 })}
                    </span>
                    {editingCallType.missed_call_sms && editingCallType.missed_call_sms.length > 140 && (
                      <span className="calltype-char-warning">
                        ⚠️ {t('calls.modals.sms.longMessage', { parts: editingCallType.missed_call_sms.length > 150 ? 2 : 1 })}
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
            <div className="form-column calltype-form-column">
              <div className="calltype-summary-center">
                <h3 className="calltype-summary-title">
                  {t('calls.modals.editCallType.aiEnhancement.title')}
                </h3>
                <p className="calltype-summary-desc">
                  {t('calls.modals.editCallType.aiEnhancement.description')}
                </p>
              </div>
              
              <div className="calltype-ai-benefits-box">
                <div className="calltype-summary-label">
                  {t('calls.modals.editCallType.aiEnhancement.benefits.title')}
                </div>
                <ul className="calltype-summary-list">
                  <li>{t('calls.modals.editCallType.aiEnhancement.benefits.optimize')}</li>
                  <li>{t('calls.modals.editCallType.aiEnhancement.benefits.improve')}</li>
                  <li>{t('calls.modals.editCallType.aiEnhancement.benefits.suggest')}</li>
                </ul>
              </div>
              
              <Button
                onClick={handleAIEnhancement}
                className="calltype-ai-btn"
              >
                {t('calls.modals.editCallType.aiEnhancement.cta')}
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
                {t('calls.modals.editCallType.buttons.previous')}
              </Button>
            )}
          </div>
          
          <div className="modal-actions-right">
            <Button
              type="button"
              onClick={handleSubmit}
            >
              {t('common.save')}
            </Button>
            {currentStep < totalSteps && (
              <Button
                type="button"
                onClick={handleNext}
                variant="secondary"
              >
                {t('calls.modals.editCallType.buttons.next')}
              </Button>
            )}
          </div>
        </div>
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

export default EditCallTypeModal 