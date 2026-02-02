import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'

export default function KuvapankkiPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Hae kuvat kun komponentti mountataan
  useEffect(() => {
    if (user) {
      fetchImages()
    }
  }, [user])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        setError('Käyttäjän ID ei löytynyt')
        setLoading(false)
        return
      }

      // Listaa kuvat Supabase Storagesta
      const bucket = 'content-media'
      const { data, error: listError } = await supabase.storage
        .from(bucket)
        .list(`${userId}/kuvapankki`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (listError) {
        // Jos kansiota ei ole, se on ok - ei kuvia vielä
        if (listError.message?.includes('not found') || listError.statusCode === '404') {
          setImages([])
          setLoading(false)
          return
        }
        console.error('Virhe kuvien listauksessa:', listError)
        setError('Virhe kuvien haussa')
        setLoading(false)
        return
      }

      // Muodosta julkiset URLit kuville
      const imageUrls = (data || [])
        .filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
        .map(file => {
          const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(`${userId}/kuvapankki/${file.name}`)
          return {
            url: urlData.publicUrl,
            name: file.name,
            created_at: file.created_at
          }
        })

      setImages(imageUrls)
    } catch (err) {
      console.error('Virhe kuvien haussa:', err)
      setError('Virhe kuvien haussa')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    await handleUpload(files)
  }

  const handleDrop = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length > 0) {
      await handleUpload(imageFiles)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleUpload = async (files) => {
    if (!user) return

    setUploading(true)
    setError('')

    try {
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      // Hae session token
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.access_token) {
        throw new Error('Käyttäjä ei ole kirjautunut')
      }

      const bucket = 'content-media'
      const uploadPromises = files.map(async (file) => {
        // Tarkista tiedostotyyppi
        if (!file.type.startsWith('image/')) {
          throw new Error(`Tiedosto ${file.name} ei ole kuva`)
        }

        // Tarkista tiedostokoko (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`Kuva ${file.name} on liian suuri (max 10MB)`)
        }

        // Luo uniikki tiedostonimi
        const fileExt = file.name.split('.').pop()
        const timestamp = Date.now()
        const randomSuffix = Math.random().toString(36).substring(2, 8)
        const fileName = `${timestamp}_${randomSuffix}.${fileExt}`
        const filePath = `${userId}/kuvapankki/${fileName}`

        // Upload kuva content-media bucketiin
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          })

        if (uploadError) {
          throw new Error(`Upload epäonnistui: ${uploadError.message}`)
        }

        // Hae julkinen URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)

        const imageUrl = urlData.publicUrl

        // Lähetä backendin kautta N8N:ään (URL mukana)
        const response = await axios.post('/api/personal-images/upload', {
          imageUrl: imageUrl,
          imagePath: filePath,
          userId: userId
        }, {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.data.success) {
          throw new Error('Kuvan lähetys N8N:ään epäonnistui')
        }

        return { fileName, filePath, imageUrl }
      })

      await Promise.all(uploadPromises)
      
      // Päivitä kuvat lista
      await fetchImages()
      
    } catch (err) {
      console.error('Virhe kuvan uploadissa:', err)
      const errorMsg = err.response?.data?.error || err.message || 'Virhe kuvan uploadissa'
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg))
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (imageName) => {
    if (!window.confirm('Haluatko varmasti poistaa tämän kuvan?')) {
      return
    }

    try {
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        throw new Error('Käyttäjän ID ei löytynyt')
      }

      const bucket = 'content-media'
      const filePath = `${userId}/kuvapankki/${imageName}`

      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (deleteError) {
        throw new Error(`Poisto epäonnistui: ${deleteError.message}`)
      }

      // Päivitä kuvat lista
      await fetchImages()
    } catch (err) {
      console.error('Virhe kuvan poistossa:', err)
      setError(err.message || 'Virhe kuvan poistossa')
    }
  }

  return (
    <div className="kuvapankki-page">
      <div className="kuvapankki-page-header">
        <button
          className="kuvapankki-back-btn"
          onClick={() => navigate('/posts')}
        >
          ← Takaisin
        </button>
        <h1>Kuvapankki</h1>
      </div>

      <div className="kuvapankki-container">
        <div className="kuvapankki-header">
          <div className="flex gap-2 items-center">
            <button
              className="kuvapankki-upload-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Ladataan...' : 'Lisää kuvia'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {error && (
          <div className="kuvapankki-error">
            {error}
          </div>
        )}

        <div
          className="kuvapankki-dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragOver}
        >
          <p>Vedä kuvat tähän tai klikkaa "Lisää kuvia"</p>
        </div>

        {loading ? (
          <div className="kuvapankki-loading">
            <p>Ladataan kuvia...</p>
          </div>
        ) : (
          <>
            <div className="kuvapankki-grid">
              {images.map((image, index) => (
                <div key={index} className="kuvapankki-item">
                  <img src={image.url} alt={image.name} />
                  <button
                    className="kuvapankki-delete-btn"
                    onClick={() => handleDelete(image.name)}
                    title="Poista kuva"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {images.length === 0 && !uploading && (
              <div className="kuvapankki-empty">
                <p>Ei kuvia vielä. Lisää ensimmäinen kuva yllä olevalla napilla.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

