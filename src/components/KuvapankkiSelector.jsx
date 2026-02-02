import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'

export default function KuvapankkiSelector({ onSelectImage, onClose }) {
  const { t } = useTranslation('common')
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
        setError(t('posts.imageBank.error.idNotFound'))
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
        setError(t('posts.imageBank.error.fetch'))
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
      setError(t('posts.imageBank.error.fetch'))
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
    <div className="bg-white rounded-3xl overflow-hidden flex flex-col max-h-[80vh]">
      <div className="px-8 py-6 flex items-center justify-between border-b border-gray-50 flex-shrink-0">
        <h3 className="text-xl font-bold text-gray-900">{t('posts.imageBank.selectTitle')}</h3>
        {onClose && (
          <button
            className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition-colors"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 grayscale opacity-40">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🖼️</div>
            <p className="text-sm font-bold text-gray-900 max-w-[240px] mx-auto">{t('posts.imageBank.noImagesSelector')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                onClick={() => handleImageClick(image)}
              >
                <img src={image.url} alt={image.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                    <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
