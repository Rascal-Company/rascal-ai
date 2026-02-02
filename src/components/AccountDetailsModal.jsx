import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AccountDetailsModal({ account, onClose }) {
  const [accountDetails, setAccountDetails] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [activeTab, setActiveTab] = useState('posts')

  useEffect(() => {
    if (account) {
      loadAccountDetails()
    }
  }, [account])

  const loadAccountDetails = async () => {
    if (!account) return

    try {
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
      } else {
        console.log('Loaded strategies:', strategies)
      }

      // Hae yrityksen tiedot
      const { data: companyData, error: companyError } = await supabase
        .from('users')
        .select('company_summary, icp_summary, kpi, tov')
        .eq('id', account.id)
        .single()

      if (companyError) console.error('Error loading company data:', companyError)

      const accountData = {
        posts: posts || [],
        strategies: strategies || [],
        company: companyData || {}
      }
      
      console.log('Account details loaded:', accountData)
      console.log('Strategies count:', accountData.strategies.length)
      
      setAccountDetails(accountData)
    } catch (error) {
      console.error('Error loading account details:', error)
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

  const handleStrategyUpdate = async (strategyId, field, value) => {
    if (!accountDetails) return

    try {
      const { error } = await supabase
        .from('content_strategy')
        .update({ [field]: value })
        .eq('id', strategyId)

      if (error) throw error

      setAccountDetails(prev => ({
        ...prev,
        strategies: prev.strategies.map(strategy => 
          strategy.id === strategyId ? { ...strategy, [field]: value } : strategy
        )
      }))
    } catch (error) {
      console.error('Error updating strategy:', error)
    }
  }

  if (!account || !accountDetails) return null

  return (
    <div className="account-details-overlay" onClick={onClose}>
      <div className="account-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{account.company_name || account.contact_person || 'Tiedot'}</h2>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {saveMessage && (
          <div className={`save-message ${isSaving ? 'saving' : 'saved'}`}>
            {saveMessage}
          </div>
        )}

        <div className="modal-tabs">
          <button
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Postaukset ({accountDetails.posts.length})
          </button>
          <button
            className={`tab ${activeTab === 'strategies' ? 'active' : ''}`}
            onClick={() => setActiveTab('strategies')}
          >
            Strategiat ({accountDetails.strategies.length})
          </button>
          <button
            className={`tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => setActiveTab('company')}
          >
            Yritys
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'posts' && (
            <div className="details-section">
              <div className="items-list">
                {accountDetails.posts.length > 0 ? (
                  accountDetails.posts.map(post => (
                    <div key={post.id} className="editable-item">
                      <div className="item-header">
                        <strong>{post.type || 'Postaus'}</strong>
                        <span className="item-status">{post.status || 'Draft'}</span>
                      </div>
                      
                      <div className="idea-field">
                        <span className="idea-label">Idea:</span>
                        <span className="idea-value">{post.idea || '-'}</span>
                      </div>
                      
                      <label className="field-label">Caption:</label>
                      <textarea
                        value={post.caption || ''}
                        onChange={(e) => handlePostUpdate(post.id, 'caption', e.target.value)}
                        className="editable-textarea"
                        rows="4"
                        placeholder="Caption..."
                      />
                      
                      <div className="item-meta">
                        {post.publish_date && (
                          <span>Julkaisu: {new Date(post.publish_date).toLocaleDateString('fi-FI')}</span>
                        )}
                        <span className="item-date">Luotu: {new Date(post.created_at).toLocaleDateString('fi-FI')}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-items">Ei postauksia</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'strategies' && (
            <div className="details-section">
              <div className="items-list">
                {accountDetails.strategies.length > 0 ? (
                  accountDetails.strategies.map(strategy => (
                    <div key={strategy.id} className="editable-item">
                      <div className="item-header">
                        <strong>{strategy.month || strategy.planner || 'Strategia'}</strong>
                        <span className="item-date">
                          {new Date(strategy.created_at).toLocaleDateString('fi-FI')}
                        </span>
                      </div>
                      <textarea
                        value={strategy.strategy || ''}
                        onChange={(e) => handleStrategyUpdate(strategy.id, 'strategy', e.target.value)}
                        className="editable-textarea"
                        rows="5"
                        placeholder="Strategia..."
                      />
                      <div className="item-actions">
                        <select
                          value={strategy.status || 'Current'}
                          onChange={(e) => handleStrategyUpdate(strategy.id, 'status', e.target.value)}
                          className="status-select"
                        >
                          <option value="Current">Nykyinen</option>
                          <option value="Upcoming">Tuleva</option>
                          <option value="Old">Vanha</option>
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-items">Ei strategioita</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'company' && (
            <>
              <div className="details-section">
                <h3>Yritysyhteenveto</h3>
                <textarea
                  value={accountDetails.company.company_summary || ''}
                  onChange={(e) => handleFieldUpdate('company_summary', e.target.value)}
                  className="editable-textarea"
                  rows="4"
                  placeholder="Yrityksen yhteenveto..."
                />
              </div>

              <div className="details-section">
                <h3>ICP (Ideal Customer Profile)</h3>
                <textarea
                  value={accountDetails.company.icp_summary || ''}
                  onChange={(e) => handleFieldUpdate('icp_summary', e.target.value)}
                  className="editable-textarea"
                  rows="4"
                  placeholder="Ideal Customer Profile..."
                />
              </div>

              <div className="details-section">
                <h3>KPI</h3>
                <textarea
                  value={accountDetails.company.kpi || ''}
                  onChange={(e) => handleFieldUpdate('kpi', e.target.value)}
                  className="editable-textarea"
                  rows="3"
                  placeholder="Key Performance Indicators..."
                />
              </div>

              <div className="details-section">
                <h3>ToV (Tone of Voice)</h3>
                <textarea
                  value={accountDetails.company.tov || ''}
                  onChange={(e) => handleFieldUpdate('tov', e.target.value)}
                  className="editable-textarea"
                  rows="3"
                  placeholder="Tone of Voice..."
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="save-btn"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? 'Tallennetaan...' : 'Tallenna muutokset'}
          </button>
          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Sulje
          </button>
        </div>
      </div>
    </div>
  )
}

