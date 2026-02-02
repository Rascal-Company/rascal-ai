import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function CallTypesTab({
  callTypes,
  editingCallType,
  callTypeEditValues,
  isSaving,
  currentPage,
  callTypesPerPage,
  onEdit,
  onCancel,
  onSave,
  onEditValueChange,
  onPageChange
}) {
  console.log('CallTypesTab received callTypes:', callTypes, 'Type:', typeof callTypes, 'Is Array:', Array.isArray(callTypes))
  
  // Automaattinen korkeuden säätö textarea-kentille
  useEffect(() => {
    if (!editingCallType) return
    
    const adjustTextareaHeight = (textarea) => {
      // Resetoi korkeus automaattiseen
      textarea.style.height = 'auto'
      // Laske minimikorkeus (1 rivi)
      const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 25.6
      const padding = 32 // 16px ylös + 16px alas
      const minHeight = lineHeight + padding // 1 rivi + padding
      
      // Jos textarea on tyhjä, aseta minimikorkeus
      if (!textarea.value || textarea.value.trim() === '') {
        textarea.style.height = minHeight + 'px'
      } else {
        // Muuten käytä scrollHeight:a (sisältää kaiken tekstin)
        const newHeight = Math.max(minHeight, textarea.scrollHeight)
        textarea.style.height = newHeight + 'px'
      }
    }
    
    // Hae kaikki textarea-elementit modaalista
    const textareas = document.querySelectorAll('.edit-card-modal-body textarea')
    textareas.forEach(adjustTextareaHeight)
    
    // Lisää input-event listener joka säätää korkeutta reaaliajassa
    const handleInput = (e) => {
      adjustTextareaHeight(e.target)
    }
    
    textareas.forEach(textarea => {
      textarea.addEventListener('input', handleInput)
    })
    
    return () => {
      textareas.forEach(textarea => {
        textarea.removeEventListener('input', handleInput)
      })
    }
  }, [callTypeEditValues, editingCallType])
  
  if (!callTypes) {
    return (
      <div className="no-posts-message">
        <p className="empty-text">Ladataan puhelutyyppejä...</p>
      </div>
    )
  }

  const totalPages = Math.ceil(callTypes.length / callTypesPerPage)
  const paginatedCallTypes = callTypes.slice(
    (currentPage - 1) * callTypesPerPage,
    currentPage * callTypesPerPage
  )

  return (
    <>
      <div className="posts-table-container">
        {callTypes.length > 0 ? (
          <>
            <div className="posts-table-wrapper">
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>Nimi</th>
                    <th>Status</th>
                    <th>Agentti</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCallTypes.map(callType => (
                    <tr key={callType.id}>
                      <td className="posts-table-idea">
                        <div className="idea-text">
                          {callType.name || '-'}
                        </div>
                      </td>
                      <td className="posts-table-status">
                        <span className="post-status-badge" data-status={callType.status || 'Active'}>
                          {callType.status === 'Active' ? 'Aktiivinen' :
                           callType.status === 'Inactive' ? 'Ei aktiivinen' :
                           'Tuntematon'}
                        </span>
                      </td>
                      <td className="posts-table-type">
                        {callType.agent_name || '-'}
                      </td>
                      <td className="posts-table-actions">
                        <button
                          className="posts-edit-btn"
                          onClick={() => onEdit(callType)}
                        >
                          Muokkaa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {callTypes.length > callTypesPerPage && (
              <div className="posts-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ← Edellinen
                </button>
                <div className="pagination-info">
                  Sivu {currentPage} / {totalPages}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Seuraava →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-posts-message">
            <p className="empty-text">Ei puhelutyyppejä</p>
          </div>
        )}
      </div>

      {editingCallType && createPortal(
        <div 
          className="edit-card-modal-overlay modal-overlay modal-overlay--light"
          onClick={onCancel}
        >
          <div 
            className="edit-card-modal modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div className="edit-card-modal-header">
              <h2>
                {callTypes.find(ct => ct.id === editingCallType)?.name || 'Puhelutyyppi'}
              </h2>
              <button 
                className="edit-card-close-btn"
                onClick={onCancel}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <div className="edit-card-modal-body">
              <div className="post-edit-fields">
                <div className="post-edit-field">
                  <label>Nimi:</label>
                  <input
                    type="text"
                    value={callTypeEditValues.name || ''}
                    onChange={(e) => onEditValueChange('name', e.target.value)}
                    className="post-edit-input"
                    placeholder="Puhelutyypin nimi..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Agentti:</label>
                  <input
                    type="text"
                    value={callTypeEditValues.agent_name || ''}
                    onChange={(e) => onEditValueChange('agent_name', e.target.value)}
                    className="post-edit-input"
                    placeholder="Agentin nimi..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Kohderyhmä:</label>
                  <input
                    type="text"
                    value={callTypeEditValues.target_audience || ''}
                    onChange={(e) => onEditValueChange('target_audience', e.target.value)}
                    className="post-edit-input"
                    placeholder="Kohderyhmä..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Identiteetti:</label>
                  <textarea
                    value={callTypeEditValues.identity || ''}
                    onChange={(e) => onEditValueChange('identity', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Identiteetti..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Tyyli:</label>
                  <textarea
                    value={callTypeEditValues.style || ''}
                    onChange={(e) => onEditValueChange('style', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Tyyli..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Ohjeistus:</label>
                  <textarea
                    value={callTypeEditValues.guidelines || ''}
                    onChange={(e) => onEditValueChange('guidelines', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Ohjeistus..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Tavoitteet:</label>
                  <textarea
                    value={callTypeEditValues.goals || ''}
                    onChange={(e) => onEditValueChange('goals', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Tavoitteet..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Yhteenveto:</label>
                  <textarea
                    value={callTypeEditValues.summary || ''}
                    onChange={(e) => onEditValueChange('summary', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Yhteenveto..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Onnistumisen arviointi:</label>
                  <textarea
                    value={callTypeEditValues.success_assessment || ''}
                    onChange={(e) => onEditValueChange('success_assessment', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Onnistumisen arviointi..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Toimenpide:</label>
                  <textarea
                    value={callTypeEditValues.action || ''}
                    onChange={(e) => onEditValueChange('action', e.target.value)}
                    className="edit-card-textarea"
                    rows="3"
                    placeholder="Toimenpide..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Avauslause:</label>
                  <textarea
                    value={callTypeEditValues.first_line || ''}
                    onChange={(e) => onEditValueChange('first_line', e.target.value)}
                    className="edit-card-textarea"
                    rows="2"
                    placeholder="Avauslause..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Ensimmäinen SMS:</label>
                  <textarea
                    value={callTypeEditValues.first_sms || ''}
                    onChange={(e) => onEditValueChange('first_sms', e.target.value)}
                    className="edit-card-textarea"
                    rows="2"
                    placeholder="Ensimmäinen SMS..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Esittely:</label>
                  <textarea
                    value={callTypeEditValues.intro || ''}
                    onChange={(e) => onEditValueChange('intro', e.target.value)}
                    className="edit-card-textarea"
                    rows="4"
                    placeholder="Esittely..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Kysymykset:</label>
                  <textarea
                    value={callTypeEditValues.questions || ''}
                    onChange={(e) => onEditValueChange('questions', e.target.value)}
                    className="edit-card-textarea"
                    rows="5"
                    placeholder="Kysymykset..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Lopetus:</label>
                  <textarea
                    value={callTypeEditValues.outro || ''}
                    onChange={(e) => onEditValueChange('outro', e.target.value)}
                    className="edit-card-textarea"
                    rows="2"
                    placeholder="Lopetus..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>SMS puhelun jälkeen:</label>
                  <textarea
                    value={callTypeEditValues.after_call_sms || ''}
                    onChange={(e) => onEditValueChange('after_call_sms', e.target.value)}
                    className="edit-card-textarea"
                    rows="2"
                    placeholder="SMS puhelun jälkeen..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>SMS vastaamattomasta puhelusta:</label>
                  <textarea
                    value={callTypeEditValues.missed_call_sms || ''}
                    onChange={(e) => onEditValueChange('missed_call_sms', e.target.value)}
                    className="edit-card-textarea"
                    rows="2"
                    placeholder="SMS vastaamattomasta puhelusta..."
                  />
                </div>

                <div className="post-edit-field">
                  <label>Muistiinpanot:</label>
                  <textarea
                    value={callTypeEditValues.notes || ''}
                    onChange={(e) => onEditValueChange('notes', e.target.value)}
                    className="edit-card-textarea"
                    rows="4"
                    placeholder="Muistiinpanot..."
                  />
                </div>
              </div>
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
                onClick={onSave}
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

