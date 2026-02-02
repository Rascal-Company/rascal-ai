import React from 'react'
import Button from '../Button'
import { useTranslation } from 'react-i18next'

export default function CallsTab({
  openMassCallModal,
  openSingleCallModal,
  setActiveTab,
  callType,
  setCallType,
  loadingCallTypes,
  callTypes,
  updateScriptFromCallType,
  selectedVoice,
  setSelectedVoice,
  isPlaying,
  playVoiceSample,
  getVoiceOptions,
  script,
  setShowInboundModal,
  inboundVoice,
  setInboundVoice,
  inboundWelcomeMessage,
  setInboundWelcomeMessage,
  inboundScript,
  setInboundScript,
  handleSaveInboundSettings,
  openEditInboundModal,
  openCallsKnowledgeModal
}) {
  const { t } = useTranslation('common')

  return (
    <div className="callpanel-grid w-full max-w-none">
      {/* Massapuhelut */}
      <div className="card">
        <h2 className="section-title">{t('calls.callsTab.mass.header')}</h2>
        <p className="text-gray-500 mb-5 text-[15px]">
          {t('calls.callsTab.mass.description')}
        </p>
        <Button
          onClick={openMassCallModal}
          variant="primary"
          className="w-full py-4 px-6 text-base font-semibold"
        >
          {t('calls.callsTab.mass.startButton')}
        </Button>
      </div>

      {/* Yksittäinen puhelu */}
      <div className="card">
        <h2 className="section-title">{t('calls.callsTab.single.header')}</h2>
        <p className="text-gray-500 mb-5 text-[15px]">
          {t('calls.callsTab.single.description')}
        </p>
        <Button
          onClick={openSingleCallModal}
          variant="primary"
          className="w-full py-4 px-6 text-base font-semibold"
        >
          {t('calls.callsTab.single.startButton')}
        </Button>
      </div>

      {/* Inbound-asetukset */}
      <div className="card">
        <h2 className="section-title">{t('calls.callsTab.inbound.header')}</h2>
        <p className="text-gray-500 mb-5 text-[15px]">
          Määritä inbound-puheluille ääni, tervetuloviesti ja skripti
        </p>
        <Button
          onClick={() => openEditInboundModal({
            voice: inboundVoice,
            welcomeMessage: inboundWelcomeMessage,
            script: inboundScript
          })}
          variant="primary"
          className="w-full py-4 px-6 text-base font-semibold"
        >
          Muokkaa inbound-asetuksia
        </Button>
      </div>

      {/* Tietokanta */}
      <div className="card">
        <h2 className="section-title">Tietokanta</h2>
        <p className="text-gray-500 mb-5 text-[15px]">
          Hallitse tietokantaa (tiedostot ja sisältö), jota käytetään puheluissa.
        </p>
        <Button
          onClick={openCallsKnowledgeModal}
          variant="primary"
          className="w-full py-4 px-6 text-base font-semibold"
        >
          Avaa tietokanta
        </Button>
      </div>
    </div>
  )
}


