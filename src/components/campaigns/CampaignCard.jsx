import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import CampaignDetailModal from './CampaignDetailModal'
// Ei tehdä suoria Supabase-hakuja tässä – käytetään backendin rikastamia arvoja
import { pauseCampaign, fetchCampaignById, deleteCampaign } from '../../services/campaignsApi'

export default function CampaignCard({ campaign, onStatusChange, onDelete }) {
  const { t } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const [pausing, setPausing] = useState(false)
  const [pauseError, setPauseError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const totalCalls = campaign.total_calls || 0
  const answeredCalls = campaign.answered_calls || 0
  const successfulCalls = campaign.successful_calls || 0
  const calledCalls = campaign.called_calls || 0
  const attemptCount = campaign.attempt_count || 0 // Soittoyritykset
  // Vastausprosentti = vastatut / soittoyritykset (sama logiikka kuin Puhelulokit-sivulla)
  const answerRate = attemptCount > 0 ? Math.round((answeredCalls / attemptCount) * 100) : 0
  // Jäljellä = vain aktiiviset (pending + in progress), ei paused
  const remainingCalls = (campaign.pending_calls || 0) + (campaign.in_progress_calls || 0)
  
  // Debug: tarkista mitä kortti näyttää
  if (campaign.id === '88f7e74a-2f4d-429f-984a-e7b447a7277b') {
    console.log('=== CAMPAIGN CARD DEBUG ===', {
      campaignId: campaign.id,
      campaignName: campaign.name,
      attempt_count: campaign.attempt_count,
      called_calls: campaign.called_calls,
      successful_calls: campaign.successful_calls,
      fullCampaign: campaign
    })
  }
  

  const statusLabelMap = {
    active: t('campaigns.status.active'),
    paused: t('campaigns.status.paused'),
    completed: t('campaigns.status.completed'),
    archived: t('campaigns.status.archived')
  }

  const status = campaign.status || 'active'
  const statusLabel = statusLabelMap[status] || status

  // Kortti näyttää arvot suoraan backendin rikastamasta kampanjaobjektista

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="border border-gray-200 rounded-lg bg-white shadow-sm transition-shadow duration-200 cursor-pointer hover:shadow-md"
      >
        <div className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="text-lg font-semibold">{campaign.name}</div>
            <span className={`rounded-full py-1 px-2.5 text-xs border border-gray-200 text-gray-700 ${
              status === 'active' ? 'bg-indigo-50' : 'bg-gray-100'
            }`}>{statusLabel}</span>
          </div>
          {campaign.description && (
            <div className="mt-1.5 text-gray-500 text-sm">{campaign.description}</div>
          )}
        </div>
        <div className="p-4 border-t border-gray-100">
          <div className="grid grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-gray-500">{t('campaigns.card.callAttempts')}</div>
              <div className="font-semibold">{attemptCount}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('campaigns.stats.calledCalls')}</div>
              <div className="font-semibold">{calledCalls}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('campaigns.card.successful')}</div>
              <div className="font-semibold">{successfulCalls}</div>
            </div>
            <div>
              <div className="text-gray-500">{t('campaigns.card.answerRateShort')}</div>
              <div className="font-semibold">{answerRate}%</div>
            </div>
            <div>
              <div className="text-gray-500">{t('campaigns.stats.totalCallLogs')}</div>
              <div className="font-semibold">{totalCalls}</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={async () => {
                try {
                  setPausing(true)
                  setPauseError('')
                  await pauseCampaign(campaign.id)
                  // Päivitä status paikallisesti ja ilmoita vanhemmalle
                  const fresh = await fetchCampaignById(campaign.id)
                  onStatusChange && onStatusChange(fresh)
                } catch (e) {
                  setPauseError(e.message || t('campaigns.card.pauseError'))
                } finally {
                  setPausing(false)
                }
              }}
              disabled={pausing || status === 'paused'}
              className={`border border-gray-200 rounded-lg py-2 px-3 font-bold ${
                status === 'paused'
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-amber-500 text-gray-900 cursor-pointer'
              } ${pausing ? 'cursor-not-allowed' : ''}`}
            >
              {pausing ? t('campaigns.card.pausing') : status === 'paused' ? t('campaigns.card.pausedButton') : t('campaigns.card.pauseButton')}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className={`bg-red-600 text-white border-none rounded-lg py-2 px-3 font-bold ${
                deleting ? 'cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {deleting ? t('campaigns.card.deleting') : t('campaigns.card.deleteButton')}
            </button>
            {pauseError && <div className="text-red-600 self-center">{pauseError}</div>}
            {deleteError && <div className="text-red-600 self-center">{deleteError}</div>}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="text-gray-500 text-sm">{t('campaigns.card.remaining')}</div>
            <div className="font-bold">{remainingCalls} / {totalCalls}</div>
          </div>
          {campaign.call_types?.name && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500">{t('campaigns.card.script')}: {campaign.call_types.name}</div>
            </div>
          )}
        </div>
      </div>
      {open && (
        <CampaignDetailModal
          campaignId={campaign.id}
          onClose={() => setOpen(false)}
        />
      )}
      {showDeleteConfirm && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true" onClick={(e) => {
          if (e.target === e.currentTarget) setShowDeleteConfirm(false)
        }}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{t('campaigns.card.deleteConfirmTitle')}</h2>
              <button className="modal-close-btn" onClick={() => setShowDeleteConfirm(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <p className="mb-4">{t('campaigns.card.deleteConfirmMessage', { name: campaign.name })}</p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className={`bg-gray-200 text-gray-700 border border-gray-300 rounded-lg py-2 px-4 font-semibold ${
                    deleting ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {t('campaigns.card.cancelButton')}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setDeleting(true)
                      setDeleteError('')
                      await deleteCampaign(campaign.id)
                      setShowDeleteConfirm(false)
                      onDelete && onDelete(campaign.id)
                    } catch (e) {
                      setDeleteError(e.message || t('campaigns.card.deleteError'))
                    } finally {
                      setDeleting(false)
                    }
                  }}
                  disabled={deleting}
                  className={`bg-red-600 text-white border-none rounded-lg py-2 px-4 font-semibold ${
                    deleting ? 'cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {deleting ? t('campaigns.card.deleting') : t('campaigns.card.deleteButton')}
                </button>
              </div>
              {deleteError && (
                <div className="mt-3 p-3 border border-red-200 bg-red-50 text-red-800 rounded-lg">
                  {deleteError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}


