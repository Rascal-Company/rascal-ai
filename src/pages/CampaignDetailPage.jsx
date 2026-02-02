import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchCampaignById } from '../services/campaignsApi'
import CampaignStats from '../components/campaigns/CampaignStats'
import CampaignStatusBadge from '../components/campaigns/CampaignStatusBadge'

export default function CampaignDetailPage() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await fetchCampaignById(id)
        if (mounted) setCampaign(data)
      } catch (err) {
        if (mounted) setError(err.message || 'Virhe haussa')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    if (id) load()
    return () => { mounted = false }
  }, [id])

  if (loading) return <div className="p-6">Ladataan...</div>
  if (error) return <div className="p-6 text-red-600">{error}</div>
  if (!campaign) return <div className="p-6">Ei löydy</div>

  return (
    <div className="p-6 grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold m-0">{campaign.name}</h1>
          {campaign.description && <p className="text-gray-500 mt-2">{campaign.description}</p>}
        </div>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <CampaignStats campaignId={campaign.id} />
    </div>
  )
}


