import React from 'react'
import Button from '../Button'
import MediaSourceMenu from './MediaSourceMenu'

const MediaControls = ({
  userAccountType,
  imageLoading,
  showMediaSourceMenu,
  onToggleMediaSourceMenu,
  onSelectKuvapankki,
  onSelectKoneelta,
  onDeleteImage,
  mediaUrl,
  variant = 'primary',
  showDelete = false,
  t
}) => {
  const hasMediaUrl = !!(mediaUrl && String(mediaUrl).trim().length > 0)
  const canDelete = hasMediaUrl && !!onDeleteImage && typeof onDeleteImage === 'function'

  const buttonBaseClass = "px-4 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50"
  const primaryClass = "bg-white text-gray-900 shadow-xl shadow-black/10 hover:scale-105 active:scale-95"
  const secondaryClass = "bg-white/90 backdrop-blur-md text-gray-900 shadow-xl hover:bg-white"
  const dangerClass = "bg-red-500/90 backdrop-blur-md text-white shadow-xl hover:bg-red-600"

  const buttonStyle = variant === 'primary' ? primaryClass : secondaryClass

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={userAccountType === 'personal_brand' ? onToggleMediaSourceMenu : onSelectKoneelta}
          disabled={imageLoading}
          className={`${buttonBaseClass} ${buttonStyle}`}
        >
          {imageLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {t('media.buttons.loading')}
            </div>
          ) : (
            variant === 'primary' ? t('media.buttons.addMedia') : t('media.buttons.changeMedia')
          )}
        </button>

        {userAccountType === 'personal_brand' && (
          <MediaSourceMenu
            show={showMediaSourceMenu}
            onSelectKuvapankki={onSelectKuvapankki}
            onSelectKoneelta={onSelectKoneelta}
          />
        )}
      </div>

      {canDelete && (
        <button
          type="button"
          onClick={() => onDeleteImage(mediaUrl)}
          disabled={imageLoading}
          className={`${buttonBaseClass} ${dangerClass}`}
        >
          {t('keskenModal.deleteImage')}
        </button>
      )}
    </div>
  )
}

export default MediaControls

