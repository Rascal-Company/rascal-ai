import React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import Button from '../Button'

export default function SingleCallModal({
  open,
  onClose,
  callType,
  setCallType,
  selectedVoice,
  setSelectedVoice,
  name,
  setName,
  phoneNumber,
  setPhoneNumber,
  singleCallSmsFirst,
  setSingleCallSmsFirst,
  singleCallSmsAfterCall,
  setSingleCallSmsAfterCall,
  singleCallSmsMissedCall,
  setSingleCallSmsMissedCall,
  callTypes,
  getVoiceOptions,
  script,
  calling,
  singleCallError,
  handleSingleCall,
  updateScriptFromCallType
}) {
  const { t } = useTranslation('common')

  if (!open) return null

  const selectedCallType = callTypes.find(ct => ct.value === callType)

  const hasSmsFirst = selectedCallType?.first_sms && selectedCallType.first_sms.trim().length > 0
  const hasSmsAfterCall = selectedCallType?.after_call_sms && selectedCallType.after_call_sms.trim().length > 0
  const hasSmsMissedCall = selectedCallType?.missed_call_sms && selectedCallType.missed_call_sms.trim().length > 0

  return createPortal(
    <div
      onClick={onClose}
      className="modal-overlay modal-overlay--dark"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-container max-w-[800px]"
      >
        <div className="modal-header">
          <h2 className="modal-title text-[22px] text-gray-800 font-bold bg-transparent">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" className="mr-2 align-middle inline-block">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            {t('calls.modals.single.title')}
          </h2>
          <Button
            onClick={onClose}
            variant="secondary"
            className="modal-close-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        <div className="modal-body">
          <div className="grid grid-cols-2 gap-6">
            {/* Left column: Voice + Call type */}
            <div>
              <label className="label">{t('calls.modals.single.callType')}</label>
              <select
                value={callType}
                onChange={e => { setCallType(e.target.value); updateScriptFromCallType(e.target.value) }}
                className="select w-full mb-5"
              >
                <option value="">{t('calls.modals.single.selectCallType')}</option>
                {callTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>

              <label className="label">{t('calls.modals.single.voice')}</label>
              <select
                value={selectedVoice}
                onChange={e => setSelectedVoice(e.target.value)}
                className="select w-full mb-5"
              >
                {getVoiceOptions().map(voice => (
                  <option key={voice.value} value={voice.value}>{voice.label}</option>
                ))}
              </select>
            </div>

            {/* Right column: Name + Phone number */}
            <div>
              <label className="label">{t('calls.modals.single.name')}</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder={t('placeholders.exampleName')}
                className="input mb-5"
              />

              <label className="label">{t('calls.modals.single.phone')}</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder={t('calls.modals.single.phonePlaceholder')}
                className="input mb-5"
              />

              {/* SMS toggles */}
              <div className="mt-2 mb-3">
                <div className="flex items-center gap-2.5 mb-3">
                  <label className="font-medium text-[13px] min-w-[120px]">{t('calls.modals.mass.step2.sms.before')}</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={singleCallSmsFirst}
                      onChange={e => setSingleCallSmsFirst(e.target.checked)}
                      disabled={!hasSmsFirst}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="flex items-center gap-2.5 mb-3">
                  <label className="font-medium text-[13px] min-w-[120px]">{t('calls.modals.mass.step2.sms.after')}</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={singleCallSmsAfterCall}
                      onChange={e => setSingleCallSmsAfterCall(e.target.checked)}
                      disabled={!hasSmsAfterCall}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>

                <div className="flex items-center gap-2.5 mb-3">
                  <label className="font-medium text-[13px] min-w-[120px]">{t('calls.modals.mass.step2.sms.missed')}</label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={singleCallSmsMissedCall}
                      onChange={e => setSingleCallSmsMissedCall(e.target.checked)}
                      disabled={!hasSmsMissedCall}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              {/* SMS preview */}
              {(singleCallSmsFirst || singleCallSmsAfterCall || singleCallSmsMissedCall) && (
                <div className="sms-preview-container mt-3">
                  <div className="text-xs text-gray-500 mb-1.5">{t('calls.modals.mass.step2.sms.preview')}</div>
                  <div className="flex flex-col gap-2">
                    {singleCallSmsFirst && selectedCallType?.first_sms && (
                      <div className="p-2 bg-gray-100 rounded-md text-xs">
                        <strong>{t('calls.modals.mass.step2.sms.before')}:</strong> {selectedCallType.first_sms}
                      </div>
                    )}
                    {singleCallSmsAfterCall && selectedCallType?.after_call_sms && (
                      <div className="p-2 bg-gray-100 rounded-md text-xs">
                        <strong>{t('calls.modals.mass.step2.sms.after')}:</strong> {selectedCallType.after_call_sms}
                      </div>
                    )}
                    {singleCallSmsMissedCall && selectedCallType?.missed_call_sms && (
                      <div className="p-2 bg-gray-100 rounded-md text-xs">
                        <strong>{t('calls.modals.mass.step2.sms.missed')}:</strong> {selectedCallType.missed_call_sms}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Call button and error messages */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-3 justify-end">
              <Button
                onClick={onClose}
                variant="secondary"
              >
                {t('calls.common.cancel')}
              </Button>
              <Button
                onClick={handleSingleCall}
                disabled={calling || !name.trim() || !phoneNumber.trim() || !callType || !script.trim() || !selectedVoice}
                variant="primary"
              >
                {calling ? t('calls.modals.single.calling') : t('calls.modals.single.call')}
              </Button>
            </div>

            {singleCallError && (
              <div className="status-error mt-3">{singleCallError}</div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
