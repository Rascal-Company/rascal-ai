import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../../lib/supabase'

export default function CompanyTab({
  company,
  editingCard,
  editValues,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onEditValueChange,
  orgId,
  onShowUsers
}) {
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [usersError, setUsersError] = useState(null)

  useEffect(() => {
    if (orgId) {
      loadUsers()
    }
  }, [orgId])

  const loadUsers = async () => {
    if (!orgId) return
    
    setLoadingUsers(true)
    setUsersError(null)
    
    try {
      // Hae käyttäjät API-endpointista
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setUsersError('Ei kirjautumistietoja')
        return
      }

      const response = await fetch(`/api/organization/account-members?org_id=${orgId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Virhe käyttäjien haussa')
      }

      const data = await response.json()
      setUsers(data.members || [])
    } catch (error) {
      console.error('Error loading users:', error)
      setUsersError(error.message || 'Virhe käyttäjien lataamisessa')
    } finally {
      setLoadingUsers(false)
    }
  }

  const getCardTitle = (field) => {
    switch(field) {
      case 'company_summary':
        return 'Yritysyhteenveto'
      case 'icp_summary':
        return 'ICP (Ideal Customer Profile)'
      case 'kpi':
        return 'KPI'
      case 'tov':
        return 'ToV (Tone of Voice)'
      default:
        return 'Muokkaa'
    }
  }

  return (
    <>
      <div className="company-cards-grid">
        {/* Yritysyhteenveto kortti */}
        <div className={`company-card ${editingCard === 'company_summary' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>Yritysyhteenveto</h3>
          </div>
          <div className="company-card-content">
            {company.company_summary ? (
              <p>{company.company_summary.length > 150 
                ? company.company_summary.substring(0, 150) + '...'
                : company.company_summary}</p>
            ) : (
              <p className="empty-text">Ei yhteenvetoa</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('company_summary')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>

        {/* ICP kortti */}
        <div className={`company-card ${editingCard === 'icp_summary' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>ICP (Ideal Customer Profile)</h3>
          </div>
          <div className="company-card-content">
            {company.icp_summary ? (
              <p>{company.icp_summary.length > 150 
                ? company.icp_summary.substring(0, 150) + '...'
                : company.icp_summary}</p>
            ) : (
              <p className="empty-text">Ei ICP-kuvausta</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('icp_summary')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>

        {/* KPI kortti */}
        <div className={`company-card ${editingCard === 'kpi' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>KPI</h3>
          </div>
          <div className="company-card-content">
            {company.kpi ? (
              <p>{company.kpi.length > 150 
                ? company.kpi.substring(0, 150) + '...'
                : company.kpi}</p>
            ) : (
              <p className="empty-text">Ei KPI-tietoja</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('kpi')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>

        {/* ToV kortti */}
        <div className={`company-card ${editingCard === 'tov' ? 'editing' : ''}`}>
          <div className="company-card-header">
            <h3>ToV (Tone of Voice)</h3>
          </div>
          <div className="company-card-content">
            {company.tov ? (
              <p>{company.tov.length > 150 
                ? company.tov.substring(0, 150) + '...'
                : company.tov}</p>
            ) : (
              <p className="empty-text">Ei ToV-kuvausta</p>
            )}
            <button 
              className="edit-btn-bottom"
              onClick={(e) => {
                e.stopPropagation()
                onEdit('tov')
              }}
            >
              Muokkaa
            </button>
          </div>
        </div>
      </div>

      {/* Käyttäjät kortti - koko sivun levyinen */}
      <div className="users-card-full-width">
        <div className="users-card-header">
          <h3>Käyttäjät</h3>
        </div>
        <div className="users-card-body">
          {loadingUsers ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Ladataan käyttäjiä...
            </div>
          ) : usersError ? (
            <div style={{ color: '#ef4444', padding: '1rem' }}>
              {usersError}
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              Ei käyttäjiä
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Sähköposti</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Rooli</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Viimeksi kirjautunut</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#1f2937' }}>Liittynyt</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.auth_user_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '12px', color: '#1f2937' }}>{user.email || '-'}</td>
                      <td style={{ padding: '12px', color: '#1f2937' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          backgroundColor: user.role === 'owner' ? '#fef3c7' : user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                          color: user.role === 'owner' ? '#92400e' : user.role === 'admin' ? '#1e40af' : '#374151'
                        }}>
                          {user.role === 'owner' ? 'Omistaja' : user.role === 'admin' ? 'Admin' : 'Jäsen'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: '#1f2937' }}>
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleDateString('fi-FI', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'Ei koskaan'}
                      </td>
                      <td style={{ padding: '12px', color: '#1f2937' }}>
                        {new Date(user.created_at).toLocaleDateString('fi-FI', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {editingCard && createPortal(
        <div 
          className="edit-card-modal-overlay modal-overlay modal-overlay--light"
          onClick={onCancel}
        >
          <div 
            className="edit-card-modal modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-card-modal-header">
              <h2>{getCardTitle(editingCard)}</h2>
              <button 
                className="edit-card-close-btn"
                onClick={onCancel}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <div className="edit-card-modal-body">
              <textarea
                value={editValues[editingCard] || ''}
                onChange={(e) => onEditValueChange(editingCard, e.target.value)}
                className="edit-card-textarea"
                rows="12"
                placeholder={editingCard === 'company_summary' ? 'Yrityksen yhteenveto...' :
                            editingCard === 'icp_summary' ? 'Ideal Customer Profile...' :
                            editingCard === 'kpi' ? 'Key Performance Indicators...' :
                            'Tone of Voice...'}
              />
            </div>
            <div className="edit-card-modal-footer">
              <button 
                className="cancel-card-btn"
                onClick={onCancel}
                disabled={isSaving}
              >
                Peruuta
              </button>
              <button 
                className="save-card-btn"
                onClick={() => onSave(editingCard)}
                disabled={isSaving}
              >
                {isSaving ? 'Tallennetaan...' : 'Tallenna'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  )
}

