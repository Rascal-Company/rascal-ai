import React from 'react'

const CaptionEditor = ({
  caption,
  onChange,
  placeholder = "Kirjoita postauksen kuvaus...",
  maxLength = 2000,
  height = '400px',
  t
}) => {
  const isOverLimit = caption.length > maxLength

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('keskenModal.postLabel')}</label>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${isOverLimit ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
          }`}>
          {caption.length} / {maxLength}
        </span>
      </div>
      <div className="relative group overflow-hidden rounded-3xl border border-gray-100 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all bg-gray-50/30" style={{ height }}>
        <textarea
          name="caption"
          value={caption}
          onChange={onChange}
          className="w-full h-full p-5 bg-transparent resize-none outline-none text-sm font-medium text-gray-700 leading-relaxed placeholder:text-gray-300"
          placeholder={placeholder}
        />
        {isOverLimit && (
          <div className="absolute inset-x-0 bottom-0 py-2 px-4 bg-red-50 text-red-600 text-[10px] font-bold border-t border-red-100 animate-in slide-in-from-bottom-full">
            {t('keskenModal.errors.captionTooLong')}
          </div>
        )}
      </div>
    </div>
  )
}

export default CaptionEditor

