import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import CampaignForm from '../components/campaigns/CampaignForm'

export default function CampaignCreatePage() {
  const { user } = useAuth()
  return (
    <div className="p-6">
      <h1 className="text-[28px] font-bold mb-3">Luo uusi kampanja</h1>
      <CampaignForm userId={user?.id} />
    </div>
  )
}


