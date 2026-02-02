import React from 'react'
import { createPortal } from 'react-dom'

export default function PostsTab({
  posts,
  editingPost,
  postEditValues,
  isSaving,
  currentPage,
  postsPerPage,
  onEdit,
  onCancel,
  onSave,
  onEditValueChange,
  onPageChange
}) {
  const totalPages = Math.ceil(posts.length / postsPerPage)
  const paginatedPosts = posts.slice(
    (currentPage - 1) * postsPerPage,
    currentPage * postsPerPage
  )

  return (
    <>
      <div className="posts-table-container">
        {posts.length > 0 ? (
          <>
            <div className="posts-table-wrapper">
              <table className="posts-table">
                <thead>
                  <tr>
                    <th>Idea</th>
                    <th>Tyyppi</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map(post => (
                    <tr key={post.id}>
                      <td className="posts-table-idea">
                        <div className="idea-text">
                          {post.idea || '-'}
                        </div>
                      </td>
                      <td className="posts-table-type">
                        {post.type || 'Postaus'}
                      </td>
                      <td className="posts-table-status">
                        <span className="post-status-badge" data-status={post.status || 'Draft'}>
                          {post.status || 'Draft'}
                        </span>
                      </td>
                      <td className="posts-table-actions">
                        <button
                          className="posts-edit-btn"
                          onClick={() => onEdit(post)}
                        >
                          Muokkaa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {posts.length > postsPerPage && (
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
            <p className="empty-text">Ei postauksia</p>
          </div>
        )}
      </div>

      {editingPost && createPortal(
        <div 
          className="edit-card-modal-overlay modal-overlay modal-overlay--light"
          onClick={onCancel}
        >
          <div 
            className="edit-card-modal modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-card-modal-header">
              <h2>Muokkaa postausta</h2>
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
                  <label>Tyyppi:</label>
                  <input
                    type="text"
                    value={postEditValues.type || ''}
                    onChange={(e) => onEditValueChange('type', e.target.value)}
                    className="post-edit-input"
                    placeholder="Tyyppi..."
                  />
                </div>
                <div className="post-edit-field">
                  <label>Status:</label>
                  <select
                    value={postEditValues.status || 'Draft'}
                    onChange={(e) => onEditValueChange('status', e.target.value)}
                    className="post-edit-select"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
                <div className="post-edit-field">
                  <label>Idea:</label>
                  <textarea
                    value={postEditValues.idea || ''}
                    onChange={(e) => onEditValueChange('idea', e.target.value)}
                    className="post-edit-textarea-small"
                    rows="2"
                    placeholder="Idea..."
                  />
                </div>
                <div className="post-edit-field">
                  <label>Caption:</label>
                  <textarea
                    value={postEditValues.caption || ''}
                    onChange={(e) => onEditValueChange('caption', e.target.value)}
                    className="edit-card-textarea"
                    rows="6"
                    placeholder="Caption..."
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

