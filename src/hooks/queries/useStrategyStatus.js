import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { supabase } from '../../lib/supabase'
import { queryKeys } from './queryKeys'

async function fetchStrategyStatus() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    return null
  }

  const response = await axios.get('/api/strategy/status', {
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  })

  return response.data
}

async function approveStrategy() {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('No access token')
  }

  const response = await fetch('/api/strategy/approve', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Approval failed')
  }

  return response.json()
}

export function useStrategyStatusQuery(options = {}) {
  const { enabled = true, userId } = options

  return useQuery({
    queryKey: queryKeys.strategy.status(userId),
    queryFn: fetchStrategyStatus,
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 min
    gcTime: 1000 * 60 * 30, // 30 min
    retry: 1,
  })
}

export function useApproveStrategy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveStrategy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.strategy.all })
    },
  })
}

export function useInvalidateStrategyStatus() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.strategy.all })
  }
}
