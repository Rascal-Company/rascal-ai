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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
      onClick={() => onClose?.({ save: false })}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Muokkaa inbound-asetuksia</h2>
          <button
            className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95 text-xl"
            onClick={() => onClose?.({ save: false })}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto px-6 py-6">
          <div className="space-y-6">
            {/* Voice select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ääni:</label>
              <div className="flex items-center gap-3">
                <select
                  value={voiceValue}
                  onChange={(e) => setEditingInboundSettings({ ...editingInboundSettings, voice: e.target.value })}
                  className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="w-auto py-2 px-4"
                >
                  Testaa ääntä
                </Button>
              </div>
            </div>

            {/* Welcome message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tervetuloviesti:</label>
              <textarea
                value={editingInboundSettings.welcomeMessage || ''}
                onChange={(e) => setEditingInboundSettings({ ...editingInboundSettings, welcomeMessage: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px]"
                rows={4}
                placeholder={`• Ystävällinen tervehdys ja esittäytyminen
• Selkeä selitys siitä, miten voin auttaa
• Kysymys, joka aloittaa keskustelun
• Lyhyt ja ammattimainen`}
              />
            </div>

            {/* Script */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Puhelun skripti:</label>
              <textarea
                value={editingInboundSettings.script || ''}
                onChange={(e) => setEditingInboundSettings({ ...editingInboundSettings, script: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[200px]"
                rows={8}
                placeholder={`• Keskustelun tavoitteet ja rakenne
• Avainkysymykset (4-7 kappaletta)
• Vastaukset yleisiin kysymyksiin
• Ohjeet eri tilanteisiin
• Vastalauseiden käsittely`}
              />
            </div>

            {/* AI Enhancement */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  {t('calls.modals.inbound.aiEnhancement.description')}
                </div>
                <Button
                  onClick={onAIEnhancement}
                  variant="secondary"
                  className="w-auto whitespace-nowrap"
                >
                  {t('calls.modals.inbound.aiEnhancement.cta')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all"
            onClick={() => onClose?.({ save: false })}
          >
            Peruuta
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all"
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
