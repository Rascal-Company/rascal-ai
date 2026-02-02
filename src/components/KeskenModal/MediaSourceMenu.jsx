import React from 'react'
import { useTranslation } from 'react-i18next'

const MediaSourceMenu = ({
  show,
  onSelectKuvapankki,
  onSelectKoneelta
}) => {
  const { t } = useTranslation('common')
  if (!show) return null

  return (
    <div className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 py-2 min-w-[200px] z-[100] animate-in slide-in-from-bottom-2 fade-in duration-200">
      <button
        type="button"
        onClick={onSelectKuvapankki}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
      >
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
        </div>
        <span className="text-sm font-bold text-gray-700">{t('keskenModal.mediaSource.selectFromImageBank')}</span>
      </button>
      <div className="mx-2 h-px bg-gray-50 my-1" />
      <button
        type="button"
        onClick={onSelectKoneelta}
        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 group"
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
        </div>
        <span className="text-sm font-bold text-gray-700">{t('keskenModal.mediaSource.selectFromDevice')}</span>
      </button>
    </div>
  )
}

export default MediaSourceMenu
