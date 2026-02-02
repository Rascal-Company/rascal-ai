import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../utils/userApi'
import { useAuth } from '../../contexts/AuthContext'

const getProviderLabel = (provider) => {
  const labels = {
    'linkedin': 'LinkedIn',
    'facebook': 'Facebook',
    'instagram': 'Instagram',
    'twitter': 'Twitter',
    'tiktok': 'TikTok',
    'wordpress_api_key': 'WordPress',
    'google_analytics_credentials': 'Google Analytics'
  }
  return labels[provider] || provider
}

const getProviderIcon = (provider) => {
  const icons = {
    'linkedin': '💼',
    'facebook': '📘',
    'instagram': '📷',
    'twitter': '🐦',
    'tiktok': '🎵',
    'wordpress_api_key': '📝',
    'google_analytics_credentials': '📊'
  }
  return icons[provider] || '🔗'
}

const getSecretTypeLabel = (secretType) => {
  const labels = {
    'wordpress_api_key': 'WordPress',
    'google_analytics_credentials': 'Google Analytics'
  }
  return labels[secretType] || secretType
}

export default function SocialMediaTab({ userId }) {
  const { user, organization } = useAuth()
  const [socialAccounts, setSocialAccounts] = useState([])
  const [secrets, setSecrets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userId) {
      loadAllIntegrations()
    }
  }, [userId])

  const loadAllIntegrations = async () => {
    if (!userId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Tarkista Supabase-yhteys
      const { data: { session } } = await supabase.auth.getSession()
      
      // Tarkista onko käyttäjä admin/moderator
      // Käytä ensisijaisesti AuthContextin organization-roolia (ei ylimääräistä kyselyä)
      let isAdminOrModerator = false
      if (organization?.role) {
        isAdminOrModerator =
          organization.role === 'admin' ||
          organization.role === 'moderator' ||
          organization.role === 'owner' ||
          organization.id === 1
      } else if (session?.user?.id) {
        // Fallback: hae rooli users-taulusta, jos organization ei ole vielä ladattu
        // Hae käyttäjätiedot API:n kautta
        const userData = await getCurrentUser()

        if (userData) {
          isAdminOrModerator =
            userData.role === 'admin' ||
            userData.role === 'moderator' ||
            userData.role === 'owner' ||
            userData.company_id === 1
        }
      }
      
      let socialData = []
      let secretsData = []
      
      if (isAdminOrModerator && session?.access_token) {
        // Käytä API-endpointia admin/moderator roolilla
        try {
          const apiUrl = `/api/admin/data?type=integrations&user_id=${userId}`
          
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          })
          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`API error: ${response.status} - ${errorText}`)
          }
          
          const result = await response.json()
          socialData = result.socialAccounts || []
          secretsData = result.secrets || []
        } catch (apiError) {
          // Fallback: yritä suoraa Supabase-kyselyä
          throw apiError
        }
      } else {
        // Normaali käyttäjä: käytä suoraa Supabase-kyselyä
        const { data: socialDataResult, error: socialError } = await supabase
          .from('user_social_accounts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_authorized', true)
          .order('last_synced_at', { ascending: false })

        if (socialError) {
          console.error('[SocialMediaTab] ❌ Virhe sometilien lataamisessa:', socialError)
          socialData = []
        } else {
          socialData = socialDataResult || []
        }
        
        // Hae muut integraatiot (user_secrets)
        const { data: secretsDataResult, error: secretsError } = await supabase
          .from('user_secrets')
          .select('id, user_id, secret_type, secret_name, metadata, is_active, created_at, updated_at')
          .eq('user_id', userId)
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (secretsError) {
          console.error('[SocialMediaTab] ❌ Virhe integraatioiden lataamisessa:', secretsError)
          secretsData = []
        } else {
          secretsData = secretsDataResult || []
        }
      }
      
      // Aseta haetut tiedot
      setSocialAccounts(socialData || [])
      setSecrets(secretsData || [])

    } catch (err) {
      setError(`Virhe integraatioiden lataamisessa: ${err.message}`)
      setSocialAccounts([])
      setSecrets([])
    } finally {
      setLoading(false)
    }
  }

  const totalIntegrations = socialAccounts.length + secrets.length

  if (loading) {
    return (
      <div className="social-media-tab-container">
        <div className="loading-message">Ladataan integraatioita...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="social-media-tab-container">
        <div className="error-message">{error}</div>
        <button className="retry-btn" onClick={loadAllIntegrations}>
          Yritä uudelleen
        </button>
      </div>
    )
  }

  return (
    <div className="social-media-tab-container">
      <div className="social-media-description">
        <p>Näkyvissä ovat tämän tilin kiinnitetyt integraatiot. Somet-tilit haetaan Mixpostista, muut integraatiot tallennetaan salattuna tietokantaan.</p>
      </div>

      {totalIntegrations === 0 ? (
        <div className="no-accounts-message">
          <div className="no-accounts-icon">🔗</div>
          <h3>Ei kiinnitettyjä integraatioita</h3>
          <p>Tälle tilille ei ole vielä kiinnitetty yhtään integraatiota.</p>
        </div>
      ) : (
        <>
          {/* Somet-tilit */}
          {socialAccounts.length > 0 && (
            <div className="integrations-section">
              <h3 className="section-title">Sosiaalisen median tilit ({socialAccounts.length})</h3>
              <div className="social-accounts-grid">
                {socialAccounts.map((account) => (
                  <div key={account.id} className="social-account-card">
                    <div className="account-header">
                      <div className="account-avatar">
                        {account.profile_image_url ? (
                          <img 
                            src={account.profile_image_url} 
                            alt={account.account_name || account.username}
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className="account-avatar-fallback"
                          style={{ display: account.profile_image_url ? 'none' : 'flex' }}
                        >
                          {getProviderIcon(account.provider)}
                        </div>
                      </div>
                      <div className="account-info">
                        <h3 className="account-name">
                          {account.account_name || account.username || 'Nimetön tili'}
                        </h3>
                        <div className="account-meta">
                          <span className="account-provider">
                            {getProviderIcon(account.provider)} {getProviderLabel(account.provider)}
                          </span>
                          {account.username && (
                            <span className="account-username">@{account.username}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="account-details">
                      {account.visibility && (
                        <div className="account-detail-item">
                          <span className="detail-label">Näkyvyys:</span>
                          <span className={`detail-value visibility-${account.visibility}`}>
                            {account.visibility === 'public' ? 'Julkinen' : 'Yksityinen'}
                          </span>
                        </div>
                      )}
                      {account.last_synced_at && (
                        <div className="account-detail-item">
                          <span className="detail-label">Viimeksi synkronoitu:</span>
                          <span className="detail-value">
                            {new Date(account.last_synced_at).toLocaleDateString('fi-FI', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {account.created_at && (
                        <div className="account-detail-item">
                          <span className="detail-label">Kiinnitetty:</span>
                          <span className="detail-value">
                            {new Date(account.created_at).toLocaleDateString('fi-FI', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {account.mixpost_account_uuid && (
                      <div className="account-id">
                        <span className="id-label">Mixpost ID:</span>
                        <span className="id-value">{account.mixpost_account_uuid}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Muut integraatiot */}
          {secrets.length > 0 && (
            <div className="integrations-section">
              <h3 className="section-title">Muut integraatiot ({secrets.length})</h3>
              <div className="social-accounts-grid">
                {secrets.map((secret) => (
                  <div key={secret.id} className="social-account-card">
                    <div className="account-header">
                      <div className="account-avatar">
                        <div className="account-avatar-fallback" style={{ display: 'flex' }}>
                          {getProviderIcon(secret.secret_type)}
                        </div>
                      </div>
                      <div className="account-info">
                        <h3 className="account-name">
                          {secret.secret_name || getSecretTypeLabel(secret.secret_type)}
                        </h3>
                        <div className="account-meta">
                          <span className="account-provider">
                            {getProviderIcon(secret.secret_type)} {getSecretTypeLabel(secret.secret_type)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="account-details">
                      {secret.metadata?.endpoint && (
                        <div className="account-detail-item">
                          <span className="detail-label">Endpoint:</span>
                          <span className="detail-value">{secret.metadata.endpoint}</span>
                        </div>
                      )}
                      {secret.metadata?.description && (
                        <div className="account-detail-item">
                          <span className="detail-label">Kuvaus:</span>
                          <span className="detail-value">{secret.metadata.description}</span>
                        </div>
                      )}
                      {secret.created_at && (
                        <div className="account-detail-item">
                          <span className="detail-label">Kiinnitetty:</span>
                          <span className="detail-value">
                            {new Date(secret.created_at).toLocaleDateString('fi-FI', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="account-id">
                      <span className="id-label">Tyyppi:</span>
                      <span className="id-value">{secret.secret_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {totalIntegrations > 0 && (
        <div className="social-accounts-summary">
          <div className="summary-item">
            <span className="summary-label">Kiinnitettyjä integraatioita yhteensä:</span>
            <span className="summary-value">{totalIntegrations}</span>
          </div>
        </div>
      )}
    </div>
  )
}

