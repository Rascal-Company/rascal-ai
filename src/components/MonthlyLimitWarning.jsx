import React from 'react'
import { useTranslation } from 'react-i18next'

const MonthlyLimitWarning = ({ limitData, onClose, onCreateAnyway }) => {
  const { t } = useTranslation('common')

  if (!limitData || limitData.canCreate) return null

  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-[500px]">
        <div className="modal-header">
          <h2 className="modal-title">⚠️ {t('monthlyLimit.title')}</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <div className="warning-content">
            <div className="warning-icon">
              🚫
            </div>
            <h3>{t('monthlyLimit.exceeded')}</h3>
            <p>
              {t('monthlyLimit.description', { currentCount: limitData.currentCount, monthlyLimit: limitData.monthlyLimit })}
            </p>
            <p>
              <strong>{t('monthlyLimit.nextMonth')}</strong>
            </p>
            
            <div className="limit-info">
              <div className="limit-stat">
                <span className="limit-label">{t('monthlyLimit.thisMonth')}:</span>
                <span className="limit-value used">{limitData.currentCount}</span>
              </div>
              <div className="limit-stat">
                <span className="limit-label">{t('monthlyLimit.limit')}:</span>
                <span className="limit-value limit">{limitData.monthlyLimit}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            {t('common.close')}
          </button>
          <button
            onClick={onCreateAnyway}
            className="btn btn-primary"
            disabled
            title={t('monthlyLimit.exceeded')}
          >
            {t('monthlyLimit.createAnyway')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default MonthlyLimitWarning

