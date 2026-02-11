import React, { useState, useEffect } from 'react'
import { useAutoLogout } from '../contexts/AutoLogoutContext'
import {
  TIMEOUT_OPTIONS,
  saveTimeoutPreference,
  getTimeoutPreference,
  getContextTimeout
} from '../utils/inactivityUtils'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const TimeoutSettings = () => {
  const [selectedTimeout, setSelectedTimeout] = useState(20)
  const [isCustom, setIsCustom] = useState(false)
  const [customTimeout, setCustomTimeout] = useState(20)
  const [showSaved, setShowSaved] = useState(false)
  const { t } = useTranslation('common')

  const location = useLocation()
  const { currentTimeout, updateTimeout } = useAutoLogout()

  useEffect(() => {
    const savedTimeout = getTimeoutPreference()
    const contextTimeout = getContextTimeout(location.pathname)

    if (savedTimeout) {
      setSelectedTimeout(savedTimeout)
      setCustomTimeout(savedTimeout)
      setIsCustom(!TIMEOUT_OPTIONS.find(option => option.value === savedTimeout))
    } else {
      setSelectedTimeout(contextTimeout)
      setCustomTimeout(contextTimeout)
    }
  }, [location.pathname])

  const handleSave = () => {
    const timeoutToSave = isCustom ? customTimeout : selectedTimeout
    saveTimeoutPreference(timeoutToSave)
    updateTimeout(timeoutToSave)
    setShowSaved(true)

    setTimeout(() => {
      setShowSaved(false)
    }, 2000)
  }

  const handleReset = () => {
    localStorage.removeItem('rascal_auto_logout_timeout')
    const contextTimeout = getContextTimeout(location.pathname)
    setSelectedTimeout(contextTimeout)
    setCustomTimeout(contextTimeout)
    setIsCustom(false)
    updateTimeout(contextTimeout)
    setShowSaved(true)

    setTimeout(() => {
      setShowSaved(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">{t('settings.timeout.title')}</h3>
        <p className="text-sm text-gray-500">
          {t('settings.timeout.description')}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">{t('settings.timeout.select')}</label>

          <div className="space-y-2">
            {TIMEOUT_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="timeout"
                  value={option.value}
                  checked={!isCustom && selectedTimeout === option.value}
                  onChange={(e) => {
                    setSelectedTimeout(parseInt(e.target.value))
                    setIsCustom(false)
                  }}
                  className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">{t('settings.timeout.minutes', { count: option.value })}</span>
              </label>
            ))}

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="timeout"
                checked={isCustom}
                onChange={() => setIsCustom(true)}
                className="w-4 h-4 text-primary-500 border-gray-300 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{t('settings.timeout.custom')}</span>
            </label>
          </div>
        </div>

        {isCustom && (
          <div className="pl-7">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('settings.timeout.customLabel')}
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={customTimeout}
              onChange={(e) => setCustomTimeout(parseInt(e.target.value) || 20)}
              className="w-24 py-2 px-3 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('settings.timeout.customNote')}
            </p>
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">{t('settings.timeout.current')}</div>
          <div className="text-lg font-semibold text-gray-800">
            {isCustom ? customTimeout : selectedTimeout} min
          </div>
          {currentTimeout !== (isCustom ? customTimeout : selectedTimeout) && (
            <div className="text-xs text-gray-500 mt-1">
              {t('settings.timeout.pageDefault', { minutes: currentTimeout })}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            className="py-2 px-4 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            onClick={handleSave}
          >
            {t('settings.timeout.save')}
          </button>

          <button
            className="py-2 px-4 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
            onClick={handleReset}
          >
            {t('settings.timeout.reset')}
          </button>
        </div>

        {showSaved && (
          <div className="p-3 bg-green-50 text-green-600 rounded-lg text-sm">
            {t('settings.timeout.saved')}
          </div>
        )}
      </div>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">{t('settings.timeout.infoTitle')}</h4>
        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
          <li>{t('settings.timeout.info.0')}</li>
          <li>{t('settings.timeout.info.1')}</li>
          <li>{t('settings.timeout.info.2')}</li>
          <li>{t('settings.timeout.info.3')}</li>
        </ul>
      </div>
    </div>
  )
}

export default TimeoutSettings
