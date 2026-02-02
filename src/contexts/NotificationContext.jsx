import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { useOrgId } from '../hooks/queries/useOrgId'
import {
  useNotificationsQuery,
  useUnreadCountQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation
} from '../hooks/queries'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const { orgId, isLoading: orgIdLoading } = useOrgId()
  const [showVersionNotification, setShowVersionNotification] = useState(false)

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    error: notificationsError,
    refetch: refetchNotifications
  } = useNotificationsQuery({
    orgId,
    enabled: !!orgId && !orgIdLoading,
  })

  const {
    data: unreadCount = 0,
    refetch: refetchUnreadCount
  } = useUnreadCountQuery({
    orgId,
    enabled: !!orgId && !orgIdLoading,
  })

  const markAsReadMutation = useMarkAsReadMutation()
  const markAllAsReadMutation = useMarkAllAsReadMutation()
  const deleteNotificationMutation = useDeleteNotificationMutation()

  const checkVersionUpdate = useCallback(() => {
    const currentVersion = import.meta.env.REACT_APP_VERSION || '1.56.0'
    const lastSeenVersion = localStorage.getItem('lastSeenVersion')

    if (lastSeenVersion !== currentVersion) {
      setShowVersionNotification(true)
    }
  }, [])

  const markVersionAsSeen = useCallback(() => {
    const currentVersion = import.meta.env.REACT_APP_VERSION || '1.56.0'
    localStorage.setItem('lastSeenVersion', currentVersion)
    setShowVersionNotification(false)
  }, [])

  const fetchNotifications = useCallback(async () => {
    if (orgId) {
      await refetchNotifications()
    }
  }, [orgId, refetchNotifications])

  const fetchUnreadCount = useCallback(async () => {
    if (orgId) {
      await refetchUnreadCount()
    }
  }, [orgId, refetchUnreadCount])

  const markAsRead = useCallback(async (notificationId) => {
    if (!orgId) return

    try {
      await markAsReadMutation.mutateAsync({ notificationId, orgId })
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }, [orgId, markAsReadMutation])

  const markAllAsRead = useCallback(async () => {
    if (!orgId) return

    try {
      await markAllAsReadMutation.mutateAsync(orgId)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }, [orgId, markAllAsReadMutation])

  const deleteNotification = useCallback(async (notificationId) => {
    if (!orgId) return

    try {
      await deleteNotificationMutation.mutateAsync({ notificationId, orgId })
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }, [orgId, deleteNotificationMutation])

  useEffect(() => {
    if (user) {
      checkVersionUpdate()
    }
  }, [user, checkVersionUpdate])

  const value = {
    notifications,
    unreadCount,
    loading: notificationsLoading || orgIdLoading,
    error: notificationsError?.message || null,
    showVersionNotification,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    markVersionAsSeen,
    refresh: fetchNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
