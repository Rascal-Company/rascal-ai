import React from 'react'
import { createPortal } from 'react-dom'

export default function EditModalTarkistuksessa({ t, editingPost, onClose }) {
  if (!editingPost) return null
  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="modal-container edit-post-modal">
        <div className="modal-header">
          <h2 className="modal-title">{t('posts.modals.viewTitle')}</h2>
          <button onClick={onClose} className="modal-close-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-content">
          <div className="form-group">
            <label className="form-label">Kuvaus</label>
            <textarea
              name="caption"
              rows={6}
              className="form-textarea bg-gray-50 text-gray-500"
              defaultValue={editingPost?.caption || ''}
              placeholder={t('posts.placeholders.caption')}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}


