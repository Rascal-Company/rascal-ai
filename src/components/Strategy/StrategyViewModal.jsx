import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

const StrategyViewModal = ({
    show,
    title,
    content,
    onClose,
    onEdit
}) => {
    const { t } = useTranslation('common')

    if (!show) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] sm:max-h-[85vh]">

                {/* Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none">{title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {content}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-t border-gray-50 bg-gray-50/30 flex flex-wrap justify-end gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 sm:px-6 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-bold transition-colors"
                    >
                        {t('common.close')}
                    </button>
                    <button
                        onClick={() => {
                            onClose()
                            onEdit()
                        }}
                        className="px-4 sm:px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                    >
                        {t('strategy.buttons.edit')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default StrategyViewModal
