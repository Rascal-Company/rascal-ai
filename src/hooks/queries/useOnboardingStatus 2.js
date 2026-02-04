import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

async function fetchOnboardingStatus(userId) {
  if (!userId) return { shouldShow: false, role: null }

  // Check user role from org_members table
  const { data: orgMember, error: orgError } = await supabase
    .from('org_members')
    .select('org_id, role')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (!orgError && orgMember) {
    // Invited users (member role) don't see onboarding
    if (orgMember.role === 'member') {
      return { shouldShow: false, role: 'member', orgId: orgMember.org_id }
    }

    // Owner/admin users: check organization's onboarding_completed
    const { data: orgUserData, error: orgUserError } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', orgMember.org_id)
      .single()

    if (!orgUserError && orgUserData) {
      const onboardingCompleted = orgUserData.onboarding_completed === true
      return {
        shouldShow: !onboardingCompleted,
        role: orgMember.role,
        orgId: orgMember.org_id,
        onboardingCompleted,
      }
    }

    // Org not found in users table - show modal
    return { shouldShow: true, role: orgMember.role, orgId: orgMember.org_id }
  }

  // Normal user (not in org_members): check their own onboarding_completed
  const { data: normalUserData, error: userError } = await supabase
    .from('users')
    .select('onboarding_completed')
    .eq('auth_user_id', userId)
    .maybeSingle()

  if (userError && userError.code === 'PGRST116') {
    // User not found - show onboarding
    return { shouldShow: true, role: null }
  }

  if (userError) {
    throw userError
  }

  if (normalUserData) {
    const onboardingCompleted = normalUserData.onboarding_completed === true
    return {
      shouldShow: !onboardingCompleted,
      role: null,
      onboardingCompleted,
    }
  }

  return { shouldShow: true, role: null }
}

export function useOnboardingStatus(userId) {
  const query = useQuery({
    queryKey: ['onboardingStatus', userId],
    queryFn: () => fetchOnboardingStatus(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 min - onboarding status doesn't change often
    placeholderData: { shouldShow: false, role: null },
  })

  return {
    shouldShow: query.data?.shouldShow ?? false,
    role: query.data?.role ?? null,
    orgId: query.data?.orgId ?? null,
    onboardingCompleted: query.data?.onboardingCompleted ?? false,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}
