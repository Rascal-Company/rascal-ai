import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useOrgId } from './useOrgId'

async function fetchSocialAccounts(orgId) {
  if (!orgId) return []

  const { data, error } = await supabase
    .from('user_social_accounts')
    .select('*')
    .eq('user_id', orgId)
    .eq('is_authorized', true)

  if (error) {
    console.error('Error fetching social accounts:', error)
    throw error
  }

  return data || []
}

export function useSocialAccounts() {
  const { orgId, isLoading: orgLoading } = useOrgId()

  const query = useQuery({
    queryKey: ['socialAccounts', orgId],
    queryFn: () => fetchSocialAccounts(orgId),
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 5, // 5 min
    placeholderData: [],
  })

  return {
    socialAccounts: query.data,
    isLoading: query.isLoading || orgLoading,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
  }
}
