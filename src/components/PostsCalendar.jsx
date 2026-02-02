import React, { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { useToast } from '../contexts/ToastContext'
import Button from './Button'

export default function PostsCalendar({ 
  items = [], 
  onEventClick, 
  readyPosts = [], 
  onSchedulePost,
  socialAccounts = [],
  selectedAccounts = [],
  setSelectedAccounts,
  loadingAccounts = false,
  onFetchSocialAccounts,
  onRefresh,
  refreshing = false
}) {
  const { t } = useTranslation('common')
  const toast = useToast()
  
  // Tarkista onko mobiili ja onko vaakatasossa
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768
    }
    return false
  })
  
  const [isLandscape, setIsLandscape] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 && window.innerWidth > window.innerHeight
    }
    return false
  })
  
  // Päivitä mobiili- ja landscape-tila kun ikkunan koko muuttuu
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      setIsLandscape(mobile && window.innerWidth > window.innerHeight)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  const [viewType, setViewType] = useState('month') // 'month', 'week' tai 'day'
  
  // Aseta näkymä mobiilissa: päivänäkymä portrait, viikonäkymä landscape
  useEffect(() => {
    if (isMobile) {
      if (isLandscape) {
        setViewType('week')
      } else {
        setViewType('day')
      }
    }
  }, [isMobile, isLandscape])
  const [current, setCurrent] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [hoveredDate, setHoveredDate] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [showTimeModal, setShowTimeModal] = useState(false)
  const [selectedTime, setSelectedTime] = useState('12:00')

  const { monthLabel, weeks, weekLabel } = useMemo(() => {
    // Luo kartta: dateKey (YYYY-MM-DD) -> events
    const eventsByDate = new Map()
    for (const item of items) {
      if (!item.dateKey) continue
      if (!eventsByDate.has(item.dateKey)) eventsByDate.set(item.dateKey, [])
      eventsByDate.get(item.dateKey).push(item)
    }

    if (viewType === 'day') {
      // Päivänäkymä: näytä vain valittu päivä
      const now = new Date(current)
      const yyyy = String(now.getFullYear())
      const mm = String(now.getMonth() + 1).padStart(2, '0')
      const dd = String(now.getDate()).padStart(2, '0')
      const key = `${yyyy}-${mm}-${dd}`
      
      const dayFormatter = new Intl.DateTimeFormat('fi-FI', { 
        weekday: 'long',
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
      const dayLabelLocal = dayFormatter.format(now)
      
      const dayCell = {
        day: now.getDate(),
        key,
        events: eventsByDate.get(key) || [],
        date: new Date(now)
      }

      return {
        monthLabel: dayLabelLocal,
        weekLabel: dayLabelLocal,
        weeks: [[dayCell]]
      }
    } else if (viewType === 'week') {
      // Viikonäkymä: hae viikon ensimmäinen päivä (maanantai)
      const now = new Date(current)
      const dayOfWeek = (now.getDay() + 6) % 7 // 0 = maanantai, 6 = sunnuntai
      const monday = new Date(now)
      monday.setDate(now.getDate() - dayOfWeek)
      
      // Luo viikon päivät
      const weekCells = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday)
        date.setDate(monday.getDate() + i)
        const yyyy = String(date.getFullYear())
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        const key = `${yyyy}-${mm}-${dd}`
        weekCells.push({ 
          day: date.getDate(), 
          key, 
          events: eventsByDate.get(key) || [],
          date: new Date(date)
        })
      }

      const weekFormatter = new Intl.DateTimeFormat('fi-FI', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      })
      const weekStart = weekFormatter.format(monday)
      const weekEnd = weekFormatter.format(new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000))
      const weekLabelLocal = `${weekStart} - ${weekEnd}`

      return {
        monthLabel: weekLabelLocal,
        weekLabel: weekLabelLocal,
        weeks: [weekCells]
      }
    } else {
      // Kuukausinäkymä (nykyinen toteutus)
      const monthFormatter = new Intl.DateTimeFormat('fi-FI', { month: 'long', year: 'numeric' })
      const monthLabelLocal = monthFormatter.format(current)

      const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1)
      const lastDayOfMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0)

      // Viikko alkaa maanantaista (FI). JS getDay(): 0=Su,1=Ma,...
      const startOffset = (firstDayOfMonth.getDay() + 6) % 7
      const totalDays = lastDayOfMonth.getDate()

      const cells = []
      for (let i = 0; i < startOffset; i++) {
        cells.push(null)
      }
      for (let d = 1; d <= totalDays; d++) {
        const date = new Date(current.getFullYear(), current.getMonth(), d)
        const yyyy = String(date.getFullYear())
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(d).padStart(2, '0')
        const key = `${yyyy}-${mm}-${dd}`
        cells.push({ day: d, key, events: eventsByDate.get(key) || [] })
      }

      while (cells.length % 7 !== 0) cells.push(null)

      const weeksLocal = []
      for (let i = 0; i < cells.length; i += 7) {
        weeksLocal.push(cells.slice(i, i + 7))
      }

      return {
        monthLabel: monthLabelLocal,
        weekLabel: monthLabelLocal,
        weeks: weeksLocal
      }
    }
  }, [current, items, viewType])

  const todayKey = useMemo(() => {
    const now = new Date()
    const yyyy = String(now.getFullYear())
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }, [])

  const goPrev = () => {
    if (viewType === 'day') {
      setCurrent(prev => {
        const newDate = new Date(prev)
        newDate.setDate(prev.getDate() - 1)
        return newDate
      })
    } else if (viewType === 'week') {
      setCurrent(prev => {
        const newDate = new Date(prev)
        newDate.setDate(prev.getDate() - 7)
        return newDate
      })
    } else {
      setCurrent(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
    }
  }
  
  const goNext = () => {
    if (viewType === 'day') {
      setCurrent(prev => {
        const newDate = new Date(prev)
        newDate.setDate(prev.getDate() + 1)
        return newDate
      })
    } else if (viewType === 'week') {
      setCurrent(prev => {
        const newDate = new Date(prev)
        newDate.setDate(prev.getDate() + 7)
        return newDate
      })
    } else {
      setCurrent(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
    }
  }
  
  const goToday = () => {
    const now = new Date()
    if (viewType === 'day' || viewType === 'week') {
      setCurrent(now)
    } else {
      setCurrent(new Date(now.getFullYear(), now.getMonth(), 1))
    }
  }

  const weekdayLabels = ['Ma', 'Ti', 'Ke', 'To', 'Pe', 'La', 'Su']

  const handleDateClick = (dateKey) => {
    if (readyPosts.length === 0) return
    setSelectedDate(dateKey)
    setShowScheduleModal(true)
  }

  const handlePostSelect = (post, dateKey) => {
    // Suljetaan postausvalinta-modaali ja avataan kellonajan valinta-modaali
    setSelectedPost({ post, dateKey })
    setShowScheduleModal(false)
    setShowTimeModal(true)
    
    // Asetetaan oletuskellonaika klo 12:00
    setSelectedTime('12:00')
    
    // Tyhjennetään aiemmat valinnat ja haetaan somekanavat
    if (setSelectedAccounts) {
      setSelectedAccounts([])
    }
    if (onFetchSocialAccounts) {
      onFetchSocialAccounts()
    }
  }

  const toggleAccount = (accountId) => {
    if (!setSelectedAccounts) return
    
    if (selectedAccounts.includes(accountId)) {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId))
    } else {
      setSelectedAccounts([...selectedAccounts, accountId])
    }
  }

  const handleConfirmSchedule = () => {
    if (onSchedulePost && selectedPost) {
      const { post, dateKey } = selectedPost
      
      // Tarkista että on valittu vähintään yksi kanava
      if (!selectedAccounts || selectedAccounts.length === 0) {
        toast.warning(t('posts.alerts.selectAtLeastOne'))
        return
      }
      
      // Muunnetaan dateKey (YYYY-MM-DD) ja kellonaika ISO-muotoon
      // Luodaan datetime-string Helsinki-aikavyöhykkeessä ja muunnetaan se UTC:ksi oikein
      const [year, month, day] = dateKey.split('-')
      const [hours, minutes] = selectedTime.split(':')
      
      // Luodaan Date-objekti joka edustaa Helsinki-aikaa UTC:na
      // Käytetään yksinkertaista tapaa: luodaan Date-objekti tulkitsemalla datetime-string
      // Helsinki-aikavyöhykkeessä, sitten muunnetaan se UTC:ksi
      const dateTimeString = `${year}-${month}-${day}T${hours}:${minutes}:00`
      
      // Luodaan Date-objekti joka edustaa Helsinki-aikaa
      // Tämä luo Date-objektin käyttäjän paikalliseen aikaan (browserin aikavyöhyke)
      // Mutta meidän täytyy tulkita se Helsinki-aikavyöhykkeessä
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes))
      
      // Laske offset Helsinki-aikavyöhykkeelle tälle päivämäärälle
      // Helsinki on UTC+2 (talviaika) tai UTC+3 (kesäaika)
      // Käytetään Intl.DateTimeFormat:ia muuntamaan Helsinki-aika UTC:ksi
      const helsinkiTime = new Date(localDate.toLocaleString('en-US', { timeZone: 'Europe/Helsinki' }))
      const utcTime = new Date(localDate.toLocaleString('en-US', { timeZone: 'UTC' }))
      const offset = helsinkiTime.getTime() - utcTime.getTime()
      
      // Luodaan UTC-datetime lisäämällä offset (koska Helsinki on UTC:n edellä)
      const utcDate = new Date(localDate.getTime() - offset)
      
      // Lähetetään ISO-muodossa (backend odottaa ISO-muotoa)
      onSchedulePost(post, utcDate.toISOString().slice(0, 16), selectedAccounts)
    }
    setShowTimeModal(false)
    setSelectedPost(null)
    setSelectedDate(null)
    if (setSelectedAccounts) {
      setSelectedAccounts([])
    }
  }

  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false)
    setSelectedDate(null)
  }

  const handleCloseTimeModal = () => {
    setShowTimeModal(false)
    setSelectedPost(null)
    setSelectedDate(null)
    if (setSelectedAccounts) {
      setSelectedAccounts([])
    }
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h3 className="calendar-title">{monthLabel}</h3>
        </div>
        <div className="calendar-header-right">
          {/* Näkymän valinta - piilotetaan mobiilissa */}
          {!isMobile && (
            <div className="flex gap-1 mr-3 bg-gray-100 rounded-md p-0.5">
              <button
                onClick={() => setViewType('month')}
                className={`py-1.5 px-3 text-sm border-none rounded cursor-pointer transition-all duration-200 ${
                  viewType === 'month'
                    ? 'font-semibold text-gray-900 bg-white shadow-sm'
                    : 'font-normal text-gray-500 bg-transparent'
                }`}
              >
                {t('calendar.view.month')}
              </button>
              <button
                onClick={() => setViewType('week')}
                className={`py-1.5 px-3 text-sm border-none rounded cursor-pointer transition-all duration-200 ${
                  viewType === 'week'
                    ? 'font-semibold text-gray-900 bg-white shadow-sm'
                    : 'font-normal text-gray-500 bg-transparent'
                }`}
              >
                {t('calendar.view.week')}
              </button>
            </div>
          )}
          
          {onRefresh && (
            <Button
              variant="secondary"
              onClick={onRefresh}
              disabled={refreshing}
              className="mr-2 text-sm py-2 px-3"
            >
              {refreshing ? t('ui.buttons.refreshing') : t('ui.buttons.refresh')}
            </Button>
          )}
          <Button variant="secondary" onClick={goPrev}>◀</Button>
          <Button variant="secondary" onClick={goToday}>{t('ui.buttons.today')}</Button>
          <Button variant="secondary" onClick={goNext}>▶</Button>
        </div>
      </div>

      <div className={`calendar-grid ${viewType === 'day' ? 'grid-cols-1' : ''}`}>
        {/* Viikonpäivien otsikot - piilotetaan päivänäkymässä */}
        {viewType !== 'day' && weekdayLabels.map(label => (
          <div key={label} className="calendar-weekday">{label}</div>
        ))}

        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((cell, ci) => {
              // Päivänäkymässä näytetään vain ensimmäinen solu (yksi päivä)
              if (viewType === 'day' && ci > 0) return null
              
              return (
                <div
                  key={ci}
                  className={`calendar-cell ${cell ? (cell.key === todayKey ? 'calendar-cell--today' : '') : 'calendar-cell--empty'} ${viewType === 'day' ? 'col-span-full' : ''}`}
                  onMouseEnter={() => cell && setHoveredDate(cell.key)}
                  onMouseLeave={() => setHoveredDate(null)}
                >
                  {cell && (
                    <div className="calendar-cell-inner">
                      <div className="calendar-day-header">
                        <div className="calendar-day-number">{cell.day}</div>
                        {hoveredDate === cell.key && readyPosts.length > 0 && (
                          <button
                            className="calendar-add-button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDateClick(cell.key)
                            }}
                            title={t('accessibility.schedulePost')}
                          >
                            +
                          </button>
                        )}
                      </div>
                      <div className="calendar-events">
                        {/* Päivänäkymässä näytetään kaikki tapahtumat, ei vain 4 ensimmäistä */}
                        {cell.events.slice(0, viewType === 'day' ? cell.events.length : 4).map(ev => (
                          <div
                            key={ev.id}
                            className={`calendar-event calendar-event--${ev.source || 'other'}`}
                            title={ev.title}
                            onClick={() => onEventClick && onEventClick(ev)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter') onEventClick && onEventClick(ev) }}
                          >
                            <div className="calendar-event-header">
                              <span className="calendar-event-time">{ev.time || ''}</span>
                              {ev.channel && <span className="calendar-event-channel">{ev.channel}</span>}
                            </div>
                            <span className="calendar-event-title">{ev.title}</span>
                            <div className="calendar-event-chips">
                              <span className="calendar-chip">{ev.type}</span>
                              {ev.status && <span className="calendar-chip calendar-chip--muted">{ev.status}</span>}
                            </div>
                          </div>
                        ))}
                        {viewType !== 'day' && cell.events.length > 4 && (
                          <div className="calendar-more">+{cell.events.length - 4} lisää</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Post Selection Modal */}
      {showScheduleModal && selectedDate && createPortal(
        <div className="modal-overlay modal-overlay--light" onClick={handleCloseScheduleModal}>
          <div className="modal-container modal-content--schedule" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>{t('accessibility.schedulePost')}</h2>
                <button className="modal-close" onClick={handleCloseScheduleModal}>×</button>
              </div>
              <div className="modal-body">
                <p className="mb-4 text-gray-500">
                  Valitse postaus joka aikataulutetaan päivälle: <strong>{selectedDate}</strong>
                </p>
                <div className="schedule-posts-list">
                  {readyPosts.length === 0 ? (
                    <p className="p-5 text-center text-gray-500">
                      Ei valmiita postauksia
                    </p>
                  ) : (
                    readyPosts.map(post => (
                      <div
                        key={post.id}
                        className="schedule-post-item"
                        onClick={() => handlePostSelect(post, selectedDate)}
                      >
                        <div className="schedule-post-thumbnail">
                          {post.thumbnail ? (
                            <img src={post.thumbnail} alt={post.title} />
                          ) : (
                            <div className="schedule-post-placeholder">🖼️</div>
                          )}
                        </div>
                        <div className="schedule-post-info">
                          <h4 className="schedule-post-title">{post.title || t('general.post')}</h4>
                          <p className="schedule-post-caption">{post.caption || t('general.noDescription')}</p>
                          <div className="schedule-post-meta">
                            <span className="schedule-post-type">{post.type || 'Post'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Time Selection Modal */}
      {showTimeModal && selectedPost && createPortal(
        <div className="modal-overlay modal-overlay--light" onClick={handleCloseTimeModal}>
          <div className="modal-container modal-content--schedule" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h2>Valitse kellonaika</h2>
                <button className="modal-close" onClick={handleCloseTimeModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="mb-6">
                  <div className="schedule-post-item cursor-default pointer-events-none">
                    <div className="schedule-post-thumbnail">
                      {selectedPost.post.thumbnail ? (
                        <img src={selectedPost.post.thumbnail} alt={selectedPost.post.title} />
                      ) : (
                        <div className="schedule-post-placeholder">🖼️</div>
                      )}
                    </div>
                    <div className="schedule-post-info">
                      <h4 className="schedule-post-title">{selectedPost.post.title || t('general.post')}</h4>
                      <p className="schedule-post-caption">{selectedPost.post.caption || t('general.noDescription')}</p>
                      <div className="schedule-post-meta">
                        <span className="schedule-post-type">{selectedPost.post.type || 'Post'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <p className="mb-2 text-gray-500 text-sm">
                    Päivämäärä: <strong>{selectedPost.dateKey}</strong>
                  </p>
                </div>

                <div className="form-group mb-6">
                  <label className="form-label block mb-2 text-sm font-semibold text-gray-900">
                    Julkaisuaika
                  </label>
                  <input
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-base outline-none transition-colors duration-200 focus:border-blue-500"
                  />
                </div>

                {/* Somekanavat */}
                <div className="form-group mb-6">
                  <h3 className="mt-0 mb-3 text-base font-semibold text-gray-900">
                    Kanavat
                  </h3>
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto">
                    {loadingAccounts ? (
                      <div className="p-5 text-center text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                        Ladataan tilejä...
                      </div>
                    ) : socialAccounts && socialAccounts.length > 0 ? (
                      socialAccounts.map((account) => {
                        const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                        return (
                          <div
                            key={account.mixpost_account_uuid}
                            onClick={() => toggleAccount(account.mixpost_account_uuid)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? 'bg-blue-50 border-2 border-blue-500'
                                : 'bg-white border border-gray-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleAccount(account.mixpost_account_uuid)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-[18px] h-[18px] cursor-pointer"
                            />
                            {account.profile_image_url && (
                              <img
                                src={account.profile_image_url}
                                alt={account.account_name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="font-semibold text-sm text-gray-900">
                                {account.account_name}
                              </div>
                              <div className="text-xs text-gray-500">
                                {account.provider} • {account.username ? `@${account.username}` : account.account_name}
                              </div>
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-5 text-center text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                        Ei yhdistettyjä sometilejä
                      </div>
                    )}
                  </div>
                </div>

                <div className="modal-actions flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <Button variant="secondary" onClick={handleCloseTimeModal}>
                    Peruuta
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleConfirmSchedule}
                    disabled={!selectedAccounts || selectedAccounts.length === 0}
                  >
                    Aikatauluta
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}


