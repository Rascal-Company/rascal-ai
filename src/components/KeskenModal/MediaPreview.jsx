import React from 'react'
import MediaControls from './MediaControls'

const MediaPreview = ({
  editingPost,
  userAccountType,
  imageLoading,
  showMediaSourceMenu,
  onToggleMediaSourceMenu,
  onSelectKuvapankki,
  onSelectKoneelta,
  onDeleteImage,
  fileInputRef,
  formData,
  t
}) => {
  const isCarousel = editingPost.type === 'Carousel'
  const mediaUrl = editingPost.thumbnail || (editingPost.media_urls && editingPost.media_urls[0])

  if (isCarousel && editingPost.segments && editingPost.segments.length > 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest leading-none">
            Slaidit ({editingPost.segments.length})
          </h4>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {editingPost.segments.map((segment, index) => (
            <div key={segment.id || index} className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100 shadow-sm transition-transform hover:scale-[1.02]">
              <div className="absolute top-2 left-2 z-10 w-6 h-6 bg-white/90 backdrop-blur-md rounded-lg flex items-center justify-center text-[10px] font-bold text-gray-900 shadow-sm">
                {segment.slide_no || index + 1}
              </div>
              {segment.media_urls?.[0] ? (
                <img
                  src={segment.media_urls[0]}
                  alt={`Slaidi ${segment.slide_no || index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center grayscale opacity-20">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
              )}
              {segment.caption && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[9px] text-white font-medium line-clamp-2 leading-tight">{segment.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!mediaUrl && !imageLoading) {
    return (
      <div className="aspect-[4/5] bg-gray-50/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl mb-4 grayscale opacity-30">📁</div>
        <MediaControls
          userAccountType={userAccountType}
          imageLoading={imageLoading}
          showMediaSourceMenu={showMediaSourceMenu}
          onToggleMediaSourceMenu={onToggleMediaSourceMenu}
          onSelectKuvapankki={onSelectKuvapankki}
          onSelectKoneelta={() => fileInputRef.current?.click()}
          variant="primary"
          t={t}
        />
      </div>
    )
  }

  const isVideo = mediaUrl?.includes('.mp4') || mediaUrl?.includes('video')

  return (
    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 group">
      {imageLoading && (
        <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-xs font-bold text-gray-900 uppercase tracking-widest">{t('media.buttons.loading')}</p>
        </div>
      )}

      {mediaUrl && (
        isVideo ? (
          <video src={mediaUrl} className="w-full h-full object-cover" controls preload="metadata" />
        ) : (
          <img
            src={`${mediaUrl}${formData.imageUpdated ? `?t=${formData.imageUpdated}` : ''}`}
            alt="Postauksen media"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        )
      )}

      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center">
        <MediaControls
          userAccountType={userAccountType}
          imageLoading={imageLoading}
          showMediaSourceMenu={showMediaSourceMenu}
          onToggleMediaSourceMenu={onToggleMediaSourceMenu}
          onSelectKuvapankki={onSelectKuvapankki}
          onSelectKoneelta={() => fileInputRef.current?.click()}
          onDeleteImage={onDeleteImage}
          mediaUrl={mediaUrl}
          variant="secondary"
          showDelete={true}
          t={t}
        />
      </div>
    </div>
  )
}

export default MediaPreview

