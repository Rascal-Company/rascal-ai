import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import KuvapankkiSelector from './KuvapankkiSelector'
import CarouselSegmentsEditor from './CarouselSegmentsEditor'
import ErrorDisplay from './KeskenModal/ErrorDisplay'
import ModalActions from './KeskenModal/ModalActions'
import CaptionEditor from './KeskenModal/CaptionEditor'
import MediaPreview from './KeskenModal/MediaPreview'

const KeskenModal = ({ 
  show, 
  editingPost, 
  user,
  onClose, 
  onSave,
  t: tProp,
  userAccountType 
}) => {
  const { t: tHook } = useTranslation('common')
  const t = tProp || tHook
  const [formData, setFormData] = useState({
    caption: ''
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageLoading, setImageLoading] = useState(false)
  const [showMediaSourceMenu, setShowMediaSourceMenu] = useState(false)
  const [showKuvapankkiSelector, setShowKuvapankkiSelector] = useState(false)
  const fileInputRef = useRef(null)

  // Validoi media-tiedosto
  const validateMediaFile = (file) => {
    // Tarkista tiedostotyyppi - backend odottaa tiettyjä MIME-tyyppejä
    const validImageTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif'
    ]
    
    const validVideoTypes = [
      'video/mp4',
      'video/x-m4v'
    ]

    const validTypes = [...validImageTypes, ...validVideoTypes]
    
    if (!validTypes.includes(file.type)) {
      return t('validation.fileTypeNotSupported', { type: file.type })
    }

    return null // Ei virheitä
  }

  // Päivitä formData kun editingPost muuttuu
  // TÄRKEÄ: Älä resetoi formDataa jos käyttäjä on jo muuttanut sitä
  // Tämä estää tekstin katoamisen kun kuva vaihdetaan
  const hasUserEdited = useRef(false)
  const currentPostId = useRef(null)
  
  useEffect(() => {
    if (editingPost) {
      // Jos postaus on vaihtunut (eri ID), resetoi muokkaus-tila
      if (currentPostId.current !== editingPost.id) {
        hasUserEdited.current = false
        currentPostId.current = editingPost.id
        setFormData({
          caption: editingPost.caption || ''
        })
        return
      }
      
      // Jos sama postaus ja käyttäjä ei ole vielä muuttanut tekstiä, päivitä formData
      if (!hasUserEdited.current) {
        setFormData({
          caption: editingPost.caption || ''
        })
      }
      // Jos käyttäjä on muuttanut tekstiä, säilytä muokkaukset
      // Älä resetoi formDataa vaikka editingPost päivittyisi kuvan vaihdon jälkeen
    }
  }, [editingPost])
  
  // Seuraa kun käyttäjä muuttaa caption-kenttää
  const handleCaptionChange = (e) => {
    hasUserEdited.current = true
    setFormData({...formData, caption: e.target.value})
  }

  if (!show || !editingPost) return null

  // Kuvan poisto
  const handleDeleteImage = async (imageUrl) => {
    if (!imageUrl) return
    
    setImageLoading(true)
    setError('')
    
    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError(t('keskenModal.errors.userNotFound'))
        return
      }

      const response = await fetch('/api/content/media-management', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          contentId: editingPost.id,
          imageUrl: imageUrl
        })
      })

      if (!response.ok) {
        throw new Error(t('keskenModal.errors.imageDeleteFailed'))
      }

      // Päivitä editingPost data
      const result = await response.json()
      onSave()
    } catch (err) {
      setError(t('keskenModal.errors.imageDeleteFailedWithDetails', { message: err.message }))
    } finally {
      setImageLoading(false)
    }
  }

  // Lisää kuva kuvapankista
  const handleAddImageFromKuvapankki = async (imageUrl) => {
    try {
      setImageLoading(true)
      setError('')

      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError(t('keskenModal.errors.userNotFound'))
        return
      }

      // Jos on jo kuvia, poista ne kaikki ensin (replaceMode)
      if (editingPost.media_urls && editingPost.media_urls.length > 0) {
        // Poista kaikki vanhat kuvat
        for (const oldImageUrl of editingPost.media_urls) {
          const deleteResponse = await fetch('/api/content/media-management', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              contentId: editingPost.id,
              imageUrl: oldImageUrl
            })
          })

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json().catch(() => ({}))
            throw new Error(t('keskenModal.errors.oldImageDeleteFailed', { error: errorData.error || deleteResponse.statusText }))
          }
        }
      }

      // Lisää uusi kuva kuvapankista
      // Tarvitaan file-objekti, mutta meillä on vain URL
      // Käytetään fetch API:a hakeaksemme kuvan blobina
      const imageResponse = await fetch(imageUrl)
      const imageBlob = await imageResponse.blob()
      const fileName = imageUrl.split('/').pop() || 'kuvapankki.jpg'
      
      const formData = new FormData()
      formData.append('image', imageBlob, fileName)
      formData.append('contentId', editingPost.id)
      formData.append('userId', userId)
      formData.append('replaceMode', 'true')

      const response = await fetch('/api/content/media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(t('keskenModal.errors.imageUploadFailed', { error: errorData.error || response.statusText }))
      }

      const result = await response.json()

      // Päivitä editingPost data
      const updatedPost = {
        ...editingPost,
        media_urls: [result.publicUrl],
        mediaUrls: [result.publicUrl],
        thumbnail: result.publicUrl
      }
      
      // Päivitä paikallinen state ensin, sitten kutsu onSave
      setFormData(prev => ({
        ...prev,
        // Lisää timestamp kuvan URL:een cache-busting:ia varten
        imageUpdated: Date.now()
      }))
      
      setShowKuvapankkiSelector(false)
      // Älä sulje showMediaSourceMenu -valikkoa, jotta käyttäjä voi helposti valita uuden kuvan
      
      // Kutsu onSave pienen viiveen jälkeen, jotta state ehtii päivittyä
      setTimeout(() => {
        onSave(updatedPost)
      }, 100)
    } catch (err) {
      console.error('Error adding image from kuvapankki:', err)
      setError(t('keskenModal.errors.imageFromKuvapankkiFailed', { message: err.message }))
    } finally {
      setImageLoading(false)
    }
  }

  // Uuden kuvan lataus
  const handleImageUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validoi tiedosto ennen latausta
    const validationError = validateMediaFile(file)
    if (validationError) {
      setError(validationError)
      // Tyhjennä file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setImageLoading(true)
    setError('')

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError(t('keskenModal.errors.userNotFound'))
        return
      }

      // Jos on jo kuvia, poista ne kaikki ensin
      if (editingPost.media_urls && editingPost.media_urls.length > 0) {

        // Poista kaikki vanhat kuvat
        for (const imageUrl of editingPost.media_urls) {
          const deleteResponse = await fetch('/api/content/media-management', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              contentId: editingPost.id,
              imageUrl: imageUrl
            })
          })

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json().catch(() => ({}))
            throw new Error(t('keskenModal.errors.oldImageDeleteFailed', { error: errorData.error || deleteResponse.statusText }))
          }
        }
      }

      const formData = new FormData()
      formData.append('image', file)
      formData.append('contentId', editingPost.id)
      formData.append('userId', userId)
      formData.append('replaceMode', 'true') // Flag että tämä on "vaihda kuva" -toiminto

      const response = await fetch('/api/content/media-management', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(t('keskenModal.errors.imageUploadFailed', { error: errorData.error || response.statusText }))
      }

      // Päivitä editingPost data
      const result = await response.json()

      // Tallenna myös caption tietokantaan samalla kun kuva vaihdetaan
      // Näin muokattu teksti ei katoa
      try {
        const userId = await getUserOrgId(user?.id)
        if (userId && formData.caption !== undefined) {
          const { error: updateError } = await supabase
            .from('content')
            .update({
              caption: formData.caption || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingPost.id)
            .eq('user_id', userId)

          if (updateError) {
            console.error('Caption update error:', updateError)
            // Jatketaan silti kuvan päivitystä
          }
        }
      } catch (captionError) {
        console.error('Error saving caption:', captionError)
        // Jatketaan silti kuvan päivitystä
      }
      
      // Päivitä editingPost state uudella kuvalla JA captionilla
      const updatedPost = {
        ...editingPost,
        media_urls: [result.publicUrl],
        mediaUrls: [result.publicUrl],
        thumbnail: result.publicUrl,
        caption: formData.caption || editingPost.caption || ''
      }
      
      // Tyhjennä file input Safari-yhteensopivuuden vuoksi
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Päivitä paikallinen state ensin, sitten kutsu onSave
      setFormData(prev => ({
        ...prev,
        // Lisää timestamp kuvan URL:een cache-busting:ia varten
        imageUpdated: Date.now()
      }))
      
      // Kutsu onSave pienen viiveen jälkeen, jotta state ehtii päivittyä
      // Älä sulje modaalia - anna käyttäjän nähdä uusi kuva ja jatkaa muokkausta
      setTimeout(() => {
        onSave(updatedPost)
      }, 100)
    } catch (err) {
      setError(t('keskenModal.errors.imageUploadFailedGeneric', { message: err.message }))
      // Tyhjennä file input myös virhetilanteessa
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } finally {
      setImageLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validoi merkkimäärä
    if (formData.caption.length > 2000) {
      setError(t('keskenModal.errors.captionTooLong'))
      setLoading(false)
      return
    }

    try {
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user?.id)

      if (!userId) {
        setError(t('keskenModal.errors.userNotFound'))
        return
      }

      // Päivitä Supabase
      const { error: updateError } = await supabase
        .from('content')
        .update({
          caption: formData.caption || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingPost.id)
        .eq('user_id', userId)

      if (updateError) {
        setError(t('keskenModal.errors.saveFailed'))
        return
      }

      onSave()
    } catch (err) {
      setError(t('keskenModal.errors.saveFailed'))
    } finally {
      setLoading(false)
    }
  }

  if (!show) return null

  return (
    <>
      {createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // Tyhjennä file input kun modaali suljetaan
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              onClose()
            }
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) {
              // Tyhjennä file input kun modaali suljetaan
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              onClose()
            }
          }}
        >
      <div className="modal-container" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{t('keskenModal.title')}</h2>
          <button
            onClick={() => {
              // Tyhjennä file input kun modaali suljetaan
              if (fileInputRef.current) {
                fileInputRef.current.value = ''
              }
              onClose()
            }}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
          {/* Luontipäivämäärä */}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">{t('keskenModal.created')}</label>
            <p className="form-text" style={{
              padding: '8px 12px',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#6b7280'
            }}>
              {editingPost.created_at ? new Date(editingPost.created_at).toLocaleString('fi-FI', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }) : t('keskenModal.notAvailable')}
            </p>
          </div>

            {/* Kaksi saraketta: media vasemmalle, kentät oikealle */}
            {/* Jos segmenttien muokkaus näkyy, vaihdetaan layout: vasen = Postaus, oikea = Slaidit + muokkaus */}
            {(() => {
              const isCarousel = editingPost.type === 'Carousel'
              // Näytetään segmenttien muokkaus vain jos vähintään yhdellä segmentillä on status "In Progress"
              const hasInProgressSegment = editingPost.segments && editingPost.segments.some(segment => segment.status === 'In Progress')
              const showSegmentsEditor = isCarousel && editingPost.segments && editingPost.segments.length > 0 && hasInProgressSegment
              
              // Jos segmenttien muokkaus näkyy, vaihdetaan layout
              if (showSegmentsEditor) {
                return (
                  <>
                    <div className="edit-modal-grid">
                    {/* Vasen sarake: Postaus */}
                    <div className="edit-modal-fields">
                      <CaptionEditor
                        caption={formData.caption}
                        onChange={handleCaptionChange}
                        t={t}
                      />
                    </div>

                    {/* Oikea sarake: Segmenttien muokkaus */}
                    <div className="edit-modal-media">
                      {/* Segmenttien muokkaus */}
                      <div>
                        <CarouselSegmentsEditor
                          segments={editingPost.segments}
                          contentId={editingPost.id}
                          onSave={async () => {
                            // Päivitä segments data
                            const userId = await getUserOrgId(user?.id)
                            if (userId) {
                              const { data: segmentsData } = await supabase
                                .from('segments')
                                .select('*')
                                .eq('content_id', editingPost.id)
                                .order('slide_no', { ascending: true })
                              
                              if (segmentsData) {
                                // Päivitä editingPost state uudella segments-datalla
                                const updatedPost = {
                                  ...editingPost,
                                  segments: segmentsData
                                }
                                // Kutsu onSave callbackia päivittääksesi postauksen
                                if (onSave) {
                                  onSave(updatedPost)
                                }
                              }
                            }
                          }}
                          t={t}
                        />
                      </div>
                    </div>
                  </div>

                  <ErrorDisplay error={error} />

                  <ModalActions
                    onClose={onClose}
                    onSave={handleSubmit}
                    loading={loading}
                    disabled={formData.caption.length > 2000}
                    fileInputRef={fileInputRef}
                    t={t}
                  />
                  </>
                )
              }
              
              // Normaali layout: vasen = Media/Slaidit, oikea = Postaus
              return (
                <>
                <div className="edit-modal-grid">
                  {/* Vasen sarake: Media */}
                  <div className="edit-modal-media">
                    <div className="media-container">
                      <MediaPreview
                        editingPost={editingPost}
                        userAccountType={userAccountType}
                        imageLoading={imageLoading}
                        showMediaSourceMenu={showMediaSourceMenu}
                        onToggleMediaSourceMenu={() => setShowMediaSourceMenu(!showMediaSourceMenu)}
                        onSelectKuvapankki={() => {
                          setShowMediaSourceMenu(false)
                          setShowKuvapankkiSelector(true)
                        }}
                        onSelectKoneelta={() => fileInputRef.current?.click()}
                        onDeleteImage={handleDeleteImage}
                        fileInputRef={fileInputRef}
                        formData={formData}
                        t={t}
                      />
                    </div>
                    
                    {/* Piilotettu file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,video/mp4,video/x-m4v"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </div>

              {/* Oikea sarake: Postaus */}
              <div className="edit-modal-fields">
                <CaptionEditor
                  caption={formData.caption}
                  onChange={handleCaptionChange}
                  t={t}
                />
              </div>
            </div>

            <ErrorDisplay error={error} />

            <ModalActions
              onClose={onClose}
              onSave={handleSubmit}
              loading={loading}
              disabled={formData.caption.length > 2000}
              fileInputRef={fileInputRef}
              t={t}
            />
                </>
          )
        })()}
          </form>
        </div>
      </div>
    </div>,
    document.body
      )}

      {/* Kuvapankki Selector Modal */}
      {showKuvapankkiSelector && createPortal(
        <div 
          className="modal-overlay modal-overlay--light"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowKuvapankkiSelector(false)
              setShowMediaSourceMenu(false)
            }
          }}
        >
          <div className="modal-container" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <KuvapankkiSelector
              onSelectImage={(imageUrl) => handleAddImageFromKuvapankki(imageUrl)}
              onClose={() => {
                setShowKuvapankkiSelector(false)
                // Palauta media source menu näkyviin kun kuvapankki sulkeutuu
                // Näin käyttäjä voi helposti valita uuden kuvan
                setShowMediaSourceMenu(true)
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default KeskenModal
