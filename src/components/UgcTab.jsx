import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'

export default function UgcTab() {
  const { user } = useAuth()
  
  const [ugcPosts, setUgcPosts] = useState([])
  const [ugcLoading, setUgcLoading] = useState(false)
  
  // Lataa tallennettu formData localStorageesta tai käytä oletusta
  const [ugcFormData, setUgcFormDataState] = useState(() => {
    try {
      const saved = localStorage.getItem('ugcFormData')
      if (saved) {
        const parsed = JSON.parse(saved)
        // Palauta tallennettu data, mutta productImage on aina null (ei voi tallentaa File-objektia)
        return {
          ...parsed,
          productImage: null // File-objekti ei voi olla localStorage:ssa
        }
      }
    } catch (e) {
      console.error('Error loading UGC form data from localStorage:', e)
    }
    return { 
      productName: '', 
      productDetails: '', 
      productImage: null,
      productImageUrl: null,
      contentType: 'Kuva', // 'Kuva' tai 'Video'
      styleId: '', // Visuaalinen tyyli
      formatId: '' // Kuvan muoto
    }
  })
  
  // Wrapper-funktio joka tallentaa formDatan localStorageen
  // Tukee sekä objektia että funktionaalista päivitystä (prev => ...)
  const setUgcFormData = (dataOrUpdater) => {
    if (typeof dataOrUpdater === 'function') {
      // Funktionaalinen päivitys
      setUgcFormDataState(prev => {
        const newData = dataOrUpdater(prev)
        try {
          // Tallenna localStorageen (ilman productImage File-objektia)
          const toSave = { ...newData, productImage: null }
          localStorage.setItem('ugcFormData', JSON.stringify(toSave))
        } catch (e) {
          console.error('Error saving UGC form data to localStorage:', e)
        }
        return newData
      })
    } else {
      // Suora objekti
      setUgcFormDataState(dataOrUpdater)
      try {
        // Tallenna localStorageen (ilman productImage File-objektia)
        const toSave = { ...dataOrUpdater, productImage: null }
        localStorage.setItem('ugcFormData', JSON.stringify(toSave))
      } catch (e) {
        console.error('Error saving UGC form data to localStorage:', e)
      }
    }
  }
  
  const [ugcUploading, setUgcUploading] = useState(false)
  const [productDragActive, setProductDragActive] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '' })

  // UGC data haku
  const fetchUgcPosts = async () => {
    if (!user) return
    
    try {
      setUgcLoading(true)
      
      // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
      const userId = await getUserOrgId(user.id)
      
      if (!userId) {
        return
      }
      
      // Haetaan vain UGC-tyyppiset postaukset content-taulusta
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'UGC')
        .neq('status', 'Deleted')
        .order('created_at', { ascending: false })
      
      if (error) {
        throw error
      }
      
      setUgcPosts(data || [])
    } catch (err) {
      console.error('Virhe UGC datan haussa:', err)
    } finally {
      setUgcLoading(false)
    }
  }

  // Hae UGC data kun komponentti mountataan
  useEffect(() => {
    if (user) {
      fetchUgcPosts()
    }
  }, [user])

  // UGC kuvan upload handler
  const handleImageUpload = async (file, type) => {
    if (!file) return null

    try {
      setUgcUploading(true)

      // Upload kuva Supabase temp-ingest bucketiin
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const bucket = 'temp-ingest'
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const path = `${userId}/ugc/${Date.now()}-${safeName}`
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { 
          upsert: true, 
          contentType: file.type || 'image/jpeg' 
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      // Hae julkinen URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      const imageUrl = urlData.publicUrl

      // Päivitä form data
      if (type === 'product') {
        setUgcFormData(prev => ({ ...prev, productImageUrl: imageUrl, productImage: file }))
      }

      return imageUrl
    } catch (err) {
      console.error('Virhe kuvan uploadissa:', err)
      setToast({ visible: true, message: 'Virhe kuvan uploadissa: ' + err.message })
      setTimeout(() => setToast({ visible: false, message: '' }), 3000)
      return null
    } finally {
      setUgcUploading(false)
    }
  }

  // Muunna formatId aspectRatio:ksi
  const getAspectRatio = (formatId) => {
    switch (formatId) {
      case 'social_story':
        return '9:16'
      case 'feed_square':
        return '1:1'
      case 'web_landscape':
        return '16:9'
      default:
        return ''
    }
  }

  // UGC form submit handler
  const handleUgcSubmit = async (e) => {
    e.preventDefault()
    
    // Validoi pakolliset kentät
    if (!ugcFormData.productName.trim() || 
        !ugcFormData.productDetails.trim() || 
        !ugcFormData.productImageUrl ||
        !ugcFormData.contentType ||
        !ugcFormData.styleId ||
        !ugcFormData.formatId) {
      setToast({ visible: true, message: 'Täytä kaikki pakolliset kentät' })
      setTimeout(() => setToast({ visible: false, message: '' }), 3000)
      return
    }
    
    try {
      setUgcUploading(true)

      // Hae session token autentikointia varten
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session?.access_token) {
        throw new Error('Session expired or invalid. Please log in again.')
      }

      // Laske aspectRatio formatId:n perusteella
      const aspectRatio = getAspectRatio(ugcFormData.formatId)

      // Lähetä data N8N:ään
      const response = await axios.post('/api/content/ugc-video', {
        productName: ugcFormData.productName,
        productDetails: ugcFormData.productDetails,
        productImageUrl: ugcFormData.productImageUrl,
        contentType: ugcFormData.contentType,
        styleId: ugcFormData.styleId,
        formatId: ugcFormData.formatId,
        aspectRatio: aspectRatio
      }, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.data.success) {
        setToast({ visible: true, message: 'UGC-sisältö pyyntö lähetetty onnistuneesti!' })
        setTimeout(() => setToast({ visible: false, message: '' }), 3000)
        
        // Tyhjennä formi ja localStorage
        const emptyFormData = { 
          productName: '', 
          productDetails: '', 
          productImage: null,
          productImageUrl: null,
          contentType: 'Kuva',
          styleId: '',
          formatId: ''
        }
        setUgcFormData(emptyFormData)
        localStorage.removeItem('ugcFormData')
        
        // Päivitä lista
        await fetchUgcPosts()
      }
    } catch (err) {
      console.error('Virhe UGC-sisällön pyynnön lähettämisessä:', err)
      setToast({ visible: true, message: 'Virhe UGC-sisällön pyynnön lähettämisessä: ' + (err.response?.data?.error || err.message) })
      setTimeout(() => setToast({ visible: false, message: '' }), 3000)
    } finally {
      setUgcUploading(false)
    }
  }

  return (
    <>
      {/* Toast notifikaatio - renderöidään portalilla body-elementtiin */}
      {toast.visible && createPortal(
        <div className="toast-notice" role="status" aria-live="polite">
          {toast.message}
        </div>,
        document.body
      )}
      
      <div className="ugc-container">
        {/* Formi - 1/4 leveys */}
      <div className="ugc-form-section">
        <form onSubmit={handleUgcSubmit} className="ugc-form">
          <h3>Luo uusi UGC-postaus</h3>
          
          {/* Sisällön tyyppi */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-content-type">Sisällön tyyppi *</label>
            <div className="ugc-radio-group">
              <label className="ugc-radio-label">
                <input
                  type="radio"
                  name="contentType"
                  value="Kuva"
                  checked={ugcFormData.contentType === 'Kuva'}
                  onChange={(e) => setUgcFormData({ ...ugcFormData, contentType: e.target.value })}
                  disabled={ugcUploading}
                  className="ugc-radio-input"
                />
                <span className="ugc-radio-text">Kuva</span>
              </label>
              <label className="ugc-radio-label">
                <input
                  type="radio"
                  name="contentType"
                  value="Video"
                  checked={ugcFormData.contentType === 'Video'}
                  onChange={(e) => setUgcFormData({ ...ugcFormData, contentType: e.target.value })}
                  disabled={ugcUploading}
                  className="ugc-radio-input"
                />
                <span className="ugc-radio-text">Video</span>
              </label>
            </div>
          </div>
          
          {/* Tuote (kuva) */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-product-image">Tuote (kuva) *</label>
            {ugcFormData.productImageUrl ? (
              <div className="ugc-image-preview">
                <img src={ugcFormData.productImageUrl} alt="Tuote" />
                <button
                  type="button"
                  onClick={() => setUgcFormData(prev => ({ ...prev, productImageUrl: null, productImage: null }))}
                  className="ugc-remove-image"
                  disabled={ugcUploading}
                >
                  ✕ Poista
                </button>
              </div>
            ) : (
              <div
                className={`ugc-drag-drop-zone ${productDragActive ? 'drag-active' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProductDragActive(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProductDragActive(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setProductDragActive(false)
                  const file = e.dataTransfer.files?.[0]
                  if (file && file.type.startsWith('image/')) {
                    handleImageUpload(file, 'product')
                  }
                }}
                onClick={() => document.getElementById('ugc-product-image').click()}
              >
                <div className="ugc-drag-drop-content">
                  <div className="ugc-drag-drop-icon">📷</div>
                  <p className="ugc-drag-drop-text">Raahaa kuva tähän tai klikkaa valitaksesi</p>
                  <p className="ugc-drag-drop-hint">JPG, PNG, GIF (max 10MB)</p>
                </div>
                <input
                  type="file"
                  id="ugc-product-image"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleImageUpload(file, 'product')
                    }
                  }}
                  className="ugc-file-input-hidden"
                  disabled={ugcUploading}
                />
              </div>
            )}
          </div>

          {/* Tuotteen nimi */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-product-name">Tuotteen nimi *</label>
            <input
              type="text"
              id="ugc-product-name"
              value={ugcFormData.productName}
              onChange={(e) => setUgcFormData({ ...ugcFormData, productName: e.target.value })}
              placeholder="Kirjoita tuotteen nimi..."
              className="ugc-input"
              disabled={ugcUploading}
            />
          </div>

          {/* Tuotteen tiedot */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-product-details">Tuotteen tiedot *</label>
            <textarea
              id="ugc-product-details"
              value={ugcFormData.productDetails}
              onChange={(e) => setUgcFormData({ ...ugcFormData, productDetails: e.target.value })}
              placeholder="Kirjoita tuotteen tiedot..."
              rows={4}
              className="ugc-textarea"
              disabled={ugcUploading}
            />
          </div>

          {/* Visuaalinen tyyli */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-style">Visuaalinen tyyli *</label>
            <select
              id="ugc-style"
              value={ugcFormData.styleId}
              onChange={(e) => setUgcFormData({ ...ugcFormData, styleId: e.target.value })}
              className="ugc-input"
              disabled={ugcUploading}
            >
              <option value="">Valitse tyyli...</option>
              <option value="studio_clean">Studio (Puhdas & Selkeä)</option>
              <option value="lifestyle_home">Lifestyle (Koti & Arki)</option>
              <option value="premium_luxury">Premium (Tumma & Ylellinen)</option>
              <option value="nature_organic">Luonto (Raikas & Orgaaninen)</option>
              <option value="urban_street">Urbaani (Kaupunki & Moderni)</option>
            </select>
          </div>

          {/* Kuvan muoto */}
          <div className="ugc-form-group">
            <label htmlFor="ugc-format">Kuvan muoto *</label>
            <div className="ugc-radio-group">
              <label className="ugc-radio-label">
                <input
                  type="radio"
                  name="formatId"
                  value="social_story"
                  checked={ugcFormData.formatId === 'social_story'}
                  onChange={(e) => setUgcFormData({ ...ugcFormData, formatId: e.target.value })}
                  disabled={ugcUploading}
                  className="ugc-radio-input"
                />
                <span className="ugc-radio-text">Story 9:16</span>
              </label>
              <label className="ugc-radio-label">
                <input
                  type="radio"
                  name="formatId"
                  value="feed_square"
                  checked={ugcFormData.formatId === 'feed_square'}
                  onChange={(e) => setUgcFormData({ ...ugcFormData, formatId: e.target.value })}
                  disabled={ugcUploading}
                  className="ugc-radio-input"
                />
                <span className="ugc-radio-text">Neliö 1:1</span>
              </label>
              <label className="ugc-radio-label">
                <input
                  type="radio"
                  name="formatId"
                  value="web_landscape"
                  checked={ugcFormData.formatId === 'web_landscape'}
                  onChange={(e) => setUgcFormData({ ...ugcFormData, formatId: e.target.value })}
                  disabled={ugcUploading}
                  className="ugc-radio-input"
                />
                <span className="ugc-radio-text">Vaaka 16:9</span>
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            className="ugc-submit-btn" 
            disabled={
              ugcUploading || 
              !ugcFormData.productName.trim() || 
              !ugcFormData.productDetails.trim() || 
              !ugcFormData.productImageUrl ||
              !ugcFormData.contentType ||
              !ugcFormData.styleId ||
              !ugcFormData.formatId
            }
          >
            {ugcUploading ? (
              <>
                <span className="ugc-loading-spinner"></span>
                Lähetetään...
              </>
            ) : (
              'Luo UGC-sisältö'
            )}
          </button>
        </form>
      </div>

      {/* Postaukset - 3/4 leveys */}
      <div className="ugc-posts-section">
        {ugcLoading ? (
          <div className="ugc-loading">Ladataan...</div>
        ) : ugcPosts.length === 0 ? (
          <div className="ugc-empty">Ei postauksia vielä</div>
        ) : (
          <div className="ugc-posts-grid">
            {ugcPosts.map((post) => {
              const mediaUrl = post.media_urls && post.media_urls.length > 0 ? post.media_urls[0] : null
              
              // Tunnista onko media video vai kuva URL:n perusteella
              const isVideo = mediaUrl && (
                mediaUrl.includes('.mp4') || 
                mediaUrl.includes('.webm') || 
                mediaUrl.includes('.mov') || 
                mediaUrl.includes('.avi') ||
                mediaUrl.includes('video')
              )
              
              return (
                <div key={post.id} className="ugc-post-card">
                  <div className="ugc-post-card-content">
                    {/* Media thumbnail/preview */}
                    <div className="ugc-post-thumbnail">
                      {mediaUrl ? (
                        isVideo ? (
                          <video
                            src={mediaUrl}
                            controls
                            className="ugc-post-video"
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt={post.idea || 'UGC-sisältö'}
                            className="ugc-post-image"
                          />
                        )
                      ) : (
                        <div className="ugc-post-placeholder">
                          <div className="ugc-placeholder-icon">📷</div>
                          <div className="ugc-placeholder-text">Ei mediaa</div>
                        </div>
                      )}
                    </div>
                    {/* Postauksen tiedot */}
                    <div className="ugc-post-info">
                      <div className="ugc-post-header">
                        <h3 className="ugc-post-title">
                          {post.idea || 'Nimetön postaus'}
                        </h3>
                        <div className="ugc-post-badges">
                          <span className="ugc-post-type">{post.type}</span>
                          <span className={`ugc-post-status ${post.status?.toLowerCase().replace(' ', '-')}`}>
                            {post.status || 'Unknown'}
                          </span>
                        </div>
                      </div>
                      {post.caption && (
                        <p className="ugc-post-caption">
                          {post.caption.length > 150 
                            ? post.caption.substring(0, 150) + '...' 
                            : post.caption}
                        </p>
                      )}
                      <div className="ugc-post-footer">
                        <span className="ugc-post-date">
                          {new Date(post.created_at).toLocaleDateString('fi-FI', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      </div>
    </>
  )
}

