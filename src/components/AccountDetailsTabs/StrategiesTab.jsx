import React from 'react'
import { createPortal } from 'react-dom'

export default function StrategiesTab({
  strategies,
  editingStrategy,
  strategyEditValues,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  onEditValueChange
}) {
  return (
    <>
      <div className="company-cards-grid">
        {strategies.length > 0 ? (
          strategies.map(strategy => (
            <div key={strategy.id} className="company-card">
              <div className="company-card-header">
                <div className="strategy-header-title">
                  <h3>{strategy.month || strategy.planner || 'Strategia'}</h3>
                  <span className="strategy-status-badge" data-status={strategy.status || 'Current'}>
                    {strategy.status === 'Current' ? 'Nykyinen' :
                     strategy.status === 'Upcoming' ? 'Tuleva' :
                     'Vanha'}
                  </span>
                </div>
              </div>
              <div className="company-card-content">
                {strategy.strategy ? (
                  <p>{strategy.strategy.length > 150 
                    ? strategy.strategy.substring(0, 150) + '...'
                    : strategy.strategy}</p>
                ) : (
                  <p className="empty-text">Ei strategiaa</p>
                )}
              </div>
              <div className="strategy-card-footer">
                <span className="strategy-date">
                  {new Date(strategy.created_at).toLocaleDateString('fi-FI')}
                </span>
                <button 
                  className="edit-btn-bottom"
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(strategy)
                  }}
                >
                  Muokkaa
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-strategies-message">
            <p className="empty-text">Ei strategioita</p>
          </div>
        )}
      </div>

      {editingStrategy && createPortal(
        <div 
          className="edit-card-modal-overlay modal-overlay modal-overlay--light"
          onClick={onCancel}
        >
          <div 
            className="edit-card-modal modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-card-modal-header">
              <h2>
                {strategies.find(s => s.id === editingStrategy)?.month || 
                 strategies.find(s => s.id === editingStrategy)?.planner || 
                 'Strategia'}
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
              <div className="strategy-edit-status">
                <label>Status:</label>
                <select
                  value={strategyEditValues.status || 'Current'}
                  onChange={(e) => onEditValueChange('status', e.target.value)}
                  className="strategy-status-select"
                >
                  <option value="Current">Nykyinen</option>
                  <option value="Upcoming">Tuleva</option>
                  <option value="Old">Vanha</option>
                </select>
              </div>
              <textarea
                value={strategyEditValues.strategy || ''}
                onChange={(e) => onEditValueChange('strategy', e.target.value)}
                className="edit-card-textarea"
                rows="12"
                placeholder="Strategia..."
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

