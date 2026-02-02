import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '../../lib/supabase'
import { queryKeys } from './queryKeys'

async function fetchCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return null
  }

  const response = await axios.get('/api/users/me', {
    headers: { Authorization: `Bearer ${session.access_token}` }
  })

  return response.data
}

export function useCurrentUser(options = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: queryKeys.user.current(),
    queryFn: fetchCurrentUser,
    enabled,
    staleTime: 1000 * 60 * 5, // 5 min - user data is fairly stable
    gcTime: 1000 * 60 * 30, // 30 min
    retry: 1,
  })
}

export function useInvalidateCurrentUser() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.user.current() })
  }
}

export function useCurrentUserData() {
  const queryClient = useQueryClient()
  return queryClient.getQueryData(queryKeys.user.current())
}
