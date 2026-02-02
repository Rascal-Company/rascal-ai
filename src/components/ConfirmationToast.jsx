import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const ConfirmationToast = ({
  show,
  message,
  onSave,
  onDiscard,
  saveLabel = 'Tallenna',
  discardLabel = 'Hylkää'
}) => {
  if (!show) return null

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[10001] flex items-center gap-4 bg-gray-800 text-white py-3 px-5 rounded-[10px] shadow-[0_10px_40px_rgba(0,0,0,0.3)] animate-[slideUp_0.2s_ease-out]">
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
      <span className="text-sm font-medium">{message}</span>
      <div className="flex gap-2">
        <Button
          onClick={onDiscard}
          variant="secondary"
          className="py-1.5 px-3.5 text-[13px] bg-gray-700 border border-gray-600 text-white"
        >
          {discardLabel}
        </Button>
        <Button
          onClick={onSave}
          className="py-1.5 px-3.5 text-[13px] bg-blue-500 border-none text-white"
        >
          {saveLabel}
        </Button>
      </div>
    </div>,
    document.body
  )
}

export default ConfirmationToast
