import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const ConfirmDialog = ({ 
  show, 
  title, 
  message, 
  confirmText = 'Vahvista',
  cancelText = 'Peruuta',
  onConfirm, 
  onCancel,
  variant = 'danger',
  loading = false,
  t
}) => {
  if (!show) return null

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel()
        }
      }}
    >
      <div className="modal-container" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          {!loading && (
            <button
              onClick={onCancel}
              className="modal-close-btn"
              type="button"
            >
              ✕
            </button>
          )}
        </div>
        <div className="modal-content">
          <p style={{ marginBottom: 0 }}>{message}</p>
        </div>
        <div className="modal-actions">
          <div className="modal-actions-left">
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelText}
            </Button>
          </div>
          <div className="modal-actions-right">
            <Button
              type="button"
              variant={variant}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (t?.('ui.buttons.saving') || 'Käsitellään...') : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmDialog
