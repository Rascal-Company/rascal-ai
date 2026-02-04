import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { queryKeys } from './queryKeys'

async function fetchNotifications({ orgId, limit = 50, offset = 0 }) {
  if (!orgId) {
    return { notifications: [], unreadCount: 0 }
  }

  const { data: notifications, error: notificationsError } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', orgId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1)

  if (notificationsError) {
    throw notificationsError
  }

  return notifications || []
}

async function fetchUnreadCount(orgId) {
  if (!orgId) {
    return 0
  }

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', orgId)
    .eq('is_read', false)
    .eq('is_deleted', false)

  if (error) {
    console.error('Error counting unread notifications:', error)
    return 0
  }

  return count || 0
}

async function markNotificationAsRead({ notificationId, orgId }) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', orgId)

  if (error) {
    throw error
  }

  return { notificationId }
}

async function markAllNotificationsAsRead(orgId) {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString()
    })
    .eq('user_id', orgId)
    .eq('is_read', false)
    .eq('is_deleted', false)

  if (error) {
    throw error
  }

  return true
}

async function deleteNotification({ notificationId, orgId }) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', orgId)

  if (error) {
    throw error
  }

  return { notificationId }
}

export function useNotificationsQuery(options = {}) {
  const { orgId, limit = 50, offset = 0, enabled = true } = options

  return useQuery({
    queryKey: queryKeys.notifications.list(orgId, { limit, offset }),
    queryFn: () => fetchNotifications({ orgId, limit, offset }),
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10, // 10 min
  })
}

export function useUnreadCountQuery(options = {}) {
  const { orgId, enabled = true } = options

  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(orgId),
    queryFn: () => fetchUnreadCount(orgId),
    enabled: enabled && !!orgId,
    staleTime: 1000 * 60 * 1, // 1 min
    gcTime: 1000 * 60 * 5, // 5 min
  })
}

export function useMarkAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(variables.orgId, {})
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(variables.orgId)
      })
    },
  })
}

export function useMarkAllAsReadMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: (_, orgId) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(orgId, {})
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(orgId)
      })
    },
  })
}

export function useDeleteNotificationMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteNotification,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.list(variables.orgId, {})
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.unreadCount(variables.orgId)
      })
    },
  })
}

export function useInvalidateNotifications() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all })
  }
}
