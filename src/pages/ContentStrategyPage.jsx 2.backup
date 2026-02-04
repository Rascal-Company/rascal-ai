import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useStrategyStatus } from '../contexts/StrategyStatusContext'
import Button from '../components/Button'

const STRATEGY_URL = import.meta.env.N8N_GET_STRATEGY_URL || 'https://samikiias.app.n8n.cloud/webhook/strategy-89777321'

const getStrategy = async () => {
  try {
    // Haetaan käyttäjän tiedot
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.user) {
      throw new Error('Käyttäjä ei ole kirjautunut')
    }

    // Hae organisaation ID (public.users.id)
    const orgId = await getUserOrgId(session.user.id)
    if (!orgId) {
      throw new Error('Organisaation ID ei löytynyt')
    }

    // Hae organisaation tiedot (company_id)
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', orgId)
      .single()

    if (userError || !userRecord?.company_id) {
      throw new Error('Company ID ei löytynyt')
    }

    const companyId = userRecord.company_id
    const userId = orgId // Käytetään organisaation ID:tä

    // Kutsu API endpointia company_id:llä ja user_id:llä (organisaation ID)
    const url = `/api/strategy?companyId=${companyId}&userId=${userId}`
    
    // Hae käyttäjän token
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    if (!currentSession?.access_token) {
      throw new Error('Käyttäjä ei ole kirjautunut')
    }
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${currentSession.access_token}`,
        'Content-Type': 'application/json'
      }
    })
    if (!res.ok) throw new Error('Strategian haku epäonnistui')
    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error in getStrategy:', error)
    throw error
  }
}

export default function ContentStrategyPage() {
  const { t, i18n } = useTranslation('common')
  const navigate = useNavigate()
  const { user, organization } = useAuth()
  const toast = useToast()
  const { refreshUserStatus } = useStrategyStatus()
  const [orgId, setOrgId] = useState(null)
  const [strategy, setStrategy] = useState([])
  
  // Debug: log strategy changes
  useEffect(() => {
    console.log('Strategy state updated:', strategy)
  }, [strategy])
  const [icpSummary, setIcpSummary] = useState([])
  const [kpiData, setKpiData] = useState([])
  const [companySummary, setCompanySummary] = useState('')
  const [tov, setTov] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [generatedCount, setGeneratedCount] = useState(0)
  const [generatedCountLoading, setGeneratedCountLoading] = useState(false)
  const [editingIcp, setEditingIcp] = useState(false)
  const [icpEditText, setIcpEditText] = useState('')
  const [editingKpi, setEditingKpi] = useState(false)
  const [kpiEditText, setKpiEditText] = useState('')
  const [editingCompanySummary, setEditingCompanySummary] = useState(false)
  const [companySummaryEditText, setCompanySummaryEditText] = useState('')
  const [editingTov, setEditingTov] = useState(false)
  const [tovEditText, setTovEditText] = useState('')
  const [viewingCompanySummary, setViewingCompanySummary] = useState(false)
  const [viewingIcp, setViewingIcp] = useState(false)
  const [viewingKpi, setViewingKpi] = useState(false)
  const [viewingTov, setViewingTov] = useState(false)
  const [editingCompanySummaryModal, setEditingCompanySummaryModal] = useState(false)
  const [editingIcpModal, setEditingIcpModal] = useState(false)
  const [editingKpiModal, setEditingKpiModal] = useState(false)
  const [editingTovModal, setEditingTovModal] = useState(false)
  const [analyzingTov, setAnalyzingTov] = useState(false)
  const [tovSocialUrlModal, setTovSocialUrlModal] = useState(false)
  const [tovSocialUrl, setTovSocialUrl] = useState('')
  const [tovSocialUrlError, setTovSocialUrlError] = useState('')

  const [companyId, setCompanyId] = useState(null)
  const textareaRef = React.useRef(null)
  const icpTextareaRef = React.useRef(null)
  const kpiTextareaRef = React.useRef(null)
  const companySummaryTextareaRef = React.useRef(null)
  const tovTextareaRef = React.useRef(null)

  // Aseta orgId kun käyttäjä on kirjautunut
  useEffect(() => {
    const setOrgIdFromUser = async () => {
      if (user?.id) {
        const userId = await getUserOrgId(user.id)
        if (userId) {
          setOrgId(userId)
        }
      } else if (organization?.id) {
        // Fallback: käytä organization.id:ta jos se on saatavilla
        setOrgId(organization.id)
      }
    }
    setOrgIdFromUser()
  }, [user?.id, organization?.id])

  const fetchGeneratedCount = async (strategyId) => {
    try {
      setGeneratedCountLoading(true)

      // Hae organisaation ID
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return

      const orgId = await getUserOrgId(session.user.id)
      if (!orgId) return

      // Laske generoidut sisällöt tälle strategialle
      const { count, error: cntErr } = await supabase
        .from('content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', orgId) // Käytetään organisaation ID:tä
        .eq('strategy_id', strategyId)
        .eq('is_generated', true)

      if (cntErr) {
        console.error('Error fetching generated count:', cntErr)
        setGeneratedCount(0)
      } else {
        setGeneratedCount(count || 0)
      }
    } catch (err) {
      console.error('fetchGeneratedCount error:', err)
      setGeneratedCount(0)
    } finally {
      setGeneratedCountLoading(false)
    }
  }


  useEffect(() => {
    const fetchStrategy = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Haetaan company_id ensin
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          // Hae organisaation ID
          const orgId = await getUserOrgId(session.user.id)
          if (orgId) {
            const { data: userRecord } = await supabase
              .from('users')
              .select('company_id')
              .eq('id', orgId)
              .single()
            
            if (userRecord?.company_id) {
              setCompanyId(userRecord.company_id)
            }
          }
        }
        
        const data = await getStrategy()
        
        // Käsittele data-rakenne
        if (data && typeof data === 'object') {
          // Data tulee objektina: {strategies: [...], icpSummary: [...], kpi: [...], companySummary: ..., tov: ...}
          console.log('Strategy data (object):', data.strategies)
          setStrategy(data.strategies || [])
          setIcpSummary(data.icpSummary || [])
          setKpiData(data.kpi || [])
          setCompanySummary(data.summary || data.companySummary || '')
          setTov(data.tov || '')
        } else if (Array.isArray(data) && data.length > 0) {
          // Vanha rakenne (array)
          console.log('Strategy data (array):', data)
          const firstItem = data[0]
          setStrategy(firstItem.strategyAndMonth || [])
          setIcpSummary(firstItem.icpSummary || [])
          setKpiData(firstItem.kpi || [])
          setCompanySummary(firstItem.summary || firstItem.companySummary || '')
          setTov(firstItem.tov || '')
        } else {
          console.log('No strategy data available')
          setStrategy([])
          setIcpSummary([])
          setKpiData([])
          setCompanySummary('')
          setTov('')
        }
      } catch (e) {
        console.error('Error fetching strategy:', e)
        setStrategy([])
        setIcpSummary([])
        setKpiData([])
        setCompanySummary('')
        setTov('')
        setError('Strategian hakeminen epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.')
      } finally {
        setLoading(false)
      }
    }
    if (orgId) {
      fetchStrategy()
    }
  }, [orgId])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editText, editId])

  useEffect(() => {
    if (icpTextareaRef.current) {
      icpTextareaRef.current.style.height = 'auto'
      icpTextareaRef.current.style.height = icpTextareaRef.current.scrollHeight + 'px'
    }
  }, [icpEditText, editingIcp])

  useEffect(() => {
    if (kpiTextareaRef.current) {
      kpiTextareaRef.current.style.height = 'auto'
      kpiTextareaRef.current.style.height = kpiTextareaRef.current.scrollHeight + 'px'
    }
  }, [kpiEditText, editingKpi])

  useEffect(() => {
    if (companySummaryTextareaRef.current) {
      companySummaryTextareaRef.current.style.height = 'auto'
      companySummaryTextareaRef.current.style.height = companySummaryTextareaRef.current.scrollHeight + 'px'
    }
  }, [companySummaryEditText, editingCompanySummary])

  useEffect(() => {
    if (tovTextareaRef.current) {
      tovTextareaRef.current.style.height = 'auto'
      tovTextareaRef.current.style.height = tovTextareaRef.current.scrollHeight + 'px'
    }
  }, [tovEditText, editingTov])

  // ESC-näppäimen tuki modaalin sulkemiseen
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (editId) {
          handleCancel()
        } else if (editingCompanySummaryModal) {
          setEditingCompanySummaryModal(false)
          setCompanySummaryEditText(companySummary)
        } else if (editingIcpModal) {
          setEditingIcpModal(false)
          setIcpEditText(icpSummary.join('\n'))
        } else if (editingKpiModal) {
          setEditingKpiModal(false)
          setKpiEditText(kpiData.join('\n'))
        } else if (editingTovModal) {
          setEditingTovModal(false)
          setTovEditText(tov)
          navigate('/strategy')
        } else if (viewingCompanySummary) {
          setViewingCompanySummary(false)
        } else if (viewingIcp) {
          setViewingIcp(false)
        } else if (viewingKpi) {
          setViewingKpi(false)
        } else if (viewingTov) {
          setViewingTov(false)
        }
      }
    }

    if (editId || editingCompanySummaryModal || editingIcpModal || editingKpiModal || editingTovModal || viewingCompanySummary || viewingIcp || viewingKpi || viewingTov) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editId, editingCompanySummaryModal, editingIcpModal, editingKpiModal, editingTovModal, viewingCompanySummary, viewingIcp, viewingKpi, viewingTov, companySummary, icpSummary, kpiData, tov])

  const handleEdit = (item) => {
    setEditId(item.id)
    setEditText(item.strategy || item.Strategy)
    fetchGeneratedCount(item.id)
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSave = async (item) => {
    try {
      // Päivitä strategia Supabasessa
      const { data: updatedStrategy, error } = await supabase
        .from('content_strategy')
        .update({ 
          strategy: editText,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating strategy:', error)
        toast.error(t('errors.saveError', { error: error.message }))
        return
      }

      // Päivitä paikallinen state
      const updated = { 
        ...item, 
        strategy: editText, 
        Strategy: editText, // Säilytetään myös vanha kenttä yhteensopivuuden vuoksi
        updated_at: updatedStrategy.updated_at
      }
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))
      setEditId(null)
    } catch (e) {
      console.error('Error in handleSave:', e)
      toast.error(t('errors.saveFailed'))
    }
  }

  const handleSaveAndApprove = async (item) => {
    try {
      // Päivitä strategia ja hyväksy se Supabasessa
      const { data: updatedStrategy, error } = await supabase
        .from('content_strategy')
        .update({ 
          strategy: editText,
          approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating and approving strategy:', error)
        toast.error(t('errors.saveAndApproveFailed', { error: error.message }))
        return
      }

      // Lähetä hyväksyntä API:n kautta
      console.log('🚀 Lähetetään strategian vahvistus API:n kautta...')
      
      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      if (!orgId) {
        throw new Error('Organisaation ID puuttuu')
      }

      const response = await axios.post('/api/strategy/approve', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: orgId // Käytetään organisaation ID:tä
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-api-key': import.meta.env.N8N_SECRET_KEY || 'fallback-key',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || 'API-vastaus epäonnistui')
      }
      
      console.log('✅ Strategy approval sent successfully:', response.data)

      // Päivitä myös organisaation status "Approved":ksi API-endpointin kautta (käyttää middlewarea)
      try {
        await axios.post('/api/strategy/status', {
          status: 'Approved'
        }, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (userError) {
        console.error('Error updating user status:', userError)
        // Ei keskeytetä prosessia tämän takia
      }

      // Päivitä paikallinen state
      const updated = { 
        ...item, 
        strategy: editText, 
        Strategy: editText, // Säilytetään myös vanha kenttä yhteensopivuuden vuoksi
        approved: true,
        updated_at: updatedStrategy.updated_at
      }
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))
      setEditId(null)

      // Päivitä käyttäjän status kontekstissa
      refreshUserStatus()

      // Näytä toast-notifikaatio
      toast.success(t('errors.approvalSuccess'))

    } catch (e) {
      console.error('Error in handleSaveAndApprove:', e)
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || 'Tuntematon virhe'
      console.error('Error details:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message
      })
      toast.error(t('errors.approvalFailed', { error: errorMessage }))
    }
  }

  const handleApproveStrategy = async (item) => {
    console.log('🎯 handleApproveStrategy kutsuttu strategialle:', item)
    try {
      // Lähetä ensin axios-kutsu API endpointin kautta
      console.log('🚀 Lähetetään strategian vahvistus API:n kautta...')
      if (!orgId) {
        throw new Error('Organisaation ID puuttuu')
      }

      console.log('Data:', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: orgId // Käytetään organisaation ID:tä
      })

      // Hae access token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      if (!orgId) {
        throw new Error('Organisaation ID puuttuu')
      }

      const response = await axios.post('/api/strategy/approve', {
        strategy_id: item.id,
        month: item.month,
        company_id: companyId,
        user_id: orgId // Käytetään organisaation ID:tä
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'x-api-key': import.meta.env.N8N_SECRET_KEY || 'fallback-key',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status !== 200 || !response.data?.success) {
        throw new Error(response.data?.error || 'API-vastaus epäonnistui')
      }
      
      console.log('✅ Strategy approval sent successfully:', response.data)

      // Sitten päivitä strategia approved: true Supabasessa
      const { data: updatedStrategy, error } = await supabase
        .from('content_strategy')
        .update({ 
          approved: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.id)
        .select()
        .single()

      if (error) {
        console.error('Error approving strategy:', error)
        toast.error(t('errors.confirmationFailed', { error: error.message }))
        return
      }

      // Päivitä myös organisaation status "Approved":ksi API-endpointin kautta (käyttää middlewarea)
      try {
        await axios.post('/api/strategy/status', {
          status: 'Approved'
        }, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })
      } catch (userError) {
        console.error('Error updating user status:', userError)
        // Ei keskeytetä prosessia tämän takia
      }

      // Päivitä paikallinen state
      const updated = { 
        ...item, 
        approved: true,
        updated_at: updatedStrategy.updated_at
      }
      setStrategy(strategy.map(s => s.id === item.id ? updated : s))

      // Päivitä käyttäjän status kontekstissa
      refreshUserStatus()

      // Näytä toast-notifikaatio
      toast.success(t('errors.confirmationSuccess'))

    } catch (e) {
      console.error('Error in handleApproveStrategy:', e)
      const errorMessage = e.response?.data?.error || e.response?.data?.details || e.message || 'Tuntematon virhe'
      console.error('Error details:', {
        status: e.response?.status,
        data: e.response?.data,
        message: e.message
      })
      toast.error(t('errors.confirmationError', { error: errorMessage }))
    }
  }

  const handleCancel = () => {
    setEditId(null)
    setEditText('')
  }

  const handleEditIcp = () => {
    setEditingIcp(true)
    setIcpEditText(icpSummary.join('\n'))
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (icpTextareaRef.current) {
        icpTextareaRef.current.style.height = 'auto'
        icpTextareaRef.current.style.height = icpTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSaveIcp = async () => {
    try {
      const newIcpSummary = icpEditText.split('\n').filter(line => line.trim() !== '')
      
      if (!orgId) {
        toast.error('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä ICP Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          icp_summary: newIcpSummary.join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

      if (error) {
        console.error('Error updating ICP:', error)
        toast.error(t('errors.icpSaveFailed', { error: error.message }))
        return
      }
      
      setIcpSummary(newIcpSummary)
      setEditingIcp(false)
      setIcpEditText('')
    } catch (e) {
      console.error('Error in handleSaveIcp:', e)
      toast.error(t('errors.icpSaveError'))
    }
  }

  const handleCancelIcp = () => {
    setEditingIcp(false)
    setIcpEditText('')
  }

  const handleSaveKpi = async () => {
    try {
      const newKpiData = kpiEditText.split('\n').filter(line => line.trim() !== '')
      
      if (!orgId) {
        toast.error('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä KPI Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          kpi: newKpiData.join('\n'),
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

      if (error) {
        console.error('Error updating KPI:', error)
        toast.error(t('errors.kpiSaveFailed', { error: error.message }))
        return
      }
      
      setKpiData(newKpiData)
      setEditingKpi(false)
      setKpiEditText('')
    } catch (e) {
      console.error('Error in handleSaveKpi:', e)
      toast.error(t('errors.kpiSaveError'))
    }
  }

  const handleCancelKpi = () => {
    setEditingKpi(false)
    setKpiEditText('')
  }

  const handleEditCompanySummary = () => {
    setEditingCompanySummary(true)
    setCompanySummaryEditText(companySummary)
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (companySummaryTextareaRef.current) {
        companySummaryTextareaRef.current.style.height = 'auto'
        companySummaryTextareaRef.current.style.height = companySummaryTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSaveCompanySummary = async () => {
    try {
      if (!orgId) {
        toast.error('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä Company Summary Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          company_summary: companySummaryEditText,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

      if (error) {
        console.error('Error updating company summary:', error)
        toast.error('Yritysanalyysin tallennus epäonnistui: ' + error.message)
        return
      }
      
      setCompanySummary(companySummaryEditText)
      setEditingCompanySummary(false)
      setCompanySummaryEditText('')
    } catch (e) {
      console.error('Error in handleSaveCompanySummary:', e)
      toast.error('Yritysanalyysin tallennus epäonnistui')
    }
  }

  const handleCancelCompanySummary = () => {
    setEditingCompanySummary(false)
    setCompanySummaryEditText('')
  }

  const handleEditTov = () => {
    setEditingTov(true)
    setTovEditText(tov)
    // Säätää textarea:n korkeus seuraavassa renderissä
    setTimeout(() => {
      if (tovTextareaRef.current) {
        tovTextareaRef.current.style.height = 'auto'
        tovTextareaRef.current.style.height = tovTextareaRef.current.scrollHeight + 'px'
      }
    }, 0)
  }

  const handleSaveTov = async () => {
    try {
      if (!orgId) {
        toast.error('Organisaation ID puuttuu')
        return
      }
      
      // Päivitä TOV Supabasessa
      const { error } = await supabase
        .from('users')
        .update({ 
          tov: tovEditText,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId) // Käytetään organisaation ID:tä

      if (error) {
        console.error('Error updating TOV:', error)
        toast.error('TOV:n tallennus epäonnistui: ' + error.message)
        return
      }
      
      setTov(tovEditText)
      setEditingTov(false)
      setTovEditText('')
    } catch (e) {
      console.error('Error in handleSaveTov:', e)
      toast.error('TOV:n tallennus epäonnistui')
    }
  }

  const handleCancelTov = () => {
    setEditingTov(false)
    setTovEditText('')
  }

  const validateSocialUrl = (url) => {
    if (!url || !url.trim()) {
      return { valid: false, error: '' }
    }

    const trimmedUrl = url.trim().toLowerCase()
    
    // Tarkista että URL on Instagram tai LinkedIn henkilöprofiili
    const instagramPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/.+/
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/

    // Tarkista ensin onko URL ylipäätään validi URL
    try {
      new URL(trimmedUrl)
    } catch {
      return {
        valid: false,
        error: 'Syötä kelvollinen URL-osoite'
      }
    }

    if (instagramPattern.test(trimmedUrl)) {
      return { valid: true, error: '' }
    }
    
    if (linkedinPattern.test(trimmedUrl)) {
      return { valid: true, error: '' }
    }

    // Jos URL on LinkedIn mutta ei /in/ polku
    if (trimmedUrl.includes('linkedin.com')) {
      return {
        valid: false,
        error: 'LinkedIn URL:n täytyy olla henkilöprofiili (linkedin.com/in/...)'
      }
    }

    return { 
      valid: false, 
      error: 'URL:n täytyy olla Instagram-profiili (instagram.com/...) tai LinkedIn henkilöprofiili (linkedin.com/in/...)' 
    }
  }

  const handleSocialUrlChange = (url) => {
    setTovSocialUrl(url)
    const validation = validateSocialUrl(url)
    setTovSocialUrlError(validation.error)
  }

  const handleAnalyzeTovFromSocialMedia = async (socialUrl) => {
    try {
      setAnalyzingTov(true)
      
      if (!orgId) {
        toast.error('Organisaation ID puuttuu')
        setAnalyzingTov(false)
        return
      }

      const validation = validateSocialUrl(socialUrl)
      if (!validation.valid) {
        setTovSocialUrlError(validation.error || 'Sometilin URL on pakollinen')
        setAnalyzingTov(false)
        return
      }

      // Hae käyttäjän token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error(t('errors.userNotLoggedIn'))
        setAnalyzingTov(false)
        return
      }

      // Kutsu API endpointia some-scrapingille ja TOV-analyysille
      const response = await axios.post('/api/ai/analyze-tone', {
        user_id: orgId,
        social_url: socialUrl.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('TOV analyze response:', response.data)

      // Sulje molemmat modaalit vasta kun API-kutsu onnistui
      setTovSocialUrlModal(false)
      setEditingTovModal(false)
      setTovSocialUrl('')
      setTovSocialUrlError('')
      navigate('/strategy')

      if (response.data?.success) {
        if (response.data?.tov) {
          // N8N palautti TOV:n suoraan
          setTovEditText(response.data.tov)
          toast.success(t('errors.tovAnalysisReady'))
        } else {
          // N8N aloitti asynkronisen prosessin
          toast.info(t('errors.tovAnalysisStarted'))
        }
      } else {
        toast.error(t('errors.tovAnalysisFailed'))
      }
    } catch (error) {
      console.error('Error analyzing TOV from social media:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.error || error.message
      toast.error(t('errors.tovAnalysisError', { error: errorMessage }))
      // Modaali pysyy auki jos virhe tapahtuu
    } finally {
      setAnalyzingTov(false)
    }
  }

  // Funktio kuukauden käännökselle ja kirjoittamiseen isolla alkukirjaimella
  const translateMonth = (month) => {
    if (!month) return ''
    
    const monthTranslations = {
      'january': 'tammikuu',
      'february': 'helmikuu', 
      'march': 'maaliskuu',
      'april': 'huhtikuu',
      'may': 'toukokuu',
      'june': 'kesäkuu',
      'july': 'heinäkuu',
      'august': 'elokuu',
      'september': 'syyskuu',
      'october': 'lokakuu',
      'november': 'marraskuu',
      'december': 'joulukuu'
    }
    
    const lowerMonth = month.toLowerCase()
    const translatedMonth = monthTranslations[lowerMonth] || month
    
    return translatedMonth
  }

  const formatMonth = (month) => {
    if (!month) return ''
    
    // Käännä kuukausi jos kieli on suomi
    const translatedMonth = i18n.language === 'fi' ? translateMonth(month) : month
    
    return translatedMonth.charAt(0).toUpperCase() + translatedMonth.slice(1).toLowerCase()
  }

  const getStrategyStatus = (month) => {
    if (!month) return 'old'
    
    const currentDate = new Date()
    const currentMonth = currentDate.getMonth() // 0-11
    const currentYear = currentDate.getFullYear()
    
    // Käännä kuukausi suomeksi vertailua varten
    const translatedMonth = translateMonth(month)
    
    // Kuukausien nimet suomeksi
    const monthNames = [
      'tammikuu', 'helmikuu', 'maaliskuu', 'huhtikuu', 'toukokuu', 'kesäkuu',
      'heinäkuu', 'elokuu', 'syyskuu', 'lokakuu', 'marraskuu', 'joulukuu'
    ]
    
    // Etsi kuukauden indeksi käännetyllä nimellä
    const monthIndex = monthNames.findIndex(name => 
      translatedMonth.toLowerCase().includes(name.toLowerCase())
    )
    
    if (monthIndex === -1) return 'old'
    
    // Jos kuukausi on tämä kuukausi
    if (monthIndex === currentMonth) return 'current'
    
    // Jos kuukausi on tulevaisuudessa (tämä vuosi)
    if (monthIndex > currentMonth) return 'upcoming'
    
    // Jos kuukausi on menneisyydessä
    return 'old'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'current': return '#22c55e' // Vihreä
      case 'upcoming': return '#3b82f6' // Sininen
      case 'old': return '#6b7280' // Harmaa
      default: return '#6b7280'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'current': return i18n.language === 'fi' ? 'Nykyinen' : 'Current'
      case 'upcoming': return i18n.language === 'fi' ? 'Tuleva' : 'Upcoming'
      case 'old': return i18n.language === 'fi' ? 'Vanha' : 'Old'
      default: return i18n.language === 'fi' ? 'Vanha' : 'Old'
    }
  }



  if (loading) {
    return (
      <div className="strategy-loading">
        <div className="loading-spinner"></div>
        <p>{t('strategy.loading')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="strategy-container">
        <div className="strategy-header">
          <h2>{t('strategy.header')}</h2>
        </div>
        
        <div className="strategy-bentogrid">
          {/* Yritysanalyysi, Kohderyhmä, Tavoitteet ja TOV - ylemmät kortit */}
          <div className="strategy-top-row">
            {/* Yritysanalyysi-kortti */}
            <div className="strategy-card">
              <div className="strategy-card-title">{t('strategy.companyAnalysis.title')}</div>
              <div className="strategy-card-body">
                {companySummary && companySummary.length > 0 ? (
                  <>
                    <div
                      className="strategy-text strategy-card-clickable"
                      onClick={() => setViewingCompanySummary(true)}
                    >
                      {companySummary}
                    </div>
                      <div className="strategy-card-footer">
                        <button 
                          className="strategy-green-btn"
                          onClick={() => {
                            setEditingCompanySummaryModal(true)
                            setCompanySummaryEditText(companySummary)
                          }}
                        >
                          {t('strategy.buttons.edit')}
                        </button>
                      </div>
                  </>
                ) : (
                  <div className="strategy-empty-state">
                    <p className="strategy-empty-text">{t('strategy.companyAnalysis.missing')}</p>
                    <button
                      className="strategy-green-btn"
                      onClick={() => {
                        setEditingCompanySummaryModal(true)
                        setCompanySummaryEditText('')
                      }}
                    >
                      {t('strategy.companyAnalysis.create')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Kohderyhmä-kortti */}
            <div className="strategy-card">
              <div className="strategy-card-title">{t('strategy.icp.title')}</div>
              <div className="strategy-card-body">
                {icpSummary && icpSummary.length > 0 ? (
                  <>
                    <div
                      className="strategy-text strategy-card-clickable"
                      onClick={() => setViewingIcp(true)}
                    >
                      {icpSummary.map((summary) => `- ${summary}`).join('\n')}
                    </div>
                      <div className="strategy-card-footer">
                        <button 
                          className="strategy-green-btn"
                          onClick={() => {
                            setEditingIcpModal(true)
                            setIcpEditText(icpSummary.join('\n'))
                          }}
                        >
                          {t('strategy.icp.edit')}
                        </button>
                      </div>
                  </>
                ) : (
                  <div className="strategy-empty-state">
                    <p className="strategy-empty-text">{t('strategy.icp.empty')}</p>
                    <button 
                      className="strategy-green-btn"
                      onClick={() => {
                        setEditingIcpModal(true)
                        setIcpEditText('')
                      }}
                    >
                      {t('strategy.icp.create')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            

            {/* Tavoitteet-kortti */}
            <div className="strategy-card">
              <div className="strategy-card-title">{t('strategy.kpi.title', 'Tavoitteet')}</div>
              <div className="strategy-card-body">
                {kpiData && kpiData.length > 0 ? (
                  <>
                    <div
                      className="strategy-text strategy-card-clickable"
                      onClick={() => setViewingKpi(true)}
                    >
                      {kpiData.map((kpi) => `- ${kpi}`).join('\n')}
                    </div>
                        <div className="strategy-card-footer">
                          <button 
                            className="strategy-green-btn"
                            onClick={() => {
                              setEditingKpiModal(true)
                              setKpiEditText(kpiData.join('\n'))
                            }}
                          >
                            {t('strategy.kpi.edit')}
                          </button>
                        </div>
                  </>
                ) : (
                  <div className="strategy-empty-state">
                    <p className="strategy-empty-text">{t('strategy.kpi.empty')}</p>
                    <button 
                      className="strategy-green-btn"
                      onClick={() => {
                        setEditingKpiModal(true)
                        setKpiEditText('')
                      }}
                    >
                      {t('strategy.kpi.create')}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* TOV-kortti */}
            <div className="strategy-card">
              <div className="strategy-card-title">🎤 {t('strategy.toneOfVoice.title')}</div>
              <div className="strategy-card-body">
                {tov && tov.length > 0 ? (
                  <>
                    <div
                      className="strategy-text strategy-card-clickable"
                      onClick={() => setViewingTov(true)}
                    >
                      {tov}
                    </div>
                      <div className="strategy-card-footer">
                        <button 
                          className="strategy-green-btn"
                          onClick={() => {
                            setEditingTovModal(true)
                            setTovEditText(tov)
                          }}
                        >
                          {t('strategy.buttons.edit')}
                        </button>
                      </div>
                  </>
                ) : (
                  <div className="strategy-empty-state">
                    <p className="strategy-empty-text">{t('strategy.toneOfVoice.missing')}</p>
                    <button
                      className="strategy-green-btn"
                      onClick={() => {
                        setEditingTovModal(true)
                        setTovEditText('')
                      }}
                    >
                      {t('strategy.toneOfVoice.create')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sisältöstrategiat - otsikko */}
          <div className="strategy-section-header">
            <h3>{t('strategy.list.title')}</h3>
          </div>

          {/* Strategiakortit */}
          <div className="strategy-grid">
            {console.log('Rendering strategies:', strategy.length, strategy)}
            {Array.isArray(strategy) && strategy.length > 0 ? strategy
              .map(item => {
                const status = getStrategyStatus(item.month || item.Month)
                return (
                  <div key={item.id} className="strategy-card">
                    <div className="strategy-persona-header">
                      <div className="strategy-card-title">
                        {formatMonth(item.month || item.Month)}
                      </div>
                      <div className="strategy-persona-actions">
                        <div
                          className="text-white py-1 px-2 rounded-md text-xs font-semibold uppercase"
                          style={{ background: getStatusColor(status) }}
                        >
                          {getStatusText(status)}
                        </div>
                        <div className={`text-white py-1 px-2 rounded-md text-xs font-semibold uppercase ${
                          item.approved ? 'bg-green-500' : 'bg-amber-500'
                        }`}>
                          {item.approved ? t('strategy.status.approved') : t('strategy.status.pending')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="strategy-card-body">
                      <div
                        className="strategy-text"
                      >
                        {item.strategy || item.Strategy}
                      </div>
                      <div className="strategy-persona-footer">
                        <span className="strategy-persona-date">
                          {new Date(item.created_at || item.createdTime).toLocaleDateString(i18n.language === 'fi' ? 'fi-FI' : 'en-US')}
                        </span>
                        <div className="strategy-persona-actions">
                          {!item.approved && (
                            <button 
                              className="strategy-amber-btn"
                              onClick={() => handleApproveStrategy(item)}
                            >
                              {t('strategy.buttons.approveStrategy')}
                            </button>
                          )}
                          <button 
                            className="strategy-green-btn"
                            onClick={() => handleEdit(item)}
                          >
                            {t('strategy.buttons.edit')}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }) : null}
          </div>

        {/* Tyhjä tila jos ei strategioita */}
        {strategy.length === 0 && (
          <div className="strategy-card strategy-large-empty">
            <div className="strategy-large-empty-icon">📋</div>
            <h3 className="strategy-large-empty-title">{t('strategy.empty.title')}</h3>
            <p className="strategy-large-empty-desc">{t('strategy.empty.description')}</p>
          </div>
        )}

        {/* Yritysanalyysi-placeholder, Kohderyhmä ja Tavoitteet ovat nyt aina top-rivissä */}

        {/* TOV jos ei ole vielä olemassa */}
        {(!tov || tov.length === 0) && (
          <div className="strategy-card">
            <div className="strategy-card-title">🎤 {t('strategy.toneOfVoice.title')}</div>
            <div className="strategy-empty-state">
              <p className="strategy-empty-text">{t('strategy.toneOfVoice.missing')}</p>
              <button
                className="strategy-green-btn"
                onClick={() => {
                  setEditingTov(true)
                  setTovEditText('')
                }}
              >
                {t('strategy.toneOfVoice.create')}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="strategy-error-box">
            <p className="strategy-error-text">{error}</p>
          </div>
        )}
      </div>
      
      {/* Editointimodaali */}
      {editId && (
        <div 
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancel()
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <div className="strategy-modal-title-row">
                <h3 className="m-0 text-xl font-bold text-gray-700">
                  {t('strategy.buttons.editStrategy')}
                </h3>
                <span className="text-[13px] text-gray-500">
                  {generatedCountLoading 
                    ? (i18n.language === 'fi' ? 'Ladataan...' : 'Loading...') 
                    : `${generatedCount} ${i18n.language === 'fi' ? 'generoitua sisältöä' : 'generated contents'}`}
                </span>
              </div>
              <button
                onClick={handleCancel}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <textarea
              ref={textareaRef}
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="w-full min-h-[300px] p-4 border-2 border-gray-200 rounded-lg text-base leading-relaxed font-inherit bg-gray-50 box-border resize-y"
              placeholder={t('strategy.strategyCard.placeholder')}
            />
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={() => handleSave(strategy.find(s => s.id === editId))}
              >
                {t('strategy.buttons.save')}
              </button>
              {!strategy.find(s => s.id === editId)?.approved && (
                <button 
                  className="strategy-amber-btn-lg"
                  onMouseOver={(e) => e.target.style.background = '#d97706'}
                  onMouseOut={(e) => e.target.style.background = '#f59e0b'}
                  onClick={() => handleSaveAndApprove(strategy.find(s => s.id === editId))}
                >
                  {t('strategy.buttons.saveAndApprove')}
                </button>
              )}
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={handleCancel}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yritysanalyysi-näyttömodaali */}
      {viewingCompanySummary && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingCompanySummary(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="m-0 text-xl font-bold text-gray-700">
                {t('strategy.companyAnalysis.title')}
              </h3>
              <button
                onClick={() => setViewingCompanySummary(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <div className="strategy-modal-content">
              {companySummary}
            </div>
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={() => {
                  setViewingCompanySummary(false)
                  setEditingCompanySummaryModal(true)
                  setCompanySummaryEditText(companySummary)
                }}
              >
                {t('strategy.buttons.edit')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => setViewingCompanySummary(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kohderyhmä-näyttömodaali */}
      {viewingIcp && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingIcp(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="m-0 text-xl font-bold text-gray-700">
                {t('strategy.icp.title')}
              </h3>
              <button
                onClick={() => setViewingIcp(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <div className="strategy-modal-content">
              {icpSummary.map((summary, index) => (
                <div key={index} className="mb-3">
                  <strong>- {summary}</strong>
                </div>
              ))}
            </div>
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={() => {
                  setViewingIcp(false)
                  setEditingIcpModal(true)
                  setIcpEditText(icpSummary.join('\n'))
                }}
              >
                {t('strategy.icp.edit')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => setViewingIcp(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tavoitteet-näyttömodaali */}
      {viewingKpi && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingKpi(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="m-0 text-xl font-bold text-gray-700">
                {t('strategy.kpi.title', 'Tavoitteet')}
              </h3>
              <button
                onClick={() => setViewingKpi(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <div className="strategy-modal-content">
              {kpiData.map((kpi, index) => (
                <div key={index} className="mb-3">
                  <strong>- {kpi}</strong>
                </div>
              ))}
            </div>
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={() => {
                  setViewingKpi(false)
                  setEditingKpiModal(true)
                  setKpiEditText(kpiData.join('\n'))
                }}
              >
                {t('strategy.kpi.edit')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => setViewingKpi(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOV-näyttömodaali */}
      {viewingTov && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setViewingTov(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="strategy-modal-title">
                {t('strategy.toneOfVoice.modalTitle')}
              </h3>
              <button
                onClick={() => setViewingTov(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <div className="strategy-modal-content">
              {tov}
            </div>
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={() => {
                  setViewingTov(false)
                  setEditingTovModal(true)
                  setTovEditText(tov)
                }}
              >
                {t('strategy.buttons.edit')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => setViewingTov(false)}
              >
                Sulje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Yritysanalyysi-muokkaustilamodaali */}
      {editingCompanySummaryModal && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingCompanySummaryModal(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="strategy-modal-title">
                {t('strategy.companyAnalysis.edit')}
              </h3>
              <button
                onClick={() => setEditingCompanySummaryModal(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <textarea
              ref={companySummaryTextareaRef}
              value={companySummaryEditText}
              onChange={e => setCompanySummaryEditText(e.target.value)}
              className="w-full min-h-[300px] p-4 border-2 border-gray-200 rounded-lg text-base leading-relaxed font-inherit bg-gray-50 box-border resize-y"
              placeholder="Kirjoita yrityksen analyysi..."
            />
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={async () => {
                  await handleSaveCompanySummary()
                  setEditingCompanySummaryModal(false)
                }}
              >
                {t('strategy.buttons.save')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setEditingCompanySummaryModal(false)
                  setCompanySummaryEditText(companySummary)
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kohderyhmä-muokkaustilamodaali */}
      {editingIcpModal && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingIcpModal(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="m-0 text-xl font-bold text-gray-700">
                {t('strategy.icp.title')}
              </h3>
              <button
                onClick={() => setEditingIcpModal(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <textarea
              ref={icpTextareaRef}
              value={icpEditText}
              onChange={e => setIcpEditText(e.target.value)}
              className="w-full min-h-[300px] p-4 border-2 border-gray-200 rounded-lg text-base leading-relaxed font-inherit bg-gray-50 box-border resize-y"
              placeholder={t('strategy.icp.placeholder')}
            />
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={async () => {
                  await handleSaveIcp()
                  setEditingIcpModal(false)
                }}
              >
                {t('strategy.buttons.save')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setEditingIcpModal(false)
                  setIcpEditText(icpSummary.join('\n'))
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tavoitteet-muokkaustilamodaali */}
      {editingKpiModal && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingKpiModal(false)
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="m-0 text-xl font-bold text-gray-700">
                {t('strategy.kpi.title', 'Tavoitteet')}
              </h3>
              <button
                onClick={() => setEditingKpiModal(false)}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <textarea
              ref={kpiTextareaRef}
              value={kpiEditText}
              onChange={e => setKpiEditText(e.target.value)}
              className="w-full min-h-[300px] p-4 border-2 border-gray-200 rounded-lg text-base leading-relaxed font-inherit bg-gray-50 box-border resize-y"
              placeholder={t('strategy.kpi.placeholder')}
            />
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={async () => {
                  await handleSaveKpi()
                  setEditingKpiModal(false)
                }}
              >
                {t('strategy.buttons.save')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setEditingKpiModal(false)
                  setKpiEditText(kpiData.join('\n'))
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOV-muokkaustilamodaali */}
      {editingTovModal && (
        <div
          className="strategy-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEditingTovModal(false)
              navigate('/strategy')
            }
          }}
        >
          <div 
            className="strategy-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="strategy-modal-title">
                {t('strategy.toneOfVoice.modalTitle')}
              </h3>
              <button
                onClick={() => {
                  setEditingTovModal(false)
                  navigate('/strategy')
                }}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            {/* Apu-nappi some-scrapingille ja TOV-analyysille */}
            <div className="mb-4">
              <button
                onClick={() => setTovSocialUrlModal(true)}
                disabled={analyzingTov}
                className={`w-full py-2.5 px-5 text-sm font-semibold text-white border-none rounded-lg transition-colors duration-200 ${
                  analyzingTov
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                }`}
              >
                {analyzingTov ? t('strategy.toneOfVoice.analyzing') : t('strategy.toneOfVoice.helpButton')}
              </button>
            </div>
            
            <textarea
              ref={tovTextareaRef}
              value={tovEditText}
              onChange={e => setTovEditText(e.target.value)}
              className="w-full min-h-[300px] p-4 border-2 border-gray-200 rounded-lg text-base leading-relaxed font-inherit bg-gray-50 box-border resize-y"
              placeholder={t('placeholders.describeToneOfVoice')}
            />
            
            <div className="strategy-modal-footer">
              <button 
                className="strategy-green-btn-lg"
                onMouseOver={(e) => e.target.style.background = '#16a34a'}
                onMouseOut={(e) => e.target.style.background = '#22c55e'}
                onClick={async () => {
                  await handleSaveTov()
                  setEditingTovModal(false)
                  navigate('/strategy')
                }}
              >
                {t('strategy.buttons.save')}
              </button>
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setEditingTovModal(false)
                  setTovEditText(tov)
                  navigate('/strategy')
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sometilin URL -modaali TOV-analyysille */}
      {tovSocialUrlModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[2001] p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setTovSocialUrlModal(false)
              setTovSocialUrl('')
              setTovSocialUrlError('')
            }
          }}
        >
          <div
            className="bg-white rounded-xl p-6 max-w-[500px] w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="strategy-modal-header">
              <h3 className="strategy-modal-title">
                {t('strategy.toneOfVoice.socialUrlModal.title')}
              </h3>
              <button
                onClick={() => {
                  setTovSocialUrlModal(false)
                  setTovSocialUrl('')
                  setTovSocialUrlError('')
                }}
                className="strategy-modal-close"
                onMouseOver={(e) => e.target.style.background = '#f3f4f6'}
                onMouseOut={(e) => e.target.style.background = 'none'}
              >
                ×
              </button>
            </div>
            
            <div className="mb-5">
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                {t('strategy.toneOfVoice.socialUrlModal.label')}
              </label>
              <input
                type="url"
                value={tovSocialUrl}
                onChange={(e) => handleSocialUrlChange(e.target.value)}
                placeholder={t('strategy.toneOfVoice.socialUrlModal.placeholder')}
                className={`w-full p-3 border-2 rounded-lg text-base font-inherit box-border ${
                  tovSocialUrlError ? 'border-red-500' : 'border-gray-200'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tovSocialUrl.trim() && !tovSocialUrlError) {
                    const validation = validateSocialUrl(tovSocialUrl)
                    if (validation.valid) {
                      handleAnalyzeTovFromSocialMedia(tovSocialUrl)
                    }
                  }
                }}
                autoFocus
              />
              {tovSocialUrlError && (
                <p className="mt-2 text-sm text-red-500">
                  {tovSocialUrlError}
                </p>
              )}
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white border-none rounded-lg py-3 px-6 text-base font-semibold cursor-pointer transition-colors duration-200"
                onClick={() => {
                  setTovSocialUrlModal(false)
                  setTovSocialUrl('')
                  setTovSocialUrlError('')
                }}
              >
                {t('strategy.buttons.cancel')}
              </button>
              <button
                className={`py-3 px-6 text-base font-semibold text-white border-none rounded-lg transition-colors duration-200 ${
                  analyzingTov
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-600 cursor-pointer'
                }`}
                disabled={analyzingTov || !tovSocialUrl.trim() || !!tovSocialUrlError}
                onClick={() => {
                  const validation = validateSocialUrl(tovSocialUrl)
                  if (validation.valid) {
                    handleAnalyzeTovFromSocialMedia(tovSocialUrl)
                  }
                }}
              >
                {analyzingTov ? t('strategy.buttons.analyzing') : t('strategy.buttons.startAnalysis')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  )
}