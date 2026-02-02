import React, { useEffect, useMemo, useState, memo } from 'react'
import { createPortal } from 'react-dom'
import Button from '../Button'
import { supabase } from '../../lib/supabase'

function CallDetailModal({
  selectedLog,
  loading,
  onClose,
  onBackgroundClick,
  formatDuration,
  detailActiveTab,
  setDetailActiveTab,
  showMoreDetails,
  setShowMoreDetails
}) {
  useEffect(() => {
    setDetailActiveTab && setDetailActiveTab('summary')
    setShowMoreDetails && setShowMoreDetails(false)
  }, [])

  if (!selectedLog) return null

  const displayName = useMemo(() => selectedLog.customer_name || 'Human', [selectedLog.customer_name])
  const displayPhone = selectedLog.phone_number
  const formattedDate = useMemo(() => {
    if (!selectedLog.call_date) return '-'
    try {
      const d = new Date(selectedLog.call_date)
      return d.toLocaleDateString('fi-FI') + ' ' + d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '-'
    }
  }, [selectedLog.call_date])

  // Pre-prosessoidaan transkripti kerran
  const transcriptMessages = useMemo(() => {
    const raw = selectedLog.transcript
    if (!raw) return []
    // JSON → array
    try {
      const parsed = JSON.parse(raw)
      const arr = Array.isArray(parsed) ? parsed : parsed?.messages
      if (Array.isArray(arr)) {
        return arr.map((m) => {
          const role = String(m.role || m.speaker || '').toLowerCase()
          const isBot = role.includes('bot') || role.includes('assistant') || role.includes('agent')
          return { isBot, text: m.text || m.content || '' }
        })
      }
    } catch {}
    // Plain text → rivikohtaisesti
    return String(raw)
      .split(/\n+/)
      .filter(Boolean)
      .map((line) => {
        const lower = line.toLowerCase()
        const isBot = lower.startsWith('bot:') || lower.startsWith('assistant:') || lower.startsWith('agent:')
        const text = line.replace(/^\w+:\s*/, '')
        return { isBot, text }
      })
  }, [selectedLog.transcript])

  // Tarkista onko äänitiedosto saatavilla
  const hasAudioFile = useMemo(() => {
    const recordingUrl = selectedLog.recording_url
    if (!recordingUrl) return false
    
    // Käsittele sekä array että JSON string -muotoja
    let urls = []
    if (Array.isArray(recordingUrl)) {
      urls = recordingUrl
    } else if (typeof recordingUrl === 'string') {
      try {
        // Yritä parsia JSON string
        const parsed = JSON.parse(recordingUrl)
        if (Array.isArray(parsed)) {
          urls = parsed
        } else {
          urls = [recordingUrl] // Jos ei ole array, käsittele stringinä
        }
      } catch {
        urls = [recordingUrl] // Jos JSON parsing epäonnistuu, käsittele stringinä
      }
    }
    
    return urls.some(url => {
      if (!url || typeof url !== 'string') return false
      const lowerUrl = url.toLowerCase()
      return lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.m4a') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mp4')
    })
  }, [selectedLog.recording_url])

  // Hae ensimmäinen äänitiedosto
  const audioUrl = useMemo(() => {
    if (!hasAudioFile) return null
    const recordingUrl = selectedLog.recording_url
    
    // Käsittele sekä array että JSON string -muotoja
    let urls = []
    if (Array.isArray(recordingUrl)) {
      urls = recordingUrl
    } else if (typeof recordingUrl === 'string') {
      try {
        // Yritä parsia JSON string
        const parsed = JSON.parse(recordingUrl)
        if (Array.isArray(parsed)) {
          urls = parsed
        } else {
          urls = [recordingUrl] // Jos ei ole array, käsittele stringinä
        }
      } catch {
        urls = [recordingUrl] // Jos JSON parsing epäonnistuu, käsittele stringinä
      }
    }
    
    return urls.find(url => {
      if (!url || typeof url !== 'string') return false
      const lowerUrl = url.toLowerCase()
      return lowerUrl.includes('.mp3') || lowerUrl.includes('.wav') || lowerUrl.includes('.m4a') || lowerUrl.includes('.ogg') || lowerUrl.includes('.mp4')
    })
  }, [selectedLog.recording_url, hasAudioFile])

  // Lataa äänitiedosto Supabase Storage:sta
  const [audioBlobUrl, setAudioBlobUrl] = useState(null)
  const [audioLoading, setAudioLoading] = useState(false)

  useEffect(() => {
    if (!hasAudioFile || !audioUrl) {
      setAudioBlobUrl(null)
      return
    }

    const downloadAudio = async () => {
      try {
        setAudioLoading(true)
        
        // Tarkista onko URL Supabase Storage authenticated URL
        if (audioUrl.includes('/storage/v1/object/authenticated/')) {
          // Pura bucket ja file path URL:ista
          const urlParts = audioUrl.split('/storage/v1/object/authenticated/')
          if (urlParts.length === 2) {
            const pathParts = urlParts[1].split('/')
            const bucket = pathParts[0]
            const filePath = pathParts.slice(1).join('/')
            
            // Lataa tiedosto Supabase Storage:sta
            const { data, error } = await supabase.storage
              .from(bucket)
              .download(filePath)
            
            if (error) {
              console.error('Error downloading audio:', error)
              return
            }
            
            // Luo blob URL
            const blobUrl = URL.createObjectURL(data)
            setAudioBlobUrl(blobUrl)
          }
        } else {
          // Jos ei ole Supabase Storage URL, käytä suoraan
          setAudioBlobUrl(audioUrl)
        }
      } catch (error) {
        console.error('Error processing audio:', error)
      } finally {
        setAudioLoading(false)
      }
    }

    downloadAudio()

    // Cleanup blob URL kun komponentti unmountataan
    return () => {
      if (audioBlobUrl && audioBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioBlobUrl)
      }
    }
  }, [hasAudioFile, audioUrl, supabase])

  // Renderöidään transkripti paginoiden, jotta avaus ja scroll on nopea
  const [transcriptLimit, setTranscriptLimit] = useState(200)
  useEffect(() => {
    setTranscriptLimit(200)
  }, [selectedLog.transcript, detailActiveTab])
  return createPortal(
    <div 
      onClick={onBackgroundClick}
      className="modal-overlay modal-overlay--dark"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="modal-container call-detail-modal"
      >
        {/* Close button only in absolute top-right */}
        <div className="call-detail-close-wrapper">
          <Button
            onClick={onClose}
            variant="secondary"
            className="modal-close-btn call-detail-overlay-dark"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </Button>
        </div>

        {/* Header */}
        <div className="call-detail__header call-detail-header">
          <h2 className="call-detail-title">Puhelun tiedot</h2>
          <div className="call-detail-subtitle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <span className="call-detail-name">{selectedLog.customer_name || selectedLog.phone_number || '-'}</span>
            {selectedLog.customer_name && (
              <span className="call-detail-phone">· {selectedLog.phone_number || '-'}</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="call-detail-body">
          {/* Basic Info */}
          <div className="call-detail__basics call-detail-section">
            <div className="call-detail-section-header">
              <h3 className="call-detail-section-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                Perustiedot
              </h3>
              <button
                onClick={() => setShowMoreDetails(v => !v)}
                className="call-detail-toggle-btn"
              >
                {showMoreDetails ? 'Piilota lisätiedot' : 'Näytä lisätiedot'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">{showMoreDetails ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}</svg>
              </button>
            </div>

            {/* Always visible: Name & Phone */}
            <div className="call-detail-grid">
              <div className="call-detail-info-card">
                <div className="call-detail-info-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/></svg>
                  Nimi
                </div>
                <div className="call-detail-info-value">{selectedLog.customer_name || 'Ei nimeä'}</div>
              </div>

              <div className="call-detail-info-card">
                <div className="call-detail-info-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Puhelinnumero
                </div>
                <div className="call-detail-info-value">{selectedLog.phone_number || '-'}</div>
              </div>
            </div>

            {/* Status & Duration */}
            <div className="call-detail-grid">
              <div className="call-detail-info-card">
                <div className="call-detail-info-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                  Vastattu
                </div>
                <div className="call-detail-flex-row">
                  <div className={`call-detail-status-dot ${selectedLog.answered ? 'success' : 'error'}`} />
                  <span className={`call-detail-status-text ${selectedLog.answered ? 'success' : 'error'}`}>{selectedLog.answered ? 'Kyllä' : 'Ei'}</span>
                </div>
              </div>

              <div className="call-detail-info-card">
                <div className="call-detail-info-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Kesto
                </div>
                <div className="call-detail-info-value">{selectedLog.duration ? formatDuration(selectedLog.duration) : '-'}</div>
              </div>
            </div>

            {/* Expandable details */}
            {showMoreDetails && (
              <div className="call-detail-grid">
                <div className="call-detail-info-card">
                  <div className="call-detail-info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                    Sähköposti
                  </div>
                  <div className={`call-detail-email-value ${selectedLog.email ? 'has-value' : 'empty'}`}>
                    {selectedLog.email || 'Ei sähköpostia'}
                  </div>
                </div>
                <div className="call-detail-info-card">
                  <div className="call-detail-info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Päivämäärä
                  </div>
                  <div className="call-detail-info-value">
                    {selectedLog.call_date ? new Date(selectedLog.call_date).toLocaleDateString('fi-FI') + ' ' + new Date(selectedLog.call_date).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </div>
                </div>
                <div className="call-detail-info-card">
                  <div className="call-detail-info-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                    Puhelun tyyppi
                  </div>
                  <div className="call-detail-info-value">{selectedLog.call_type || '-'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="call-detail-tabs">
            <button
              onClick={() => setDetailActiveTab('summary')}
              className={`call-detail-tab-btn ${detailActiveTab === 'summary' ? 'active' : ''}`}
            >
              Yhteenveto
            </button>
            <button
              onClick={() => setDetailActiveTab('transcript')}
              className={`call-detail-tab-btn ${detailActiveTab === 'transcript' ? 'active' : ''}`}
            >
              Transkripti
            </button>
            {hasAudioFile && (
              <button
                onClick={() => setDetailActiveTab('audio')}
                className={`call-detail-tab-btn ${detailActiveTab === 'audio' ? 'active' : ''}`}
              >
                Ääni
              </button>
            )}
          </div>

          {/* Tab content */}
          <div className="call-detail-min-height">
            {detailActiveTab === 'summary' && (
              <div className="call-detail-summary-box">
                {selectedLog.summary ? (
                  <div className="call-detail-summary-text">{selectedLog.summary}</div>
                ) : (
                  <div className="call-detail-no-summary">Ei yhteenvetoa.</div>
                )}
              </div>
            )}

            {detailActiveTab === 'transcript' && transcriptMessages.length > 0 && (
              <div className="call-detail-transcript-box">
                <div className="call-detail-messages-grid">
                  {transcriptMessages.slice(0, transcriptLimit).map((m, idx) => {
                    const bubbleStyle = {
                      padding: 12,
                      borderRadius: 12,
                      maxWidth: '80%',
                      background: m.isBot ? '#f8f5f2' : '#f3f4f6',
                      color: '#111827',
                      border: '1px solid #e2e8f0'
                    }
                    return (
                      <div key={idx} className={`call-detail-message-row ${m.isBot ? 'bot' : 'user'}`}>
                        <div style={bubbleStyle}>
                          <div className="call-detail-message-sender">
                            {m.isBot ? 'Bot' : displayName}
                          </div>
                          <div className="call-detail-message-text">{m.text}</div>
                        </div>
                      </div>
                    )
                  })}
                  {transcriptMessages.length > transcriptLimit && (
                    <div className="call-detail-load-more-wrapper">
                      <button
                        onClick={() => setTranscriptLimit(l => l + 200)}
                        className="call-detail-load-more-btn"
                      >
                        Näytä lisää ({transcriptMessages.length - transcriptLimit})
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

       {detailActiveTab === 'audio' && hasAudioFile && (
         <div className="call-detail-transcript-box">
           <div className="call-detail-audio-header">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff6600" strokeWidth="2">
               <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
               <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
             </svg>
             <div>
               <div className="call-detail-audio-title">Puhelun äänitiedosto</div>
               <div className="call-detail-no-summary">
                 {audioLoading ? 'Ladataan äänitiedostoa...' : 'Kuuntele puhelun tallenne'}
               </div>
             </div>
           </div>
           
           {audioLoading ? (
             <div className="call-detail-loading-center">
               <div className="call-detail-spinner"></div>
               Ladataan...
             </div>
           ) : audioBlobUrl ? (
             <audio
               controls
               className="call-detail-audio-player"
               preload="metadata"
             >
               <source src={audioBlobUrl} type="audio/mpeg" />
               <source src={audioBlobUrl} type="audio/wav" />
               <source src={audioBlobUrl} type="audio/mp4" />
               <source src={audioBlobUrl} type="audio/ogg" />
               <source src={audioBlobUrl} type="video/mp4" />
               Selaimesi ei tue äänitiedostojen toistoa.
             </audio>
           ) : (
             <div className="call-detail-audio-error">
               Äänitiedoston lataus epäonnistui
             </div>
           )}
         </div>
       )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default memo(CallDetailModal)
