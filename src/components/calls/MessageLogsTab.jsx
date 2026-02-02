import React from 'react'
import Button from '../Button'
import { useTranslation } from 'react-i18next'

function getTypeBadgeClass(type) {
  switch (type) {
    case 'sms': return 'msglogs-badge sms'
    case 'whatsapp': return 'msglogs-badge whatsapp'
    case 'email': return 'msglogs-badge email'
    default: return 'msglogs-badge'
  }
}

function getDirectionBadgeClass(direction) {
  return direction === 'outbound' ? 'msglogs-badge outbound' : 'msglogs-badge inbound'
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'sent': return 'msglogs-status-badge sent'
    case 'delivered': return 'msglogs-status-badge delivered'
    case 'read': return 'msglogs-status-badge read'
    case 'failed': return 'msglogs-status-badge failed'
    case 'pending': return 'msglogs-status-badge pending'
    default: return 'msglogs-status-badge'
  }
}

export default function MessageLogsTab({
  fetchMessageLogs,
  loadingMessageLogs,
  messageLogsError,
  messageLogs
}) {
  const { t, i18n } = useTranslation('common')

  const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-US'

  return (
    <div className="card-container p-8 w-full">
      <div className="msglogs-header">
        <h2 className="msglogs-title">
          {t('calls.tabs.messages')}
        </h2>
        <div className="msglogs-actions">
          <Button
            type="button"
            onClick={() => fetchMessageLogs()}
            disabled={loadingMessageLogs}
            variant={loadingMessageLogs ? 'secondary' : 'primary'}
          >
            {loadingMessageLogs ? t('calls.messagesTab.buttons.refreshing') : t('calls.messagesTab.buttons.refresh')}
          </Button>
        </div>
      </div>

      {messageLogsError && (
        <div className="msglogs-error">
          {messageLogsError}
        </div>
      )}

      <div>
        <div className="msglogs-section-header">
          <h3 className="msglogs-section-title">
            {t('calls.messagesTab.history.title')}
          </h3>
          {messageLogs.length > 0 && (
            <div className="msglogs-count">
              {t('calls.messagesTab.history.showingCount', { count: messageLogs.length })}
            </div>
          )}
        </div>

        {loadingMessageLogs ? (
          <div className="msglogs-empty">
            {t('calls.messagesTab.loading')}
          </div>
        ) : messageLogs.length === 0 ? (
          <div className="msglogs-empty">
            {t('calls.messagesTab.empty')}
          </div>
        ) : (
          <div className="msglogs-table-wrapper">
            <table className="msglogs-table">
              <thead>
                <tr>
                  <th>{t('calls.messagesTab.table.phone')}</th>
                  <th>{t('calls.messagesTab.table.type')}</th>
                  <th>{t('calls.messagesTab.table.direction')}</th>
                  <th>{t('calls.messagesTab.table.status')}</th>
                  <th>{t('calls.messagesTab.table.aiText')}</th>
                  <th>{t('calls.messagesTab.table.customerText')}</th>
                  <th>{t('calls.messagesTab.table.date')}</th>
                </tr>
              </thead>
              <tbody>
                {messageLogs.map((log, index) => (
                  <tr key={log.id || index}>
                    <td className="phone">{log.phone_number || '-'}</td>
                    <td>
                      <span className={getTypeBadgeClass(log.message_type)}>
                        {log.message_type === 'sms' ? 'SMS' : log.message_type === 'whatsapp' ? 'WhatsApp' : log.message_type === 'email' ? 'Email' : log.message_type}
                      </span>
                    </td>
                    <td>
                      <span className={getDirectionBadgeClass(log.direction)}>
                        {log.direction === 'outbound' ? t('calls.messagesTab.direction.outbound') : t('calls.messagesTab.direction.inbound')}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className={getStatusBadgeClass(log.status)}>
                        {log.status === 'sent' ? t('calls.messagesTab.status.sent') :
                         log.status === 'delivered' ? t('calls.messagesTab.status.delivered') :
                         log.status === 'read' ? t('calls.messagesTab.status.read') :
                         log.status === 'failed' ? t('calls.messagesTab.status.failed') :
                         log.status === 'pending' ? t('calls.messagesTab.status.pending') : log.status}
                      </span>
                    </td>
                    <td className="text">
                      {log.ai_text ? (log.ai_text.length > 50 ? log.ai_text.substring(0, 50) + '...' : log.ai_text) : '-'}
                    </td>
                    <td className="text">
                      {log.customer_text ? (log.customer_text.length > 50 ? log.customer_text.substring(0, 50) + '...' : log.customer_text) : '-'}
                    </td>
                    <td>
                      {log.created_at ? new Date(log.created_at).toLocaleDateString(locale) + ' ' + new Date(log.created_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
