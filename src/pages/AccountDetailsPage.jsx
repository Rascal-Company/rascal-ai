import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import CompanyTab from '../components/AccountDetailsTabs/CompanyTab'
import StrategiesTab from '../components/AccountDetailsTabs/StrategiesTab'
import PostsTab from '../components/AccountDetailsTabs/PostsTab'
import CallTypesTab from '../components/AccountDetailsTabs/CallTypesTab'
import FeaturesTab from '../components/AccountDetailsTabs/FeaturesTab'
import SocialMediaTab from '../components/AccountDetailsTabs/SocialMediaTab'

export default function AccountDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { organization, user } = useAuth()
  const [account, setAccount] = useState(null)
  const [accountDetails, setAccountDetails] = useState(null)
  const [accountFeatures, setAccountFeatures] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(true)
  const [editingCard, setEditingCard] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [editingStrategy, setEditingStrategy] = useState(null)
  const [strategyEditValues, setStrategyEditValues] = useState({})
  const [editingPost, setEditingPost] = useState(null)
  const [postEditValues, setPostEditValues] = useState({})
  const [editingCallType, setEditingCallType] = useState(null)
  const [callTypeEditValues, setCallTypeEditValues] = useState({})
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(10)
  const [callTypesCurrentPage, setCallTypesCurrentPage] = useState(1)
  const [callTypesPerPage] = useState(10)

  useEffect(() => {
    if (id) {
      loadAccount()
    }
  }, [id])

  useEffect(() => {
    if (account) {
      loadAccountDetails()
    }
  }, [account])

  useEffect(() => {
    // Nollaa paginointi kun vaihdetaan tabia
    setCurrentPage(1)
    setCallTypesCurrentPage(1)
    
    // Lataa featuret uudelleen kun features-tabia avataan
    if (activeTab === 'features' && account) {
      loadFeatures()
    }
  }, [activeTab, account])

  const loadFeatures = async () => {
    if (!account) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('features')
        .eq('id', account.id)
        .single()

      if (error) {
        console.error('Error loading features:', error)
        return
      }

      const features = Array.isArray(data?.features) ? data.features : []
      console.log('Reloaded features for account:', account.id, features)
      setAccountFeatures(features)
    } catch (error) {
      console.error('Error in loadFeatures:', error)
    }
  }

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        if (editingCard) {
          handleCancelEdit()
        } else if (editingStrategy) {
          handleCancelStrategyEdit()
        } else if (editingPost) {
          handleCancelPostEdit()
        } else if (editingCallType) {
          handleCancelCallTypeEdit()
        }
      }
    }

    if (editingCard || editingStrategy || editingPost || editingCallType) {
      document.addEventListener('keydown', handleEsc)
      return () => {
        document.removeEventListener('keydown', handleEsc)
      }
    }
  }, [editingCard, editingStrategy, editingPost, editingCallType])

  const loadAccount = async () => {
    try {
      console.log('[AccountDetailsPage] Haetaan account ID:llä:', id)
      const { data, error } = await supabase
        .from('users')
        .select('id, company_name, contact_person, contact_email')
        .eq('id', id)
        .single()

      if (error) throw error
      console.log('[AccountDetailsPage] Account haettu:', data)
      setAccount(data)
    } catch (error) {
      console.error('Error loading account:', error)
      setLoading(false)
    }
  }

  const loadAccountDetails = async () => {
    if (!account) return

    setLoading(true)
    try {
      console.log('Loading account details for account:', account.id, account.company_name)
      
      // Hae postaukset
      const { data: posts, error: postsError } = await supabase
        .from('content')
        .select(`
          id,
          idea,
          type,
          status,
          created_at,
          updated_at,
          caption,
          media_urls,
          publish_date
        `)
        .eq('user_id', account.id)
        .order('created_at', { ascending: false })

      if (postsError) console.error('Error loading posts:', postsError)

      // Hae strategiat
      const { data: strategies, error: strategiesError } = await supabase
        .from('content_strategy')
        .select('*')
        .eq('user_id', account.id)
        .order('created_at', { ascending: false })

      if (strategiesError) {
        console.error('Error loading strategies:', strategiesError)
      }

      // Hae yrityksen tiedot
      const { data: companyData, error: companyError } = await supabase
        .from('users')
        .select('company_summary, icp_summary, kpi, tov, features, onboarding_completed')
        .eq('id', account.id)
        .single()

      if (companyError) {
        console.error('Error loading company data:', companyError)
      } else {
        // Aseta featuret - varmista että ne ovat aina array
        const features = Array.isArray(companyData?.features) ? companyData.features : []
        console.log('Loaded features for account:', account.id, features)
        setAccountFeatures(features)
      }

      // Hae puhelutyypit
      console.log('Fetching call types for user_id:', account.id)
      const { data: callTypes, error: callTypesError } = await supabase
        .from('call_types')
        .select('*')
        .eq('user_id', account.id)
        .order('created_at', { ascending: false })

      console.log('Call types query result:', { callTypes, error: callTypesError })

      if (callTypesError) {
        console.error('Error loading call types:', callTypesError)
        console.error('Error details:', {
          message: callTypesError.message,
          details: callTypesError.details,
          hint: callTypesError.hint,
          code: callTypesError.code
        })
        // Jos RLS-esto, logitetaan lisätietoja
        if (callTypesError.code === '42501' || callTypesError.message?.includes('permission')) {
          console.error('RLS policy violation - checking session...')
          const { data: { session } } = await supabase.auth.getSession()
          console.log('Current session:', session?.user?.id)
          console.log('Account ID:', account.id)
        }
      } else {
        console.log('Call types loaded successfully:', callTypes, 'Count:', callTypes?.length || 0)
      }

      const accountData = {
        posts: posts || [],
        strategies: strategies || [],
        callTypes: callTypes || [],
        company: companyData || {}
      }
      
      console.log('Account data set:', {
        postsCount: accountData.posts.length,
        strategiesCount: accountData.strategies.length,
        callTypesCount: accountData.callTypes.length,
        callTypes: accountData.callTypes
      })
      setAccountDetails(accountData)
    } catch (error) {
      console.error('Error loading account details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFieldUpdate = (field, value) => {
    if (!accountDetails) return
    
    setAccountDetails(prev => ({
      ...prev,
      company: {
        ...prev.company,
        [field]: value
      }
    }))
  }

  const handleSaveChanges = async () => {
    if (!account || !accountDetails) return

    setIsSaving(true)
    setSaveMessage('')

    try {
      const { error } = await supabase
        .from('users')
        .update({
          company_summary: accountDetails.company.company_summary || '',
          icp_summary: accountDetails.company.icp_summary || '',
          kpi: accountDetails.company.kpi || '',
          tov: accountDetails.company.tov || ''
        })
        .eq('id', account.id)

      if (error) throw error

      setSaveMessage('Muutokset tallennettu!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving changes:', error)
      setSaveMessage('Virhe tallennuksessa')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCard = (field) => {
    setEditingCard(field)
    setEditValues({
      ...editValues,
      [field]: accountDetails.company[field] || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingCard(null)
    setEditValues({})
  }

  const handleEditStrategy = (strategy) => {
    setEditingStrategy(strategy.id)
    setStrategyEditValues({
      strategy: strategy.strategy || '',
      status: strategy.status || 'Current'
    })
  }

  const handleCancelStrategyEdit = () => {
    setEditingStrategy(null)
    setStrategyEditValues({})
  }

  const handleSaveStrategy = async () => {
    if (!accountDetails || !editingStrategy) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('content_strategy')
        .update({
          strategy: strategyEditValues.strategy || '',
          status: strategyEditValues.status || 'Current'
        })
        .eq('id', editingStrategy)

      if (error) throw error

      // Päivitä paikallinen state
      setAccountDetails(prev => ({
        ...prev,
        strategies: prev.strategies.map(strategy => 
          strategy.id === editingStrategy 
            ? { ...strategy, strategy: strategyEditValues.strategy, status: strategyEditValues.status }
            : strategy
        )
      }))

      setEditingStrategy(null)
      setStrategyEditValues({})
      setSaveMessage('Muutokset tallennettu!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving strategy:', error)
      setSaveMessage('Virhe tallennuksessa')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveCard = async (field) => {
    if (!account || !accountDetails) return

    setIsSaving(true)
    try {
      const updateData = {
        [field]: editValues[field] || ''
      }

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', account.id)

      if (error) throw error

      // Päivitä paikallinen state
      setAccountDetails(prev => ({
        ...prev,
        company: {
          ...prev.company,
          [field]: editValues[field] || ''
        }
      }))

      setEditingCard(null)
      setEditValues({})
      setSaveMessage('Muutokset tallennettu!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving card:', error)
      setSaveMessage('Virhe tallennuksessa')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePostUpdate = async (postId, field, value) => {
    if (!accountDetails) return

    try {
      const { error } = await supabase
        .from('content')
        .update({ [field]: value })
        .eq('id', postId)

      if (error) throw error

      setAccountDetails(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === postId ? { ...post, [field]: value } : post
        )
      }))
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const handleEditPost = (post) => {
    setEditingPost(post.id)
    setPostEditValues({
      idea: post.idea || '',
      caption: post.caption || '',
      type: post.type || '',
      status: post.status || 'Draft'
    })
  }

  const handleCancelPostEdit = () => {
    setEditingPost(null)
    setPostEditValues({})
  }

  const handleSavePost = async () => {
    if (!accountDetails || !editingPost) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('content')
        .update({
          idea: postEditValues.idea || '',
          caption: postEditValues.caption || '',
          type: postEditValues.type || '',
          status: postEditValues.status || 'Draft'
        })
        .eq('id', editingPost)

      if (error) throw error

      // Päivitä paikallinen state
      setAccountDetails(prev => ({
        ...prev,
        posts: prev.posts.map(post => 
          post.id === editingPost 
            ? { ...post, ...postEditValues }
            : post
        )
      }))

      setEditingPost(null)
      setPostEditValues({})
      setSaveMessage('Muutokset tallennettu!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving post:', error)
      setSaveMessage('Virhe tallennuksessa')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditCallType = (callType) => {
    setEditingCallType(callType.id)
    setCallTypeEditValues({
      name: callType.name || '',
      agent_name: callType.agent_name || '',
      target_audience: callType.target_audience || '',
      identity: callType.identity || '',
      style: callType.style || '',
      guidelines: callType.guidelines || '',
      goals: callType.goals || '',
      first_line: callType.first_line || '',
      first_sms: callType.first_sms || '',
      intro: callType.intro || '',
      questions: callType.questions || '',
      outro: callType.outro || '',
      notes: callType.notes || '',
      summary: callType.summary || '',
      success_assessment: callType.success_assessment || '',
      action: callType.action || '',
      after_call_sms: callType.after_call_sms || '',
      missed_call_sms: callType.missed_call_sms || ''
    })
  }

  const handleCancelCallTypeEdit = () => {
    setEditingCallType(null)
    setCallTypeEditValues({})
  }

  const handleSaveCallType = async () => {
    if (!accountDetails || !editingCallType) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('call_types')
        .update({
          name: callTypeEditValues.name || '',
          agent_name: callTypeEditValues.agent_name || '',
          target_audience: callTypeEditValues.target_audience || '',
          identity: callTypeEditValues.identity || '',
          style: callTypeEditValues.style || '',
          guidelines: callTypeEditValues.guidelines || '',
          goals: callTypeEditValues.goals || '',
          first_line: callTypeEditValues.first_line || '',
          first_sms: callTypeEditValues.first_sms || '',
          intro: callTypeEditValues.intro || '',
          questions: callTypeEditValues.questions || '',
          outro: callTypeEditValues.outro || '',
          notes: callTypeEditValues.notes || '',
          summary: callTypeEditValues.summary || '',
          success_assessment: callTypeEditValues.success_assessment || '',
          action: callTypeEditValues.action || '',
          after_call_sms: callTypeEditValues.after_call_sms || '',
          missed_call_sms: callTypeEditValues.missed_call_sms || ''
        })
        .eq('id', editingCallType)

      if (error) throw error

      // Päivitä paikallinen state
      setAccountDetails(prev => ({
        ...prev,
        callTypes: prev.callTypes.map(callType => 
          callType.id === editingCallType 
            ? { ...callType, ...callTypeEditValues }
            : callType
        )
      }))

      setEditingCallType(null)
      setCallTypeEditValues({})
      setSaveMessage('Muutokset tallennettu!')
      setTimeout(() => setSaveMessage(''), 3000)
    } catch (error) {
      console.error('Error saving call type:', error)
      setSaveMessage('Virhe tallennuksessa')
      setTimeout(() => setSaveMessage(''), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleFeatureToggle = async (newFeatures) => {
    if (!account) {
      console.error('handleFeatureToggle: account is null')
      return
    }
    
    setIsSaving(true)
    setSaveMessage('')
    
    try {
      // Varmista että newFeatures on array
      const featuresToSave = Array.isArray(newFeatures) ? newFeatures : []

      // Tarkista onko käyttäjä admin/moderator/owner
      // Tarkistetaan SEKÄ system role (users.role) ETTÄ organization role (org_members.role)
      const isSystemAdmin = user?.systemRole === 'admin' || user?.systemRole === 'superadmin' || user?.systemRole === 'moderator'
      const isOrgAdmin = organization?.role === 'admin' || organization?.role === 'owner' || organization?.role === 'moderator'
      const isAdmin = isSystemAdmin || isOrgAdmin

      console.log('[handleFeatureToggle] Permission check:', {
        isSystemAdmin,
        isOrgAdmin,
        isAdmin,
        systemRole: user?.systemRole,
        orgRole: organization?.role,
        userId: account.id
      })
      
      if (isAdmin) {
        // Käytä admin-data endpointia admin-käyttäjille (ohittaa RLS:n)
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          throw new Error('Session expired or invalid')
        }

        const response = await fetch('/api/admin/data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            type: 'update-features',
            user_id: account.id,
            features: featuresToSave
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update features')
        }

        // Päivitä state suoraan tallennettuun arvoon
        setAccountFeatures(featuresToSave)
        setSaveMessage('Ominaisuudet päivitetty!')
        setTimeout(() => setSaveMessage(''), 3000)
      } else {
        // Normaali käyttäjä: käytä suoraa Supabase-kyselyä
        const { error } = await supabase
          .from('users')
          .update({ features: featuresToSave })
          .eq('id', account.id)

        if (error) {
          console.error('Supabase error updating features:', error)
          throw error
        }

        // Päivitä state suoraan tallennettuun arvoon
        setAccountFeatures(featuresToSave)
        setSaveMessage('Ominaisuudet päivitetty!')
        setTimeout(() => setSaveMessage(''), 3000)
      }
    } catch (error) {
      console.error('Error updating features:', error)
      setSaveMessage('Virhe ominaisuuksien päivityksessä: ' + (error.message || 'Tuntematon virhe'))
      setTimeout(() => setSaveMessage(''), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="account-details-page">
        <div className="loading-message">Ladataan tietoja...</div>
      </div>
    )
  }

  if (!account || !accountDetails) {
    return (
      <div className="account-details-page">
        <div className="error-message">Tiliä ei löytynyt</div>
        <button className="back-btn" onClick={() => navigate('/account-manager')}>
          Takaisin
        </button>
      </div>
    )
  }

  return (
    <div className="account-details-page">
      <div className="account-details-header">
        <button className="back-btn" onClick={() => navigate('/account-manager')}>
          ← Takaisin
        </button>
        <h1>{account.company_name || account.contact_person || 'Tiedot'}</h1>
      </div>

      {saveMessage && (
        <div className={`save-message ${isSaving ? 'saving' : 'saved'}`}>
          {saveMessage}
        </div>
      )}

      <div className="page-tabs">
        <button
          className={`tab ${activeTab === 'company' ? 'active' : ''}`}
          onClick={() => setActiveTab('company')}
        >
          Yritys
        </button>
        <button
          className={`tab ${activeTab === 'strategies' ? 'active' : ''}`}
          onClick={() => setActiveTab('strategies')}
        >
          Strategiat ({accountDetails.strategies.length})
        </button>
        <button
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Postaukset ({accountDetails.posts.length})
        </button>
        <button
          className={`tab ${activeTab === 'callTypes' ? 'active' : ''}`}
          onClick={() => setActiveTab('callTypes')}
        >
          Puhelutyypit ({accountDetails.callTypes.length})
        </button>
        <button
          className={`tab ${activeTab === 'features' ? 'active' : ''}`}
          onClick={() => setActiveTab('features')}
        >
          Ominaisuudet ({accountFeatures.length})
        </button>
        <button
          className={`tab ${activeTab === 'socialMedia' ? 'active' : ''}`}
          onClick={() => setActiveTab('socialMedia')}
        >
          Integraatiot
        </button>
      </div>

      <div className="page-body">
        {activeTab === 'company' && (
          <CompanyTab
            company={accountDetails.company}
            editingCard={editingCard}
            editValues={editValues}
            isSaving={isSaving}
            onEdit={handleEditCard}
            onCancel={handleCancelEdit}
            onSave={handleSaveCard}
            onEditValueChange={(field, value) => setEditValues({ ...editValues, [field]: value })}
            orgId={account?.id}
          />
        )}

        {activeTab === 'strategies' && (
          <StrategiesTab
            strategies={accountDetails.strategies}
            editingStrategy={editingStrategy}
            strategyEditValues={strategyEditValues}
            isSaving={isSaving}
            onEdit={handleEditStrategy}
            onCancel={handleCancelStrategyEdit}
            onSave={handleSaveStrategy}
            onEditValueChange={(field, value) => setStrategyEditValues({ ...strategyEditValues, [field]: value })}
          />
        )}

        {activeTab === 'posts' && (
          <PostsTab
            posts={accountDetails.posts}
            editingPost={editingPost}
            postEditValues={postEditValues}
            isSaving={isSaving}
            currentPage={currentPage}
            postsPerPage={postsPerPage}
            onEdit={handleEditPost}
            onCancel={handleCancelPostEdit}
            onSave={handleSavePost}
            onEditValueChange={(field, value) => setPostEditValues({ ...postEditValues, [field]: value })}
            onPageChange={setCurrentPage}
          />
        )}

        {activeTab === 'callTypes' && accountDetails && (
          <CallTypesTab
            callTypes={accountDetails.callTypes || []}
            editingCallType={editingCallType}
            callTypeEditValues={callTypeEditValues}
            isSaving={isSaving}
            currentPage={callTypesCurrentPage}
            callTypesPerPage={callTypesPerPage}
            onEdit={handleEditCallType}
            onCancel={handleCancelCallTypeEdit}
            onSave={handleSaveCallType}
            onEditValueChange={(field, value) => setCallTypeEditValues({ ...callTypeEditValues, [field]: value })}
            onPageChange={setCallTypesCurrentPage}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesTab
            features={accountFeatures}
            isSaving={isSaving}
            onFeatureToggle={handleFeatureToggle}
            userId={account?.id}
          />
        )}

        {activeTab === 'socialMedia' && (
          <SocialMediaTab
            userId={account?.id}
          />
        )}
      </div>
    </div>
  )
}

