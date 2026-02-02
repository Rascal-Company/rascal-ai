import React from 'react'
import { useAutoLogout } from '../contexts/AutoLogoutContext'
import { useLocation } from 'react-router-dom'
import { getContextTimeout } from '../utils/inactivityUtils'

const TimeoutInfo = () => {
  const { currentTimeout, isActive } = useAutoLogout()
  const location = useLocation()
  const contextTimeout = getContextTimeout(location.pathname)

  return (
    <div className="fixed bottom-5 right-5 bg-black/80 text-white py-2 px-3 rounded-md text-xs z-[1000] font-mono">
      <div>Timeout: {currentTimeout}min</div>
      <div>Active: {isActive ? '✓' : '✗'}</div>
      <div>Context: {contextTimeout}min</div>
    </div>
  )
}

export default TimeoutInfo 