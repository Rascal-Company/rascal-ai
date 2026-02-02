import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import { useToast } from '../contexts/ToastContext'
import { useMonitoring } from '../contexts/MonitoringContext'

const MediaMonitoringPage = () => {
  const [news, setNews] = useState([])
  const [feeds, setFeeds] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedsLoading, setFeedsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [createLoading, setCreateLoading] = useState(false)
  const { hasMonitoring, refreshMonitoringStatus } = useMonitoring()
  const [viewMode, setViewMode] = useState('news') // 'news' tai 'feeds'
  const [showAddFeedModal, setShowAddFeedModal] = useState(false)
  const [feedUrl, setFeedUrl] = useState('')
  const [addFeedLoading, setAddFeedLoading] = useState(false)
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'oldest', 'source-az', 'source-za'
  const navigate = useNavigate()
  const { t } = useTranslation('common')
  const toast = useToast()

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError(t('monitoring.error.authRequired'))
        setLoading(false)
        return
      }

      const response = await axios.get('/api/monitoring/feed', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      const fetchedNews = response.data || []
      setNews(fetchedNews)
    } catch (err) {
      console.error('Error fetching news:', err)
      setError(t('monitoring.error.feedLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePost = (article) => {
    navigate('/monitoring/create', {
      state: {
        sourceUrl: article.url,
        title: article.title,
        body: article.contentSnippet,
        original: article
      }
    })
  }

  const handleMarkRead = async (item) => {
    // Piilota entry näkymästä (status-kenttää ei ole taulussa, joten piilotetaan vain frontendissä)
    setNews(news.filter(n => n.id !== item.id))
  }

  // Sorttaa uutiset valitun sortBy-muuttujan mukaan
  const getSortedNews = () => {
    const sorted = [...news]
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.publishedAt || 0)
          const dateB = new Date(b.publishedAt || 0)
          return dateB - dateA
        })
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.publishedAt || 0)
          const dateB = new Date(b.publishedAt || 0)
          return dateA - dateB
        })
      case 'source-az':
        return sorted.sort((a, b) => {
          const sourceA = (a.feedTitle || '').toLowerCase()
          const sourceB = (b.feedTitle || '').toLowerCase()
          return sourceA.localeCompare(sourceB)
        })
      case 'source-za':
        return sorted.sort((a, b) => {
          const sourceA = (a.feedTitle || '').toLowerCase()
          const sourceB = (b.feedTitle || '').toLowerCase()
          return sourceB.localeCompare(sourceA)
        })
      default:
        return sorted
    }
  }

  const fetchFeeds = async () => {
    try {
      setFeedsLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError(t('monitoring.error.authRequired'))
        setFeedsLoading(false)
        return
      }

      const response = await axios.get('/api/monitoring/feeds', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      setFeeds(response.data || [])
    } catch (err) {
      console.error('Error fetching feeds:', err)
      setError(t('monitoring.error.feedLoadFailed'))
      toast.error(t('monitoring.error.feedLoadFailed'))
    } finally {
      setFeedsLoading(false)
    }
  }

  const handleDeleteFeed = async (feedId, username) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        toast.error(t('monitoring.error.authRequired'))
        return
      }

      await axios.delete('/api/monitoring/delete-feed', {
        data: {
          feed_id: feedId,
          username: username
        },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      toast.success(t('monitoring.deleteFeed.success'))
      // Päivitä feedit-lista
      fetchFeeds()
    } catch (err) {
      console.error('Error deleting feed:', err)
      toast.error(err.response?.data?.error || t('monitoring.deleteFeed.error'))
    }
  }

  const handleAddSources = () => {
    setShowAddFeedModal(true)
  }

  const handleAddFeedSubmit = async (e) => {
    e.preventDefault()
    
    if (!feedUrl || !feedUrl.trim()) {
      toast.error(t('monitoring.addFeed.urlRequired'))
      return
    }

    setAddFeedLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error(t('monitoring.error.authRequired'))
      }

      // Lähetä action N8N:ään feed URL:llä - N8N hoitaa lähteen lisäämisen
      const response = await axios.post(
        '/api/monitoring/manage',
        {
          action: 'add',
          feed_url: feedUrl.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data?.success) {
        toast.success(t('monitoring.addFeed.success'))
        setShowAddFeedModal(false)
        setFeedUrl('')
        // Päivitä feedit-lista hetken kuluttua (anna N8N:lle aikaa hoitaa asiat)
        if (viewMode === 'feeds') {
          setTimeout(() => {
            fetchFeeds()
          }, 2000)
        }
      }
    } catch (err) {
      console.error('Error adding feed:', err)
      setError(err.response?.data?.error || err.message || t('monitoring.addFeed.error'))
      toast.error(err.response?.data?.error || err.message || t('monitoring.addFeed.error'))
    } finally {
      setAddFeedLoading(false)
    }
  }

  const handleCloseAddFeedModal = () => {
    setShowAddFeedModal(false)
    setFeedUrl('')
    setError(null)
  }

  const handleStartMonitoring = async () => {
    setCreateLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error(t('monitoring.error.authRequired'))
      }

      // Lähetä vain action N8N:ään - N8N hoitaa kaiken taian
      const response = await axios.post(
        '/api/monitoring/manage',
        {
          action: 'create'
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.data?.success) {
        // Näytä onnistumisviesti toastissa
        toast.success(t('monitoring.createUser.success'))
        // Päivitä status ja feed uudelleen hetken kuluttua (anna N8N:lle aikaa hoitaa asiat)
        setTimeout(() => {
          refreshMonitoringStatus()
          fetchFeed()
        }, 2000)
      }
    } catch (err) {
      console.error('Error starting media monitoring:', err)
      setError(err.response?.data?.error || err.message || t('monitoring.error.startFailed'))
      toast.error(err.response?.data?.error || err.message || t('monitoring.error.startFailed'))
    } finally {
      setCreateLoading(false)
    }
  }

  return (
    <div className="monitoring-container">
      <div className="monitoring-header">
        <h2>{t('monitoring.title')}</h2>
        <p className="monitoring-subtitle">{t('monitoring.subtitle')}</p>
        <div className="monitoring-header-actions">
          {hasMonitoring ? (
            <>
              <div className="monitoring-tab-group">
                <button
                  className={`monitoring-tab ${viewMode === 'news' ? 'monitoring-tab--active' : ''}`}
                  onClick={() => setViewMode('news')}
                >
                  {t('monitoring.viewNews')}
                </button>
                <button
                  className={`monitoring-tab ${viewMode === 'feeds' ? 'monitoring-tab--active' : ''}`}
                  onClick={() => {
                    setViewMode('feeds')
                    fetchFeeds()
                  }}
                >
                  {t('monitoring.viewFeeds')}
                </button>
              </div>
              <Button
                onClick={handleAddSources}
                variant="primary"
                disabled={createLoading}
              >
                {createLoading ? t('common.loading') : `+ ${t('monitoring.addSources.label')}`}
              </Button>
            </>
          ) : (
            <Button
              onClick={handleStartMonitoring}
              variant="primary"
              disabled={createLoading}
            >
              {createLoading ? t('common.loading') : `+ ${t('monitoring.startMonitoring')}`}
            </Button>
          )}
        </div>
      </div>

      {viewMode === 'feeds' ? (
        <>
          {feedsLoading ? (
            <div className="monitoring-loading">
              <div className="loading-spinner"></div>
              <p>{t('monitoring.loading')}</p>
            </div>
          ) : feeds.length === 0 ? (
            <div className="monitoring-empty">
              <p>{t('monitoring.feeds.empty')}</p>
            </div>
          ) : (
            <div className="monitoring-feeds-list">
              {feeds.map((feed) => (
                <div key={feed.id} className="monitoring-feed-item">
                  <div className="monitoring-feed-content">
                    <h3 className="monitoring-feed-title">{feed.title || feed.feed_url}</h3>
                    {feed.feed_url && (
                      <p className="monitoring-feed-url">{feed.feed_url}</p>
                    )}
                  </div>
                  <button 
                    onClick={() => handleDeleteFeed(feed.id, feed.username)}
                    className="monitoring-feed-delete"
                    title={t('monitoring.deleteFeed.button')}
                    aria-label={t('monitoring.deleteFeed.button')}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {!loading && news.length > 0 && (
            <div className="monitoring-controls">
              <div className="monitoring-controls-left">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="monitoring-sort-select"
                >
                  <option value="newest">{t('monitoring.sort.newest')}</option>
                  <option value="oldest">{t('monitoring.sort.oldest')}</option>
                  <option value="source-az">{t('monitoring.sort.sourceAz')}</option>
                  <option value="source-za">{t('monitoring.sort.sourceZa')}</option>
                </select>
              </div>
              <div className="monitoring-controls-right">
                <Button
                  onClick={fetchFeed}
                  variant="secondary"
                  disabled={loading}
                >
                  {t('monitoring.refresh')}
                </Button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="monitoring-loading">
              <div className="loading-spinner"></div>
              <p>{t('monitoring.loading')}</p>
            </div>
          ) : error ? (
            <div className="monitoring-error">
              <p>{error}</p>
              <Button onClick={fetchFeed} variant="secondary">
                {t('common.retry')}
              </Button>
            </div>
          ) : news.length === 0 ? (
            <div className="monitoring-empty">
              <p>{t('monitoring.empty')}</p>
            </div>
          ) : (
            <div className="monitoring-grid">
              {getSortedNews().map((item) => (
                <div key={item.id} className="monitoring-card">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="monitoring-card-image"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  )}
                  
                  <div className="monitoring-card-content">
                    <span className="monitoring-card-source">
                      {item.feedTitle}
                    </span>
                    <h3 className="monitoring-card-title">
                      <a 
                        href={item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="monitoring-card-link"
                      >
                        {item.title}
                      </a>
                    </h3>
                    {item.contentSnippet && (
                      <p className="monitoring-card-snippet">
                        {item.contentSnippet}
                      </p>
                    )}
                  </div>

                  <div className="monitoring-card-actions">
                    <Button 
                      onClick={() => handleCreatePost(item)}
                      className="monitoring-card-button"
                    >
                      ✨ {t('monitoring.createPost')}
                    </Button>
                    <button 
                      onClick={() => handleMarkRead(item)}
                      className="monitoring-card-close"
                      title={t('monitoring.hide')}
                      aria-label={t('monitoring.hide')}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Lisää feed -modaali */}
      {showAddFeedModal && (
        <div className="monitoring-modal-overlay" onClick={handleCloseAddFeedModal}>
          <div className="monitoring-modal" onClick={(e) => e.stopPropagation()}>
            <div className="monitoring-modal-header">
              <h3>{t('monitoring.addFeed.title')}</h3>
              <button 
                className="monitoring-modal-close"
                onClick={handleCloseAddFeedModal}
                disabled={addFeedLoading}
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="monitoring-modal-error">
                <p>{error}</p>
              </div>
            )}

            <form className="monitoring-modal-form" onSubmit={handleAddFeedSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="feed-url">
                  {t('monitoring.addFeed.urlLabel')}
                  <span className="form-required"> *</span>
                </label>
                <input
                  id="feed-url"
                  type="text"
                  className="form-input"
                  value={feedUrl}
                  onChange={(e) => setFeedUrl(e.target.value)}
                  placeholder={t('monitoring.addFeed.urlPlaceholder')}
                  disabled={addFeedLoading}
                  required
                />
                <p className="form-hint">{t('monitoring.addFeed.urlHint')}</p>
              </div>

              <div className="monitoring-modal-actions">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCloseAddFeedModal}
                  disabled={addFeedLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={addFeedLoading || !feedUrl.trim()}
                >
                  {addFeedLoading ? t('common.loading') : t('monitoring.addFeed.submit')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MediaMonitoringPage
