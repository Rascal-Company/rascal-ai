import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Button from '../Button'

export default function InboundSettingsModal({
  open,
  onClose,
  inboundVoice,
  setInboundVoice,
  inboundWelcomeMessage,
  setInboundWelcomeMessage,
  inboundScript,
  setInboundScript,
  handleSaveInboundSettings,
  getVoiceOptions,
  playVoiceSample
}) {
  const { t } = useTranslation('common')

  if (!open) return null

  const handleBackdropClick = async (e) => {
    if (e.target === e.currentTarget) {
      await handleSaveInboundSettings()
      onClose()
    }
  }

  const handleSave = async () => {
    await handleSaveInboundSettings()
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-5"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl p-8 w-full max-w-[800px] max-h-[90vh] overflow-y-auto shadow-xl border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0 text-2xl font-bold text-gray-800">
            {t('calls.modals.inbound.title')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('calls.modals.inbound.voiceLabel')}</label>
          <div className="flex items-center gap-2 mb-2.5">
            <select
              value={inboundVoice}
              onChange={e => setInboundVoice(e.target.value)}
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {getVoiceOptions().map(voice => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
              ))}
            </select>
            <Button
              variant="secondary"
              onClick={() => playVoiceSample(inboundVoice)}
              className="w-auto py-2 px-4"
            >
              {t('calls.modals.inbound.testVoice')}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('calls.modals.inbound.welcomeMessageLabel')}</label>
          <textarea
            value={inboundWelcomeMessage}
            onChange={e => setInboundWelcomeMessage(e.target.value)}
            placeholder={t('calls.modals.inbound.welcomeMessagePlaceholder')}
            rows={5}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono leading-relaxed resize-y"
          />
          <div className="text-xs text-gray-500 mt-2">
            {t('calls.modals.inbound.welcomeMessageHint')}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('calls.modals.inbound.scriptLabel')}</label>
          <textarea
            value={inboundScript}
            onChange={e => setInboundScript(e.target.value)}
            placeholder={t('calls.modals.inbound.scriptPlaceholder')}
            rows={15}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono leading-relaxed resize-y min-h-[300px]"
          />
          <div className="text-xs text-gray-500 mt-2">
            {t('calls.modals.inbound.scriptHint')}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
          >
            {t('calls.common.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
          >
            {t('calls.modals.inbound.save')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
