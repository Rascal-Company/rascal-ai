import React from 'react'
import Button from '../Button'

const ModalActions = ({
  onClose,
  loading,
  disabled,
  fileInputRef,
  t
}) => {
  const handleClose = () => {
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClose()
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        type="button"
        onClick={handleClose}
        className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-all font-sans"
      >
        {t('ui.buttons.cancel')}
      </button>
      <button
        type="submit"
        disabled={loading || disabled}
        className="px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2 min-w-[120px]"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            {t('ui.buttons.saving')}
          </>
        ) : t('ui.buttons.save')}
      </button>
    </div>
  )
}

export default ModalActions

