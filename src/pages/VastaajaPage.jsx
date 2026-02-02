import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CallDetailModal from '../components/calls/CallDetailModal'

export default function VastaajaPage() {
  const { t } = useTranslation('common')
  const { user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  // Käyttäjä ja inbound-asetukset
  const [userRecordId, setUserRecordId] = useState(null)
  const [inboundCallTypes, setInboundCallTypes] = useState([])
  const [selectedCallTypeId, setSelectedCallTypeId] = useState(null)
  const [inboundVoice, setInboundVoice] = useState('rascal-nainen-1')
  const [inboundVoiceId, setInboundVoiceId] = useState(null)
  const [inboundWelcomeMessage, setInboundWelcomeMessage] = useState('')
  const [inboundScript, setInboundScript] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsError, setSettingsError] = useState('')
  const [settingsSuccess, setSettingsSuccess] = useState('')
  const [activeSettingsTab, setActiveSettingsTab] = useState('vastaaja')
  const [assistantPhoneNumber, setAssistantPhoneNumber] = useState('')
  const [inboundSettingsId, setInboundSettingsId] = useState(null)
  const [userProfileDetails, setUserProfileDetails] = useState(null)
  const formattedAssistantNumber = useMemo(() => {
    if (!assistantPhoneNumber) return ''
    const normalized = assistantPhoneNumber.replace(/\s+/g, '')
    if (normalized.startsWith('+358')) {
      return '0' + normalized.slice(4)
    }
    if (normalized.startsWith('358')) {
      return '0' + normalized.slice(3)
    }
    return normalized
  }, [assistantPhoneNumber])
  
  // Äänen testaus
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  
  // Puheluloki
  const [callLogs, setCallLogs] = useState([])
  const [loadingCallLogs, setLoadingCallLogs] = useState(false)
  const [callLogsError, setCallLogsError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showLogDetail, setShowLogDetail] = useState(false)
  const [loadingLogDetail, setLoadingLogDetail] = useState(false)
  const [detailActiveTab, setDetailActiveTab] = useState('summary')
  const [showMoreDetails, setShowMoreDetails] = useState(false)
  
  // Äänioptiot
  const voiceOptions = [
    { value: 'rascal-nainen-1', label: 'Aurora (Nainen, Lämmin)', id: 'GGiK1UxbDRh5IRtHCTlK' },
    { value: 'rascal-nainen-2', label: 'Lumi (Nainen, Positiivinen)', id: 'bEe5jYFAF6J2nz6vM8oo' },
    { value: 'rascal-nainen-3', label: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' },
    { value: 'rascal-mies-1', label: 'Kai (Mies, Rauhallinen)', id: 'waueh7VTxMDDIYKsIaYC' },
    { value: 'rascal-mies-2', label: 'Veeti (Mies, Energinen)', id: 's6UtVF1khAck9KlohM9j' }
  ]

  // Lataa inbound-asetukset
  useEffect(() => {
    if (user) {
      initializeInboundData()
      fetchCallLogs()
    }
  }, [user])

  const applyCallType = (callType) => {
    if (!callType) return
    setSelectedCallTypeId(callType.id)
    setInboundSettingsId(callType.id)
    setInboundWelcomeMessage(callType.welcome_message || '')
    setInboundScript(callType.script || '')

    if (callType.voice_id) {
      const matchedVoice = voiceOptions.find(option => option.id === callType.voice_id || option.value === callType.voice_id)
      if (matchedVoice) {
        setInboundVoice(matchedVoice.value)
        setInboundVoiceId(matchedVoice.id)
      } else {
        setInboundVoice(voiceOptions[0].value)
        setInboundVoiceId(callType.voice_id)
      }
    } else {
      setInboundVoice(voiceOptions[0].value)
      setInboundVoiceId(voiceOptions[0].id)
    }
  }

  const fetchInboundCallTypes = async (userIdParam) => {
    const targetUserId = userIdParam || userRecordId
    if (!targetUserId) return
    setSettingsError('')

    try {
      const { data, error } = await supabase
        .from('inbound_call_types')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const callTypes = data || []
      setInboundCallTypes(callTypes)

      if (callTypes.length > 0) {
        const current = callTypes.find(item => item.id === selectedCallTypeId) || callTypes[0]
        applyCallType(current)
      } else {
        setSelectedCallTypeId(null)
        setInboundSettingsId(null)
        setInboundWelcomeMessage('')
        setInboundScript('')
      }
    } catch (error) {
      console.error('Virhe vastaajan asetusten lataamisessa:', error)
      setSettingsError('Vastaajan asetusten lataus epäonnistui')
    }
  }

  const initializeInboundData = async () => {
    setSettingsError('')
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('id, vapi_phone_number, contact_email, contact_person, company_name, vapi_inbound_assistant_id')
        .eq('auth_user_id', user.id)
        .single()

      if (error) throw error
      if (!userData?.id) return

      setUserRecordId(userData.id)
      setAssistantPhoneNumber(userData.vapi_phone_number || '')
      setUserProfileDetails({
        contact_email: userData.contact_email,
        contact_person: userData.contact_person,
        company_name: userData.company_name,
        vapi_inbound_assistant_id: userData.vapi_inbound_assistant_id
      })
      await fetchInboundCallTypes(userData.id)
    } catch (error) {
      console.error('Virhe käyttäjätietojen lataamisessa:', error)
      setSettingsError('Käyttäjätietojen haku epäonnistui')
    }
  }

  const handleSelectCallType = (callTypeId) => {
    if (!callTypeId) return
    const callType = inboundCallTypes.find(ct => ct.id === callTypeId)
    if (callType) {
      setSettingsError('')
      setSettingsSuccess('')
      applyCallType(callType)
    }
  }

  const handleVoiceChange = (voiceValue) => {
    setInboundVoice(voiceValue)
    const matchedVoice = voiceOptions.find(option => option.value === voiceValue)
    if (matchedVoice) {
      setInboundVoiceId(matchedVoice.id)
    }
  }

  const saveCallTypeSettings = async () => {
    if (!selectedCallTypeId) return

    setSavingSettings(true)
    setSettingsError('')
    setSettingsSuccess('')

    try {
      const voiceId = inboundVoiceId || voiceOptions.find(option => option.value === inboundVoice)?.id || null

      const { error: updateError } = await supabase
        .from('inbound_call_types')
        .update({
          voice_id: voiceId,
          welcome_message: inboundWelcomeMessage,
          script: inboundScript
        })
        .eq('id', selectedCallTypeId)

      if (updateError) throw updateError

      const profile = userProfileDetails || {}
      const response = await fetch('/api/calls/inbound-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          voiceId,
          script: inboundScript,
          welcomeMessage: inboundWelcomeMessage,
          userId: user.id,
          userEmail: profile.contact_email,
          userName: profile.contact_person,
          companyName: profile.company_name,
          vapiInboundAssistantId: profile.vapi_inbound_assistant_id,
          inboundSettingsId: selectedCallTypeId
        })
      })

      const result = await response.json()

      if (!response.ok && (!result?.error || !result.error.includes('N8N workflow ei ole aktiivinen'))) {
        throw new Error(result?.error || 'Asetusten lähetys epäonnistui')
      }

      setSettingsSuccess('Asetukset tallennettu onnistuneesti!')
      setTimeout(() => setSettingsSuccess(''), 3000)
      await fetchInboundCallTypes()
    } catch (error) {
      console.error('Virhe asetusten tallennuksessa:', error)
      setSettingsError('Asetusten tallennus epäonnistui: ' + (error.message || error))
    } finally {
      setSavingSettings(false)
    }
  }

  const testVoice = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
      return
    }

    const selectedVoice = voiceOptions.find(v => v.value === inboundVoice)
    if (!selectedVoice) return

    const audioFile = `/rascal-${selectedVoice.value.split('-')[1]}-${selectedVoice.value.split('-')[2]}.mp3`
    
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(audioFile)
    audioRef.current = audio
    
    audio.play()
    setIsPlaying(true)

    audio.onended = () => {
      setIsPlaying(false)
    }

    audio.onerror = () => {
      setIsPlaying(false)
      alert(t('alerts.error.audioPlaybackFailed'))
    }
  }

  const fetchCallLogs = async () => {
    setLoadingCallLogs(true)
    setCallLogsError('')

    try {
      if (!user?.id) {
        setCallLogs([])
        return
      }

      const { data: userProfile, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError || !userProfile) {
        setCallLogsError('Käyttäjää ei löytynyt')
        return
      }

      let query = supabase
        .from('call_logs')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })
        .limit(200)

      if (searchTerm) {
        // Escapetaan erikoismerkit SQL LIKE -kyselyissä (%, _, \)
        const escapedSearchTerm = searchTerm.replace(/[%_\\]/g, '\\$&')
        query = query.or(`customer_name.ilike.%${escapedSearchTerm}%,phone_number.ilike.%${escapedSearchTerm}%`)
      }

      if (dateFrom) {
        query = query.gte('call_date', dateFrom)
      }
      if (dateTo) {
        query = query.lte('call_date', dateTo)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setCallLogs(data || [])
    } catch (error) {
      console.error('Virhe puhelulokien lataamisessa:', error)
      setCallLogsError('Puhelulokien haku epäonnistui: ' + (error.message || error))
    } finally {
      setLoadingCallLogs(false)
    }
  }

  const handleSearch = () => {
    fetchCallLogs()
  }

  const clearFilters = () => {
    setSearchTerm('')
    setDateFrom('')
    setDateTo('')
    fetchCallLogs()
  }

  const fetchLogDetail = async (log) => {
    if (!log) return
    setLoadingLogDetail(true)
    setDetailActiveTab('summary')
    setShowMoreDetails(false)
    setSelectedLog(log)
    setShowLogDetail(true)
    setLoadingLogDetail(false)
  }

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        setShowLogDetail(false)
      }
    }

    if (showLogDetail) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [showLogDetail])

  const handleModalBackgroundClick = (event) => {
    if (event.target === event.currentTarget) {
      setShowLogDetail(false)
    }
  }

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed(prev => !prev)
  }

  const formatDuration = (value) => {
    if (value === null || value === undefined) return '-'
    const seconds = typeof value === 'number' ? value : parseInt(value, 10)
    if (!Number.isFinite(seconds) || Number.isNaN(seconds)) return '-'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString, timeString) => {
    if (!dateString && !timeString) return '-'
    try {
      if (dateString && timeString) {
        const iso = dateString.includes('T') ? dateString : `${dateString}T${timeString}`
        const parsed = new Date(iso)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('fi-FI') + ' ' + parsed.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
        }
      }
      if (dateString) {
        const parsed = new Date(dateString)
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toLocaleDateString('fi-FI') + ' ' + parsed.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
        }
      }
      return [dateString, timeString].filter(Boolean).join(' ') || '-'
    } catch {
      return [dateString, timeString].filter(Boolean).join(' ') || '-'
    }
  }

  const getStatusInfo = (log) => {
    if (!log) return { label: '-', className: 'pending' }
    const status = log.call_status || log.status
    const outcome = log.call_outcome
    if (status === 'done') {
      if (outcome === 'voice mail') {
        return { label: 'Vastaaja', className: 'pending' }
      }
      if (outcome === 'cancelled') {
        return { label: 'Peruttu', className: 'failed' }
      }
      return log.answered ? { label: 'Onnistunut', className: 'success' } : { label: 'Epäonnistunut', className: 'failed' }
    }
    if (status === 'pending') {
      return { label: t('strategy.status.pending'), className: 'pending' }
    }
    if (status === 'in progress') {
      return { label: 'Jonossa', className: 'pending' }
    }
    if (status === 'scheduled') {
      return { label: 'Ajastettu', className: 'pending' }
    }
    if (outcome === 'voice mail') {
      return { label: 'Vastaaja', className: 'pending' }
    }
    return { label: status || '-', className: 'pending' }
  }

  return (
    <div className="vastaaja-layout">
      {/* Sidebar - Inbound-asetukset */}
      <div className={`vastaaja-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button
          type="button"
          className={`sidebar-collapse-handle ${sidebarCollapsed ? 'collapsed' : ''}`}
          onClick={toggleSidebarCollapse}
          aria-label={sidebarCollapsed ? t('vastaaja.settings.openPanel') : t('vastaaja.settings.closePanel')}
        >
          <span>{sidebarCollapsed ? '›' : '‹'}</span>
        </button>
        <div className="sidebar-header">
          <h2>Vastaajan asetukset</h2>
          <button onClick={() => setSidebarOpen(false)} className="close-sidebar">✕</button>
        </div>

        <div className="sidebar-content">
          {inboundCallTypes.length === 0 ? (
            <div className="empty-state">Ei vastaajan asetuksia löytynyt.</div>
          ) : (
            <>
              <div className="sidebar-tabs">
                <button
                  className={`sidebar-tab ${activeSettingsTab === 'vastaaja' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveSettingsTab('vastaaja')}
                >
                  Vastaaja
                </button>
                <button
                  className={`sidebar-tab ${activeSettingsTab === 'asetukset' ? 'active' : ''}`}
                  type="button"
                  onClick={() => setActiveSettingsTab('asetukset')}
                >
                  Asetukset
                </button>
              </div>

              <div className="sidebar-tab-content">
                {activeSettingsTab === 'vastaaja' ? (
                  <>
                      <>
                        {inboundCallTypes.length > 1 && (
                          <div className="settings-section">
                            <h3>Valitse vastaaja</h3>
                            <select
                              value={selectedCallTypeId || ''}
                              onChange={(e) => handleSelectCallType(e.target.value)}
                              className="voice-select"
                            >
                              {inboundCallTypes.map((callType) => (
                                <option key={callType.id} value={callType.id}>
                                  {callType.name || 'Nimetön vastaaja'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="settings-section">
                          <h3>Ääni</h3>
                          <select
                            value={inboundVoice}
                            onChange={(e) => handleVoiceChange(e.target.value)}
                            className="voice-select"
                          >
                            {voiceOptions.map((voice) => (
                              <option key={voice.value} value={voice.value}>
                                {voice.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="settings-section">
                          <h3>Tervehdysviesti</h3>
                          <textarea
                            value={inboundWelcomeMessage}
                            onChange={(e) => setInboundWelcomeMessage(e.target.value)}
                            placeholder="Kiitos soitostasi! Olen Rascal AI vastaaja..."
                            rows={4}
                            className="settings-textarea"
                          />
                        </div>

                        <div className="settings-section">
                          <h3>Vastaajan skripti</h3>
                          <textarea
                            value={inboundScript}
                            onChange={(e) => setInboundScript(e.target.value)}
                            placeholder="Skripti joka ohjaa vastaajan toimintaa..."
                            rows={8}
                            className="settings-textarea"
                          />
                        </div>

                        {settingsError && <div className="error-message">{settingsError}</div>}
                        {settingsSuccess && <div className="success-message">{settingsSuccess}</div>}

                        <button
                          onClick={saveCallTypeSettings}
                          disabled={savingSettings || !selectedCallTypeId}
                          className="save-settings-btn"
                        >
                          {savingSettings ? t('vastaaja.settings.saving') : t('vastaaja.settings.saveSettings')}
                        </button>
                      </>
                  </>
                ) : (
                  <>
                      <>
                        <div className="settings-section">
                          <h3>Testaa ääni</h3>
                          <p className="settings-text">
                            Kuuntele vastaajan ääninäyte ja varmista, että valittu ääni sopii yrityksesi tyyliin.
                          </p>
                          <select
                            value={inboundVoice}
                            onChange={(e) => handleVoiceChange(e.target.value)}
                            className="voice-select"
                          >
                            {voiceOptions.map((voice) => (
                              <option key={voice.value} value={voice.value}>
                                {voice.label}
                              </option>
                            ))}
                          </select>
                          <button onClick={testVoice} className="test-voice-btn" type="button">
                            {isPlaying ? 'Pysäytä' : 'Kuuntele valittu ääni'}
                          </button>
                        </div>

                        <div className="settings-section">
                          <h3>Ohjeet</h3>
                          <p className="settings-text">
                            Ota vastaaja käyttöön noudattamalla seuraavia vaiheita:
                          </p>
                          <ol className="settings-instructions list-numbered">
                            <li>
                              <p className="settings-text">
                                Avaa puhelimessa valintanäppäimistö ja kirjoita seuraava koodi:
                              </p>
                              <div className="settings-code">
                                {`*004*${formattedAssistantNumber || '045_______'}#`}
                              </div>
                            </li>
                            <li>
                              <p className="settings-text">
                                Aseta soitonsiirron viive (suositus 10 sekuntia) syöttämällä:
                              </p>
                              <div className="settings-code">
                                {`*61*${formattedAssistantNumber || '045_______'}*11*10#`}
                              </div>
                              <p className="settings-text">
                                Paina <strong>soita</strong>.
                              </p>
                            </li>
                            <li>
                              Testaa toimivuus soittamalla omaan numeroosi – puhelu siirtyy automaattisesti vastaajalle.
                            </li>
                          </ol>
                          <p className="settings-text">
                            Tarvitsetko apua? Ota yhteyttä tukeen ja kerro, mitä vaihetta haluat tarkentaa.
                          </p>
                        </div>
                        <div className="settings-section">
                          <h3>Poista vastaaja käytöstä</h3>
                          <p className="settings-text">
                            Kun haluat purkaa soitonsiirron ja kytkeä vastaajan pois päältä, toimi näin:
                          </p>
                          <ol className="settings-instructions list-numbered">
                            <li>
                              <p className="settings-text">
                                Avaa puhelimessa valintanäppäimistö ja anna seuraava koodi, joka poistaa kaikki siirrot:
                              </p>
                              <div className="settings-code">
                                ##004#
                              </div>
                            </li>
                            <li>
                              <p className="settings-text">
                                Paina <strong>soita</strong> ja odota vahvistusta.
                              </p>
                            </li>
                            <li>
                              <p className="settings-text">
                                Soita lopuksi omaan numeroosi varmistaaksesi, että puhelut ohjautuvat suoraan sinulle.
                              </p>
                            </li>
                          </ol>
                          <p className="settings-text">
                            Kun haluat ottaa vastaajan uudelleen käyttöön, noudata yllä olevia käyttöönoton ohjeita.
                          </p>
                        </div>
                      </>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pääsisältö - Puheluloki */}
      <div className="vastaaja-main">
        <div className="main-header">
          <h1>Vastaajan puhelut</h1>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="open-sidebar-btn">
              Asetukset
            </button>
          )}
        </div>

        {/* Filtterit */}
        <div className="filters-section">
          <h3>Filtterit</h3>
          <div className="filters-grid">
            <div className="filter-field">
              <label>Hae</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nimi tai numero..."
              />
            </div>

            <div className="filter-field">
              <label>Alkaen</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>

            <div className="filter-field">
              <label>Asti</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={handleSearch} className="btn-primary">Hae</button>
            <button onClick={clearFilters} className="btn-secondary">Tyhjennä</button>
          </div>
        </div>

        {/* Puheluloki-taulukko */}
        <div className="call-logs-section">
          {loadingCallLogs ? (
            <div className="loading-state">Ladataan puhelulokia...</div>
          ) : callLogsError ? (
            <div className="error-state">{callLogsError}</div>
          ) : callLogs.length === 0 ? (
            <div className="empty-state">Ei puhelulokeja</div>
          ) : (
            <table className="call-logs-table">
              <thead>
                <tr>
                  <th>Aika</th>
                  <th>Soittaja</th>
                  <th>Numero</th>
                  <th>Kesto</th>
                  <th>Toiminnot</th>
                </tr>
              </thead>
              <tbody>
                {callLogs.map((log) => {
                  const statusInfo = getStatusInfo(log)
                  return (
                  <tr key={log.id}>
                    <td>{formatDate(log.call_date || log.created_at, log.call_time)}</td>
                    <td>{log.customer_name || '-'}</td>
                    <td>{log.phone_number || '-'}</td>
                    <td>{formatDuration(log.duration)}</td>
                    <td>
                      <button 
                        onClick={() => fetchLogDetail(log)}
                        className="view-details-btn"
                      >
                        Näytä
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Puhelun yksityiskohdat -modaali */}
      {showLogDetail && selectedLog && (
        <CallDetailModal
          selectedLog={selectedLog}
          loading={loadingLogDetail}
          onClose={() => {
            setShowLogDetail(false)
            setSelectedLog(null)
          }}
          onBackgroundClick={handleModalBackgroundClick}
          formatDuration={formatDuration}
          detailActiveTab={detailActiveTab}
          setDetailActiveTab={setDetailActiveTab}
          showMoreDetails={showMoreDetails}
          setShowMoreDetails={setShowMoreDetails}
        />
      )}
    </div>
  )
}

