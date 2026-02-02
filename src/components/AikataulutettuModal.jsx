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
          placeholder={t('calendar.modals.scheduledDetail.contentPlaceholder')}
        />
        {charCount > 2000 && (
          <p className="text-red-500 text-xs mt-1 font-medium">
            {t('posts.publishModal.captionTooLong')}
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
      setError(t('posts.publishModal.captionTooLong'))
      setLoading(false)
      return
    }

    // Validoi kanavaspesifiset tekstit
    for (const [accountId, content] of Object.entries(channelContents)) {
      if (content.length > 2000) {
        setError(t('posts.publishModal.captionTooLong'))
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
        const helsinkiNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }))
        const helsinkiSelected = new Date(selectedDateTime.toLocaleString("en-US", { timeZone: "Europe/Helsinki" }))

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

  if (!show || !editingPost) return null

  const handleSaveInternal = async () => {
    await handleSave()
  }

  const isOverLimitFull = formData.content.length > 2000 || Object.values(channelContents).some(c => c.length > 2000)

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 text-left">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-6 border-b border-gray-50 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {editingPost?.status === 'Luonnos' ? t('calendar.modals.scheduledDetail.draftTitle') : t('calendar.modals.scheduledDetail.title')}
              </h2>
              <p className="text-xs text-gray-400 font-medium">{t('calendar.modals.scheduledDetail.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-600 text-sm font-medium animate-in slide-in-from-top-2">
              {t('calendar.modals.scheduledDetail.successUpdate')}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('calendar.modals.scheduledDetail.createdLabel')}</label>
                <div className="px-4 py-3 bg-gray-50/50 rounded-2xl border border-gray-100 text-xs font-medium text-gray-600">
                  {editingPost.created_at ? new Date(editingPost.created_at).toLocaleString(i18n.language === 'en' ? 'en-US' : 'fi-FI', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false
                  }) : t('calendar.modals.scheduledDetail.unknown')}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('calendar.modals.scheduledDetail.mediaLabel')}</label>
                <div className="relative aspect-video rounded-3xl overflow-hidden bg-gray-50 border border-gray-100 group">
                  {(() => {
                    let mediaUrl = null
                    if (editingPost.source === 'mixpost' && editingPost.versions?.[0]?.content?.[0]?.media?.[0]) {
                      const mediaItem = editingPost.versions[0].content[0].media[0]
                      mediaUrl = typeof mediaItem === 'object' ? mediaItem.url : mediaItem
                    } else if (editingPost.source === 'supabase') {
                      mediaUrl = editingPost.thumbnail || editingPost.media_urls?.[0]
                    }

                    if (!mediaUrl) return <div className="flex items-center justify-center h-full text-xs font-bold text-gray-300 uppercase tracking-widest">Ei mediaa</div>

                    if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                      return <video src={mediaUrl} className="w-full h-full object-cover" controls preload="metadata" />
                    }
                    return <img src={mediaUrl} alt="Media" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  })()}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('calendar.modals.scheduledDetail.statusLabel')}</label>
                <div className="flex">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${editingPost.status === 'Aikataulutettu'
                    ? 'bg-blue-50 text-blue-600 border-blue-100'
                    : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                    {editingPost.status || 'Ei statusta'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {(() => {
                let dateTimeStr = null
                if (editingPost.source === 'supabase') {
                  dateTimeStr = editingPost.originalData?.mixpost_scheduled_at || editingPost.originalData?.publish_date
                } else if (editingPost.source === 'mixpost') {
                  dateTimeStr = editingPost.scheduled_at
                }

                if (dateTimeStr) {
                  return (
                    <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-2">
                      <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                        {t('calendar.modals.scheduledDetail.scheduledAtLabel')}
                      </label>
                      <div className="text-sm font-bold text-gray-900 leading-tight capitalize">
                        {(() => {
                          try {
                            const date = new Date(dateTimeStr.replace(' ', 'T') + 'Z')
                            return date.toLocaleString(i18n.language === 'en' ? 'en-US' : 'fi-FI', {
                              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Europe/Helsinki'
                            })
                          } catch (e) { return t('calendar.modals.scheduledDetail.noDateTime') }
                        })()}
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('calendar.modals.scheduledDetail.dateLabel')}</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">{t('calendar.modals.scheduledDetail.timeLabel')}</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t('calendar.modals.scheduledDetail.contentLabel')}</label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${formData.content.length > 2000 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'}`}>
                {formData.content.length} / 2000
              </span>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder={t('calendar.modals.scheduledDetail.contentPlaceholder')}
              rows={6}
              className={`w-full p-5 bg-gray-50 border border-transparent rounded-3xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium leading-relaxed resize-none ${formData.content.length > 2000 ? 'border-red-200 ring-2 ring-red-50' : ''}`}
            />
          </div>

          {editingPost.accounts?.length > 1 && (
            <div className="space-y-4">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                {t('calendar.modals.scheduledDetail.perChannelLabel')}
              </label>
              <div className="grid grid-cols-1 gap-4">
                {editingPost.accounts.map((account, index) => {
                  const accountId = typeof account === 'object' ? account.id : account
                  if (!accountId || accountId === 0) return null

                  const supabaseAccount = socialAccounts.find(acc => acc.mixpost_account_uuid === String(accountId))
                  const accountName = supabaseAccount?.username ? `@${supabaseAccount.username}` : supabaseAccount?.account_name || `Kanava ${accountId}`
                  const currentContent = channelContents[accountId] || formData.content

                  return (
                    <div key={accountId} className="p-5 bg-gray-50/50 rounded-3xl border border-gray-100 space-y-3 group hover:border-blue-200 transition-colors">
                      <div className="flex justify-between items-center px-1">
                        <div className="flex items-center gap-2">
                          {supabaseAccount?.profile_image_url && <img src={supabaseAccount.profile_image_url} className="w-6 h-6 rounded-full border border-white shadow-sm" alt="" />}
                          <span className="text-xs font-bold text-gray-900">{accountName}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentContent.length > 2000 ? 'bg-red-50 text-red-600' : 'bg-white/80 text-gray-400'}`}>
                          {currentContent.length} / 2000
                        </span>
                      </div>
                      <textarea
                        value={currentContent}
                        onChange={(e) => setChannelContents({ ...channelContents, [accountId]: e.target.value })}
                        rows={3}
                        className={`w-full p-4 bg-white border border-transparent rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium leading-relaxed resize-none shadow-sm ${currentContent.length > 2000 ? 'border-red-200' : ''}`}
                        placeholder={t('calendar.modals.scheduledDetail.contentPlaceholder')}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-3 sticky bottom-0 z-10">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-white transition-all disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSaveInternal}
            disabled={loading || isOverLimitFull}
            className="px-8 py-3 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-xl shadow-gray-200 transition-all disabled:opacity-50 disabled:bg-gray-400 flex items-center justify-center gap-2 min-w-[120px]"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                {t('ui.buttons.saving')}
              </>
            ) : t('common.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AikataulutettuModal
