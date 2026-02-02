import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { fetchCampaignById } from '../../services/campaignsApi'
import { pauseCampaign } from '../../services/campaignsApi'
import CampaignStats from './CampaignStats'
import CampaignStatusBadge from './CampaignStatusBadge'

export default function CampaignDetailModal({ campaignId, onClose }) {
  const { t } = useTranslation('common')
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pausing, setPausing] = useState(false)
  const [pauseError, setPauseError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await fetchCampaignById(campaignId)
        if (mounted) setCampaign(data)
      } catch (err) {
        if (mounted) setError(err.message || t('campaigns.details.fetchError'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (campaignId) load()
    return () => { mounted = false }
  }, [campaignId])

  return (
    <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true">
      <div className="modal-container max-w-[900px]">
        <div className="modal-header">
          <h2 className="modal-title">{t('campaigns.details.title')}</h2>
          <button className="modal-close-btn" onClick={onClose} type="button">×</button>
        </div>
        <div className="modal-content">
          {loading && <div>{t('campaigns.details.loading')}</div>}
          {error && <div className="text-red-600">{t('campaigns.details.error')}</div>}
          {!loading && !error && campaign && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-[22px] font-bold m-0">{campaign.name}</h3>
                  {campaign.description && (
                    <p className="text-gray-500 mt-1.5">{campaign.description}</p>
                  )}
                </div>
                <CampaignStatusBadge status={campaign.status} />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setPausing(true)
                      setPauseError('')
                      await pauseCampaign(campaign.id)
                      // Päivitä näkymä tuoreella datalla
                      const fresh = await fetchCampaignById(campaign.id)
                      setCampaign(fresh)
                    } catch (e) {
                      setPauseError(e.message || t('campaigns.details.pauseError'))
                    } finally {
                      setPausing(false)
                    }
                  }}
                  disabled={pausing || campaign.status === 'paused'}
                  className={`border border-gray-200 rounded-lg py-2 px-3 font-bold ${
                    campaign.status === 'paused'
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-amber-500 text-gray-900 cursor-pointer'
                  } ${pausing ? 'cursor-not-allowed' : ''}`}
                >
                  {pausing ? t('campaigns.details.pausing') : campaign.status === 'paused' ? t('campaigns.details.pausedButton') : t('campaigns.details.pauseButton')}
                </button>
                {pauseError && <div className="text-red-600 self-center">{pauseError}</div>}
              </div>
              
              {/* Tilastot - samalla tavalla kuin Puhelulokit-sivulla */}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-4">
                {/* Soittoyritykset - ensimmäinen kortti */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-indigo-500 mb-2">
                    {campaign.attempt_count || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.callAttempts')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-green-500 mb-2">
                    {campaign.answered_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.answeredCalls')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-emerald-500 mb-2">
                    {campaign.successful_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.successfulCalls')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-red-500 mb-2">
                    {campaign.failed_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.failedCalls')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-amber-500 mb-2">
                    {campaign.pending_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.scheduledCalls')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-blue-500 mb-2">
                    {campaign.in_progress_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.queuedCalls')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-indigo-500 mb-2">
                    {campaign.total_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.totalCalls')}</div>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <div className="text-[32px] font-bold text-blue-700 mb-2">
                    {campaign.called_calls || 0}
                  </div>
                  <div className="text-sm text-gray-500">{t('campaigns.details.stats.calledCalls')}</div>
                </div>
              </div>
              
              <CampaignStats campaignId={campaign.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


