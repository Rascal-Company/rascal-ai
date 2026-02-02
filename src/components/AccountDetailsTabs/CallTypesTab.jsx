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

  useEffect(() => {
    if (!editingCallType) return

    const adjustTextareaHeight = (textarea) => {
      textarea.style.height = 'auto'
      const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 25.6
      const padding = 32
      const minHeight = lineHeight + padding

      if (!textarea.value || textarea.value.trim() === '') {
        textarea.style.height = minHeight + 'px'
      } else {
        const newHeight = Math.max(minHeight, textarea.scrollHeight)
        textarea.style.height = newHeight + 'px'
      }
    }

    const textareas = document.querySelectorAll('[data-auto-resize="true"]')
    textareas.forEach(adjustTextareaHeight)

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
      <div className="text-center py-12 text-gray-500">
        Ladataan puhelutyyppejä...
      </div>
    )
  }

  const totalPages = Math.ceil(callTypes.length / callTypesPerPage)
  const paginatedCallTypes = callTypes.slice(
    (currentPage - 1) * callTypesPerPage,
    currentPage * callTypesPerPage
  )

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800'
      case 'Inactive':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {callTypes.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Nimi</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Status</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800">Agentti</th>
                    <th className="p-3 text-left text-sm font-semibold text-gray-800"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCallTypes.map(callType => (
                    <tr key={callType.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="text-sm text-gray-800 font-medium">
                          {callType.name || '-'}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`py-1 px-2.5 rounded-full text-xs font-medium ${getStatusStyle(callType.status)}`}>
                          {callType.status === 'Active' ? 'Aktiivinen' :
                           callType.status === 'Inactive' ? 'Ei aktiivinen' :
                           'Tuntematon'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">
                        {callType.agent_name || '-'}
                      </td>
                      <td className="p-3">
                        <button
                          className="py-1.5 px-3 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
            Ei puhelutyyppejä
          </div>
        )}
      </div>

      {editingCallType && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
          onClick={onCancel}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {callTypes.find(ct => ct.id === editingCallType)?.name || 'Puhelutyyppi'}
              </h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nimi:</label>
                  <input
                    type="text"
                    value={callTypeEditValues.name || ''}
                    onChange={(e) => onEditValueChange('name', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Puhelutyypin nimi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agentti:</label>
                  <input
                    type="text"
                    value={callTypeEditValues.agent_name || ''}
                    onChange={(e) => onEditValueChange('agent_name', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Agentin nimi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kohderyhmä:</label>
                  <input
                    type="text"
                    value={callTypeEditValues.target_audience || ''}
                    onChange={(e) => onEditValueChange('target_audience', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Kohderyhmä..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Identiteetti:</label>
                  <textarea
                    value={callTypeEditValues.identity || ''}
                    onChange={(e) => onEditValueChange('identity', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Identiteetti..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tyyli:</label>
                  <textarea
                    value={callTypeEditValues.style || ''}
                    onChange={(e) => onEditValueChange('style', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Tyyli..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ohjeistus:</label>
                  <textarea
                    value={callTypeEditValues.guidelines || ''}
                    onChange={(e) => onEditValueChange('guidelines', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Ohjeistus..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tavoitteet:</label>
                  <textarea
                    value={callTypeEditValues.goals || ''}
                    onChange={(e) => onEditValueChange('goals', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Tavoitteet..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yhteenveto:</label>
                  <textarea
                    value={callTypeEditValues.summary || ''}
                    onChange={(e) => onEditValueChange('summary', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Yhteenveto..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Onnistumisen arviointi:</label>
                  <textarea
                    value={callTypeEditValues.success_assessment || ''}
                    onChange={(e) => onEditValueChange('success_assessment', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Onnistumisen arviointi..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Toimenpide:</label>
                  <textarea
                    value={callTypeEditValues.action || ''}
                    onChange={(e) => onEditValueChange('action', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[80px]"
                    data-auto-resize="true"
                    rows="3"
                    placeholder="Toimenpide..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Avauslause:</label>
                  <textarea
                    value={callTypeEditValues.first_line || ''}
                    onChange={(e) => onEditValueChange('first_line', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[60px]"
                    data-auto-resize="true"
                    rows="2"
                    placeholder="Avauslause..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ensimmäinen SMS:</label>
                  <textarea
                    value={callTypeEditValues.first_sms || ''}
                    onChange={(e) => onEditValueChange('first_sms', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[60px]"
                    data-auto-resize="true"
                    rows="2"
                    placeholder="Ensimmäinen SMS..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Esittely:</label>
                  <textarea
                    value={callTypeEditValues.intro || ''}
                    onChange={(e) => onEditValueChange('intro', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px]"
                    data-auto-resize="true"
                    rows="4"
                    placeholder="Esittely..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kysymykset:</label>
                  <textarea
                    value={callTypeEditValues.questions || ''}
                    onChange={(e) => onEditValueChange('questions', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[120px]"
                    data-auto-resize="true"
                    rows="5"
                    placeholder="Kysymykset..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lopetus:</label>
                  <textarea
                    value={callTypeEditValues.outro || ''}
                    onChange={(e) => onEditValueChange('outro', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[60px]"
                    data-auto-resize="true"
                    rows="2"
                    placeholder="Lopetus..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMS puhelun jälkeen:</label>
                  <textarea
                    value={callTypeEditValues.after_call_sms || ''}
                    onChange={(e) => onEditValueChange('after_call_sms', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[60px]"
                    data-auto-resize="true"
                    rows="2"
                    placeholder="SMS puhelun jälkeen..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SMS vastaamattomasta puhelusta:</label>
                  <textarea
                    value={callTypeEditValues.missed_call_sms || ''}
                    onChange={(e) => onEditValueChange('missed_call_sms', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[60px]"
                    data-auto-resize="true"
                    rows="2"
                    placeholder="SMS vastaamattomasta puhelusta..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Muistiinpanot:</label>
                  <textarea
                    value={callTypeEditValues.notes || ''}
                    onChange={(e) => onEditValueChange('notes', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[100px]"
                    data-auto-resize="true"
                    rows="4"
                    placeholder="Muistiinpanot..."
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
