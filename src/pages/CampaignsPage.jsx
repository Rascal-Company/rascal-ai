import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useCampaigns, useOrgId } from '../hooks/queries'
import StatsCard from '../components/shared/StatsCard'
import CampaignCard from '../components/campaigns/CampaignCard'
import Button from '../components/Button'
import CampaignForm from '../components/campaigns/CampaignForm'

export default function CampaignsPage() {
  const { t } = useTranslation('common')
  const { orgId } = useOrgId()
  const { campaigns, isLoading, error, refetch } = useCampaigns()
  const [showCreate, setShowCreate] = useState(false)

  if (isLoading) {
    return (
      <div className="container p-6">
        <p>{t('campaigns.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container p-6">
        <div className="text-red-600">{t('campaigns.error')}: {error.message}</div>
      </div>
    )
  }

  const activeCount = campaigns.filter(c => c.status === 'active').length
  const totalCalls = campaigns.reduce((sum, c) => sum + (c.total_calls || 0), 0)
  const answeredCalls = campaigns.reduce((sum, c) => sum + (c.answered_calls || 0), 0)
  const successfulCalls = campaigns.reduce((sum, c) => sum + (c.successful_calls || 0), 0)
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0

  return (
    <div className="container p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[28px] font-bold m-0">{t('campaigns.header.title')}</h1>
          <p className="text-gray-500 mt-2">{t('campaigns.header.description')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>{t('campaigns.actions.create')}</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard title={t('campaigns.stats.active')} value={activeCount} />
        <StatsCard title={t('campaigns.stats.totalCalls')} value={totalCalls} />
        <StatsCard title={t('campaigns.stats.answerRate')} value={`${answerRate}%`} />
        <StatsCard title={t('campaigns.stats.successful')} value={successfulCalls} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {campaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onStatusChange={() => refetch()}
            onDelete={() => refetch()}
          />
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{t('campaigns.empty')}</p>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay modal-overlay--light" role="dialog" aria-modal="true">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">{t('campaigns.actions.create')}</h2>
              <button className="modal-close-btn" onClick={() => setShowCreate(false)} type="button">×</button>
            </div>
            <div className="modal-content">
              <CampaignForm
                userId={orgId}
                onSuccess={() => {
                  setShowCreate(false)
                  refetch()
                }}
                onCancel={() => setShowCreate(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


