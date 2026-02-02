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
  const getStatusStyle = (status) => {
    switch (status) {
      case 'Current':
        return 'bg-green-100 text-green-800'
      case 'Upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {strategies.length > 0 ? (
          strategies.map(strategy => (
            <div key={strategy.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-gray-800 truncate">
                    {strategy.month || strategy.planner || 'Strategia'}
                  </h3>
                  <span className={`py-1 px-2.5 rounded-full text-xs font-medium flex-shrink-0 ${getStatusStyle(strategy.status)}`}>
                    {strategy.status === 'Current' ? 'Nykyinen' :
                     strategy.status === 'Upcoming' ? 'Tuleva' :
                     'Vanha'}
                  </span>
                </div>
              </div>
              <div className="p-5">
                {strategy.strategy ? (
                  <p className="text-sm text-gray-600 mb-4">
                    {strategy.strategy.length > 150
                      ? strategy.strategy.substring(0, 150) + '...'
                      : strategy.strategy}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 italic mb-4">Ei strategiaa</p>
                )}
              </div>
              <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {new Date(strategy.created_at).toLocaleDateString('fi-FI')}
                </span>
                <button
                  className="py-2 px-4 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
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
          <div className="col-span-full text-center py-12 text-gray-500">
            Ei strategioita
          </div>
        )}
      </div>

      {editingStrategy && createPortal(
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9998] p-4"
          onClick={onCancel}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {strategies.find(s => s.id === editingStrategy)?.month ||
                 strategies.find(s => s.id === editingStrategy)?.planner ||
                 'Strategia'}
              </h2>
              <button
                className="text-gray-500 bg-gray-100 border border-gray-200 cursor-pointer p-2 rounded-lg transition-all duration-200 w-9 h-9 flex items-center justify-center hover:bg-gray-200 hover:text-gray-700 active:scale-95 text-xl"
                onClick={onCancel}
                disabled={isSaving}
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                <select
                  value={strategyEditValues.status || 'Current'}
                  onChange={(e) => onEditValueChange('status', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Current">Nykyinen</option>
                  <option value="Upcoming">Tuleva</option>
                  <option value="Old">Vanha</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Strategia:</label>
                <textarea
                  value={strategyEditValues.strategy || ''}
                  onChange={(e) => onEditValueChange('strategy', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[300px]"
                  rows="12"
                  placeholder="Strategia..."
                />
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
