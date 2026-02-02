import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'
import PostCard from './PostCard/PostCard'

export default function CarouselsTab({ 
  posts = [], 
  onEdit, 
  onDelete, 
  onPublish, 
  onSchedule, 
  onMoveToNext, 
  onDragStart, 
  onDragEnd, 
  draggedPost, 
  t
}) {
  const { user } = useAuth()
  
  // Data state
  const [carouselsData, setCarouselsData] = useState([])
  
  // Muokkausten state - tallennetaan muutokset segmentteihin
  const [segmentEdits, setSegmentEdits] = useState({}) // { [recordId]: { text: string, approved: boolean } }
  
  // Tallennuksen state
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  
  // Helper-funktio datan yhdistämiseen
  const combineContentAndSegments = (contentData, segmentsData) => {
    if (!contentData || contentData.length === 0) {
      return []
    }

    // Luo map segmenteistä Content ID:n perusteella
    const segmentsByContentId = {}

    if (segmentsData) {
      segmentsData.forEach(segment => {
        const contentId = segment.content_id
        
        if (!segmentsByContentId[contentId]) {
          segmentsByContentId[contentId] = []
        }
        
        segmentsByContentId[contentId].push({
          recordId: segment.id,
          text: segment.text,
          slideNo: segment.slide_no,
          status: segment.status
        })
      })
    }

    // Järjestä segmentit Slide No. mukaan
    Object.keys(segmentsByContentId).forEach(contentId => {
      segmentsByContentId[contentId].sort((a, b) => {
        const slideA = String(a.slideNo || '0')
        const slideB = String(b.slideNo || '0')
        
        if (slideA === slideB) return 0
        if (slideA.includes('final')) return 1
        if (slideB.includes('final')) return -1
        
        const numA = parseInt(slideA)
        const numB = parseInt(slideB)
        
        if (isNaN(numA)) return 1
        if (isNaN(numB)) return -1
        
        return numA - numB
      })
    })

    // Yhdistä Content itemit ja niiden Segmentit - segments SISÄLLÄ content objektia
    return contentData.map(content => {
      const contentRecordId = content.id
      const segments = segmentsByContentId[contentRecordId] || []
      
      return {
        content: {
          recordId: contentRecordId,
          caption: content.caption,
          idea: content.idea,
          status: content.status,
          type: content.type,
          created: content.created_at,
          hashtags: content.hashtags,
          // Segments SISÄLLÄ content objektia
          segments: segments
        }
      }
    })
  }

  // Hae data automaattisesti kun komponentti mountataan
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)
        
        if (!userId) {
          console.error(t('posts.carouselsTab.messages.userIdNotFound'))
          return
        }

        // Hae kaikki Carousel-tyyppiset contentit
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'Carousel')
          .neq('status', 'Deleted')
          .order('created_at', { ascending: false })

        if (contentError) {
          throw contentError
        }

        if (!contentData || contentData.length === 0) {
          setCarouselsData([])
          return
        }

        // Hae kaikki segmentit näihin contenteihin
        const contentIds = contentData.map(item => item.id)
        
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('segments')
          .select('*')
          .in('content_id', contentIds)

        if (segmentsError) {
          throw segmentsError
        }

        // Suodata contentit: näytä vain ne, joilla on vähintään yksi segmentti, jonka status on "In Progress"
        const contentIdsWithInProgressSegments = new Set()
        
        if (segmentsData) {
          segmentsData.forEach(segment => {
            if (segment.status === 'In Progress') {
              contentIdsWithInProgressSegments.add(segment.content_id)
            }
          })
        }

        // Suodata contentit
        const filteredContentData = contentData.filter(content => 
          contentIdsWithInProgressSegments.has(content.id)
        )

        // Yhdistä Content itemit ja niiden Segmentit
        const posts = combineContentAndSegments(filteredContentData, segmentsData)

        console.log(`Created ${posts.length} posts with "In Progress" segments`)
        console.log(`Total segments mapped: ${segmentsData ? segmentsData.length : 0}`)

        setCarouselsData(posts)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [user])

  // Tallenna kaikki muutokset
  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage(null)

      if (!user) {
        throw new Error(t('posts.carouselsTab.messages.noAuth'))
      }

      // Kerää kaikki muutokset kaikista karuselleista
      const updates = []
      
      carouselsData.forEach((item, carouselIndex) => {
        const content = item.content || {}
        const segments = content.segments || []
        
        segments.forEach((segment, segIndex) => {
          const segmentId = segment.recordId || `segment-${carouselIndex}-${segIndex}`
          const edit = segmentEdits[segmentId]
          
          if (edit) {
            updates.push({
              id: segment.recordId,
              contentId: content.recordId,
              text: edit.text !== undefined ? edit.text : segment.text,
              approved: edit.approved !== undefined ? edit.approved : false
            })
          }
        })
      })

      if (updates.length === 0) {
        setSaveMessage({ type: 'info', text: t('posts.carouselsTab.messages.noChanges') })
        return
      }

      // Päivitä jokainen segmentti Supabaseen
      for (const update of updates) {
        // Rakenna päivitysobjekti dynaamisesti
        const updateData = {
          text: update.text || null,
          updated_at: new Date().toISOString()
        }
        
        // Lisää approved vain jos se on määritelty (jos kenttä on olemassa)
        if (update.approved !== undefined) {
          updateData.approved = update.approved
        }
        
        const { error } = await supabase
          .from('segments')
          .update(updateData)
          .eq('id', update.id)
          .eq('content_id', update.contentId)

        if (error) {
          console.error('Error updating segment:', error)
          // Jos approved-kenttä ei ole olemassa, yritetään päivittää ilman sitä
          if (error.message && error.message.includes('approved')) {
            const { error: retryError } = await supabase
              .from('segments')
              .update({
                text: update.text || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', update.id)
              .eq('content_id', update.contentId)
            
            if (retryError) {
              throw new Error(t('posts.carouselsTab.messages.segmentUpdateFailed', { id: update.id }))
            }
          } else {
            throw new Error(t('posts.carouselsTab.messages.segmentUpdateFailed', { id: update.id }))
          }
        }
      }

      setSaveMessage({ type: 'success', text: t('posts.carouselsTab.messages.saved', { count: updates.length }) })
      
      // Päivitä data uudelleen onnistuneen tallennuksen jälkeen
      const userId = await getUserOrgId(user.id)
      if (userId) {
        // Hae päivitetty data
        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'Carousel')
          .neq('status', 'Deleted')
          .order('created_at', { ascending: false })

        if (!contentError && contentData) {
          const contentIds = contentData.map(item => item.id)
          
          const { data: segmentsData, error: segmentsError } = await supabase
            .from('segments')
            .select('*')
            .in('content_id', contentIds)

          if (!segmentsError && segmentsData) {
            // Suodata contentit: näytä vain ne, joilla on vähintään yksi segmentti, jonka status on "In Progress"
            const contentIdsWithInProgressSegments = new Set()
            
            segmentsData.forEach(segment => {
              if (segment.status === 'In Progress') {
                contentIdsWithInProgressSegments.add(segment.content_id)
              }
            })

            // Suodata contentit
            const filteredContentData = contentData.filter(content => 
              contentIdsWithInProgressSegments.has(content.id)
            )

            const posts = combineContentAndSegments(filteredContentData, segmentsData)
            setCarouselsData(posts)
          }
        }
      }
      
      // Tyhjennä muutokset onnistuneen tallennuksen jälkeen
      setTimeout(() => {
        setSegmentEdits({})
        setSaveMessage(null)
      }, 2000)

    } catch (error) {
      console.error('Error saving changes:', error)
      setSaveMessage({ type: 'error', text: error.message || t('posts.carouselsTab.messages.saveFailed') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="carousels-tab-container">
      <div className="carousels-tab-header">
        <h2 className="carousels-tab-title">{t('posts.carouselsTab.title')}</h2>
        <div className="carousels-header-actions">
          {carouselsData.length > 0 && (
            <span className="carousels-count">{t('posts.carouselsTab.count', { count: carouselsData.length })}</span>
          )}
          {carouselsData.length > 0 && Object.keys(segmentEdits).length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="carousels-save-btn"
            >
              {saving ? t('ui.buttons.saving') : t('ui.buttons.save')}
            </button>
          )}
        </div>
      </div>

      {/* Tallennusviesti */}
      {saveMessage && (
        <div className={`carousels-save-message ${saveMessage.type}`}>
          {saveMessage.text}
        </div>
      )}

      {carouselsData.length === 0 ? (
        <div className="carousels-empty">
          <div className="carousels-empty-icon">🎠</div>
          <p className="carousels-empty-text">{t('posts.carouselsTab.empty.text')}</p>
        </div>
      ) : (
        <div className="carousels-list">
          {carouselsData.map((item, index) => {
            const content = item.content || {}
            const segments = content.segments || []
            
            // Järjestä segmentit slideNo:n mukaan
            const sortedSegments = [...segments].sort((a, b) => {
              const aNum = parseInt(a.slideNo) || 999
              const bNum = parseInt(b.slideNo) || 999
              return aNum - bNum
            })

            return (
              <div key={content.recordId || index} className="carousel-item">
                {/* Vasemmalla 1/4: Caption-laatikko */}
                <div className="carousel-caption-box">
                  <div className="carousel-caption-content">
                    <h3 className="carousel-caption-title">{t('posts.carouselsTab.caption.title')}</h3>
                    <p className="carousel-caption-text">{content.caption || t('posts.carouselsTab.caption.noCaption')}</p>
                  </div>
                </div>

                {/* Oikealla 3/4: Segmentit allekkain */}
                <div className="carousel-segments">
                  {sortedSegments.length === 0 ? (
                    <div className="carousel-segment-empty">
                      <p>{t('posts.carouselsTab.segments.noSegments')}</p>
                    </div>
                  ) : (
                    sortedSegments.map((segment, segIndex) => {
                      const segmentId = segment.recordId || `segment-${index}-${segIndex}`
                      const currentText = segmentEdits[segmentId]?.text !== undefined 
                        ? segmentEdits[segmentId].text 
                        : segment.text || ''
                      const currentApproved = segmentEdits[segmentId]?.approved !== undefined
                        ? segmentEdits[segmentId].approved
                        : false
                      
                      return (
                        <div key={segmentId} className="carousel-segment">
                          <div className="carousel-segment-header">
                            <span className="carousel-segment-number">{t('posts.carouselsTab.segments.slideNumber', { number: segment.slideNo || segIndex + 1 })}</span>
                            <div className="carousel-segment-header-right">
                              {segment.status && (
                                <span className={`carousel-segment-status status-${segment.status.toLowerCase()}`}>
                                  {segment.status}
                                </span>
                              )}
                              <div className="carousel-segment-approved">
                                <label className="switch">
                                  <input
                                    type="checkbox"
                                    checked={currentApproved}
                                    onChange={(e) => {
                                      setSegmentEdits(prev => ({
                                        ...prev,
                                        [segmentId]: {
                                          ...prev[segmentId],
                                          approved: e.target.checked
                                        }
                                      }))
                                    }}
                                  />
                                  <span className="slider"></span>
                                </label>
                                <span className="carousel-segment-approved-label">{t('posts.carouselsTab.segments.approved')}</span>
                              </div>
                            </div>
                          </div>
                          <textarea
                            className="carousel-segment-text-input"
                            value={currentText}
                            onChange={(e) => {
                              setSegmentEdits(prev => ({
                                ...prev,
                                [segmentId]: {
                                  ...prev[segmentId],
                                  text: e.target.value
                                }
                              }))
                            }}
                            placeholder={t('posts.carouselsTab.segments.placeholder')}
                            rows={3}
                          />
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
