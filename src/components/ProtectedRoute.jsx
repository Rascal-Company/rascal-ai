import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ProtectedRoute = ({ children, requiredFeatures = [], requiredRole = null }) => {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="protected-route-loading">Ladataan...</div>
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  // ROOLITARKISTUS
  // Roolihierarkia: superadmin > admin > moderator > user
  if (requiredRole) {
    if (requiredRole === 'superadmin') {
      if (user.systemRole !== 'superadmin') {
        return <Navigate to="/dashboard" replace />
      }
    } else if (requiredRole === 'admin') {
      if (user.systemRole !== 'admin' && user.systemRole !== 'superadmin') {
        return <Navigate to="/dashboard" replace />
      }
    } else if (requiredRole === 'moderator') {
      const isModerator = user.systemRole === 'moderator' || user.systemRole === 'admin' || user.systemRole === 'superadmin'
      if (!isModerator) {
        return <Navigate to="/dashboard" replace />
      }
    }
  }

  // Feature-tarkistus (Käytetään suoraan user.features taulukkoa)
  if (requiredFeatures.length > 0) {
    const userFeatures = Array.isArray(user.features) ? user.features : []
    const hasRequiredFeatures = requiredFeatures.every(feature => userFeatures.includes(feature))
    
    if (!hasRequiredFeatures) {
      return <div className="protected-route-error">Sinulla ei ole tarvittavia oikeuksia tälle sivulle.</div>
    }
  }

  return children
}

export default ProtectedRoute
