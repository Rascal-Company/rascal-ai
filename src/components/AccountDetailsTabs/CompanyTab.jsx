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

  const cards = [
    { field: 'company_summary', title: 'Yritysyhteenveto', emptyText: 'Ei yhteenvetoa', placeholder: 'Yrityksen yhteenveto...' },
    { field: 'icp_summary', title: 'ICP (Ideal Customer Profile)', emptyText: 'Ei ICP-kuvausta', placeholder: 'Ideal Customer Profile...' },
    { field: 'kpi', title: 'KPI', emptyText: 'Ei KPI-tietoja', placeholder: 'Key Performance Indicators...' },
    { field: 'tov', title: 'ToV (Tone of Voice)', emptyText: 'Ei ToV-kuvausta', placeholder: 'Tone of Voice...' },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {cards.map(({ field, title, emptyText }) => (
          <div
            key={field}
            className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
              editingCard === field ? 'border-primary-500' : 'border-gray-200'
            }`}
          >
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">{title}</h3>
            </div>
            <div className="p-5">
              {company[field] ? (
                <p className="text-sm text-gray-600 mb-4">
                  {company[field].length > 150
                    ? company[field].substring(0, 150) + '...'
                    : company[field]}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic mb-4">{emptyText}</p>
              )}
              <button
                className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(field)
                }}
              >
                Muokkaa
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-semibold text-gray-800">Käyttäjät</h3>
        </div>
        <div className="p-5">
          {loadingUsers ? (
            <div className="text-center py-8 text-gray-500">
              Ladataan käyttäjiä...
            </div>
          ) : usersError ? (
            <div className="text-red-500 py-4">
              {usersError}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Ei käyttäjiä
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Sähköposti</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Rooli</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Viimeksi kirjautunut</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Liittynyt</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.auth_user_id} className="border-b border-gray-200">
                      <td className="p-3 text-sm text-gray-800">{user.email || '-'}</td>
                      <td className="p-3 text-sm">
                        <span className={`py-1 px-2 rounded text-xs font-medium ${
                          user.role === 'owner'
                            ? 'bg-amber-100 text-amber-800'
                            : user.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role === 'owner' ? 'Omistaja' : user.role === 'admin' ? 'Admin' : 'Jäsen'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-800">
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
                      <td className="p-3 text-sm text-gray-800">
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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
          onClick={onCancel}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">{getCardTitle(editingCard)}</h2>
              <button
                className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95 text-xl"
                onClick={onCancel}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-6">
              <textarea
                value={editValues[editingCard] || ''}
                onChange={(e) => onEditValueChange(editingCard, e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[300px]"
                rows="12"
                placeholder={cards.find(c => c.field === editingCard)?.placeholder || ''}
              />
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
