import React, { useEffect } from 'react'
import { useAutoLogout } from '../contexts/AutoLogoutContext'
import { formatTime } from '../utils/inactivityUtils'

const InactivityWarningModal = () => {
  const { 
    showWarning, 
    countdown, 
    extendSession, 
    handleLogout, 
    hideWarningDialog 
  } = useAutoLogout()

  // Estä dialogin sulkeminen klikkaamalla ulkopuolelta
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      // Ei tee mitään - estetään sulkeminen
    }
  }

  // Estä ESC-näppäin
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
      }
    }

    if (showWarning) {
      document.addEventListener('keydown', handleKeyDown)
      // Estä scrollaus taustalla
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [showWarning])

  if (!showWarning) {
    return null
  }

  return (
    <div className="inactivity-warning-overlay" onClick={handleBackdropClick}>
      <div className="inactivity-warning-modal">
        <div className="inactivity-warning-header">
          <div className="inactivity-warning-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
            </svg>
          </div>
          <h2 className="inactivity-warning-title">Sessio päättyy pian</h2>
        </div>
        
        <div className="inactivity-warning-content">
          <p className="inactivity-warning-message">
            Olet ollut inaktiivinen ja sessiosi päättyy automaattisesti turvallisuussyistä.
          </p>
          
          <div className="inactivity-countdown">
            <div className="countdown-label">Aikaa jäljellä:</div>
            <div className="countdown-timer">
              {formatTime(countdown)}
            </div>
          </div>
          
          <div className="inactivity-warning-actions">
            <button 
              className="inactivity-btn inactivity-btn-primary"
              onClick={extendSession}
            >
              Jatka sessiota
            </button>
            
            <button 
              className="inactivity-btn inactivity-btn-secondary"
              onClick={() => handleLogout('Käyttäjä valitsi logoutin')}
            >
              Kirjaudu ulos nyt
            </button>
          </div>
        </div>
        
        <div className="inactivity-warning-footer">
          <p className="inactivity-warning-note">
            Tämä varoitus näkyy automaattisesti 5 minuuttia ennen sessio päättymistä.
          </p>
        </div>
      </div>
    </div>
  )
}

export default InactivityWarningModal 