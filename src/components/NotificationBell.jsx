import React, { useState, useEffect } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { useNotifications } from '../contexts/NotificationContext'
import NotificationPanel from './NotificationPanel'

const NotificationBell = () => {
  const { unreadCount, fetchUnreadCount } = useNotifications()
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Hae unread count kun komponentti mountataan
  useEffect(() => {
    fetchUnreadCount()
  }, []) // Ei dependencyjä - hakee vain kerran mountissa

  const togglePanel = (e) => {
    // Critical Safari fix: Stop event from bubbling
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    setIsPanelOpen(!isPanelOpen)
  }

  const closePanel = () => {
    setIsPanelOpen(false)
  }

  return (
    <div className="notification-bell-container">
      <button
        className={`notification-bell ${isPanelOpen ? 'active' : ''}`}
        onClick={togglePanel}
        aria-label={`Notifikaatiot ${unreadCount > 0 ? `(${unreadCount} lukematonta)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellRing className="bell-icon" size={24} />
        ) : (
          <Bell className="bell-icon" size={24} />
        )}
        
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isPanelOpen && (
        <NotificationPanel onClose={closePanel} />
      )}
    </div>
  )
}

export default NotificationBell
