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
      <div className="container" style={{ padding: 24 }}>
        <p>{t('campaigns.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container" style={{ padding: 24 }}>
        <div style={{ color: '#dc2626' }}>{t('campaigns.error')}: {error.message}</div>
      </div>
    )
  }

  const activeCount = campaigns.filter(c => c.status === 'active').length
  const totalCalls = campaigns.reduce((sum, c) => sum + (c.total_calls || 0), 0)
  const answeredCalls = campaigns.reduce((sum, c) => sum + (c.answered_calls || 0), 0)
  const successfulCalls = campaigns.reduce((sum, c) => sum + (c.successful_calls || 0), 0)
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0

  return (
    <div className="container" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>{t('campaigns.header.title')}</h1>
          <p style={{ color: '#6b7280', marginTop: 8 }}>{t('campaigns.header.description')}</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>{t('campaigns.actions.create')}</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatsCard title={t('campaigns.stats.active')} value={activeCount} />
        <StatsCard title={t('campaigns.stats.totalCalls')} value={totalCalls} />
        <StatsCard title={t('campaigns.stats.answerRate')} value={`${answerRate}%`} />
        <StatsCard title={t('campaigns.stats.successful')} value={successfulCalls} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
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
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ color: '#6b7280', marginBottom: 16 }}>{t('campaigns.empty')}</p>
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


