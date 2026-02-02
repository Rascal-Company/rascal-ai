import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { queryKeys } from './queryKeys'

async function fetchOrgId(authUserId) {
  if (!authUserId) {
    return null
  }

  // 1. Tarkista ensin onko käyttäjä admin tai moderator users-taulussa
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (!userError && userData?.id) {
    // Jos käyttäjä on admin tai moderator, palauta käyttäjän oma users.id
    if (userData.role === 'admin' || userData.role === 'moderator' || userData.role === 'superadmin') {
      return userData.id
    }
  }

  // 2. Tarkista onko käyttäjä kutsuttu käyttäjä (org_members taulussa)
  const { data: orgMember, error: orgError } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (!orgError && orgMember?.org_id) {
    return orgMember.org_id
  }

  // 3. Fallback: palauta users.id
  if (!userError && userData?.id) {
    return userData.id
  }

  return null
}

export function useOrgId() {
  const { user, loading: authLoading } = useAuth()

  // Jos AuthContext on jo hakenut organizationId:n, käytetään sitä
  const hasOrgIdFromAuth = user?.organizationId != null

  const query = useQuery({
    queryKey: queryKeys.user.orgId(user?.id),
    queryFn: () => fetchOrgId(user?.id),
    enabled: !!user?.id && !hasOrgIdFromAuth && !authLoading,
    staleTime: 1000 * 60 * 30, // 30 min - org ID muuttuu harvoin
    gcTime: 1000 * 60 * 60, // 1h
  })

  // Palauta AuthContextin arvo jos se on saatavilla
  if (hasOrgIdFromAuth) {
    return {
      orgId: user.organizationId,
      isLoading: false,
      error: null,
    }
  }

  return {
    orgId: query.data ?? null,
    isLoading: query.isLoading || authLoading,
    error: query.error,
  }
}
