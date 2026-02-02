import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const ExportCallLogsModal = ({ isOpen, onClose, callLogs, formatDuration, onSuccess, onError }) => {
  const [exportFields, setExportFields] = useState({
    customer_name: true,
    phone_number: true,
    email: true,
    call_type: true,
    call_date: true,
    answered: true,
    wants_contact: false,
    direction: true,
    duration: true,
    call_status: true,
    summary: true,
    transcript: true,
    call_outcome: true,
    campaign_id: false,
    new_campaign_id: false,
    vap_call_id: false,
    price: false,
    crm_id: false
  })

  const exportToCSV = () => {
    try {
      const logs = Array.isArray(callLogs) ? callLogs : []
      if (!logs.length) {
        if (onError) onError('Ei puheluja exportattavaksi!')
        return
      }

      // Valitse valitut kentät
      const selectedFields = Object.entries(exportFields)
        .filter(([_, selected]) => selected)
        .map(([field, _]) => field)

      if (selectedFields.length === 0) {
        if (onError) onError('Valitse vähintään yksi kenttä exportattavaksi!')
        return
      }

      // Määritä kenttien nimet suomeksi
      const fieldLabels = {
        customer_name: 'Nimi',
        phone_number: 'Puhelinnumero',
        email: 'Sähköposti',
        call_type: 'Puhelun tyyppi',
        call_date: 'Päivämäärä',
        answered: 'Vastattu',
        wants_contact: 'Yhteydenotto',
        direction: 'Suunta',
        duration: 'Kesto',
        call_status: 'Tila',
        summary: 'Yhteenveto',
        transcript: 'Transkripti',
        call_outcome: 'Puhelun tulos',
        campaign_id: 'Kampanja ID (vanha)',
        new_campaign_id: 'Kampanja ID',
        vap_call_id: 'VAPI Call ID',
        price: 'Hinta',
        crm_id: 'CRM ID'
      }

      // Luo CSV headerit
      const headers = selectedFields.map(field => fieldLabels[field] || field)

      // Helper-funktio kentän arvon muuntamiseen
      const formatFieldValue = (log, field) => {
        let value = ''
        
        switch (field) {
          case 'customer_name':
            value = log.customer_name || ''
            break
          case 'phone_number':
            value = log.phone_number || ''
            break
          case 'email':
            value = log.email || ''
            break
          case 'call_type':
            value = log.call_type || ''
            break
          case 'call_date':
            value = log.call_date 
              ? new Date(log.call_date).toLocaleDateString('fi-FI') + ' ' + (log.call_time ? log.call_time : new Date(log.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }))
              : ''
            break
          case 'answered':
            value = log.answered ? 'Kyllä' : 'Ei'
            break
          case 'wants_contact':
            value = log.wants_contact === true ? 'Otetaan yhteyttä' : 
                    log.wants_contact === false ? 'Ei oteta yhteyttä' : 'Ei määritelty'
            break
          case 'direction':
            value = log.direction === 'outbound' ? 'Lähtenyt' : 'Vastaanotettu'
            break
          case 'duration':
            value = log.duration ? formatDuration(log.duration) : ''
            break
          case 'call_status':
            value = (log.call_date && log.call_time) ? 'Ajastettu' : 
                    (log.call_status === 'done' && log.call_outcome === 'cancelled') ? 'Peruttu' :
                    (log.call_status === 'done' && log.call_outcome === 'voice mail') ? 'Vastaaja' :
                    log.call_status === 'done' && log.answered ? 'Onnistui' : 
                    log.call_status === 'done' && !log.answered ? 'Epäonnistui' :
                    log.call_status === 'pending' ? 'Aikataulutettu' : 
                    log.call_status === 'in progress' ? 'Jonossa' : 
                    'Tuntematon'
            break
          case 'summary':
            value = log.summary || ''
            break
          case 'transcript':
            value = log.transcript || log.call_transcript || ''
            break
          case 'call_outcome':
            value = log.call_outcome || ''
            break
          case 'campaign_id':
            value = log.campaign_id || ''
            break
          case 'new_campaign_id':
            value = log.new_campaign_id || ''
            break
          case 'vap_call_id':
            value = log.vapi_call_id || ''
            break
          case 'price':
            value = log.price || ''
            break
          case 'crm_id':
            value = log.crm_id || ''
            break
          default:
            value = log[field] || ''
        }
        
        // Escapoi CSV-merkinnät
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""').replace(/[\r\n]+/g, ' ')}"`
        }
        return stringValue
      }

      // Luo CSV rivit
      const csvRows = logs.map(log => {
        return selectedFields.map(field => formatFieldValue(log, field))
      })

      // Yhdistä CSV
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n')

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `puheluloki_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onClose()
      if (onSuccess) onSuccess(`Exportattu ${logs.length} puhelua CSV-muodossa!`)
    } catch (error) {
      console.error('Export epäonnistui:', error)
      if (onError) onError('Export epäonnistui: ' + error.message)
    }
  }

  if (!isOpen) {
    return null
  }

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="modal-container export-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '800px', width: '90%' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Export CSV</h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content" style={{ padding: '24px 32px' }}>
          <div className="export-info">
            <p style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '14px', fontWeight: '500' }}>
              Valitse kentät, jotka halutaan sisällyttää CSV-tiedostoon
            </p>
            <p style={{ margin: '0', color: '#6b7280', fontSize: '13px' }}>
              Exportataan <strong>{callLogs.length}</strong> puhelua (filtteröidyt tulokset)
            </p>
          </div>
          
          <div className="export-fields-container">
            {/* Perustiedot */}
            <div className="export-field-group">
              <div className="export-field-group-header">
                <h3 className="export-field-group-title">Perustiedot</h3>
                <button
                  type="button"
                  className="export-select-all-btn"
                  onClick={() => {
                    const basicFields = ['customer_name', 'phone_number', 'email', 'call_type', 'call_date']
                    const allSelected = basicFields.every(field => exportFields[field])
                    setExportFields(prev => {
                      const updated = { ...prev }
                      basicFields.forEach(field => {
                        updated[field] = !allSelected
                      })
                      return updated
                    })
                  }}
                >
                  {['customer_name', 'phone_number', 'email', 'call_type', 'call_date'].every(field => exportFields[field]) ? 'Poista kaikki' : 'Valitse kaikki'}
                </button>
              </div>
              <div className="export-fields-grid">
                {[
                  { key: 'customer_name', label: 'Nimi' },
                  { key: 'phone_number', label: 'Puhelinnumero' },
                  { key: 'email', label: 'Sähköposti' },
                  { key: 'call_type', label: 'Puhelun tyyppi' },
                  { key: 'call_date', label: 'Päivämäärä' }
                ].map(field => (
                  <label key={field.key} className="export-field-checkbox">
                    <input
                      type="checkbox"
                      checked={exportFields[field.key]}
                      onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Puhelun tiedot */}
            <div className="export-field-group">
              <div className="export-field-group-header">
                <h3 className="export-field-group-title">Puhelun tiedot</h3>
                <button
                  type="button"
                  className="export-select-all-btn"
                  onClick={() => {
                    const callFields = ['answered', 'wants_contact', 'direction', 'duration', 'call_status', 'call_outcome']
                    const allSelected = callFields.every(field => exportFields[field])
                    setExportFields(prev => {
                      const updated = { ...prev }
                      callFields.forEach(field => {
                        updated[field] = !allSelected
                      })
                      return updated
                    })
                  }}
                >
                  {['answered', 'wants_contact', 'direction', 'duration', 'call_status', 'call_outcome'].every(field => exportFields[field]) ? 'Poista kaikki' : 'Valitse kaikki'}
                </button>
              </div>
              <div className="export-fields-grid">
                {[
                  { key: 'answered', label: 'Vastattu' },
                  { key: 'wants_contact', label: 'Yhteydenotto' },
                  { key: 'direction', label: 'Suunta' },
                  { key: 'duration', label: 'Kesto' },
                  { key: 'call_status', label: 'Tila' },
                  { key: 'call_outcome', label: 'Puhelun tulos' }
                ].map(field => (
                  <label key={field.key} className="export-field-checkbox">
                    <input
                      type="checkbox"
                      checked={exportFields[field.key]}
                      onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Sisältö */}
            <div className="export-field-group">
              <div className="export-field-group-header">
                <h3 className="export-field-group-title">Sisältö</h3>
                <button
                  type="button"
                  className="export-select-all-btn"
                  onClick={() => {
                    const contentFields = ['summary', 'transcript']
                    const allSelected = contentFields.every(field => exportFields[field])
                    setExportFields(prev => {
                      const updated = { ...prev }
                      contentFields.forEach(field => {
                        updated[field] = !allSelected
                      })
                      return updated
                    })
                  }}
                >
                  {['summary', 'transcript'].every(field => exportFields[field]) ? 'Poista kaikki' : 'Valitse kaikki'}
                </button>
              </div>
              <div className="export-fields-grid">
                {[
                  { key: 'summary', label: 'Yhteenveto' },
                  { key: 'transcript', label: 'Transkripti' }
                ].map(field => (
                  <label key={field.key} className="export-field-checkbox">
                    <input
                      type="checkbox"
                      checked={exportFields[field.key]}
                      onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Muut */}
            <div className="export-field-group">
              <div className="export-field-group-header">
                <h3 className="export-field-group-title">Muut</h3>
                <button
                  type="button"
                  className="export-select-all-btn"
                  onClick={() => {
                    const otherFields = ['campaign_id', 'new_campaign_id', 'vap_call_id', 'price', 'crm_id']
                    const allSelected = otherFields.every(field => exportFields[field])
                    setExportFields(prev => {
                      const updated = { ...prev }
                      otherFields.forEach(field => {
                        updated[field] = !allSelected
                      })
                      return updated
                    })
                  }}
                >
                  {['campaign_id', 'new_campaign_id', 'vap_call_id', 'price', 'crm_id'].every(field => exportFields[field]) ? 'Poista kaikki' : 'Valitse kaikki'}
                </button>
              </div>
              <div className="export-fields-grid">
                {[
                  { key: 'campaign_id', label: 'Kampanja ID (vanha)' },
                  { key: 'new_campaign_id', label: 'Kampanja ID' },
                  { key: 'vap_call_id', label: 'VAPI Call ID' },
                  { key: 'price', label: 'Hinta' },
                  { key: 'crm_id', label: 'CRM ID' }
                ].map(field => (
                  <label key={field.key} className="export-field-checkbox">
                    <input
                      type="checkbox"
                      checked={exportFields[field.key]}
                      onChange={(e) => setExportFields(prev => ({ ...prev, [field.key]: e.target.checked }))}
                    />
                    <span>{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="modal-footer" style={{ 
          padding: '20px 32px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <Button 
            variant="secondary"
            onClick={onClose}
          >
            Peruuta
          </Button>
          <Button 
            variant="primary" 
            onClick={exportToCSV}
          >
            Export CSV
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ExportCallLogsModal

