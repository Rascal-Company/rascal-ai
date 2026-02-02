import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useOrgId } from './useOrgId'

async function fetchCampaigns(orgId) {
  if (!orgId) return []

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData?.session?.access_token

  const response = await fetch(`/api/campaigns?user_id=${encodeURIComponent(orgId)}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Kampanjoiden haku epäonnistui: ${response.status} ${text}`)
  }

  return response.json()
}

export function useCampaigns() {
  const { orgId, isLoading: orgLoading } = useOrgId()

  const query = useQuery({
    queryKey: ['campaigns', orgId],
    queryFn: () => fetchCampaigns(orgId),
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 2, // 2 min
    placeholderData: [], // Näytetään tyhjä array latauksen aikana (ei tallenneta cacheen)
  })

  return {
    campaigns: query.data,
    isLoading: query.isLoading || orgLoading,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCampaign(campaignId) {
  const query = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error(`Kampanjan haku epäonnistui: ${response.status}`)
      }

      return response.json()
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60 * 2,
  })

  return {
    campaign: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useCampaignMutations() {
  const queryClient = useQueryClient()
  const { orgId } = useOrgId()

  const pauseMutation = useMutation({
    mutationFn: async (campaignId) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/pause`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: campaignId }),
      })

      if (!response.ok) {
        throw new Error('Kampanjan keskeytys epäonnistui')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', orgId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (campaignId) => {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData?.session?.access_token

      const response = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ id: campaignId }),
      })

      if (!response.ok) {
        throw new Error('Kampanjan poisto epäonnistui')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', orgId] })
    },
  })

  return {
    pauseCampaign: pauseMutation.mutate,
    deleteCampaign: deleteMutation.mutate,
    isPausing: pauseMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
