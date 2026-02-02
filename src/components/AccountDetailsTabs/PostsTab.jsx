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

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Published':
        return 'bg-green-100 text-green-800'
      case 'Scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'Draft':
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {posts.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Idea</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Tyyppi</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Status</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPosts.map(post => (
                    <tr key={post.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="text-sm text-gray-800 font-medium max-w-md truncate">
                          {post.idea || '-'}
                        </div>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {post.type || 'Postaus'}
                      </td>
                      <td className="p-3">
                        <span className={`py-1 px-2.5 rounded-full text-xs font-medium ${getStatusStyle(post.status)}`}>
                          {post.status || 'Draft'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          className="py-1.5 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
              <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50">
                <button
                  className="py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ← Edellinen
                </button>
                <div className="text-sm text-gray-600">
                  Sivu {currentPage} / {totalPages}
                </div>
                <button
                  className="py-2 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Seuraava →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Ei postauksia
          </div>
        )}
      </div>

      {editingPost && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
          onClick={onCancel}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Muokkaa postausta</h2>
              <button
                className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95 text-xl"
                onClick={onCancel}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tyyppi:</label>
                  <input
                    type="text"
                    value={postEditValues.type || ''}
                    onChange={(e) => onEditValueChange('type', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tyyppi..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                  <select
                    value={postEditValues.status || 'Draft'}
                    onChange={(e) => onEditValueChange('status', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Idea:</label>
                  <textarea
                    value={postEditValues.idea || ''}
                    onChange={(e) => onEditValueChange('idea', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[60px]"
                    rows="2"
                    placeholder="Idea..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Caption:</label>
                  <textarea
                    value={postEditValues.caption || ''}
                    onChange={(e) => onEditValueChange('caption', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[150px]"
                    rows="6"
                    placeholder="Caption..."
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                onClick={onCancel}
                disabled={isSaving}
              >
                Peruuta
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-all disabled:opacity-50"
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
