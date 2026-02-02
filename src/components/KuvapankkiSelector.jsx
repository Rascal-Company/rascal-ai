import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'

export default function KuvapankkiSelector({ onSelectImage, onClose }) {
  const { user } = useAuth()
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const handleImageClick = (image) => {
    if (onSelectImage) {
      onSelectImage(image.url)
    }
    if (onClose) {
      onClose()
    }
  }

  return (
    <div className="kuvapankki-selector">
      <div className="kuvapankki-selector-header">
        <h3>Valitse kuva kuvapankista</h3>
        {onClose && (
          <button
            className="kuvapankki-selector-close"
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="kuvapankki-selector-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="kuvapankki-selector-loading">
          <p>Ladataan kuvia...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="kuvapankki-selector-empty">
          <p>Ei kuvia kuvapankissa. Lisää kuvia Kuvapankki-sivulla.</p>
        </div>
      ) : (
        <div className="kuvapankki-selector-grid">
          {images.map((image, index) => (
            <div
              key={index}
              className="kuvapankki-selector-item"
              onClick={() => handleImageClick(image)}
            >
              <img src={image.url} alt={image.name} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

