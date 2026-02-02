import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

export default function DevChatPage() {
  const { t } = useTranslation('common')
  // DEV: käytä erillisiä localStorage-avaimia jotta ei jaeta tilaa AI-chatin kanssa
  const PENDING_KEY = 'rascalai_dev_pending_msgs'
  const loadPendingQueue = () => {
    try { const s = localStorage.getItem(PENDING_KEY); return s ? JSON.parse(s) : [] } catch { return [] }
  }
  const savePendingQueue = (q) => { try { localStorage.setItem(PENDING_KEY, JSON.stringify(q)) } catch {} }
  const pendingQueueRef = useRef(loadPendingQueue())
  const inFlightIdsRef = useRef(new Set())
  const isSendingRef = useRef(false)
  const enqueuePending = (item) => { pendingQueueRef.current = [...pendingQueueRef.current, item]; savePendingQueue(pendingQueueRef.current) }
  const dequeuePending = (id) => { pendingQueueRef.current = pendingQueueRef.current.filter(i => i.id !== id); savePendingQueue(pendingQueueRef.current) }
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('rascalai_dev_chat_messages')
    return saved ? JSON.parse(saved) : []
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('chat')
  const [files, setFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [filesError, setFilesError] = useState('')
  const [threadId, setThreadId] = useState(() => localStorage.getItem('rascalai_dev_threadId') || null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')
  const [showAllFiles, setShowAllFiles] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const dropRef = useRef(null)
  const filesListRef = useRef(null)
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [loadingUserData, setLoadingUserData] = useState(true)
  const [windowWidth, setWindowWidth] = useState(window.innerWidth)

  // Hae käyttäjän tiedot Supabase-tietokannasta
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.id) {
        setLoadingUserData(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('company_name, company_id, assistant_id, id')
          .eq('auth_user_id', user.id)
          .single()

        if (!error) setUserData(data)
      } catch (_err) {
      } finally {
        setLoadingUserData(false)
      }
    }

    fetchUserData()
  }, [user?.id])

  const companyName = userData?.company_name || 'Yrityksen'

  // Hae tiedostot kun tietokanta-välilehti avataan
  useEffect(() => {
    if (tab === 'files' && files.length === 0) {
      fetchFiles()
    }
  }, [tab])

  // Seuraa ikkunan koon muutoksia responsiivisuutta varten
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  function formatBytes(bytes) {
    if (!bytes) return '-'
    if (bytes < 1024) return bytes + ' t'
    return (bytes / 1024).toFixed(1).replace('.', ',') + ' kt'
  }
  function formatDate(ts) {
    if (!ts) return '-'
    const d = new Date(ts * 1000)
    return d.toLocaleDateString('fi-FI')
  }

  // REST-muotoinen knowledge-endpoint: /api/storage/knowledge
  const KNOWLEDGE_LIST_ENDPOINT = '/api/storage/knowledge'
  const KNOWLEDGE_UPLOAD_ENDPOINT = '/api/storage/knowledge/upload'

  const fetchFiles = async () => {
    if (loadingUserData) {
      setFilesError('Ladataan käyttäjän tietoja...')
      return
    }
    if (!companyId) {
      setFilesError('Yrityksen ID puuttuu')
      return
    }
    setFilesLoading(true)
    setFilesError('')
    try {
      const response = await axios.post(KNOWLEDGE_LIST_ENDPOINT, { action: 'list', userId: userData.id }, {
        headers: { 'x-api-key': import.meta.env.N8N_SECRET_KEY }
      })
      let arr = []
      if (Array.isArray(response.data.files)) arr = response.data.files
      else if (response.data.files && Array.isArray(response.data.files.data)) arr = response.data.files.data
      else if (Array.isArray(response.data.data)) arr = response.data.data
      else if (Array.isArray(response.data)) arr = response.data

      // Normalize: if items have file_name and id (array), use as-is; otherwise map to compatible shape
      const normalized = Array.isArray(arr) ? arr.map(item => {
        if (item && typeof item === 'object' && 'file_name' in item && Array.isArray(item.id)) {
          return item
        }
        return {
          file_name: item.filename || item.name || 'Tiedosto',
          id: item.id ? [item.id] : [],
        }
      }) : []

      setFiles(normalized)
    } catch (error) {
      setFilesError('Virhe haettaessa tiedostoja')
    } finally {
      setFilesLoading(false)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading || loadingUserData) return
    if (isSendingRef.current) return
    isSendingRef.current = true

    if (!userData?.id) {
      const errorMessage = { role: 'assistant', content: 'Käyttäjän ID puuttuu. Ota yhteyttä ylläpitoon.' }
      setMessages(prev => [...prev, errorMessage])
      return
    }

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const clientMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
      if (inFlightIdsRef.current.has(clientMessageId)) return
      inFlightIdsRef.current.add(clientMessageId)
      const payload = { message: input, threadId, userId: userData.id, mode: 'dev', clientMessageId }
      const response = await axios.post('/api/ai/chat', payload)
      const raw = response.data
      const items = Array.isArray(raw) ? raw : [raw]

      // Suodata: jos mukana on onnistuneita itemeitä (output/response), näytä vain ne.
      // Jos ei yhtään onnistunutta, näytä virhe selkokielisesti. Ohita duplikaatti-indikaattorit.
      const successMessages = []
      let firstErrorText = null
      for (const it of items) {
        if (it && it.duplicated) continue
        const okText = it?.output || it?.response
        if (okText) {
          successMessages.push({ role: 'assistant', content: okText })
          continue
        }
        if (it && it.error) {
          const details = typeof it.details === 'string' ? it.details : (it.details ? JSON.stringify(it.details) : '')
          const status = it.status ? ` (${it.status})` : ''
          firstErrorText = `Virhe: ${it.error}${status}${details ? `\n${details}` : ''}`
        }
      }

      if (successMessages.length > 0) {
        setMessages(prev => [...prev, ...successMessages])
      } else if (firstErrorText) {
        setMessages(prev => [...prev, { role: 'assistant', content: firstErrorText }])
      }
      // Ei lisätä pending-jonoa onnistuneessa lähetyksessä
      if (data.threadId && !threadId) {
        setThreadId(data.threadId)
        localStorage.setItem('rascalai_dev_threadId', data.threadId)
      }
    } catch (_error) {
      const errorMessage = { role: 'assistant', content: 'Virhe viestin lähettämisessä. Yritä uudelleen.' }
      setMessages(prev => [...prev, errorMessage])
      // Varmista että viesti yritetään lähettää myöhemmin
        enqueuePending({ id: clientMessageId, payload: { message: input, threadId, userId: userData.id, mode: 'dev', clientMessageId } })
    } finally {
      inFlightIdsRef.current.clear()
      isSendingRef.current = false
      setLoading(false)
    }
  }

  // Flushaa keskeneräiset viestit käynnistyksessä ja poistuttaessa
  useEffect(() => {
    const flushWithAxios = async () => {
      if (!pendingQueueRef.current.length) return
      const queue = [...pendingQueueRef.current]
      for (const item of queue) {
        try { await axios.post('/api/ai/chat', item.payload); dequeuePending(item.id) } catch {}
      }
    }
    flushWithAxios()

    const flushWithBeacon = () => {
      if (!pendingQueueRef.current.length) return
      const queue = [...pendingQueueRef.current]
      for (const item of queue) {
        const body = JSON.stringify(item.payload)
        let sent = false
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: 'application/json' })
          sent = navigator.sendBeacon('/api/ai/chat', blob)
        }
        if (!sent) {
          try { fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }) } catch {}
        }
        dequeuePending(item.id)
      }
    }
    const onVis = () => { if (document.visibilityState === 'hidden') flushWithBeacon() }
    const onUnload = () => { flushWithBeacon() }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('beforeunload', onUnload)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('beforeunload', onUnload)
    }
  }, [])

  const handleFileDeletion = async (fileItem) => {
    try {
      const ids = Array.isArray(fileItem?.id) ? fileItem.id : (fileItem?.ids || [])
      await axios.post('/api/storage/knowledge/delete', { ids }, {
        headers: { 'x-api-key': import.meta.env.N8N_SECRET_KEY }
      })
      setFiles(prev => prev.filter(f => f.file_name !== fileItem.file_name))
      setSelectedFiles([])
    } catch (error) {
      console.error('Virhe tiedoston poistamisessa:', error)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setPendingFiles(prev => [...prev, ...files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))])
    }
  }
  const handleFileInput = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      setPendingFiles(prev => {
        const newPendingFiles = [...prev, ...files.filter(f => !prev.some(p => p.name === f.name && p.size === f.size))]
        return newPendingFiles
      })
    }
  }
  const handleRemovePending = (name, size) => {
    setPendingFiles(prev => prev.filter(f => !(f.name === name && f.size === size)))
  }
  const handleUploadPending = async () => {
    if (pendingFiles.length === 0) return
    if (!companyId) { setUploadError('Yrityksen ID puuttuu'); return }
    if (!assistantId) { setUploadError('Assistentin ID puuttuu'); return }
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const formData = new FormData()
      pendingFiles.forEach(file => formData.append('files', file))
      formData.append('action', 'feed')
      formData.append('companyId', companyId)
      formData.append('assistantId', assistantId)
      formData.append('fileNames', JSON.stringify(pendingFiles.map(f => f.name)))
      await axios.post(KNOWLEDGE_UPLOAD_ENDPOINT, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'x-api-key': import.meta.env.N8N_SECRET_KEY
        }
      })
      setUploadSuccess(`${pendingFiles.length} tiedosto(a) ladattu onnistuneesti!`)
      setPendingFiles([])
      await fetchFiles()
    } catch (error) {
      setUploadError('Virhe tiedostojen lataamisessa')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleNewChat = () => {
    setMessages([])
    localStorage.removeItem('rascalai_dev_chat_messages')
    setThreadId(null)
    localStorage.removeItem('rascalai_dev_threadId')
  }

  useEffect(() => {
    localStorage.setItem('rascalai_dev_chat_messages', JSON.stringify(messages))
  }, [messages])

  return (
    <>
      {loadingUserData ? (
        <div className="ai-chat-loading">Ladataan käyttäjän tietoja...</div>
      ) : (
        <div className="ai-chat-wrapper">
          <div className="ai-chat-tabs">
            <button onClick={() => setTab('chat')} className={`ai-chat-tab ${tab === 'chat' ? 'active' : ''}`}>
              Keskustelu
            </button>
            <button onClick={() => setTab('files')} className={`ai-chat-tab ${tab === 'files' ? 'active' : ''}`}>
              Tietokanta ({files.length})
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col m-0 p-0">
            {tab === 'chat' ? (
              <div className="flex-1 min-h-0 flex flex-col m-0 p-0 h-full">
                <div className="flex-1 min-h-0 flex flex-col m-0 p-0 overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-y-auto flex flex-col-reverse gap-3 m-0 p-6 w-full h-full">
                    {(() => {
                      const list = [...messages]
                      if (loading) list.push({ role: 'assistant', content: 'Kirjoittaa…', temp: true })
                      return list.slice().reverse().map((message, index) => (
                        <div key={index} className={`ai-chat-message ${message.role === 'assistant' ? 'assistant' : ''}`}>
                          <div className={`ai-chat-message-bubble ${message.role === 'assistant' ? 'assistant' : ''}`}>
                            {message.temp ? (
                              message.content
                            ) : message.role === 'assistant' ? (
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            ) : (
                              message.content
                            )}
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
                <form onSubmit={handleSendMessage} className="ai-chat-input-form">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('devChat.messagePlaceholder')}
                    disabled={loading}
                    className="ai-chat-input"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="ai-chat-send-button"
                  >
                    Lähetä
                  </button>
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title={t('chat.buttons.newChat')}
                    className="ai-chat-newchat-button"
                  >
                    <span role="img" aria-label={t('devChat.newConversation')}>➕</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 flex flex-col p-6 md:p-4 gap-6 md:gap-5 overflow-hidden bg-slate-50">
                <div className="ai-chat-upload-card shrink-0">
                  <h3>Lisää tiedosto tietokantaan</h3>
                  <p>Voit liittää PDF-, Word- tai tekstimuotoisen tiedoston. Tiedosto tallennetaan yrityksesi tietokantaan.</p>
                  <div
                    ref={dropRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`ai-chat-drag-drop ${dragActive ? 'active' : ''}`}
                    onClick={() => dropRef.current && dropRef.current.querySelector('input[type=file]').click()}
                  >
                    Vedä ja pudota tiedostoja tähän tai <span>valitse tiedostot</span>
                    <input type="file" multiple className="hidden" onChange={handleFileInput} />
                  </div>
                  {pendingFiles.length > 0 && (
                    <div className="ai-chat-pending-files">
                      {pendingFiles.map(f => (
                        <div key={f.name + f.size} className="ai-chat-pending-file">
                          <span className="ai-chat-pending-file-name">{f.name}</span>
                          <span className="ai-chat-remove-file" onClick={() => handleRemovePending(f.name, f.size)}>❌</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={handleUploadPending} disabled={uploadLoading || pendingFiles.length === 0} className="ai-chat-upload-button">
                    Lähetä tiedostot ({pendingFiles.length})
                  </button>
                  {uploadLoading && <p className="ai-chat-loading-text">Ladataan...</p>}
                  {uploadError && <p className="ai-chat-error-text">{uploadError}</p>}
                  {uploadSuccess && <p className="ai-chat-success-text">{uploadSuccess}</p>}
                </div>

                <div className="ai-chat-files-list">
                  <h3>Tiedostot</h3>
                  <div className="ai-chat-files-scroll" ref={filesListRef}>
                    {filesLoading ? (
                      <div className="ai-chat-loading"><span>Ladataan tiedostoja...</span></div>
                    ) : filesError ? (
                      <div className="ai-chat-error"><span>{filesError}</span></div>
                    ) : files.length === 0 ? (
                      <div className="ai-chat-empty-state">
                        <img src="/placeholder.png" alt="Ei tiedostoja" />
                        <div>Et ole vielä lisännyt tiedostoja</div>
                      </div>
                    ) : (
                      <>
                        {files.map((file) => (
                          <div key={file.file_name} className="ai-chat-file-item">
                            <div className="ai-chat-file-info">
                              <div className="ai-chat-file-name">{file.file_name || file.filename}</div>
                              {Array.isArray(file.id) && (
                                <div className="ai-chat-file-meta">{file.id.length} osaa</div>
                              )}
                            </div>
                            <button onClick={() => handleFileDeletion(file)} className="ai-chat-delete-button">Poista</button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}


