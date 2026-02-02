import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
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
      const { data: { session } } = await supabase.auth.getSession()

      const isAdminOrModerator =
        user?.systemRole === 'superadmin' ||
        user?.systemRole === 'moderator' ||
        organization?.role === 'admin' ||
        organization?.role === 'moderator' ||
        organization?.role === 'owner'

      let socialData = []
      let secretsData = []

      if (isAdminOrModerator && session?.access_token) {
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
          throw apiError
        }
      } else {
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
      <div className="text-center py-12 text-gray-500">
        Ladataan integraatioita...
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
        <button
          className="py-2 px-4 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          onClick={loadAllIntegrations}
        >
          Yritä uudelleen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600">
        <p>Näkyvissä ovat tämän tilin kiinnitetyt integraatiot. Somet-tilit haetaan Mixpostista, muut integraatiot tallennetaan salattuna tietokantaan.</p>
      </div>

      {totalIntegrations === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🔗</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Ei kiinnitettyjä integraatioita</h3>
          <p className="text-gray-500">Tälle tilille ei ole vielä kiinnitetty yhtään integraatiota.</p>
        </div>
      ) : (
        <>
          {socialAccounts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800">
                Sosiaalisen median tilit ({socialAccounts.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialAccounts.map((account) => (
                  <div key={account.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                          {account.profile_image_url ? (
                            <img
                              src={account.profile_image_url}
                              alt={account.account_name || account.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div
                            className={`w-full h-full items-center justify-center text-xl ${account.profile_image_url ? 'hidden' : 'flex'}`}
                          >
                            {getProviderIcon(account.provider)}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {account.account_name || account.username || 'Nimetön tili'}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                            <span>
                              {getProviderIcon(account.provider)} {getProviderLabel(account.provider)}
                            </span>
                            {account.username && (
                              <span className="text-gray-400">@{account.username}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      {account.visibility && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Näkyvyys:</span>
                          <span className={`font-medium ${account.visibility === 'public' ? 'text-green-600' : 'text-gray-600'}`}>
                            {account.visibility === 'public' ? 'Julkinen' : 'Yksityinen'}
                          </span>
                        </div>
                      )}
                      {account.last_synced_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Viimeksi synkronoitu:</span>
                          <span className="text-gray-800">
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
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Kiinnitetty:</span>
                          <span className="text-gray-800">
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
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs">
                        <span className="text-gray-500">Mixpost ID:</span>
                        <span className="ml-2 text-gray-600 font-mono">{account.mixpost_account_uuid}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {secrets.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800">
                Muut integraatiot ({secrets.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secrets.map((secret) => (
                  <div key={secret.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                          {getProviderIcon(secret.secret_type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-gray-800 truncate">
                            {secret.secret_name || getSecretTypeLabel(secret.secret_type)}
                          </h4>
                          <div className="text-sm text-gray-500">
                            {getProviderIcon(secret.secret_type)} {getSecretTypeLabel(secret.secret_type)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      {secret.metadata?.endpoint && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Endpoint:</span>
                          <span className="text-gray-800 truncate ml-2 max-w-[60%]">{secret.metadata.endpoint}</span>
                        </div>
                      )}
                      {secret.metadata?.description && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Kuvaus:</span>
                          <span className="text-gray-800">{secret.metadata.description}</span>
                        </div>
                      )}
                      {secret.created_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Kiinnitetty:</span>
                          <span className="text-gray-800">
                            {new Date(secret.created_at).toLocaleDateString('fi-FI', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs">
                      <span className="text-gray-500">Tyyppi:</span>
                      <span className="ml-2 text-gray-600 font-mono">{secret.secret_type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {totalIntegrations > 0 && (
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Kiinnitettyjä integraatioita yhteensä:</span>
            <span className="text-lg font-semibold text-gray-800">{totalIntegrations}</span>
          </div>
        </div>
      )}
    </div>
  )
}
