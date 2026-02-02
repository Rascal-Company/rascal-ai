import React, { useState, useEffect, useMemo } from 'react'
import pkg from '../../package.json'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getCurrentUser, isAdmin } from '../utils/userApi'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/Button'

export default function AdminPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [content, setContent] = useState([])
  const [callLogs, setCallLogs] = useState([])
  const [messageLogs, setMessageLogs] = useState([])
  const [segments, setSegments] = useState([])
  const [variables, setVariables] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [updateTimeout, setUpdateTimeout] = useState(null)
  const [modalChanges, setModalChanges] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [showUserIds, setShowUserIds] = useState(false)
  const [featureAddSelection, setFeatureAddSelection] = useState({})
  const [featuresOpen, setFeaturesOpen] = useState({})
  const [featuresPlacement, setFeaturesPlacement] = useState({}) // 'up' | 'down'
  const [featuresMaxHeight, setFeaturesMaxHeight] = useState({})

  const ALL_FEATURES = [
    'Campaigns',
    'Segments',
    'CRM',
    'Phone Calls',
    'Social Media',
    'Marketing assistant',
    'Email marketing integration',
    'Dev',
    'Voicemail',
    'Leads',
    'UGC',
    'Media Monitoring'
  ]

  const KNOWN_FEATURES = useMemo(() => {
    const set = new Set(ALL_FEATURES)
    for (const u of users || []) {
      const arr = Array.isArray(u.features) ? u.features : []
      for (const f of arr) set.add(f)
    }
    return Array.from(set).sort()
  }, [users])

  useEffect(() => {
    checkAdminStatus()
  }, [user])

  useEffect(() => {
    if (isAdmin) {
      loadData()
    }
  }, [isAdmin, activeTab])

  // Cleanup timeout kun komponentti unmountataan
  useEffect(() => {
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout)
      }
    }
  }, [updateTimeout])

  const checkAdminStatus = async () => {
    if (!user) return

    try {
      // Admin-tarkistus: käytetään uutta is-admin endpointia
      const adminStatus = await isAdmin()
      setIsAdmin(adminStatus)
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'users') {
        await loadUsers()
      } else if (activeTab === 'content') {
        await loadContent()
      } else if (activeTab === 'calls') {
        await loadCallLogs()
      } else if (activeTab === 'messages') {
        await loadMessageLogs()
      } else if (activeTab === 'segments') {
        await loadSegments()
      } else if (activeTab === 'system') {
        await loadSystemStats()
      }
    } catch (error) {
      setError('Virhe tietojen lataamisessa: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin/data?type=users', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setUsers(result.users || [])
      } else {
        throw new Error(result.error || 'Failed to fetch users')
      }
    } catch (error) {
      throw error
    }
  }

  const loadContent = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin/data?type=content', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setContent(result.content || [])
      } else {
        throw new Error(result.error || 'Failed to fetch content')
      }
    } catch (error) {
      throw error
    }
  }

  const updateUserRole = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      setError('Virhe roolin päivittämisessä: ' + error.message)
    }
  }

  const updateUserField = async (userId, field, value) => {
    // Päivitä käyttäjätieto heti UI:ssa
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser(prev => ({ ...prev, [field]: value }))
    }
    
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, [field]: value } : user
    ))

    // Debounce API-kutsu
    if (updateTimeout) {
      clearTimeout(updateTimeout)
    }

    const timeout = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('users')
          .update({ [field]: value })
          .eq('id', userId)

        if (error) throw error
      } catch (error) {
        setError(`Virhe kentän ${field} päivittämisessä: ` + error.message)
        // Palauta alkuperäinen arvo jos päivitys epäonnistui
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, [field]: user[field] } : user
        ))
      }
    }, 500) // 500ms viive

    setUpdateTimeout(timeout)
  }

  // Suodata käyttäjät haun perusteella
  const filteredUsers = users.filter(user => 
    user.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Avaa modaali ja päivitä käyttäjätiedot
  const openUserModal = (user) => {
    // Etsi päivitetyt käyttäjätiedot listasta
    const updatedUser = users.find(u => u.id === user.id)
    console.log('Opening modal for user:', updatedUser || user)
    console.log('Platforms data:', (updatedUser || user)?.platforms)
    console.log('Onboarding completed:', (updatedUser || user)?.onboarding_completed)
    setSelectedUser(updatedUser || user)
    setModalChanges({}) // Tyhjennä muutokset
  }

  // Päivitä modaalin kenttä ilman tallennusta
  const updateModalField = (field, value) => {
    setModalChanges(prev => ({ ...prev, [field]: value }))
  }

  // Tallenna kaikki muutokset
  const saveModalChanges = async () => {
    if (Object.keys(modalChanges).length === 0) {
      setSelectedUser(null)
      return
    }

    setIsSaving(true)
    try {
      // Käsittele platforms-kenttä erityisesti
      const processedChanges = { ...modalChanges }
      if (processedChanges.platforms && Array.isArray(processedChanges.platforms)) {
        // Tallenna platforms JSON stringinä
        processedChanges.platforms = JSON.stringify(processedChanges.platforms)
      }

      console.log('Saving changes:', processedChanges)

      const { error } = await supabase
        .from('users')
        .update(processedChanges)
        .eq('id', selectedUser.id)

      if (error) throw error

      // Päivitä käyttäjätieto listassa
      setUsers(prev => prev.map(user => 
        user.id === selectedUser.id ? { ...user, ...modalChanges } : user
      ))

      // Päivitä selectedUser
      setSelectedUser(prev => ({ ...prev, ...modalChanges }))
      
      setModalChanges({})
      setSelectedUser(null)
    } catch (error) {
      setError(`Virhe muutosten tallentamisessa: ` + error.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Sulje modaali ilman tallennusta
  const closeModal = () => {
    setSelectedUser(null)
    setModalChanges({})
  }

  const deleteUser = async (userId) => {
    if (!confirm('Oletko varma, että haluat poistaa tämän käyttäjän?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      setError('Virhe käyttäjän poistamisessa: ' + error.message)
    }
  }

  const deleteContent = async (contentId) => {
    if (!confirm('Oletko varma, että haluat poistaa tämän sisällön?')) return

    try {
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', contentId)

      if (error) throw error
      await loadContent()
    } catch (error) {
      setError('Virhe sisällön poistamisessa: ' + error.message)
    }
  }

  const loadCallLogs = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin/call-logs', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setCallLogs(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch call logs')
      }
    } catch (error) {
      throw error
    }
  }

  const loadMessageLogs = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin/message-logs', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Admin message logs response:', response.status, errorText)
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setMessageLogs(result.data || [])
      } else {
        throw new Error(result.error || 'Failed to fetch message logs')
      }
    } catch (error) {
      console.error('Error loading message logs:', error)
      setMessageLogs([]) // Aseta tyhjä array virheen sattuessa
      throw error
    }
  }

  const loadSegments = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin/data?type=segments', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setSegments(result.segments || [])
      } else {
        throw new Error(result.error || 'Failed to fetch segments')
      }
    } catch (error) {
      throw error
    }
  }

  const loadSystemStats = async () => {
    try {
      const token = await supabase.auth.getSession()
      if (!token.data.session?.access_token) {
        throw new Error('No access token')
      }

      const response = await fetch('/api/admin/data?type=stats', {
        headers: {
          'Authorization': `Bearer ${token.data.session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      if (result.success) {
        setStats(result.stats)
      } else {
        throw new Error(result.error || 'Failed to fetch stats')
      }
    } catch (error) {
      throw error
    }
  }

  if (!isAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-access-denied">
          <h2>Pääsy estetty</h2>
          <p>Sinulla ei ole oikeuksia admin-paneeliin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Hallinta</h1>
        <p>Järjestelmän hallintapaneeli</p>
      </div>

      {error && (
        <div className="admin-error">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Käyttäjät ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Sisältö ({content.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'calls' ? 'active' : ''}`}
          onClick={() => setActiveTab('calls')}
        >
          Puhelut ({callLogs.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          Viestit ({messageLogs.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          Segmentit ({segments.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          Järjestelmä
        </button>
      </div>

      <div className="admin-content">
        {loading ? (
          <div className="admin-loading">Ladataan...</div>
        ) : (
          <>
                         {activeTab === 'users' && (
               <div className="admin-section">
                 <div className="admin-header-row">
                   <h2>Käyttäjät ({filteredUsers.length})</h2>
                   <div className="admin-controls">
                     <button
                       className="admin-btn admin-btn-secondary"
                       onClick={() => setShowUserIds(!showUserIds)}
                     >
                       {showUserIds ? t('admin.buttons.hideIds') : t('admin.buttons.showIds')}
                     </button>
                   <div className="admin-search">
                     <input
                       type="text"
                       placeholder={t('placeholders.searchByNameEmailCompany')}
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="search-input"
                     />
                     </div>
                   </div>
                 </div>
                 
                 <div className="admin-table-container">
                   <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nimi</th>
                        <th>Sähköposti</th>
                        {showUserIds && <th>User ID</th>}
                        <th>Rooli</th>
                        <th>Yritys</th>
                        <th>Tilaus</th>
                        <th>CRM yhdistetty</th>
                        <th>Featuret</th>
                        <th>Rekisteröitynyt</th>
                        <th>Toiminnot</th>
                      </tr>
                    </thead>
                     <tbody>
                       {filteredUsers.map(user => (
                         <tr key={user.id}>
                           <td>{user.contact_person || 'Nimeä ei asetettu'}</td>
                           <td>{user.contact_email}</td>
                           {showUserIds && <td>{user.auth_user_id || '-'}</td>}
                           <td>
                             <select
                               value={user.role || 'user'}
                               onChange={(e) => updateUserRole(user.id, e.target.value)}
                             >
                               <option value="user">Käyttäjä</option>
                               <option value="admin">Admin</option>
                               <option value="moderator">Moderaattori</option>
                             </select>
                           </td>
                           <td>{user.company_name || 'Ei yritystä'}</td>
                           <td>
                             <select
                               value={user.subscription_status || 'free'}
                               onChange={(e) => updateUserField(user.id, 'subscription_status', e.target.value)}
                               style={{ textTransform: 'capitalize' }}
                             >
                               <option value="free">Free</option>
                               <option value="pro">Pro</option>
                               <option value="enterprise">Enterprise</option>
                             </select>
                           </td>
                           <td>
                             <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                               <label className="switch" title="CRM yhdistetty">
                                 <input
                                   type="checkbox"
                                   checked={Boolean(user.crm_connected)}
                                   onChange={(e) => updateUserField(user.id, 'crm_connected', e.target.checked)}
                                   aria-label="CRM yhdistetty"
                                 />
                                 <span className="slider" />
                               </label>
                               <span style={{ fontSize: 12, color: user.crm_connected ? '#166534' : '#6b7280' }}>
                                 {user.crm_connected ? 'Kytketty' : 'Ei kytketty'}
                               </span>
                             </div>
                           </td>
                           <td>
                            <div style={{ position: 'relative', marginTop: 8 }}>
                              <button
                                className="admin-btn admin-btn-secondary"
                                onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  const verticalPadding = 24 // popover padding yhteensä
                                  const spaceBelow = window.innerHeight - rect.bottom
                                  const spaceAbove = rect.top
                                  const placeUp = spaceAbove > spaceBelow
                                  setFeaturesPlacement(prev => ({ ...prev, [user.id]: placeUp ? 'up' : 'down' }))
                                  const availableSpace = placeUp ? spaceAbove - verticalPadding : spaceBelow - verticalPadding
                                  const maxH = Math.max(160, Math.min(availableSpace, 420))
                                  setFeaturesMaxHeight(prev => ({ ...prev, [user.id]: maxH }))
                                  setFeaturesOpen(prev => ({ ...prev, [user.id]: !prev[user.id] }))
                                }}
                              >Näytä</button>
                              <div className="feature-popover" style={{ display: featuresOpen[user.id] ? 'block' : 'none', position: 'absolute', [featuresPlacement[user.id] === 'up' ? 'bottom' : 'top']: 36, left: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, boxShadow: '0 12px 30px rgba(0,0,0,0.12)', zIndex: 1000, minWidth: 260 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: featuresMaxHeight[user.id] || 300, overflowY: 'auto', paddingRight: 4 }}>
                                  {KNOWN_FEATURES.map(f => {
                                    const enabled = (Array.isArray(user.features) ? user.features : []).includes(f)
                                    const featureLabel = f === 'Voicemail' ? 'Vastaaja' : f === 'Leads' ? 'Liidit' : f === 'UGC' ? 'UGC' : f
                                    return (
                                      <div key={f} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: '#374151' }}>{featureLabel}</span>
                                        <label className="switch">
                                          <input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={(e) => {
                                              const current = Array.isArray(user.features) ? user.features : []
                                              const next = e.target.checked ? Array.from(new Set([...current, f])) : current.filter(x => x !== f)
                                              updateUserField(user.id, 'features', next)
                                            }}
                                            aria-label={featureLabel}
                                          />
                                          <span className="slider" />
                                        </label>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                           <td>{new Date(user.created_at).toLocaleDateString('fi-FI')}</td>
                           <td>
                             <div className="action-buttons">
                               <button
                                 className="admin-btn admin-btn-secondary"
                                 onClick={() => openUserModal(user)}
                                 title={t('accessibility.editTechnicalId')}
                               >
                                 Muokkaa
                               </button>
                               <button
                                 className="admin-btn admin-btn-danger"
                                 onClick={() => deleteUser(user.id)}
                                 title={t('accessibility.deleteUser')}
                               >
                                 Poista
                               </button>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>

                 {/* Teknisten ID:iden muokkaus modal */}
                 {selectedUser && createPortal(
                   <div className="modal-overlay modal-overlay--light" onClick={closeModal}>
                     <div className="modal-container" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                       <div className="modal-header">
                         <h2 className="modal-title">Muokkaa {selectedUser?.contact_person || selectedUser?.contact_email || 'käyttäjän'} käyttäjätietoja</h2>
                         {Object.keys(modalChanges).length > 0 && (
                           <span style={{ fontSize: '12px', color: '#666' }}>
                             Tallentamattomia muutoksia
                           </span>
                         )}
                         <button
                           className="modal-close-btn"
                           onClick={closeModal}
                         >
                           ✕
                         </button>
                       </div>
                       <div className="modal-content">
                         <div className="form-sections">
                           {/* Synthflow-konfiguraatio */}
                           <div className="form-section">
                             <h3 className="section-title">Synthflow-konfiguraatio</h3>
                             <div className="form-grid">
                               <div className="form-group">
                                 <label className="form-label">Assistant ID</label>
                                 <input
                                   type="text"
                                   className="form-input"
                                   value={modalChanges.vapi_assistant_id !== undefined ? modalChanges.vapi_assistant_id : (selectedUser.vapi_assistant_id || '')}
                                   onChange={(e) => updateModalField('vapi_assistant_id', e.target.value)}
                                   placeholder="Synthflow Assistant ID"
                                 />
                               </div>
                               <div className="form-group">
                                 <label className="form-label">Inbound Assistant ID</label>
                                 <input
                                   type="text"
                                   className="form-input"
                                   value={modalChanges.vapi_inbound_assistant_id !== undefined ? modalChanges.vapi_inbound_assistant_id : (selectedUser.vapi_inbound_assistant_id || '')}
                                   onChange={(e) => updateModalField('vapi_inbound_assistant_id', e.target.value)}
                                   placeholder="Synthflow Inbound Assistant ID"
                                 />
                               </div>
                               <div className="form-group">
                                 <label className="form-label">Puhelinnumero</label>
                                 <input
                                   type="text"
                                   className="form-input"
                                   value={modalChanges.vapi_phone_number !== undefined ? modalChanges.vapi_phone_number : (selectedUser.vapi_phone_number || '')}
                                   onChange={(e) => updateModalField('vapi_phone_number', e.target.value)}
                                   placeholder="Synthflow Phone Number"
                                 />
                               </div>
                               <div className="form-group">
                                 <label className="form-label">Voice ID</label>
                                 <input
                                   type="text"
                                   className="form-input"
                                   value={modalChanges.voice_id !== undefined ? modalChanges.voice_id : (selectedUser.voice_id || '')}
                                   onChange={(e) => updateModalField('voice_id', e.target.value)}
                                   placeholder="Voice ID"
                                 />
                               </div>
                             </div>
                           </div>

                           {/* Käyttäjätiedot */}
                           <div className="form-section">
                             <h3 className="section-title">Käyttäjätiedot</h3>
                             <div className="form-grid">
                               <div className="form-group">
                                 <label className="form-label">Tilausstatus</label>
                                 <select
                                   className="form-input"
                                   value={modalChanges.subscription_status !== undefined ? modalChanges.subscription_status : (selectedUser.subscription_status || 'free')}
                                   onChange={(e) => updateModalField('subscription_status', e.target.value)}
                                 >
                                   <option value="free">Free</option>
                                   <option value="pro">Pro</option>
                                   <option value="enterprise">Enterprise</option>
                                 </select>
                               </div>
                              <div className="form-group">
                                <label className="form-label">Käyttäjän tila</label>
                                <select
                                  className="form-input"
                                  value={modalChanges.status !== undefined ? modalChanges.status : (selectedUser.status || '')}
                                  onChange={(e) => updateModalField('status', e.target.value)}
                                >
                                  <option value="">-</option>
                                  <option value="New">New</option>
                                  <option value="Processing">Processing</option>
                                  <option value="Summarized">Summarized</option>
                                  <option value="Create Content">Create Content</option>
                                  <option value="Active">Active</option>
                                  <option value="Demo">Demo</option>
                                  <option value="Canceled">Canceled</option>
                                  <option value="Pending">Pending</option>
                                </select>
                              </div>
                               <div className="form-group">
                                 <label className="form-label">Onboarding valmis</label>
                                 <div className="status-display">
                                   <span className={`status-text ${(modalChanges.onboarding_completed !== undefined ? modalChanges.onboarding_completed : (selectedUser.onboarding_completed || false)) ? 'status-yes' : 'status-no'}`}>
                                     {(modalChanges.onboarding_completed !== undefined ? modalChanges.onboarding_completed : (selectedUser.onboarding_completed || false)) ? 'Kyllä' : 'Ei'}
                                   </span>
                                   <button
                                     type="button"
                                     className="status-toggle-btn"
                                     onClick={() => {
                                       const currentValue = modalChanges.onboarding_completed !== undefined ? modalChanges.onboarding_completed : (selectedUser.onboarding_completed || false);
                                       updateModalField('onboarding_completed', !currentValue);
                                     }}
                                   >
                                     Vaihda
                                   </button>
                                 </div>
                               </div>
                             </div>
                           </div>

                           {/* Alustat */}
                           <div className="form-section">
                             <h3 className="section-title">Alustat</h3>
                             <div className="platforms-grid">
                               {["Blog", "Newsletter", "Instagram Photo", "LinkedIn", "Instagram Carousel", "Instagram Reels"].map(platform => {
                                 // Käsittele platforms-kenttä eri muodoista
                                 const getCurrentPlatforms = () => {
                                   const platformsData = modalChanges.platforms !== undefined ? modalChanges.platforms : (selectedUser.platforms || []);
                                   
                                   // Jos on jo array, palauta sellaisenaan
                                   if (Array.isArray(platformsData)) {
                                     return platformsData;
                                   }
                                   
                                   // Jos on string, käsittele sitä
                                   if (typeof platformsData === 'string') {
                                     // Tyhjä string
                                     if (!platformsData.trim()) {
                                       return [];
                                     }
                                     
                                     // Yritä parsia JSON array stringinä
                                     try {
                                       const parsed = JSON.parse(platformsData);
                                       if (Array.isArray(parsed)) {
                                         return parsed;
                                       }
                                     } catch (e) {
                                       // Ei JSON, käsittele pilkuilla eroteltuna
                                       return platformsData.split(',').map(p => p.trim()).filter(p => p);
                                     }
                                   }
                                   
                                   return [];
                                 };
                                 
                                 const currentPlatforms = getCurrentPlatforms();
                                 const isSelected = currentPlatforms.includes(platform);
                                 
                                 return (
                                   <label key={platform} className="platform-option">
                                     <input
                                       type="checkbox"
                                       checked={isSelected}
                                       onChange={(e) => {
                                         const platformsArray = getCurrentPlatforms();
                                         let newPlatforms;
                                         if (e.target.checked) {
                                           newPlatforms = [...platformsArray, platform];
                                         } else {
                                           newPlatforms = platformsArray.filter(p => p !== platform);
                                         }
                                         updateModalField('platforms', newPlatforms);
                                       }}
                                     />
                                     <span className="platform-label">{platform}</span>
                                   </label>
                                 );
                               })}
                             </div>
                           </div>
                         </div>
                         <div className="modal-actions">
                           <div className="modal-actions-left">
                             <Button
                               variant="secondary"
                               onClick={closeModal}
                             >
                               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                 <line x1="18" y1="6" x2="6" y2="18"></line>
                                 <line x1="6" y1="6" x2="18" y2="18"></line>
                               </svg>
                             </Button>
                           </div>
                           <div className="modal-actions-right">
                             <Button
                               variant="primary"
                               onClick={saveModalChanges}
                               disabled={isSaving || Object.keys(modalChanges).length === 0}
                             >
                               {isSaving ? t('admin.buttons.saving') : t('admin.buttons.save')}
                             </Button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>,
                   document.body
                 )}
               </div>
             )}

            {activeTab === 'content' && (
              <div className="admin-section">
                <h2>Sisältö</h2>
                <div className="admin-table-container">
                  <table className="admin-table">
                                         <thead>
                       <tr>
                         <th>Idea</th>
                         <th>Tyyppi</th>
                         <th>Luonut</th>
                         <th>Tila</th>
                         <th>Luotu</th>
                         <th>Toiminnot</th>
                       </tr>
                     </thead>
                     <tbody>
                       {content.map(item => (
                         <tr key={item.id}>
                           <td>{item.idea || 'Idea ei asetettu'}</td>
                           <td>{item.type || 'Ei tyyppiä'}</td>
                           <td>{item.users?.contact_person || item.users?.contact_email || 'Tuntematon'}</td>
                           <td>
                             <span className={`status-badge status-${item.status?.toLowerCase()}`}>
                               {item.status || 'Draft'}
                             </span>
                           </td>
                           <td>{new Date(item.created_at).toLocaleDateString('fi-FI')}</td>
                           <td>
                             <button
                               className="admin-btn admin-btn-danger"
                               onClick={() => deleteContent(item.id)}
                             >
                               Poista
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                  </table>
                </div>
              </div>
            )}

                         {activeTab === 'calls' && (
               <div className="admin-section">
                 <h2>Puhelut</h2>
                 <div className="admin-table-container">
                   <table className="admin-table">
                     <thead>
                       <tr>
                         <th>Asiakas</th>
                         <th>Puhelinnumero</th>
                         <th>Käyttäjä</th>
                         <th>Hinta</th>
                         <th>Päivä</th>
                       </tr>
                     </thead>
                     <tbody>
                       {callLogs.map(call => (
                         <tr key={call.id}>
                           <td>{call.customer_name || 'Nimeä ei asetettu'}</td>
                           <td>{call.phone_number}</td>
                           <td>{call.users?.contact_person || call.users?.contact_email || 'Tuntematon'}</td>
                           <td>{call.price ? `€${call.price}` : '-'}</td>
                           <td>{new Date(call.call_date).toLocaleDateString('fi-FI')}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {activeTab === 'messages' && (
               <div className="admin-section">
                 <h2>Viestit / kuukausi</h2>
                 <div className="admin-table-container">
                   {loading ? (
                     <div className="admin-loading">Ladataan viestejä...</div>
                   ) : error ? (
                     <div className="admin-error">
                       <p>❌ Virhe viestien lataamisessa: {error}</p>
                       <button 
                         className="admin-btn admin-btn-secondary"
                         onClick={() => loadData()}
                       >
                         Yritä uudelleen
                       </button>
                     </div>
                   ) : !messageLogs || messageLogs.length === 0 ? (
                     <div className="admin-empty">
                       <p>Ei viestejä löytynyt.</p>
                     </div>
                   ) : (
                     <table className="admin-table">
                       <thead>
                         <tr>
                           <th>Käyttäjä</th>
                           <th>Viestien määrä</th>
                           <th>Kuukausi</th>
                           <th>Kustannus (€)</th>
                         </tr>
                       </thead>
                       <tbody>
                         {(() => {
                           try {
                             // Ryhmitellään messageLogs käyttäjä+kuukausi -tasoille
                             const monthNames = [
                               'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
                               'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
                             ];
                             const groups = {};
                             
                             if (Array.isArray(messageLogs)) {
                               messageLogs.forEach(msg => {
                                 if (msg && msg.created_at) {
                                   const user = msg.users?.contact_person || msg.users?.contact_email || 'Tuntematon';
                                   const date = new Date(msg.created_at);
                                   if (!isNaN(date.getTime())) {
                                     const month = date.getMonth();
                                     const year = date.getFullYear();
                                     const key = `${user}__${year}-${month}`;
                                     if (!groups[key]) {
                                       groups[key] = { user, year, month, count: 0 };
                                     }
                                     groups[key].count++;
                                   }
                                 }
                               });
                             }
                             
                             // Järjestetään tulos uusimmat ensin
                             const sorted = Object.values(groups).sort((a, b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
                             return sorted.map((g, idx) => (
                               <tr key={g.user + g.year + g.month}>
                                 <td>{g.user}</td>
                                 <td>{g.count}</td>
                                 <td>{monthNames[g.month]} {g.year}</td>
                                 <td>{(g.count * 0.01).toFixed(2)} €</td>
                               </tr>
                             ));
                           } catch (error) {
                             console.error('Error processing message logs:', error);
                             return (
                               <tr>
                                 <td colSpan="4" style={{ textAlign: 'center', color: '#dc2626' }}>
                                   Virhe tietojen käsittelyssä
                                 </td>
                               </tr>
                             );
                           }
                         })()}
                       </tbody>
                     </table>
                   )}
                 </div>
               </div>
             )}

             {activeTab === 'segments' && (
               <div className="admin-section">
                 <h2>Segmentit</h2>
                 <div className="admin-table-container">
                   <table className="admin-table">
                     <thead>
                       <tr>
                         <th>Dia</th>
                         <th>Teksti</th>
                         <th>Tila</th>
                         <th>Luonut</th>
                         <th>Luotu</th>
                       </tr>
                     </thead>
                     <tbody>
                       {segments.map(segment => (
                         <tr key={segment.id}>
                           <td>{segment.slide_no || 'Ei diaa'}</td>
                           <td>{segment.text || 'Ei tekstiä'}</td>
                           <td>
                             <span className={`status-badge status-${segment.status?.toLowerCase()}`}>
                               {segment.status || 'Draft'}
                             </span>
                           </td>
                           <td>{segment.users?.contact_person || segment.users?.contact_email || 'Tuntematon'}</td>
                           <td>{new Date(segment.created_at).toLocaleDateString('fi-FI')}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             )}

             {activeTab === 'system' && (
               <div className="admin-section">
                 <h2>Järjestelmän tiedot</h2>
                 <div className="system-info">
                   <div className="info-card">
                     <h3>Käyttäjät</h3>
                     <p>Yhteensä: {stats.totalUsers || users.length}</p>
                     <p>Admineja: {stats.adminUsers || users.filter(u => u.role === 'admin').length}</p>
                     <p>Aktiivisia: {stats.activeUsers || 0}</p>
                   </div>
                   <div className="info-card">
                     <h3>Sisältö</h3>
                     <p>Yhteensä: {stats.totalContent || content.length}</p>
                     <p>Julkaistu: {stats.publishedContent || 0}</p>
                     <p>Segmenttejä: {stats.totalSegments || 0}</p>
                   </div>
                   <div className="info-card">
                     <h3>Kommunikaatio</h3>
                     <p>Puhelut: {stats.totalCalls || 0}</p>
                     <p>Vastattu: {stats.answeredCalls || 0}</p>
                     <p>Viestit: {stats.totalMessages || 0}</p>
                   </div>
                    <div className="info-card">
                      <h3>Järjestelmä</h3>
                      <p>Versio: {pkg.version}</p>
                     <p>Ympäristö: {import.meta.env.MODE}</p>
                      <p>Supabase: Aktiivinen</p>
                    </div>
                 </div>
               </div>
             )}
          </>
        )}
      </div>
    </div>
  )
} 