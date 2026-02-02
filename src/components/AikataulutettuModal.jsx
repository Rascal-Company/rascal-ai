import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Button from './Button'

const AikataulutettuModal = ({ 
  show = true,  // Oletusarvo true, jotta Dashboard voi käyttää ilman show proppia
  editingPost, 
  onClose, 
  onEdit,  // ManagePostsPage käyttää
  onSave,  // DashboardPage käyttää
  t: tProp 
}) => {
  const { t: tHook } = useTranslation('common')
  const t = tProp || tHook
  const { user } = useAuth()
  
  // Funktio kanavan kentän renderöimiseen
  const renderChannelField = (accountId, accountData, index) => {
    // Etsi kanavan nimi Supabase-dataa käyttäen
    // Supabase-datassa mixpost_account_uuid on string, accountId on numero
    const supabaseAccount = socialAccounts.find(acc => 
      acc.mixpost_account_uuid === String(accountId)
    )
    // Käytä username:a jos se on saatavilla (@username), muuten account_name
    const accountName = supabaseAccount?.username ? `@${supabaseAccount.username}` : 
                      supabaseAccount?.account_name || 
                      `Kanava ${accountId}`
    const providerIcon = supabaseAccount?.provider
    
    // Debug info removed
    
    const currentContent = channelContents[accountId] || formData.content
    const charCount = currentContent.length
    
    return (
      <div key={accountId} className="border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-0">
            <span className="text-sm font-medium text-gray-900">{accountName}</span>
          </label>
          <span className={`text-xs ${charCount > 2000 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
            {charCount} / 2000
          </span>
        </div>
        <textarea
          className={`form-textarea ${charCount > 2000 ? 'border-red-500' : ''}`}
          rows={4}
          value={currentContent}
          onChange={(e) => setChannelContents({
            ...channelContents,
            [accountId]: e.target.value
          })}
          placeholder={`Teksti kanavalle ${accountName}...`}
        />
        {charCount > 2000 && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            Postauksen pituus ylittää maksimin 2000 merkkiä
          </p>
        )}
      </div>
    )
  }
  
  const [formData, setFormData] = useState({
    content: '',
    date: '',
    time: ''
  })
  const [channelContents, setChannelContents] = useState({}) // account_id -> content
  const [socialAccounts, setSocialAccounts] = useState([]) // Supabase social accounts
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [mixpostData, setMixpostData] = useState(null)
  const [fetchingMixpost, setFetchingMixpost] = useState(false)

  // Ei haeta Mixpost-dataa, käytetään Supabase-dataa

  // Hae social accounts Supabasesta
  useEffect(() => {
    const fetchSocialAccounts = async () => {
      if (!user?.id) return
      
      try {
        const { data, error } = await supabase
          .from('user_social_accounts')
          .select('mixpost_account_uuid, provider, account_name, username, profile_image_url')
          .eq('user_id', user.id)
          .eq('is_authorized', true)
        
        if (error) {
          console.error('Error fetching social accounts:', error)
          return
        }
        
        setSocialAccounts(data || [])
      } catch (error) {
        console.error('Error fetching social accounts:', error)
      }
    }

    fetchSocialAccounts()
  }, [user?.id])

  // Päivitä formData kun editingPost muuttuu
  useEffect(() => {
    if (editingPost) {
      console.log('AikataulutettuModal - editingPost:', {
        id: editingPost.id,
        source: editingPost.source,
        status: editingPost.status,
        hasAccounts: !!editingPost.accounts,
        accountsLength: editingPost.accounts?.length,
        accounts: editingPost.accounts,
        hasVersions: !!editingPost.versions,
        versionsLength: editingPost.versions?.length
      })
      
      let dateStr = ''
      let timeStr = ''
      let postBody = ''
      
      // Parsitaan päivämäärä ja aika datasta (Supabase tai Mixpost)
      let dateTimeStr = null
      if (editingPost.source === 'supabase') {
        dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
      } else if (editingPost.source === 'mixpost') {
        dateTimeStr = editingPost.scheduled_at
      }
      
      if (dateTimeStr) {
        try {
          // Mixpost tallentaa UTC-ajan ilman Z-merkintää
          // Lisätään Z jotta JavaScript tulkitsee sen UTC:nä
          const utcDateString = dateTimeStr.replace(' ', 'T') + 'Z'
          const date = new Date(utcDateString)
          
          // Muunna Europe/Helsinki aikavyöhykkeeseen
          const formatter = new Intl.DateTimeFormat('fi-FI', {
            timeZone: 'Europe/Helsinki',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
          
          const parts = formatter.formatToParts(date)
          const year = parts.find(p => p.type === 'year').value
          const month = parts.find(p => p.type === 'month').value
          const day = parts.find(p => p.type === 'day').value
          const hour = parts.find(p => p.type === 'hour').value
          const minute = parts.find(p => p.type === 'minute').value
          
          dateStr = `${year}-${month}-${day}`
          timeStr = `${hour}:${minute}`
        } catch (e) {
          console.error('Error parsing date:', e)
        }
      }

      // Asetetaan postauksen sisältö - Supabase tai Mixpost
      if (editingPost.source === 'supabase') {
        postBody = editingPost.caption || ''
      } else if (editingPost.source === 'mixpost') {
        // Mixpost-data: käytä versions[0].content[0].body
        postBody = editingPost.versions?.[0]?.content?.[0]?.body || editingPost.caption || ''
        // Poista HTML-tagit jos on
        if (postBody && postBody.includes('<div>')) {
          postBody = postBody.replace(/<div>/g, '').replace(/<\/div>/g, '')
        }
      } else {
        postBody = editingPost.caption || ''
      }

      setFormData({
        content: postBody,
        date: dateStr,
        time: timeStr
      })

      // Alusta channelContents jokaiselle kanavalle
      const channelContentsData = {}
      
      // Jos versions löytyy, käytä sitä
      if (editingPost.versions && editingPost.versions.length > 0) {
        editingPost.versions.forEach(version => {
          if (version.account_id !== undefined) {
            const content = version.content?.[0]?.body || postBody
            channelContentsData[version.account_id] = content
          }
        })
      }
      
      // Jos versions ei löydy tai account_id on 0, käytä accounts-dataa
      if (editingPost.accounts && editingPost.accounts.length > 0) {
        editingPost.accounts.forEach(account => {
          const accountId = typeof account === 'object' ? account.id : account
          if (accountId && accountId !== 0 && !channelContentsData[accountId]) {
            channelContentsData[accountId] = postBody
          }
        })
      }
      
      // Debug info removed
      setChannelContents(channelContentsData)
    }
  }, [editingPost])

  if (!show || !editingPost) return null

  const handleSave = async () => {
    setLoading(true)
    setError('')
    setSuccess(false)

    // Validoi merkkimäärät
    if (formData.content.length > 2000) {
      setError('Päätekstin pituus ylittää maksimin 2000 merkkiä')
      setLoading(false)
      return
    }
    
    // Validoi kanavaspesifiset tekstit
    for (const [accountId, content] of Object.entries(channelContents)) {
      if (content.length > 2000) {
        setError('Yhden tai useamman kanavan tekstin pituus ylittää maksimin 2000 merkkiä')
        setLoading(false)
        return
      }
    }

    try {
      // Haetaan käyttäjän user_id users taulusta (sama logiikka kuin ManagePostsPage)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', (await supabase.auth.getSession()).data.session?.user?.id)
        .single()

      if (userError || !userData?.id) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Haetaan Mixpost post UUID - Supabase-datasta tai Mixpost-datasta
      let postUuid = null
      
      if (editingPost.source === 'supabase') {
        // Supabase-data: käytä mixpost_post_id originalData:sta
        postUuid = editingPost.originalData?.mixpost_post_id
      } else if (editingPost.source === 'mixpost') {
        // Mixpost-data: hae Supabase-data Mixpost UUID:n perusteella
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('content')
          .select('mixpost_post_id, caption, mixpost_scheduled_at')
          .eq('mixpost_post_id', editingPost.uuid)
          .eq('user_id', userData.id)
          .single()

        if (supabaseError || !supabaseData) {
          throw new Error('Supabase-data ei löytynyt Mixpost UUID:lle')
        }

        postUuid = editingPost.uuid // Käytä Mixpost UUID:ta
      }

      // Debug info removed

      if (!postUuid) {
        throw new Error('Mixpost post UUID puuttuu. Varmista että postaus on Mixpostissa.')
      }

      // Rakennetaan päivitysdata Mixpost API:n mukaisesti
      // Käytetään dokumentaation mukaista muotoa - vain muuttuneet kentät
      const originalVersions = editingPost.versions || []
      // Jos account_id on 0, luo versions accounts-datasta
      let versionsToUpdate = originalVersions
      
      if (originalVersions.length > 0 && originalVersions[0].account_id === 0 && editingPost.accounts && editingPost.accounts.length > 0) {
        // Luo versions accounts-datasta
        versionsToUpdate = editingPost.accounts.map(account => {
          const accountId = typeof account === 'object' ? account.id : account
          return {
            account_id: accountId,
            is_original: true,
            content: [{
              body: channelContents[accountId] || formData.content,
              media: editingPost.versions?.[0]?.content?.[0]?.media || []
            }],
            options: originalVersions[0]?.options || {}
          }
        })
      }
      
      const updatedVersions = versionsToUpdate.map(version => {
        // Käytä kanavan omaa tekstiä jos se on määritelty, muuten käytä päätekstiä
        const channelContent = channelContents[version.account_id] || formData.content
        
        // Debug info removed
        
        return {
          account_id: version.account_id,
          is_original: version.is_original,
          content: version.content?.map(content => ({
            body: channelContent,
            // Media-kenttä pitää olla integer-array, ei objekti-array
            media: Array.isArray(content.media) 
              ? content.media.map(m => typeof m === 'object' ? parseInt(m.id) : parseInt(m)).filter(id => !isNaN(id))
              : []
          })) || [{ body: channelContent, media: [] }],
          options: version.options
        }
      })

      // Rakennetaan updateData Mixpost API:n dokumentaation mukaan
      // Dokumentaatio vaatii: date, time, timezone, accounts, tags, versions
      const updateData = {
        versions: updatedVersions
      }

      // Jos päivämäärä ja aika on valittu, tarkistetaan että se on tulevaisuudessa
      if (formData.date && formData.time) {
        // Tarkista että päivämäärä on tulevaisuudessa (Helsinki-aikavyöhyke)
        const selectedDateTime = new Date(`${formData.date}T${formData.time}`)
        const now = new Date()
        
        // Vertaa Helsinki-aikavyöhykkeessä
        const helsinkiNow = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Helsinki"}))
        const helsinkiSelected = new Date(selectedDateTime.toLocaleString("en-US", {timeZone: "Europe/Helsinki"}))
        
        if (helsinkiSelected <= helsinkiNow) {
          throw new Error(t('schedule.messages.selectFutureDateTime'))
        }
        
        // Mixpost API:n dokumentaation mukaan: lähetä lokaali päivä ja aika aikavyöhykkeen kanssa
        // Ei muunnoksia, Mixpost API käsittelee aikavyöhykkeen automaattisesti
        updateData.date = formData.date // YYYY-MM-DD (lokaali päivä)
        updateData.time = formData.time   // HH:MM (lokaali aika)
        updateData.timezone = 'Europe/Helsinki' // Aikavyöhyke
        
        // Debug info removed
      }

      // Lisätään alkuperäiset accounts ja tags jos ne löytyvät
      // Tarkista ensin editingPost-objektista accounts
      if (editingPost.accounts && editingPost.accounts.length > 0) {
        updateData.accounts = editingPost.accounts.map(acc => 
          typeof acc === 'object' ? acc.id : acc
        ).filter(id => !isNaN(id) && id !== 0)
      }
      
      // Tags löytyvät yleensä editingPost-objektista
      if (editingPost.tags && editingPost.tags.length > 0) {
        updateData.tags = editingPost.tags.map(tag => 
          typeof tag === 'object' ? tag.id : tag
        ).filter(id => !isNaN(id))
      }

      // Debug info removed

      // Kutsu backend-endpointtia
      const response = await fetch('/api/integrations/mixpost/update-post', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          postUuid,
          updateData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Tallennus epäonnistui')
      }

      const updateResult = await response.json()

      // Päivitä Supabase-data jos kyseessä on Mixpost-postaus
      if (editingPost.source === 'mixpost') {
        const { error: updateError } = await supabase
          .from('content')
          .update({
            caption: formData.content,
            updated_at: new Date().toISOString()
          })
          .eq('mixpost_post_id', editingPost.uuid)
          .eq('user_id', userData.id)

        if (updateError) {
          console.warn('Supabase-päivitys epäonnistui:', updateError)
          // Ei heitä virhettä, koska Mixpost-päivitys onnistui
        }
      }

      // Jos päivämäärä ja aika on asetettu, kutsutaan schedule-endpointtia
      // Mixpost API:n dokumentaation mukaan schedule-endpointtia käytetään ajastamiseen
      if (updateData.date && updateData.time) {
        
        try {
          const scheduleResponse = await fetch('/api/integrations/mixpost/schedule-post', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              postUuid,
              postNow: false,  // false = ajastetaan date/time mukaan, true = julkaistaan heti
              updateData: updateData  // Lähetetään myös media-data
            })
          })

          if (!scheduleResponse.ok) {
            const errorData = await scheduleResponse.json()
            throw new Error(`Schedule-päivitys epäonnistui: ${errorData.error || errorData.details || 'Tuntematon virhe'}`)
          }

          const scheduleResult = await scheduleResponse.json()
          
          console.log('AikataulutettuModal - scheduleResult:', scheduleResult)
          console.log('AikataulutettuModal - editingPost.source:', editingPost.source)
          console.log('AikataulutettuModal - editingPost.status:', editingPost.status)
          
          // Jos postaus ajastettiin onnistuneesti ja se oli Supabase-postaus, 
          // palautetaan tieto callbackille
          // Tarkistetaan myös status, koska "Tarkistuksessa" -sarakkeessa olevat postaukset ovat Supabase-postauksia
          const isSupabasePost = editingPost.source === 'supabase' || editingPost.status === 'Tarkistuksessa'
          
          if (isSupabasePost && scheduleResult) {
            console.log('AikataulutettuModal - Ajastetaan Supabase-postaus, palautetaan tiedot callbackille')
            // Palautetaan tiedot siitä, että postaus ajastettiin
            if (onEdit) {
              onEdit({ 
                wasScheduled: true, 
                originalPost: editingPost,
                mixpostUuid: scheduleResult.uuid || scheduleResult.id || postUuid,
                scheduledAt: scheduleResult.scheduled_at || `${formData.date} ${formData.time}:00`
              })
            }
            if (onSave) {
              onSave({ 
                wasScheduled: true, 
                originalPost: editingPost,
                mixpostUuid: scheduleResult.uuid || scheduleResult.id || postUuid
              })
            }
          } else {
            console.log('AikataulutettuModal - Ei Supabase-postaus tai scheduleResult puuttuu, kutsutaan callbackia normaalisti')
            // Muuten kutsutaan callbackia normaalisti
            if (onEdit) {
              onEdit()
            }
            if (onSave) {
              onSave(editingPost)
            }
          }
        } catch (scheduleError) {
          // Ei heitä virhettä, koska sisältö päivittyi onnistuneesti
          setError(`Sisältö päivittyi, mutta ajastus epäonnistui: ${scheduleError.message}`)
          // Kutsutaan callbackia silti
          if (onEdit) {
            onEdit()
          }
          if (onSave) {
            onSave(editingPost)
          }
        }
      } else {
        // Jos ei ajastettu, kutsutaan callbackia normaalisti
        setSuccess(true)
        if (onEdit) {
          onEdit()
        }
        if (onSave) {
          onSave(editingPost)
        }
      }

      setSuccess(true)

      // Suljetaan modaali 1.5 sekunnin kuluttua
      setTimeout(() => {
        onClose()
      }, 1500)

    } catch (err) {
      setError(err.message || 'Tallennus epäonnistui')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container edit-post-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            {editingPost?.status === 'Luonnos' ? t('schedule.messages.draftPost') : t('schedule.messages.scheduledPost')}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="modal-content">
          {error && (
            <div className="error-message mb-4 p-3 bg-red-50 text-red-600 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message mb-4 p-3 bg-green-50 text-green-600 rounded">
              Postaus päivitetty onnistuneesti!
            </div>
          )}

          {/* Luontipäivämäärä */}
          <div className="form-group mb-4">
            <label className="form-label">Luotu</label>
            <p className="form-text py-2 px-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-500">
              {editingPost.created_at ? new Date(editingPost.created_at).toLocaleString('fi-FI', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              }) : 'Ei tiedossa'}
            </p>
          </div>

          {/* Media-preview */}
          <div className="form-group">
            <label className="form-label">Media</label>
            <div className="max-w-[300px] max-h-[200px] border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {(() => {
                // Hae media URL editingPost-datasta
                let mediaUrl = null

                if (editingPost.source === 'mixpost' && editingPost.versions?.[0]?.content?.[0]?.media?.[0]) {
                  // Mixpost-data: hae media URL
                  const mediaItem = editingPost.versions[0].content[0].media[0]
                  if (typeof mediaItem === 'object' && mediaItem.url) {
                    mediaUrl = mediaItem.url
                  } else if (typeof mediaItem === 'string') {
                    mediaUrl = mediaItem
                  }
                } else if (editingPost.source === 'supabase') {
                  // Supabase-data: käytä thumbnail tai media_urls
                  mediaUrl = editingPost.thumbnail || editingPost.media_urls?.[0]
                }

                if (!mediaUrl) {
                  return (
                    <div className="flex items-center justify-center h-[200px] text-gray-500">
                      Ei mediaa
                    </div>
                  )
                }

                // Video-tarkistus
                if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                  return (
                    <video
                      src={mediaUrl}
                      className="w-full h-[200px] object-cover"
                      controls
                    />
                  )
                }

                // Kuva
                return (
                  <img
                    src={mediaUrl}
                    alt="Postauksen media"
                    className="w-full h-[200px] object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                )
              })()}

              {/* Fallback placeholder */}
              <div className="hidden items-center justify-center h-[200px] text-gray-500">
                Media ei lataa
              </div>
            </div>
          </div>

          {/* Näytetään nykyinen ajastettu ajankohta */}
          {(() => {
            let dateTimeStr = null
            if (editingPost.source === 'supabase') {
              dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
            } else if (editingPost.source === 'mixpost') {
              dateTimeStr = editingPost.scheduled_at
            }
            return dateTimeStr
          })() && (
            <div className="form-group">
              <div className="p-4 bg-sky-50 border border-sky-400 rounded-md mb-2">
                <div className="text-sm font-semibold text-sky-700 mb-1">
                  📅 Ajastettu julkaisuajankohta
                </div>
                <div className="text-lg font-bold text-sky-900">
                  {(() => {
                    try {
                      let dateTimeStr = null
                      if (editingPost.source === 'supabase') {
                        dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
                      } else if (editingPost.source === 'mixpost') {
                        dateTimeStr = editingPost.scheduled_at
                      }

                      if (dateTimeStr) {
                        // Mixpost tallentaa UTC-ajan ilman Z-merkintää
                        // Lisätään Z jotta JavaScript tulkitsee sen UTC:nä
                        const utcDateString = dateTimeStr.replace(' ', 'T') + 'Z'
                        const date = new Date(utcDateString)
                        return date.toLocaleString('fi-FI', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                          timeZone: 'Europe/Helsinki'
                        })
                      }
                      return 'Ei ajankohtaa'
                    } catch (e) {
                      return 'Virhe ajankohdassa'
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Näytetään statustieto */}
          <div className="form-group">
            <label className="form-label">Status</label>
            <p className={`form-text inline-block py-1 px-3 rounded-full text-sm font-semibold ${
              editingPost.status === 'Aikataulutettu'
                ? 'bg-blue-100 text-blue-800'
                : editingPost.status === 'Luonnos'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-gray-100 text-gray-700'
            }`}>
              {editingPost.status || 'Ei statusta'}
            </p>
          </div>


          <div className="form-group">
            <div className="flex justify-between items-center mb-2">
              <label className="form-label mb-0">Postaus (pääteksti)</label>
              <span className={`text-xs ${formData.content.length > 2000 ? 'text-red-500 font-semibold' : 'text-gray-500'}`}>
                {formData.content.length} / 2000
              </span>
            </div>
            <textarea
              className={`form-textarea ${formData.content.length > 2000 ? 'border-red-500' : ''}`}
              rows={6}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Kirjoita postauksen teksti..."
            />
            {formData.content.length > 2000 && (
              <p className="text-red-500 text-xs mt-1 font-medium">
                Postauksen pituus ylittää maksimin 2000 merkkiä
              </p>
            )}
          </div>

          {/* Per-kanava muokkauskentät */}
          {editingPost.accounts && editingPost.accounts.length > 1 && (
            <div className="form-group">
              <label className="form-label">Teksti per kanava</label>
              <div className="space-y-4">
                {editingPost.accounts.map((account, index) => {
                  const accountId = typeof account === 'object' ? account.id : account
                  if (!accountId || accountId === 0) return null
                  
                  // Debug info removed
                  
                  return renderChannelField(accountId, account, index)
                })}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Julkaisupäivä</label>
            <input
              type="date"
              className="form-input"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Julkaisuaika</label>
            <input
              type="time"
              className="form-input"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>


          <div className="modal-actions">
            <div className="modal-actions-left">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                {t('common.cancel')}
              </Button>
            </div>
            <div className="modal-actions-right">
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={loading || formData.content.length > 2000 || Object.values(channelContents).some(content => content.length > 2000)}
              >
                {loading ? t('ui.buttons.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AikataulutettuModal
