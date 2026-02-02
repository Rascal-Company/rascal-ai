import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useOrgId } from './useOrgId'

async function fetchContent(orgId, options = {}) {
  if (!orgId) return []

  let query = supabase
    .from('content')
    .select('*')
    .eq('user_id', orgId)

  if (options.status) {
    query = query.eq('status', options.status)
  }

  if (options.type) {
    query = query.eq('type', options.type)
  }

  if (options.limit) {
    query = query.limit(options.limit)
  }

  query = query.order('publish_date', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching content:', error)
    throw error
  }

  return data || []
}

export function useContent(options = {}) {
  const { orgId, isLoading: orgLoading } = useOrgId()

  const queryKey = ['content', orgId, options.status, options.type, options.limit]

  const query = useQuery({
    queryKey,
    queryFn: () => fetchContent(orgId, options),
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 2, // 2 min
    placeholderData: [],
  })

  return {
    content: query.data,
    isLoading: query.isLoading || orgLoading,
    isPlaceholderData: query.isPlaceholderData,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useContentMutations() {
  const queryClient = useQueryClient()
  const { orgId } = useOrgId()

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from('content')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', orgId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', orgId] })
    },
  })

  return {
    updateContent: updateMutation.mutate,
    deleteContent: deleteMutation.mutate,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
