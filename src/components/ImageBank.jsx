import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

export default function ImageBank({ onSelectImage }) {
  const { t, i18n } = useTranslation('common')
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [dragActive, setDragActive] = useState(false)
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
        if (listError.message?.includes('not found') || listError.statusCode === '404') {
          setImages([])
          setLoading(false)
          return
        }
        console.error('Error listing images:', listError)
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
      console.error('Error fetching images:', err)
      setError(t('posts.imageBank.error.fetch'))
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
    setDragActive(false)

    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length > 0) {
      await handleUpload(imageFiles)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleUpload = async (files) => {
    if (!user) return
    setUploading(true)
    setError('')

    try {
      const userId = await getUserOrgId(user.id)
      if (!userId) throw new Error(t('posts.imageBank.error.idNotFound'))

      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session?.access_token) throw new Error('Not authenticated')

      const bucket = 'content-media'
      const uploadPromises = files.map(async (file) => {
        if (!file.type.startsWith('image/')) {
          throw new Error(t('posts.imageBank.error.notImage', { name: file.name }))
        }

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(t('posts.imageBank.error.tooLarge', { name: file.name }))
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`
        const filePath = `${userId}/kuvapankki/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType: file.type })

        if (uploadError) throw new Error(`${t('posts.imageBank.error.upload')}: ${uploadError.message}`)

        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
        const imageUrl = urlData.publicUrl

        // N8N notification
        await axios.post('/api/personal-images/upload', {
          imageUrl: imageUrl,
          imagePath: filePath,
          userId: userId
        }, {
          headers: {
            'Authorization': `Bearer ${sessionData.session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        return { fileName, filePath, imageUrl }
      })

      await Promise.all(uploadPromises)
      await fetchImages()
    } catch (err) {
      console.error('Upload error:', err)
      setError(err.response?.data?.error || err.message || t('posts.imageBank.error.upload'))
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (imageName) => {
    if (!window.confirm(t('posts.imageBank.deleteConfirm'))) return

    try {
      const userId = await getUserOrgId(user.id)
      if (!userId) throw new Error(t('posts.imageBank.error.idNotFound'))

      const bucket = 'content-media'
      const filePath = `${userId}/kuvapankki/${imageName}`

      const { error: deleteError } = await supabase.storage
        .from(bucket)
        .remove([filePath])

      if (deleteError) throw new Error(`${t('posts.imageBank.error.delete')}: ${deleteError.message}`)
      await fetchImages()
    } catch (err) {
      console.error('Delete error:', err)
      setError(err.message || t('posts.imageBank.error.delete'))
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {/* Upload Zone */}
      <div className="p-8 pb-4 flex-shrink-0">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative h-40 rounded-3xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-6 text-center group ${dragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' : 'border-gray-100 bg-gray-50/30 hover:border-gray-200 hover:bg-gray-50/50'
            }`}
        >
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {uploading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            )}
          </div>
          <p className="text-sm font-bold text-gray-900 mb-1">
            {uploading ? t('posts.imageBank.uploading') : t('posts.imageBank.upload')}
          </p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">{t('posts.imageBank.dropHint')}</p>
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

      {/* Error Message */}
      {error && (
        <div className="mx-8 mb-4 px-4 py-3 bg-red-50 text-red-600 rounded-2xl text-xs font-bold border border-red-100 animate-in fade-in slide-in-from-top-2 flex-shrink-0">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-8 pt-0 custom-scrollbar">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="aspect-square bg-gray-50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : images.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-20 grayscale opacity-40">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center text-4xl mb-6">🖼️</div>
            <p className="text-sm font-bold text-gray-900 max-w-[200px]">{t('posts.imageBank.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-500">
            {images.map((image, index) => (
              <div
                key={index}
                className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer"
                onClick={() => onSelectImage?.(image.url)}
              >
                <img src={image.url} alt={image.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(image.name)
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-md text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"
                  title={t('posts.imageBank.deleteTitle')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Info Overlay on Hover */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
