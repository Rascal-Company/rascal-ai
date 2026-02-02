import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export default function PageHeader({ title, background = 'var(--brand-dark)', color = '#fff', children }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const paddingLeft = isMobile ? 16 : 32;
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { signOut } = useAuth()

  // Dummy user
  const user = {
    name: 'Floyd Miles',
    avatar: '/favicon.png',
  }

  const handleLogout = async () => {
    console.log('=== PAGEHEADER LOGOUT START ===')
    console.log('Calling AuthContext signOut...')
    await signOut()
    console.log('AuthContext signOut completed, navigating to /signin')
    navigate('/signin')
    console.log('=== PAGEHEADER LOGOUT END ===')
  }

  return (
    <div className="page-header" style={{ paddingLeft }}>
      <h1 className="page-header-title" style={{ color }}>{title}</h1>
      <div className="page-header-user">
        <div className={`page-header-user-button ${dropdownOpen ? 'active' : ''}`} onClick={() => setDropdownOpen(v => !v)}>
          <img src={user.avatar} alt={user.name} className="page-header-user-avatar" />
          <span className="page-header-user-name">{user.name}</span>
          <span className="page-header-user-dropdown">▼</span>
        </div>
        {dropdownOpen && (
          <div className="page-header-dropdown">
            <div className="page-header-dropdown-item" onClick={() => { setDropdownOpen(false); navigate('/settings') }}>⚙️ Asetukset</div>
            <div className="page-header-dropdown-item" onClick={handleLogout}>🚪 Kirjaudu ulos</div>
          </div>
        )}
      </div>
      {children}
    </div>
  )
} 