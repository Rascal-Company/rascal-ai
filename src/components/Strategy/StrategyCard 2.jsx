import React from 'react'
import { useTranslation } from 'react-i18next'

const StrategyCard = ({
    title,
    icon,
    content,
    isEmpty,
    emptyText,
    onEdit,
    onCreate,
    onClick,
    isClickable = false
}) => {
    const { t } = useTranslation('common')

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-[280px]">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-br from-gray-50/50 to-white flex-shrink-0">
                <h3 className="text-xs font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                    {icon && <span className="text-base">{icon}</span>}
                    {title}
                </h3>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 min-h-0 overflow-hidden">
                {isEmpty ? (
                    <div className="flex flex-col items-center justify-center text-center h-full">
                        <p className="text-xs font-medium text-gray-500 max-w-[150px]">
                            {emptyText}
                        </p>
                    </div>
                ) : (
                    <div
                        className={`text-xs text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-[10] ${isClickable ? 'cursor-pointer hover:text-gray-900 transition-colors' : ''
                            }`}
                        onClick={isClickable ? onClick : undefined}
                        title={isClickable ? 'Klikkaa nähdäksesi koko sisältö' : ''}
                    >
                        {content}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/30 flex justify-end flex-shrink-0">
                {isEmpty ? (
                    <button
                        onClick={onCreate}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        {t('strategy.buttons.create')}
                    </button>
                ) : (
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        {t('strategy.buttons.edit')}
                    </button>
                )}
            </div>
        </div>
    )
}

export default StrategyCard
