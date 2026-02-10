import React, { useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

const TextEditModal = ({
    show,
    title,
    value,
    onChange,
    onSave,
    onCancel,
    placeholder,
    icon
}) => {
    const { t } = useTranslation('common')
    const textareaRef = useRef(null)

    // Focus on mount
    useEffect(() => {
        if (show && textareaRef.current) {
            textareaRef.current.focus()
        }
    }, [show])

    if (!show) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-white/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onCancel}
            />

            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-[0_32px_96px_-16px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] sm:max-h-[85vh]">

                {/* Header */}
                <div className="px-4 sm:px-8 py-4 sm:py-6 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                            {icon || (
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 leading-none">{title}</h2>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-full min-h-[200px] p-4 sm:p-6 border-2 border-gray-100 rounded-2xl text-base leading-relaxed bg-gray-50/50 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all resize-y"
                        placeholder={placeholder}
                    />
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-8 py-4 sm:py-5 border-t border-gray-50 bg-gray-50/30 flex flex-wrap justify-end gap-2 sm:gap-3 flex-shrink-0">
                    <button
                        onClick={onCancel}
                        className="px-4 sm:px-6 py-2.5 text-gray-600 hover:text-gray-900 text-sm font-bold transition-colors"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={onSave}
                        className="px-4 sm:px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-200 transition-all active:scale-95"
                    >
                        {t('common.save')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}

export default TextEditModal
