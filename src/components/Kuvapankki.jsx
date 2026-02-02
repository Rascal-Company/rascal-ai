import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUser } from '../utils/userApi'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'

export default function Kuvapankki({ onClose }) {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
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
      const userId = await getUserOrgId(user.id)
      if (!userId) {
        setError('Käyttäjän ID ei löytynyt')
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
        console.error('Virhe kuvien listauksessa:', listError)
        return
      }

      // Muodosta julkiset URLit kuville
      const imageUrls = data
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

        // Upload kuva
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Upload epäonnistui: ${uploadError.message}`)
        }

        return { fileName, filePath }
      })

      await Promise.all(uploadPromises)
      
      // Päivitä kuvat lista
      await fetchImages()
      
    } catch (err) {
      console.error('Virhe kuvan uploadissa:', err)
      setError(err.message || 'Virhe kuvan uploadissa')
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

  if (loading && images.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Ladataan...</div>
  }

  return (
    <div className="kuvapankki-container">
      <div className="kuvapankki-header">
        <h3>Kuvapankki</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="kuvapankki-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Ladataan...' : 'Lisää kuvia'}
          </button>
          {onClose && (
            <button
              className="kuvapankki-upload-btn"
              onClick={onClose}
              style={{ background: '#6b7280' }}
            >
              Sulje
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
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
    </div>
  )
}

