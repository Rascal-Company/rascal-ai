import React, { useState, useEffect, useRef } from 'react'
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
  const [selectedCarouselId, setSelectedCarouselId] = useState(null)

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
          status: segment.status,
          media_urls: segment.media_urls || []
        })
      })
    }

    Object.keys(segmentsByContentId).forEach(contentId => {
      segmentsByContentId[contentId].sort((a, b) => {
        const slideA = String(a.slideNo || '0').toLowerCase()
        const slideB = String(b.slideNo || '0').toLowerCase()

        if (slideA === slideB) return 0

        // Handle 'final' or 'x_final' - always move to end
        const isAFinal = slideA.includes('final')
        const isBFinal = slideB.includes('final')

        if (isAFinal && !isBFinal) return 1
        if (!isAFinal && isBFinal) return -1
        if (isAFinal && isBFinal) return slideA.localeCompare(slideB) // In case there are multiple final-tagged slides

        const numA = parseInt(slideA)
        const numB = parseInt(slideB)

        if (isNaN(numA)) return 1
        if (isNaN(numB)) return -1

        return numA - numB
      })
    })

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
        const userId = await getUserOrgId(user.id)
        if (!userId) return

        const { data: contentData, error: contentError } = await supabase
          .from('content')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'Carousel')
          .neq('status', 'Deleted')
          .order('created_at', { ascending: false })

        if (contentError) throw contentError
        if (!contentData || contentData.length === 0) {
          setCarouselsData([])
          return
        }

        const contentIds = contentData.map(item => item.id)
        const { data: segmentsData, error: segmentsError } = await supabase
          .from('segments')
          .select('*')
          .in('content_id', contentIds)

        if (segmentsError) throw segmentsError

        const contentIdsWithInProgressSegments = new Set()
        if (segmentsData) {
          segmentsData.forEach(segment => {
            if (segment.status === 'In Progress') {
              contentIdsWithInProgressSegments.add(segment.content_id)
            }
          })
        }

        const filteredContentData = contentData.filter(content =>
          contentIdsWithInProgressSegments.has(content.id)
        )

        const posts = combineContentAndSegments(filteredContentData, segmentsData)
        setCarouselsData(posts)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    }

    fetchData()
  }, [user])

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveMessage(null)

      if (!user) throw new Error(t('posts.carouselsTab.messages.noAuth'))

      const updates = []
      carouselsData.forEach((item) => {
        const content = item.content || {}
        const segments = content.segments || []

        segments.forEach((segment) => {
          const segmentId = segment.recordId
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

      for (const update of updates) {
        const updateData = {
          text: update.text || null,
          updated_at: new Date().toISOString()
        }
        if (update.approved !== undefined) updateData.approved = update.approved

        const { error } = await supabase
          .from('segments')
          .update(updateData)
          .eq('id', update.id)
          .eq('content_id', update.contentId)

        if (error) {
          if (error.message && error.message.includes('approved')) {
            await supabase
              .from('segments')
              .update({ text: update.text || null, updated_at: new Date().toISOString() })
              .eq('id', update.id)
              .eq('content_id', update.contentId)
          } else {
            throw new Error(t('posts.carouselsTab.messages.segmentUpdateFailed', { id: update.id }))
          }
        }
      }

      setSaveMessage({ type: 'success', text: t('posts.carouselsTab.messages.saved', { count: updates.length }) })

      const userId = await getUserOrgId(user.id)
      if (userId) {
        const { data: contentData } = await supabase.from('content').select('*').eq('user_id', userId).eq('type', 'Carousel').neq('status', 'Deleted')
        if (contentData) {
          const contentIds = contentData.map(item => item.id)
          const { data: segmentsData } = await supabase.from('segments').select('*').in('content_id', contentIds)
          if (segmentsData) {
            const posts = combineContentAndSegments(contentData, segmentsData)
            setCarouselsData(posts)
          }
        }
      }

      setTimeout(() => {
        setSegmentEdits({})
        setSaveMessage(null)
      }, 2000)
    } catch (error) {
      setSaveMessage({ type: 'error', text: error.message || t('posts.carouselsTab.messages.saveFailed') })
    } finally {
      setSaving(false)
    }
  }

  const activeCarousel = selectedCarouselId ? carouselsData.find(c => c.content.recordId === selectedCarouselId) : null

  return (
    <div className="space-y-12 pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-2">
          {selectedCarouselId ? (
            <button
              onClick={() => setSelectedCarouselId(null)}
              className="group flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors mb-2"
            >
              <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
              <span className="text-[10px] font-black uppercase tracking-widest">{t('posts.carouselsTab.editor.backToList')}</span>
            </button>
          ) : null}
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">
            {selectedCarouselId ? activeCarousel?.content.idea || t('posts.carouselsTab.editor.editingTitle') : t('posts.carouselsTab.title')}
          </h2>
          {carouselsData.length > 0 && !selectedCarouselId && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest pl-2">
                {t('posts.carouselsTab.editor.workingPreview', { count: carouselsData.length })}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {selectedCarouselId && Object.keys(segmentEdits).length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="group px-8 py-3.5 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-sm shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 flex items-center gap-3"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
              )}
              {saving ? t('ui.buttons.saving') : t('ui.buttons.save')}
            </button>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className={`p-6 rounded-[32px] border-2 animate-in slide-in-from-top-4 duration-500 flex items-center justify-between shadow-xl shadow-gray-200/20 ${saveMessage.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
          saveMessage.type === 'error' ? 'bg-red-50/50 border-red-100 text-red-700' :
            'bg-blue-50/50 border-blue-100 text-blue-700'
          }`}>
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${saveMessage.type === 'success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {saveMessage.type === 'success' ? '✨' : '⚠️'}
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest leading-none mb-1">{saveMessage.type}</p>
              <p className="text-sm font-bold opacity-80">{saveMessage.text}</p>
            </div>
          </div>
          <button onClick={() => setSaveMessage(null)} className="text-[10px] font-black uppercase tracking-widest hover:opacity-100 opacity-40">{t('common.close')}</button>
        </div>
      )}

      {carouselsData.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[48px] border border-gray-100 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.05)] group">
          <div className="relative mb-8">
            <div className="absolute -inset-4 bg-blue-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative w-24 h-24 bg-white rounded-[32px] shadow-xl shadow-gray-100 flex items-center justify-center text-5xl group-hover:scale-110 transition-all duration-500 group-hover:rotate-6">🎠</div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">{t('common.done')}</h3>
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest max-w-xs">{t('posts.carouselsTab.empty.text') || 'Ei uusia karuselleja työn alla.'}</p>
        </div>
      ) : !selectedCarouselId ? (
        /* ListView: Grid of Carousels */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in duration-700">
          {carouselsData.map((item, idx) => {
            const dateStr = item.content.created ? new Date(item.content.created).toLocaleDateString(t('common.locale') === 'fi' ? 'fi-FI' : 'en-US', { day: 'numeric', month: 'short' }) : ''

            return (
              <button
                key={item.content.recordId}
                onClick={() => setSelectedCarouselId(item.content.recordId)}
                className="group p-10 bg-white rounded-[48px] border border-gray-100 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.03)] hover:shadow-[0_48px_80px_-16px_rgba(0,0,0,0.08)] hover:-translate-y-2 transition-all duration-700 text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-10">
                  <div className="px-3 py-1 bg-gray-50 rounded-full text-[9px] font-black text-gray-400 uppercase tracking-widest">{dateStr}</div>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-900 rounded-[20px] shadow-lg shadow-gray-200 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      <span className="opacity-80">🎠</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        {t('posts.carouselsTab.list.badge')}
                      </p>
                      <h4 className="text-base font-black text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                        {item.content.idea || t('posts.carouselsTab.list.untitled')}
                      </h4>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100/50 min-h-[80px]">
                    <p className="text-[11px] font-bold text-gray-400 italic leading-relaxed line-clamp-2">
                      {item.content.caption || t('posts.carouselsTab.list.noDescription')}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex -space-x-2">
                      {item.content.segments?.slice(0, 5).map((s, i) => (
                        <div key={i} className="inline-block h-8 w-8 rounded-xl ring-4 ring-white bg-gray-100 overflow-hidden flex-shrink-0 z-[1]">
                          {s.media_urls?.[0] ? (
                            <img src={s.media_urls[0]} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-[9px] font-black text-gray-300">{i + 1}</div>
                          )}
                        </div>
                      ))}
                      {item.content.segments?.length > 5 && (
                        <div className="flex items-center justify-center h-8 w-8 rounded-xl ring-4 ring-white bg-gray-900 text-[9px] font-black text-white z-[0]">
                          +{item.content.segments.length - 5}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{t('posts.carouselsTab.list.pagesLabel')}</p>
                      <p className="text-sm font-black text-gray-900">{item.content.segments?.length || 0}</p>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      ) : activeCarousel ? (
        /* FocusView: Full Editor for one carousel */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in zoom-in-95 duration-500">
          {/* Left: Metadata Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-8 order-2 lg:order-1">
            <div className="p-10 bg-white rounded-[48px] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <span className="text-[40px] opacity-[0.03] font-black select-none pointer-events-none">Focus</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('posts.carouselsTab.editor.themeLabel')}</label>
                </div>
                <div className="text-lg font-bold text-gray-900 leading-snug">
                  {activeCarousel.content.idea || t('posts.carouselsTab.editor.untitled')}
                </div>
              </div>

              <div className="p-8 bg-gray-50/50 rounded-[32px] border border-gray-100/50">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-4">{t('posts.carouselsTab.editor.contextLabel')}</label>
                <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                  "{activeCarousel.content.caption || t('posts.carouselsTab.editor.noDescription')}"
                </p>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('posts.carouselsTab.editor.statusLabel')}</span>
                  <span className="px-3 py-1 bg-white border border-gray-100 rounded-full text-[10px] font-bold text-gray-900 shadow-sm">{activeCarousel.content.status}</span>
                </div>
                <div className="space-y-1 text-right">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">{t('posts.carouselsTab.editor.pagesLabel')}</span>
                  <span className="text-sm font-black text-gray-900">{activeCarousel.content.segments.length}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCarouselId(null)}
                className="w-full py-4 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all mt-4"
              >
                {t('posts.carouselsTab.editor.selectAnother')}
              </button>
            </div>
          </div>

          {/* Right: Slide Flow */}
          <div className="lg:col-span-8 space-y-4 order-1 lg:order-2">
            <div className="relative space-y-4">
              <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-blue-500/20 via-blue-500/10 to-transparent hidden md:block" />

              {activeCarousel.content.segments.map((segment, segIndex) => {
                const segmentId = segment.recordId
                const currentText = segmentEdits[segmentId]?.text !== undefined ? segmentEdits[segmentId].text : segment.text || ''
                const currentApproved = segmentEdits[segmentId]?.approved !== undefined ? segmentEdits[segmentId].approved : false
                const hasMedia = segment.media_urls && segment.media_urls.length > 0
                const displayNo = segIndex + 1

                return (
                  <div key={segmentId} className="flex gap-4 group/segment items-start">
                    {/* Index Indicator */}
                    <div className="w-10 h-10 rounded-xl bg-gray-50/50 flex items-center justify-center border border-gray-100/50 shrink-0 mt-0.5">
                      <span className="text-[11px] font-black text-gray-400">{displayNo}</span>
                    </div>

                    <div className="flex-1 bg-white px-5 py-3 rounded-[20px] border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-100 transition-all duration-300">
                      <div className="flex items-center gap-4">
                        {hasMedia && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0 group-hover:scale-105 transition-transform duration-500">
                            <img src={segment.media_urls[0]} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0 flex items-center py-1">
                          <textarea
                            value={currentText}
                            onChange={(e) => {
                              setSegmentEdits(prev => ({
                                ...prev,
                                [segmentId]: { ...prev[segmentId], text: e.target.value }
                              }))
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onFocus={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder={t('posts.carouselsTab.editor.segmentPlaceholder')}
                            rows={1}
                            className="w-full p-0 bg-transparent border-none focus:ring-0 text-[13px] font-bold text-gray-900 leading-snug resize-none overflow-hidden placeholder:text-gray-200"
                          />
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className={`
                            px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-colors
                            ${currentApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}
                          `}>
                            {currentApproved ? t('posts.carouselsTab.editor.ok') : t('posts.carouselsTab.editor.editing')}
                          </div>

                          <button
                            onClick={() => {
                              setSegmentEdits(prev => ({
                                ...prev,
                                [segmentId]: { ...prev[segmentId], approved: !currentApproved }
                              }))
                            }}
                            className={`
                              relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-300 ease-in-out focus:outline-none 
                              ${currentApproved ? 'bg-emerald-500 shadow-[0_0_12px_-2px_rgba(16,185,129,0.4)]' : 'bg-gray-200 group-hover/segment:bg-gray-300'}
                            `}
                          >
                            <span className={`
                              pointer-events-none relative inline-block h-4 w-4 transform rounded-full bg-white shadow-xl ring-0 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]
                              ${currentApproved ? 'translate-x-5' : 'translate-x-0'}
                              flex items-center justify-center
                            `}>
                              {currentApproved ? (
                                <svg className="h-2 w-2 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <div className="w-1 h-1 bg-gray-300 rounded-full" />
                              )}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
