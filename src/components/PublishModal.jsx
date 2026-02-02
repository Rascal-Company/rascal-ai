import React from 'react'
import { createPortal } from 'react-dom'
import Button from './Button'

const PublishModal = ({ 
  show, 
  publishingPost, 
  socialAccounts,
  selectedAccounts,
  setSelectedAccounts,
  loadingAccounts,
  onClose, 
  onConfirm,
  t 
}) => {
  if (!show || !publishingPost) return null

  const [publishDate, setPublishDate] = React.useState('')

  const toggleAccount = (accountId) => {
    console.log('toggleAccount called with:', accountId)
    console.log('Current selectedAccounts:', selectedAccounts)
    if (selectedAccounts.includes(accountId)) {
      const newAccounts = selectedAccounts.filter(id => id !== accountId)
      console.log('Removing account, new selectedAccounts:', newAccounts)
      setSelectedAccounts(newAccounts)
    } else {
      const newAccounts = [...selectedAccounts, accountId]
      console.log('Adding account, new selectedAccounts:', newAccounts)
      setSelectedAccounts(newAccounts)
    }
  }

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container publish-modal-wide">
        <div className="modal-header">
          <h2 className="modal-title">{t('posts.publishModal.title')}</h2>
          <button onClick={onClose} className="modal-close-btn">✕</button>
        </div>
        
        <div className="modal-content">
          {/* Grid: Kuva vasemmalla (1/3), Caption+Aikataulu oikealla (2/3), Somet alhaalla koko leveydellä */}
          <div className="publish-modal-grid">
            {/* Vasen: Kuva/Video */}
            <div className="publish-modal-media">
              <div className="media-container">
                {(() => {
                  const isCarousel = publishingPost.type === 'Carousel'
                  
                  // Carousel-tyyppisillä postauksilla näytetään kaikki slaidit
                  if (isCarousel && publishingPost.segments && publishingPost.segments.length > 0) {
                    return (
                      <div className="carousel-slides">
                        <h4 className="publish-modal-slides-title">
                          {t('posts.publishModal.slides', { count: publishingPost.segments.length })}
                        </h4>
                        <div className="slides-grid">
                          {publishingPost.segments.map((segment, index) => (
                            <div key={segment.id || index} className="slide-item">
                              <div className="slide-number">
                                {segment.slide_no || index + 1}
                              </div>
                              {segment.media_urls && segment.media_urls.length > 0 ? (
                                <img
                                  src={segment.media_urls[0]}
                                  alt={`Slaidi ${segment.slide_no || index + 1}`}
                                  className="slide-image"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    e.target.nextSibling.style.display = 'flex'
                                  }}
                                />
                              ) : (
                                <div className="slide-placeholder">
                                  <img src="/placeholder.png" alt={t('posts.publishModal.noMedia')} />
                                </div>
                              )}
                              {/* Fallback placeholder */}
                              <div className="slide-placeholder hidden">
                                <img src="/placeholder.png" alt={t('posts.publishModal.noMedia')} />
                              </div>
                              {segment.caption && (
                                <div className="slide-caption">
                                  {segment.caption}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  
                  // Muille tyypeille näytetään yksi kuva
                  const mediaUrl = publishingPost.thumbnail || (publishingPost.media_urls && publishingPost.media_urls[0])
                  
                  if (!mediaUrl) {
                    return (
                      <div className="media-placeholder">
                        <img src="/placeholder.png" alt={t('posts.publishModal.noMedia')} />
                      </div>
                    )
                  }
                  
                  if (mediaUrl.includes('.mp4') || mediaUrl.includes('video')) {
                    return (
                      <video
                        src={mediaUrl}
                        className="media-preview media-object-contain"
                        controls
                      />
                    )
                  }
                  
                  return (
                    <div className="media-wrapper">
                      <img 
                        src={mediaUrl} 
                        alt="Postauksen media"
                        className="media-preview media-object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                    </div>
                  )
                })()}

                {/* Fallback placeholder */}
                <div className="media-placeholder hidden">
                  <img src="/placeholder.png" alt={t('posts.publishModal.noMedia')} />
                </div>
              </div>
            </div>

            {/* Oikea: Caption + Aikataulu allekkain */}
            <div className="publish-modal-right-column publish-modal-col-fixed">
              {/* Caption/Postaus */}
              <div className="publish-modal-fields publish-modal-half">
                <div className="publish-modal-header-row">
                  <h3 className="publish-modal-section-title">
                    {t('posts.publishModal.contentToPublish')}
                  </h3>
                  <span className={`publish-modal-char-count ${(publishingPost.caption?.length || 0) > 2000 ? 'warning' : ''}`}>
                    {publishingPost.caption?.length || 0} / 2000
                  </span>
                </div>
                <div className={`publish-modal-caption-box ${(publishingPost.caption?.length || 0) > 2000 ? 'error' : ''}`}>
                  {publishingPost.caption || t('posts.publishModal.noCaption')}
                </div>
                {(publishingPost.caption?.length || 0) > 2000 && (
                  <p className="publish-modal-warning-text">
                    {t('posts.publishModal.captionTooLong')}
                  </p>
                )}
              </div>

              {/* Julkaisupäivä */}
              <div className="publish-modal-schedule publish-modal-half">
                <h3 className="publish-modal-section-title-mt0">
                  {t('posts.publishModal.scheduleDate')}
                </h3>
                <div className="publish-modal-schedule-box">
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="publish-modal-datetime-input"
                  />
                </div>
              </div>
            </div>

            {/* Ala: Somekanavat */}
            <div className="publish-modal-accounts">
              <h3 className="publish-modal-section-title-mt0">
                {t('posts.publishModal.selectChannels')}
              </h3>
              <div className="publish-modal-accounts-list">
                {loadingAccounts ? (
                  <div className="publish-modal-loading-box">
                    {t('posts.publishModal.loadingAccounts')}
                  </div>
                ) : socialAccounts && socialAccounts.length > 0 ? (
                  socialAccounts.map((account) => {
                    const isSelected = selectedAccounts.includes(account.mixpost_account_uuid)
                    return (
                      <div
                        key={account.mixpost_account_uuid}
                        onClick={() => toggleAccount(account.mixpost_account_uuid)}
                        className={`publish-modal-account-card ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation()
                            toggleAccount(account.mixpost_account_uuid)
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="publish-modal-account-checkbox"
                        />
                        {account.profile_image_url && (
                          <img
                            src={account.profile_image_url}
                            alt={account.account_name}
                            className="publish-modal-account-avatar"
                          />
                        )}
                        <div className="publish-modal-account-info">
                          <div className="publish-modal-account-name">
                            {account.account_name}
                          </div>
                          <div className="publish-modal-account-meta">
                            {account.provider} • {account.username ? `@${account.username}` : account.account_name}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="publish-modal-loading-box">
                    {t('posts.publishModal.noAccounts')}
                  </div>
                )}
              </div>
            </div>

         
          </div>

          {/* Modal actions */}
          <div className="modal-actions">
            <div className="modal-actions-left">
              <Button type="button" variant="secondary" onClick={onClose}>
                {t('posts.publishModal.cancel')}
              </Button>
            </div>
            <div className="modal-actions-right">
              <Button
                type="button"
                variant="primary"
                onClick={() => onConfirm(publishDate)}
                disabled={selectedAccounts.length === 0 || (publishingPost.caption?.length || 0) > 2000}
              >
                {publishDate ? t('posts.publishModal.schedule') : t('posts.publishModal.publishNow')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

export default PublishModal
