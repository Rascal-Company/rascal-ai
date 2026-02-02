import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { createPortal } from 'react-dom'
import axios from 'axios'
// Analytics data haetaan nyt iframe:n kautta
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar, ScatterChart, Scatter, ZAxis, Tooltip, Legend, CartesianGrid } from 'recharts'
import PageHeader from '../components/PageHeader'
import { supabase } from '../lib/supabase'
// CSS Module removed - styles moved to main.css
import { useAuth } from '../contexts/AuthContext'
import PageMeta from '../components/PageMeta'
import AikataulutettuModal from '../components/AikataulutettuModal'
import { useOrgId, useSocialAccounts, useCampaigns } from '../hooks/queries'

function EditPostModal({ post, onClose, onSave }) {
  const { t } = useTranslation('common')
  const [idea, setIdea] = useState(post.Idea || '')
  const [caption, setCaption] = useState(post.Caption || '')
  const [publishDate, setPublishDate] = useState(post["Publish Date"] ? post["Publish Date"].slice(0, 16) : '') // yyyy-MM-ddTHH:mm
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600)

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      const payload = {
        "Record ID": post["Record ID"] || post.id,
        Idea: idea,
        Caption: caption,
        "Publish Date": publishDate,
        updateType: 'postUpdate'
      }
      const res = await fetch('/api/social/posts/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(t('dashboard.edit.saveError'))
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onSave(payload)
      }, 1200)
    } catch (err) {
      setError(t('dashboard.edit.saveError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edit-post-modal-overlay">
      <div className={`edit-post-modal-content ${isMobile ? 'mobile' : ''}`}>
        <div className="edit-post-modal-header">
          <h2 className="edit-post-modal-title">{t('dashboard.edit.title')}</h2>
          <button onClick={onClose} className="edit-post-modal-close">×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-post-form">
          <div className="edit-post-form-group">
            <label>{t('dashboard.edit.ideaLabel')}</label>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="edit-post-form-textarea"
              style={{ minHeight: 80 }}
              placeholder={t('dashboard.edit.ideaPlaceholder')}
            />
          </div>

          <div className="edit-post-form-group">
            <label>{t('dashboard.edit.captionLabel')}</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="edit-post-form-textarea"
              style={{ minHeight: 120 }}
              placeholder={t('dashboard.edit.captionPlaceholder')}
            />
          </div>

          <div className="edit-post-form-group">
            <label>{t('dashboard.edit.publishDateLabel')}</label>
            <input
              type="datetime-local"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="edit-post-form-input"
            />
          </div>

          {error && (
            <div className="dashboard-alert dashboard-alert-error">
              {error || t('dashboard.edit.saveError')}
            </div>
          )}

          {success && (
            <div className="dashboard-alert dashboard-alert-success">
              {t('dashboard.edit.saveSuccess')}
            </div>
          )}

          <div className="edit-post-form-actions">
            <button
              type="button"
              onClick={onClose}
              className="dashboard-btn-secondary"
            >
              {t('dashboard.edit.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="dashboard-btn-primary"
            >
              {saving ? t('dashboard.edit.saving') : t('dashboard.edit.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation('common')
  // Analytics data haetaan nyt iframe:n kautta
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingPost, setEditingPost] = useState(null)
  const [totalCallPrice, setTotalCallPrice] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsData, setStatsData] = useState({
    upcomingCount: 0,
    monthlyCount: 0,
    totalCallPrice: 0,
    totalMessagePrice: 0,
    features: [],
    aiUsage: 0
  })
  
  // Stats data trendeillä - käytetään oikeita tietoja
  const dashboardStats = [
    { 
      label: t('dashboard.metrics.stats.upcomingPosts'), 
      value: statsData.upcomingCount || 0, 
      trend: 12.5, 
      color: '#9ca3af' 
    },
    { 
      label: t('dashboard.metrics.stats.publishedContent'), 
      value: statsData.monthlyCount || 0, 
      trend: -5.2, 
      color: '#9ca3af' 
    },
    { 
      label: t('dashboard.metrics.stats.messageCosts'), 
      value: statsData.totalMessagePrice ? `€${statsData.totalMessagePrice.toFixed(2)}` : '€0.00', 
      trend: 8.7, 
      color: '#9ca3af' 
    },
    { 
      label: t('dashboard.metrics.stats.callCosts'), 
      value: statsData.totalCallPrice ? `€${statsData.totalCallPrice.toFixed(2)}` : '€0.00', 
      trend: 15.3, 
      color: '#9ca3af' 
    }
  ]
  const [schedule, setSchedule] = useState([])
  const [scheduleLoading, setScheduleLoading] = useState(true)
  const { user, organization, loading: authLoading } = useAuth()

  // TanStack Query hooks - vähennetään duplikaatteja
  const { orgId, isLoading: orgLoading } = useOrgId()
  const { socialAccounts } = useSocialAccounts()
  const { campaigns } = useCampaigns()
  const [imageModalUrl, setImageModalUrl] = useState(null)
  const [showScheduledModal, setShowScheduledModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('7days')
  
  // Mixpost Analytics State
  const [mixpostData, setMixpostData] = useState(null)
  const [mixpostLoading, setMixpostLoading] = useState(true)
  const [mixpostTimeFilter, setMixpostTimeFilter] = useState('all') // 'all', 'week', 'month'

  useEffect(() => {
    const fetchMixpostAnalytics = async () => {
      setMixpostLoading(true)
      try {
        // Laske aikaväli filtterista
        const now = new Date()
        let fromDate = null
        let toDate = now.toISOString().split('T')[0]
        
        if (mixpostTimeFilter === 'week') {
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        } else if (mixpostTimeFilter === 'month') {
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        } else if (mixpostTimeFilter === 'last_week') {
          // Viime viikko (7-14 päivää sitten)
          const end = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          const start = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
          toDate = end.toISOString().split('T')[0]
          fromDate = start.toISOString().split('T')[0]
        } else if (mixpostTimeFilter === 'last_month') {
          // Viime kuukausi (30-60 päivää sitten)
          const end = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          const start = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
          toDate = end.toISOString().split('T')[0]
          fromDate = start.toISOString().split('T')[0]
        }
        
        // Kutsu omaa backend-endpointia, joka hoitaa datan haun ja laskennan
        const params = new URLSearchParams()
        
        if (fromDate) {
          params.append('from', fromDate)
          params.append('to', toDate)
        }
        
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token

        if (!token) {
          console.warn('No auth token available for Mixpost analytics')
          setMixpostLoading(false)
          return
        }
        
        const response = await axios.get(`/api/analytics/social-stats?${params.toString()}`, {
          headers: {
            'Authorization': `Bearer ${token}` 
          }
        })
        
        setMixpostData(response.data)
      } catch (error) {
        console.error('Error fetching Mixpost analytics:', error)
        setMixpostData(null)
      } finally {
        setMixpostLoading(false)
      }
    }
    
    fetchMixpostAnalytics()
  }, [mixpostTimeFilter])

  // Analytics filtteröinnit käsitellään iframe:ssä

  // Chart data - käytetään oikeita tietoja Supabase:sta
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(true)
  const [successStats, setSuccessStats] = useState({ total: 0, answered: 0, success: 0, answerRate: 0, successRate: 0, perDay: [] })
  const [campaignMetrics, setCampaignMetrics] = useState([])
  
  // Google Analytics -kävijätiedot
  const [gaConnected, setGaConnected] = useState(false)
  const [gaLoading, setGaLoading] = useState(true)
  const [gaVisitorsFilter, setGaVisitorsFilter] = useState('week') // 'week' tai '30days'
  const [gaVisitorsData, setGaVisitorsData] = useState([]) // Päiväkohtainen data
  const [gaVisitors, setGaVisitors] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    trend: 0
  })
  
  // Hae chart data Supabase:sta
  const fetchChartData = async (timeFilter, userOrgId) => {
    if (!userOrgId) return

    setChartLoading(true)

    try {
      const userId = userOrgId
      const now = new Date()
      let startDate
      
      if (timeFilter === '7days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      
      // Hae puhelut
      const { data: calls } = await supabase
        .from('call_logs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
      
      // Hae viestit
      const { data: messages } = await supabase
        .from('message_logs')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
      
      // Ryhmittele data päivien mukaan
      const groupedData = {}
      
      // Alusta päivät
      if (timeFilter === '7days') {
        const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
        const today = now.getDay()
        for (let i = 6; i >= 0; i--) {
          const dayIndex = (today - i + 7) % 7
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dayKey = days[dayIndex]
          groupedData[dayKey] = { date: dayKey, calls: 0, messages: 0 }
        }
      } else {
        // 30 päivää - viikoittain
        for (let i = 29; i >= 0; i -= 7) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const weekKey = `${date.getDate()}.${date.getMonth() + 1}`
          groupedData[weekKey] = { date: weekKey, calls: 0, messages: 0 }
        }
      }
      
      // Laske puhelut päivittäin
      if (calls) {
        calls.forEach(call => {
          const callDate = new Date(call.created_at)
          if (timeFilter === '7days') {
            const dayIndex = callDate.getDay()
            const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
            const dayKey = days[dayIndex]
            if (groupedData[dayKey]) {
              groupedData[dayKey].calls++
            }
          } else {
            // 30 päivää - viikoittain
            const weekStart = new Date(callDate.getTime() - callDate.getDay() * 24 * 60 * 60 * 1000)
            const weekKey = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`
            if (groupedData[weekKey]) {
              groupedData[weekKey].calls++
            }
          }
        })
      }
      
      // Laske viestit päivittäin
      if (messages) {
        messages.forEach(message => {
          const messageDate = new Date(message.created_at)
          if (timeFilter === '7days') {
            const dayIndex = messageDate.getDay()
            const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
            const dayKey = days[dayIndex]
            if (groupedData[dayKey]) {
              groupedData[dayKey].messages++
            }
          } else {
            // 30 päivää - viikoittain
            const weekStart = new Date(messageDate.getTime() - messageDate.getDay() * 24 * 60 * 60 * 1000)
            const weekKey = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`
            if (groupedData[weekKey]) {
              groupedData[weekKey].messages++
            }
          }
        })
      }
      
      // Muunna objektista array:ksi ja järjestä
      const sortedData = Object.values(groupedData).sort((a, b) => {
        if (timeFilter === '7days') {
          const days = ['Su', 'Ma', 'Ti', 'Ke', 'To', 'Pe', 'La']
          return days.indexOf(a.date) - days.indexOf(b.date)
        } else {
          return a.date.localeCompare(b.date)
        }
      })
      
      setChartData(sortedData)
    } catch (error) {
      console.error('Virhe haettaessa chart dataa:', error)
      // Fallback dummy data jos virhe
      setChartData([
        { date: 'Ma', calls: 0, messages: 0 },
        { date: 'Ti', calls: 0, messages: 0 },
        { date: 'Ke', calls: 0, messages: 0 },
        { date: 'To', calls: 0, messages: 0 },
        { date: 'Pe', calls: 0, messages: 0 },
        { date: 'La', calls: 0, messages: 0 },
        { date: 'Su', calls: 0, messages: 0 }
      ])
    } finally {
      setChartLoading(false)
    }
  }
  
  // Päivitä chartData kun aikaväli muuttuu
  useEffect(() => {
    if (orgId) {
      fetchChartData(selectedTimeFilter, orgId)
    }
  }, [selectedTimeFilter, orgId])

  // Hae onnistumisanalytiikka backendistä
  useEffect(() => {
    const fetchSuccess = async () => {
      if (authLoading || !user) return
      try {
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token
        if (!token) return
        const days = selectedFilter === 'week' ? 7 : selectedFilter === 'month' ? 30 : 30
        const res = await fetch(`/api/analytics/success?days=${encodeURIComponent(days)}`, { headers: { Authorization: `Bearer ${token}` } })
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON')
        }
        
        const json = await res.json()
        setSuccessStats(json)
      } catch (e) {
        console.error('Dashboard: Error fetching success stats:', e)
      }
    }
    fetchSuccess()
  }, [authLoading, user, selectedFilter])

  // Hae scatter- ja heatmap-data backendistä
  useEffect(() => {
    const fetchAdvanced = async () => {
      if (authLoading || !user) return
      try {
        const session = await supabase.auth.getSession()
        // Heatmap ja scatter API-kutsut poistettu
      } catch (_) {}
    }
    fetchAdvanced()
  }, [authLoading, user])

  // Kampanjametriikat lasketaan useCampaigns-hookin datasta (TanStack Query)
  useEffect(() => {
    if (!campaigns || campaigns.length === 0) {
      setCampaignMetrics([])
      return
    }
    const rows = campaigns.map(c => {
      const total = Number(c.total_calls || 0)
      const success = Number(c.successful_calls || 0)
      const successRate = total > 0 ? Math.round((success / total) * 100) : 0
      return { id: c.id, name: c.name, total, successRate }
    })
    setCampaignMetrics(rows)
  }, [campaigns])

  // Platform värit
  const getPlatformColor = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'instagram': return '#e4405f'
      case 'facebook': return '#1877f2'
      case 'tiktok': return '#000000'
      case 'twitter': return '#1da1f2'
      case 'linkedin': return '#0a66c2'
      default: return '#6b7280'
    }
  }

  useEffect(() => {
    if (!imageModalUrl) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setImageModalUrl(null)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageModalUrl])

  // Responsiivinen apu
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    const fetchPosts = async () => {
      if (orgLoading || !orgId) {
        if (!orgLoading && !orgId) {
          setError('Käyttäjän ID ei löytynyt')
          setLoading(false)
        }
        return
      }
      setLoading(true)
      setError(null)

      // Hakee kirjautuneen käyttäjän postaukset - vain käyttäjän omat
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', orgId)
        .order('publish_date', { ascending: false })
      if (error) setError('Virhe haettaessa julkaisuja')
      setPosts(data || [])
      setLoading(false)
    }
    fetchPosts()
  }, [orgLoading, orgId])

  useEffect(() => {
    const fetchCallPrice = async () => {
      if (orgLoading || !orgId) return

      // Hae kuluvan kuukauden puheluiden kokonaishinta - vain käyttäjän omat
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const { data, error } = await supabase
        .from('call_logs')
        .select('price')
        .eq('user_id', orgId)
        .gte('call_date', firstDay.toISOString())
        .lte('call_date', lastDay.toISOString())
      if (!error && data) {
        const sum = data.reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0)
        setTotalCallPrice(sum)
      } else {
        setTotalCallPrice(0)
      }
    }
    fetchCallPrice()
  }, [orgLoading, orgId])

  useEffect(() => {
    const fetchStats = async () => {
      if (authLoading || !user) {
        setStatsLoading(false)
        return
      }

      setStatsLoading(true)
      try {
        // Hae tilastot optimoidusti backend-endpointista
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token
        
        if (!token) {
          console.error('No auth token available')
          setStatsLoading(false)
          return
        }

        const response = await fetch('/api/analytics/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Response is not JSON')
        }

        const data = await response.json()
        
        setStatsData({
          upcomingCount: data.upcomingCount || 0,
          monthlyCount: data.monthlyCount || 0,
          totalCallPrice: data.totalCallPrice || 0,
          totalMessagePrice: data.totalMessagePrice || 0,
          features: data.features || organization?.data?.features || [],
          aiUsage: data.aiUsage || 0
        })
      } catch (e) {
        console.error('Error fetching stats:', e)
        setError('Virhe tilastojen lataamisessa')
      } finally {
        setStatsLoading(false)
      }
    }
    fetchStats()
  }, [authLoading, user, organization])

  // Social accounts haetaan nyt useSocialAccounts-hookilla (TanStack Query)

  // Hae Google Analytics -kävijätiedot
  useEffect(() => {
    const fetchGAVisitors = async () => {
      if (authLoading || !user?.id) {
        setGaLoading(false)
        return
      }

      setGaLoading(true)
      try {
        const session = await supabase.auth.getSession()
        const token = session?.data?.session?.access_token
        if (!token) {
          setGaLoading(false)
          return
        }

        // Hae data riippuen filtteristä
        const days = gaVisitorsFilter === 'week' ? 7 : 30
        const response = await axios.get(`/api/analytics/visitors?days=${days}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.data.connected) {
          setGaConnected(true)
          if (response.data.visitors) {
            setGaVisitors(response.data.visitors)
          }
          if (response.data.data) {
            setGaVisitorsData(response.data.data)
          }
        } else {
          setGaConnected(false)
        }
      } catch (error) {
        console.error('Error fetching GA visitors:', error)
        setGaConnected(false)
      } finally {
        setGaLoading(false)
      }
    }
    fetchGAVisitors()
  }, [authLoading, user?.id, gaVisitorsFilter])

  useEffect(() => {
    const fetchSchedule = async () => {
      if (orgLoading || !orgId) {
        if (!orgLoading) {
          setSchedule([])
          setScheduleLoading(false)
        }
        return
      }

      setScheduleLoading(true)
      try {
        const userId = orgId

        // Hae tulevat julkaisut Supabasesta
        const { data: supabaseData, error } = await supabase
          .from('content')
          .select('id, type, idea, status, publish_date, created_at, media_urls, caption')
          .eq('user_id', userId)
          .order('publish_date', { ascending: true, nullsFirst: true })
          .limit(20)

        if (error) {
          console.error('Error fetching schedule:', error)
        }

        // Hae myös Mixpost-postaukset (käytetään axiosia kuten ManagePostsPage)
        let mixpostData = []
        try {
          const session = await supabase.auth.getSession()
          const token = session.data.session?.access_token
          
          if (!token) {
            console.error('No auth token available for Mixpost API')
            mixpostData = []
          } else {
            const response = await axios.get('/api/integrations/mixpost/posts', {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              }
            })
            
            const mixpostPosts = response.data
            
            // Käännä statusit suomeksi
            const statusMap = {
              'published': 'Julkaistu',
              'scheduled': 'Aikataulutettu', 
              'draft': t('status.draft'),
              'failed': 'Epäonnistui'
            }
            
            // Tarkista että mixpostPosts on array
            if (!Array.isArray(mixpostPosts)) {
              console.warn('Mixpost API returned non-array data:', mixpostPosts)
              mixpostData = []
            } else {
              // Muunna kaikki Mixpost-postaukset samaan muotoon kuin Supabase-data
              // HUOM: API palauttaa publishDate (camelCase), muunnetaan publish_date:ksi
              mixpostData = mixpostPosts
                .filter(post => post && post.publishDate) // Vain postaukset joilla on julkaisupäivä
                .map(post => ({
                  id: post.id,
                  type: 'Mixpost',
                  idea: post.title || post.caption?.slice(0, 80) || 'Postaus',
                  status: statusMap[post.status] || post.status,
                  publish_date: post.publishDate, // API:sta tuleva publishDate -> publish_date
                  publishDate: post.publishDate, // Säilytetään myös alkuperäinen
                  created_at: post.createdAt,
                  media_urls: post.thumbnail ? [post.thumbnail] : [],
                  caption: post.caption,
                  source: 'mixpost',
                  accounts: post.accounts || [],
                  channelNames: post.channelNames || []
                }))
            }
          }
        } catch (mixpostError) {
          console.error('Error fetching Mixpost posts:', mixpostError)
        }

        // Yhdistä Supabase ja Mixpost data
        const allSchedule = [...(supabaseData || []), ...mixpostData]
        setSchedule(allSchedule)
      } catch (e) {
        console.error('Error in fetchSchedule:', e)
        setSchedule([])
      } finally {
        setScheduleLoading(false)
      }
    }
    fetchSchedule()
  }, [orgLoading, orgId, t])




  const handleSavePost = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post.id === updatedPost["Record ID"] || post["Record ID"] === updatedPost["Record ID"]
          ? { ...post, ...updatedPost }
          : post
      )
    )
    setEditingPost(null)
  }


  // Laske tulevat postaukset (seuraavat 7 päivää)
  const now = new Date()
  const weekFromNow = new Date()
  weekFromNow.setDate(now.getDate() + 7)
  const upcomingCount = posts.filter(post => {
    const date = post.publish_date ? new Date(post.publish_date) : null
    return date && date > now && date < weekFromNow
  }).length

  // Laske julkaisut kuluvassa kuukaudessa (created_at mukaan)
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const monthlyCount = posts.filter(post => {
    const date = post.created_at ? new Date(post.created_at) : null
    return date && date.getMonth() === thisMonth && date.getFullYear() === thisYear
  }).length

  const statusMap = {
    'Draft': t('dashboard.status.Draft'),
    'In Progress': t('dashboard.status.In Progress'),
    'Under Review': t('dashboard.status.Under Review'),
    'Scheduled': t('dashboard.status.Scheduled'),
    'Done': t('dashboard.status.Done'),
    'Deleted': t('dashboard.status.Deleted'),
    'Odottaa': t('dashboard.status.Odottaa'),
    'Pending': t('dashboard.status.Pending'),
  }

  function formatDate(dateStr) {
    if (!dateStr) return '--'
    const d = new Date(dateStr)
    const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-US'
    return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const stats = [
    { label: t('dashboard.metrics.stats.upcomingPosts'), value: statsData.upcomingCount, sub: `${t('dashboard.upcoming.headers.status')}: ${t('dashboard.status.Scheduled')}` , color: '#22c55e' },
    { label: t('dashboard.metrics.stats.monthlyPosts'), value: `${statsData.monthlyCount} / 30`, sub: t('dashboard.monthly.headers.thisMonth'), color: '#2563eb' },
    { label: t('dashboard.metrics.stats.totalCallPrice'), value: statsData.totalCallPrice.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), sub: t('dashboard.monthly.headers.thisMonth'), color: '#f59e42' },
    { label: t('dashboard.metrics.stats.totalMessagePrice'), value: statsData.totalMessagePrice.toLocaleString('fi-FI', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }), sub: t('dashboard.monthly.headers.thisMonth'), color: '#059669' },
  ]

  // Aikataulu-kortin data: näytetään vain tulevat julkaisut (publish_date >= nyt)
  const nowDate = new Date()
  
  // Tulevat julkaisut -kortin data: media_urls ja caption mukaan
  const upcomingPosts = (schedule || []).filter(row => {
    if (!row.publish_date) {
      return false
    }
    // Tarkista onko jo UTC-muodossa (sisältää Z tai +)
    const dateStr = row.publish_date
    let publishDate
    if (dateStr.includes('Z') || dateStr.includes('+')) {
      publishDate = new Date(dateStr)
    } else {
      // Lisää Z jotta tulkitaan UTC:nä
      publishDate = new Date(dateStr.replace(' ', 'T') + 'Z')
    }
    const isFuture = publishDate >= nowDate
    if (!isFuture) {
    }
    return isFuture
  }).sort((a, b) => {
    const dateA = a.publish_date.includes('Z') || a.publish_date.includes('+') 
      ? new Date(a.publish_date) 
      : new Date(a.publish_date.replace(' ', 'T') + 'Z')
    const dateB = b.publish_date.includes('Z') || b.publish_date.includes('+')
      ? new Date(b.publish_date)
      : new Date(b.publish_date.replace(' ', 'T') + 'Z')
    return dateA - dateB
  })
  

  function renderMediaCell(row) {
    const urls = row.media_urls || []
    const url = Array.isArray(urls) ? urls[0] : (typeof urls === 'string' ? urls : null)
    if (url) {
      return (
        <img
          src={url}
          alt="media"
          className="dashboard-media-thumbnail"
          onClick={() => setImageModalUrl(url)}
        />
      )
    }
    return <div className="dashboard-media-placeholder">–</div>
  }

  function formatUpcomingDate(dateStr) {
    if (!dateStr) return '--'
    // Tarkista onko jo UTC-muodossa (sisältää Z tai +)
    let d
    if (dateStr.includes('Z') || dateStr.includes('+')) {
      d = new Date(dateStr)
    } else {
      // Lisää Z jotta tulkitaan UTC:nä
      d = new Date(dateStr.replace(' ', 'T') + 'Z')
    }
    
    // Muunna Europe/Helsinki aikavyöhykkeeseen vertailua varten
    const helsinkiDate = new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
    const now = new Date()
    
    // Hae kellonaika
    const timeStr = d.toLocaleString('fi-FI', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Helsinki'
    })
    
    if (
      helsinkiDate.getDate() === now.getDate() &&
      helsinkiDate.getMonth() === now.getMonth() &&
      helsinkiDate.getFullYear() === now.getFullYear()
    ) {
      return `${t('dashboard.upcoming.today')} klo ${timeStr}`
    }
    const locale = i18n.language === 'fi' ? 'fi-FI' : 'en-US'
    return d.toLocaleString(locale, { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Helsinki'
    })
  }

  const handleScheduledPostClick = (post) => {
    setSelectedPost(post)
    setShowScheduledModal(true)
  }

  const handleCloseScheduledModal = () => {
    setShowScheduledModal(false)
    setSelectedPost(null)
  }

  const handleSaveScheduledPost = async (updatedPost) => {
    // Päivitä schedule-lista
    setSchedule(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p))
    setShowScheduledModal(false)
    setSelectedPost(null)
  }

  return (
    <>
      <PageMeta 
        title={t('dashboard.meta.title')}
        description={t('dashboard.meta.description')}
        image="/hero.png"
      />
      <div className={'dashboard-container'}>
        <div className={'dashboard-header'}>
          <h1>{t('dashboard.header.title')}</h1>
          <p>{t('dashboard.header.subtitle')}</p>
        </div>
        {/* Metrics Section - VAPIn tyylillä */}
        <div className={'dashboard-metrics-section'}>
          <div className={'dashboard-metrics-header'}>
            <h2>{t('dashboard.metrics.title')}</h2>
            <div className={'dashboard-metrics-filters'}>
              <button 
                className={'dashboard-filter-btn' + ' ' + (selectedFilter === 'all' ? 'filter-active' : '')}
                onClick={() => setSelectedFilter('all')}
              >
                {t('dashboard.metrics.filters.all')}
              </button>
              <button 
                className={'dashboard-filter-btn' + ' ' + (selectedFilter === 'week' ? 'filter-active' : '')}
                onClick={() => setSelectedFilter('week')}
              >
                {t('dashboard.metrics.filters.week')}
              </button>
              <button 
                className={'dashboard-filter-btn' + ' ' + (selectedFilter === 'month' ? 'filter-active' : '')}
                onClick={() => setSelectedFilter('month')}
              >
                {t('dashboard.metrics.filters.month')}
              </button>
            </div>
          </div>
          
          <div className={'dashboard-metrics-grid'}>
            {statsLoading || (gaConnected && gaLoading) ? (
              Array(gaConnected ? 8 : 6).fill(0).map((_, i) => (
                <div key={i} className={'dashboard-metric-card'}>
                  <div className={'dashboard-metric-skeleton'}>
                    <div className="dashboard-skeleton-block" style={{ height: 16, width: 100 }}></div>
                    <div className="dashboard-skeleton-block" style={{ height: 32, width: 80, margin: '12px 0' }}></div>
                    <div className="dashboard-skeleton-block" style={{ height: 14, width: 60 }}></div>
                  </div>
                </div>
              ))
            ) : (
              [
                ...dashboardStats,
                { label: t('dashboard.metrics.stats.successCalls'), value: successStats.success || 0, trend: successStats.successRate || 0, color: '#22c55e' },
                { label: t('dashboard.metrics.stats.answerRate'), value: `${successStats.answerRate || 0}%`, trend: successStats.answerRate || 0, color: '#2563eb' },
                // Google Analytics -kävijätiedot (näytetään vain jos yhdistetty)
                ...(gaConnected && !gaLoading ? [
                  {
                    label: gaVisitorsFilter === 'week' ? t('dashboard.visitors.thisWeek') : t('dashboard.visitors.last30Days'),
                    value: gaVisitorsFilter === 'week' 
                      ? gaVisitors.thisWeek.toLocaleString('fi-FI')
                      : gaVisitors.total.toLocaleString('fi-FI'),
                    trend: gaVisitors.trend || 0,
                    color: '#9ca3af'
                  },
                  {
                    label: t('dashboard.visitors.today'),
                    value: gaVisitors.today.toLocaleString('fi-FI'),
                    trend: 0, // Ei trendiä tänään-kortissa
                    color: '#9ca3af',
                    noTrend: true // Merkitään että trendiä ei näytetä
                  }
                ] : [])
              ].map((stat, i) => (
                <div key={i} className={'dashboard-metric-card'}>
                  <div className={'dashboard-metric-label'}>{stat.label}</div>
                  <div className={'dashboard-metric-value'}>{stat.value}</div>
                  {stat.noTrend ? (
                    <div className={'dashboard-metric-trend'}>
                      <span className={'dashboard-trend-text'}>
                        {t('dashboard.visitors.todayDescription')}
                      </span>
                    </div>
                  ) : (
                    <div className={'dashboard-metric-trend'}>
                      <span className={'dashboard-trend-icon' + ' ' + (stat.trend > 0 ? 'dashboard-trend-up' : 'dashboard-trend-down')}>
                        {stat.trend > 0 ? '↗' : '↘'}
                      </span>
                      <span className={'dashboard-trend-text'}>
                        {Math.abs(stat.trend)}% {stat.trend > 0 ? t('dashboard.metrics.stats.trendUpSuffix') : t('dashboard.metrics.stats.trendDownSuffix')}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Filtterit kävijätiedoille - näytetään vain jos Google Analytics on yhdistetty */}
          {gaConnected && (
            <div className={'dashboard-metrics-filters mt-4 justify-start'}>
              <button 
                className={'dashboard-filter-btn' + ' ' + (gaVisitorsFilter === 'week' ? 'filter-active' : '')}
                onClick={() => setGaVisitorsFilter('week')}
              >
                {t('dashboard.visitors.filters.thisWeek')}
              </button>
              <button 
                className={'dashboard-filter-btn' + ' ' + (gaVisitorsFilter === '30days' ? 'filter-active' : '')}
                onClick={() => setGaVisitorsFilter('30days')}
              >
                {t('dashboard.visitors.filters.last30Days')}
              </button>
            </div>
          )}
        </div>

        <div className={'dashboard-bentogrid'}>
          
          {/* Poistetaan Engagement Analytics -kortti kokonaan */}
          {/*
          <div className={'dashboard-card'} style={{ gridColumn: 'span 2', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#374151', marginBottom: 12 }}>Engagement Analytics</div>
            <div style={{ width: '100%', height: 120, background: 'linear-gradient(90deg,#22c55e22,#2563eb22)', borderRadius: 12, display: 'flex', alignItems: 'flex-end', gap: 8, padding: 16 }}>
              {[40, 60, 80, 50, 90, 70, 100, 60, 80, 50, 70, 90].map((v, i) => (
                <div key={i} style={{ flex: 1, height: v, background: '#22c55e', borderRadius: 6, minWidth: 8 }}></div>
              ))}
            </div>
            <div style={{ color: '#6b7280', fontSize: 13, marginTop: 8 }}>Dummy chart – korvaa oikealla myöhemmin</div>
          </div>
          */}
          {/* Mixpost Analytics Section */}
          <div className={'dashboard-card dashboard-card-span-3'}>
            <div className="dashboard-metrics-header mb-4">
              <div className="dashboard-card-title mb-0">
                {t('dashboard.mixpost.title')}
              </div>
              <div className="dashboard-metrics-filters">
                <button
                  onClick={() => setMixpostTimeFilter('all')}
                  className={'dashboard-filter-btn' + (mixpostTimeFilter === 'all' ? ' filter-active' : '')}
                >
                  {t('dashboard.metrics.filters.all')}
                </button>
                <button
                  onClick={() => setMixpostTimeFilter('week')}
                  className={'dashboard-filter-btn' + (mixpostTimeFilter === 'week' ? ' filter-active' : '')}
                >
                  {t('dashboard.metrics.filters.week')}
                </button>
                <button
                  onClick={() => setMixpostTimeFilter('month')}
                  className={'dashboard-filter-btn' + (mixpostTimeFilter === 'month' ? ' filter-active' : '')}
                >
                  {t('dashboard.metrics.filters.month')}
                </button>
                <button
                  onClick={() => setMixpostTimeFilter('last_week')}
                  className={'dashboard-filter-btn' + (mixpostTimeFilter === 'last_week' ? ' filter-active' : '')}
                >
                  {t('dashboard.metrics.filters.last_week')}
                </button>
                <button
                  onClick={() => setMixpostTimeFilter('last_month')}
                  className={'dashboard-filter-btn' + (mixpostTimeFilter === 'last_month' ? ' filter-active' : '')}
                >
                  {t('dashboard.metrics.filters.last_month')}
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="dashboard-mixpost-grid">
              {mixpostLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <div key={i} className="dashboard-mixpost-metric" style={{ background: '#f9fafb' }}>
                    <div className="dashboard-skeleton-block" style={{ height: 14, width: 100, marginBottom: 12 }}></div>
                    <div className="dashboard-skeleton-block" style={{ height: 28, width: 60 }}></div>
                  </div>
                ))
              ) : (() => {
                const metrics = mixpostData
                if (!metrics) return <div>{t('dashboard.mixpost.noData')}</div>

                return [
                  { label: t('dashboard.mixpost.metrics.fbEngagements'), value: (metrics.fbEngagements ?? 0).toLocaleString('fi-FI'), color: '#1877f2' },
                  { label: t('dashboard.mixpost.metrics.fbImpressions'), value: (metrics.fbImpressions ?? 0).toLocaleString('fi-FI'), color: '#1877f2' },
                  { label: t('dashboard.mixpost.metrics.igReach'), value: (metrics.igReach ?? 0).toLocaleString('fi-FI'), color: '#e4405f' },
                  { label: t('dashboard.mixpost.metrics.igFollowers'), value: (metrics.igFollowers ?? 0).toLocaleString('fi-FI'), color: '#e4405f' }
                ].map((metric, i) => (
                  <div key={i} className="dashboard-mixpost-metric">
                    <div className="dashboard-mixpost-metric-label">{metric.label}</div>
                    <div className="dashboard-mixpost-metric-value">{metric.value}</div>
                    <div className="dashboard-mixpost-metric-bar" style={{ background: metric.color }}></div>
                  </div>
                ))
              })()}
            </div>
          </div>

          {/* Tulevat julkaisut -kortti: mobiiliystävällinen */}
          <div className={'dashboard-card dashboard-card-span-3'}>
            <div className="dashboard-card-title">{t('dashboard.upcoming.title')}</div>
            <div className="dashboard-table-container">
              <table className="dashboard-table">
                <thead className="dashboard-table-head">
                  <tr>
                    <th>{t('dashboard.upcoming.headers.media')}</th>
                    <th>{t('dashboard.upcoming.headers.caption')}</th>
                    <th>{t('dashboard.upcoming.headers.channels')}</th>
                    <th>{t('dashboard.upcoming.headers.status')}</th>
                    <th>{t('dashboard.upcoming.headers.date')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={5}>
                          <div className="dashboard-skeleton-block" style={{ height: 48 }}></div>
                        </td>
                      </tr>
                    ))
                  ) : upcomingPosts.length === 0 ? (
                    <tr><td colSpan={5} className="dashboard-table-empty">{t('dashboard.upcoming.empty')}</td></tr>
                  ) : (
                    upcomingPosts.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handleScheduledPostClick(row)}
                        className="dashboard-table-row-clickable"
                      >
                        <td className="dashboard-table-cell">{renderMediaCell(row)}</td>
                        <td className="dashboard-table-cell-caption">
                          <div className="dashboard-caption-text">
                            {row.caption || '--'}
                          </div>
                        </td>
                        <td className="dashboard-table-cell-nowrap">
                          {(() => {
                            if (row.accounts && row.accounts.length > 0) {
                              return (
                                <div className="dashboard-channels-list">
                                  {row.accounts.map((acc, idx) => {
                                    const accountId = acc.id || acc.account_id
                                    const supabaseAccount = socialAccounts.find(sa =>
                                      sa.mixpost_account_uuid === String(accountId)
                                    )

                                    const name = supabaseAccount?.username
                                      ? `@${supabaseAccount.username}`
                                      : supabaseAccount?.account_name
                                      || acc.name
                                      || (acc.username ? `@${acc.username}` : null)
                                      || (acc.provider ? acc.provider.charAt(0).toUpperCase() + acc.provider.slice(1) : null)

                                    return name ? (
                                      <span key={idx} className="dashboard-channel-badge">
                                        {name}
                                      </span>
                                    ) : null
                                  })}
                                </div>
                              )
                            }
                            return '--'
                          })()}
                        </td>
                        <td className="dashboard-table-cell-nowrap">{statusMap[row.status] || row.status || '--'}</td>
                        <td className="dashboard-table-cell-nowrap">{formatUpcomingDate(row.publish_date)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Kampanjat – onnistumiset */}
          <div className={'dashboard-card dashboard-card-span-3'}>
            <div className="dashboard-card-title">{t('dashboard.campaigns.title')}</div>
            <div className="dashboard-table-container">
              <table className="dashboard-table" style={{ minWidth: 'min(520px, 100%)' }}>
                <thead className="dashboard-table-head">
                  <tr>
                    <th>{t('dashboard.campaigns.headers.campaign')}</th>
                    <th>{t('dashboard.campaigns.headers.calls')}</th>
                    <th>{t('dashboard.campaigns.headers.successRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignMetrics.length === 0 ? (
                    <tr><td colSpan={3} className="dashboard-table-empty">{t('dashboard.campaigns.noCampaigns')}</td></tr>
                  ) : (
                    campaignMetrics.slice(0, 6).map(row => (
                      <tr key={row.id} className="dashboard-table-row">
                        <td className="dashboard-table-cell">{row.name}</td>
                        <td className="dashboard-table-cell">{row.total}</td>
                        <td className="dashboard-table-cell">{row.successRate}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        {/* Heatmap */}
        {/* Heatmap ja scatter kaaviot poistettu */}
        
        {/* Grafiikki Section - VAPIn tyylillä */}
        <div className={'dashboard-chart-section'}>
          <div className={'dashboard-chart-header'}>
            <h2>{t('dashboard.charts.title')}</h2>
            <div className={'dashboard-chart-filters'}>
              <button 
                className={'dashboard-filter-btn' + ' ' + (selectedTimeFilter === '7days' ? 'filter-active' : '')}
                onClick={() => setSelectedTimeFilter('7days')}
              >
                {t('dashboard.metrics.filters.days7')}
              </button>
              <button 
                className={'dashboard-filter-btn' + ' ' + (selectedTimeFilter === '30days' ? 'filter-active' : '')}
                onClick={() => setSelectedTimeFilter('30days')}
              >
                {t('dashboard.metrics.filters.days30')}
              </button>
            </div>
          </div>
          
          <div className={'dashboard-chart-container'}>
            {chartLoading ? (
              <div className={'dashboard-chart-skeleton'}>
                <div className="dashboard-skeleton-block" style={{ height: 200, width: '100%' }}></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="calls" 
                    stroke="#9ca3af" 
                    strokeWidth={3}
                    dot={{ fill: '#9ca3af', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="messages" 
                    stroke="#374151" 
                    strokeWidth={3}
                    dot={{ fill: '#374151', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {imageModalUrl && createPortal(
        <div
          className="modal-overlay modal-overlay--dark"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setImageModalUrl(null)
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              setImageModalUrl(null)
            }
          }}
        >
          <div className="modal-container dashboard-image-modal-content">
            <img
              src={imageModalUrl}
              alt="media"
              className="dashboard-image-modal-img"
            />
          </div>
        </div>,
        document.body
      )}

      {/* Aikataulutettu Modal */}
      {showScheduledModal && selectedPost && (
        <AikataulutettuModal
          editingPost={selectedPost}
          onClose={handleCloseScheduledModal}
          onSave={handleSaveScheduledPost}
        />
      )}
    </>
  )
} 