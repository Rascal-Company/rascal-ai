import React from 'react'
import { useTranslation } from 'react-i18next'

const MonthlyStrategyCard = ({
    month,
    strategy,
    status,
    isApproved,
    createdAt,
    onEdit,
    onApprove,
    getStatusColor,
    getStatusText
}) => {
    const { t, i18n } = useTranslation('common')

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
            {/* Header with Status Badges */}
            <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-br from-gray-50/50 to-white flex items-center justify-between flex-shrink-0">
                <h3 className="text-sm font-bold text-gray-900">
                    {month}
                </h3>
                <div className="flex items-center gap-2">
                    <div
                        className="text-white py-0.5 px-2 rounded-full text-[9px] font-bold uppercase tracking-wider"
                        style={{ background: getStatusColor(status) }}
                    >
                        {getStatusText(status)}
                    </div>
                    <div
                        className={`text-white py-0.5 px-2 rounded-full text-[9px] font-bold uppercase tracking-wider ${isApproved ? 'bg-green-500' : 'bg-amber-500'
                            }`}
                    >
                        {isApproved ? t('strategy.status.approved') : t('strategy.status.pending')}
                    </div>
                </div>
            </div>

            {/* Strategy Content */}
            <div className="flex-1 p-4 min-h-[120px]">
                <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {strategy}
                </div>
            </div>

            {/* Footer with Date and Actions */}
            <div className="px-4 py-3 border-t border-gray-50 bg-gray-50/30 flex items-center justify-between flex-shrink-0">
                <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(createdAt).toLocaleDateString(
                        i18n.language === 'fi' ? 'fi-FI' : 'en-US'
                    )}
                </span>
                <div className="flex items-center gap-2">
                    {!isApproved && (
                        <button
                            onClick={onApprove}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                        >
                            {t('strategy.buttons.approveStrategy')}
                        </button>
                    )}
                    <button
                        onClick={onEdit}
                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        {t('strategy.buttons.edit')}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default MonthlyStrategyCard
