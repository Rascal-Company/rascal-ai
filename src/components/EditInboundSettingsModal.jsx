import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'
import { useTranslation } from 'react-i18next'

const EditInboundSettingsModal = ({ 
  showModal, 
  onClose, 
  editingInboundSettings, 
  setEditingInboundSettings, 
  onSave,
  getVoiceOptions,
  playVoiceSample,
  onAIEnhancement
}) => {
  const { t } = useTranslation('common')

  // ESC-toiminnallisuus - pitää olla heti useState jälkeen
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (showModal) {
      document.addEventListener('keydown', handleEscKey)
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [showModal, onClose])

  if (!showModal || !editingInboundSettings) return null

  const voiceValue = editingInboundSettings.voice || 'rascal-nainen-1'

  return createPortal(
    <div
      className="edit-card-modal-overlay modal-overlay modal-overlay--light"
      onClick={() => onClose?.({ save: false })}
    >
      <div
        className="edit-card-modal modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="edit-card-modal-header">
          <h2>Muokkaa inbound-asetuksia</h2>
          <button
            className="edit-card-close-btn"
            onClick={() => onClose?.({ save: false })}
          >
            ×
          </button>
        </div>

        <div className="edit-card-modal-body">
          <div className="post-edit-fields">
            <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
              <label>Ääni:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={voiceValue}
                  onChange={(e) => setEditingInboundSettings({ ...editingInboundSettings, voice: e.target.value })}
                  className="post-edit-input"
                  style={{ flex: 1 }}
                >
                  {getVoiceOptions().map((voice) => (
                    <option key={voice.value} value={voice.value}>
                      {voice.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="secondary"
                  onClick={() => playVoiceSample(voiceValue)}
                  style={{ width: 'auto', padding: '8px 16px' }}
                >
                  Testaa ääntä
                </Button>
              </div>
            </div>

            <div className="post-edit-field">
              <label>Tervetuloviesti:</label>
              <textarea
                value={editingInboundSettings.welcomeMessage || ''}
                onChange={(e) => setEditingInboundSettings({ ...editingInboundSettings, welcomeMessage: e.target.value })}
                className="edit-card-textarea"
                rows={4}
                placeholder={
`• Ystävällinen tervehdys ja esittäytyminen
• Selkeä selitys siitä, miten voin auttaa
• Kysymys, joka aloittaa keskustelun
• Lyhyt ja ammattimainen`
                }
              />
            </div>

            <div className="post-edit-field">
              <label>Puhelun skripti:</label>
              <textarea
                value={editingInboundSettings.script || ''}
                onChange={(e) => setEditingInboundSettings({ ...editingInboundSettings, script: e.target.value })}
                className="edit-card-textarea"
                rows={8}
                placeholder={
`• Keskustelun tavoitteet ja rakenne
• Avainkysymykset (4-7 kappaletta)
• Vastaukset yleisiin kysymyksiin
• Ohjeet eri tilanteisiin
• Vastalauseiden käsittely`
                }
              />
            </div>

            <div className="post-edit-field" style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  {t('calls.modals.inbound.aiEnhancement.description')}
                </div>
                <Button
                  onClick={onAIEnhancement}
                  variant="secondary"
                  style={{ width: 'auto' }}
                >
                  {t('calls.modals.inbound.aiEnhancement.cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="edit-card-modal-footer">
          <button
            className="cancel-card-btn"
            onClick={() => onClose?.({ save: false })}
          >
            Peruuta
          </button>
          <button
            className="save-card-btn"
            onClick={async () => {
              await onSave?.()
              onClose?.({ save: false })
            }}
          >
            Tallenna
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default EditInboundSettingsModal
