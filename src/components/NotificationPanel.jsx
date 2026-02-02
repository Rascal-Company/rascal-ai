import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Check, Trash2, Phone, MessageSquare, AlertCircle, Bell, Lightbulb } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'

const NotificationPanel = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    error, 
    fetchNotifications,
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications()
  
  const panelRef = useRef(null)

  // Hae notifikaatiot kun paneli avataan
  useEffect(() => {
    fetchNotifications()
  }, []) // Ei dependencyjä - hakee vain kerran kun paneli avataan

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking the bell button
      if (event.target.closest('.notification-bell-container')) {
        return
      }
      
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose()
      }
    }

    // Small delay to prevent the opening click from closing the panel
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)
    
    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Sulje paneli ESC-näppäimellä
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'inbound_call':
        return <Phone className="notification-icon" size={16} />
      case 'message':
        return <MessageSquare className="notification-icon" size={16} />
      case 'strategy':
        return <Lightbulb className="notification-icon" size={16} />
      default:
        return <AlertCircle className="notification-icon" size={16} />
    }
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return 'juuri nyt'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} min sitten`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} h sitten`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} pv sitten`
    }
  }

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation()
    await deleteNotification(notificationId)
  }

  if (loading && notifications.length === 0) {
    return (
      <div className="notification-panel" ref={panelRef}>
        <div className="notification-panel-header">
          <h3>Notifikaatiot</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="notification-panel-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Ladataan notifikaatioita...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="notification-panel" ref={panelRef}>
        <div className="notification-panel-header">
          <h3>Notifikaatiot</h3>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="notification-panel-content">
          <div className="error-state">
            <AlertCircle size={24} />
            <p>Virhe notifikaatioiden lataamisessa</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Yritä uudelleen
            </button>
          </div>
        </div>
      </div>
    )
  }

  return createPortal(
    <div className="notification-panel" ref={panelRef}>
      <div className="notification-panel-header">
        <h3>Notifikaatiot</h3>
        <div className="header-actions">
          {unreadCount > 0 && (
            <button 
              className="mark-all-read-button"
              onClick={handleMarkAllRead}
              title="Merkitse kaikki luetuksi"
            >
              <Check size={16} />
            </button>
          )}
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="notification-panel-content">
        {loading && notifications.length === 0 ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Ladataan notifikaatioita...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <AlertCircle size={24} />
            <p>Virhe notifikaatioiden lataamisessa</p>
            <button className="retry-button" onClick={() => window.location.reload()}>
              Yritä uudelleen
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <Bell size={32} />
            <p>Ei notifikaatioita</p>
            <span>Uudet ilmoitukset näkyvät tässä</span>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon-container">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="notification-content">
                  <div className="notification-header">
                    <h4 className="notification-title">{notification.title}</h4>
                    <span className="notification-time">
                      {formatTimeAgo(notification.created_at)}
                    </span>
                  </div>
                  
                  <p className="notification-message">{notification.message}</p>
                  
                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="notification-data">
                      {notification.data.phone && (
                        <span className="data-item">📞 {notification.data.phone}</span>
                      )}
                      {notification.data.caller_name && (
                        <span className="data-item">👤 {notification.data.caller_name}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="notification-actions">
                  <button
                    className="delete-button"
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    title="Poista notifikaatio"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default NotificationPanel
