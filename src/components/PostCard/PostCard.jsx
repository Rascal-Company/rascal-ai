import React, { useState, useRef } from 'react'
import Button from '../Button'
import ConfirmPopover from '../ConfirmPopover'

function PostCard({ post, onEdit, onDelete, onDuplicate, onPublish, onSchedule, onMoveToNext, onDragStart, onDragEnd, isDragging, hideActions = false, t }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const deleteButtonRef = useRef(null)

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false)
    onDelete(post)
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }
  return (
    <div 
      className={`post-card ${isDragging ? 'dragging' : ''} ${hideActions ? 'clickable' : ''}`}
      draggable={true}
      onDragStart={(e) => onDragStart(e, post)}
      onDragEnd={onDragEnd}
      onClick={hideActions ? () => onEdit(post) : undefined}
    >
      <div className="post-card-content">
        <div className="post-thumbnail">
          {(() => {
            // Carousel: Näytä ensimmäinen slide segments-taulusta
            if (post.type === 'Carousel' && post.segments && post.segments.length > 0) {
              const firstSegment = post.segments.find(seg => seg.slide_no === 1) || post.segments[0];
              const mediaUrl = firstSegment.media_urls?.[0];
              
              if (mediaUrl) {
                const isVideo = mediaUrl.includes('.mp4') || mediaUrl.includes('.webm') || mediaUrl.includes('.mov') || mediaUrl.includes('.avi');
                
                if (isVideo) {
                  return (
                    <video
                      src={mediaUrl}
                      muted
                      loop
                      playsInline
                      className="post-thumbnail-media"
                      onError={(e) => {
                        if (e.target && e.target.style) {
                          e.target.style.display = 'none';
                        }
                        if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  );
                } else {
                  return (
                    <img
                      src={mediaUrl}
                      alt="carousel preview"
                      loading="lazy"
                      decoding="async"
                      className="post-thumbnail-image"
                      onLoad={(e) => {
                        e.target.classList.add('loaded')
                      }}
                      onError={(e) => {
                        if (e.target && e.target.style) {
                          e.target.style.display = 'none';
                        }
                        if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  );
                }
              }
            }
            
            // Video: Toisto
            if (post.thumbnail && (post.thumbnail.includes('.mp4') || post.thumbnail.includes('.webm') || post.thumbnail.includes('.mov') || post.thumbnail.includes('.avi'))) {
              return (
                <video
                  src={post.thumbnail}
                  muted
                  loop
                  playsInline
                  className="post-thumbnail-media"
                  onError={(e) => {
                    if (e.target && e.target.style) {
                      e.target.style.display = 'none';
                    }
                    if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              );
            }
            
            // Kuva: Näytä kaikki kuvat jos useampi, muuten vain thumbnail
            if (post.thumbnail) {
              // Tarkista onko useampi kuva media_urls-kentässä
              const mediaUrls = post.media_urls || post.mediaUrls || [];
              const hasMultipleImages = mediaUrls.length > 1;
              
              if (hasMultipleImages) {
                // Näytä kaikki kuvat pienenä gridinä
                return (
                  <div className="post-thumbnail-grid">
                    {mediaUrls.slice(0, 4).map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`media ${index + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="post-thumbnail-grid-item"
                        onLoad={(e) => {
                          e.target.classList.add('loaded')
                        }}
                        onError={(e) => {
                          if (e.target && e.target.style) {
                            e.target.style.display = 'none';
                          }
                          if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                            e.target.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ))}
                    {mediaUrls.length > 4 && (
                      <div className="post-thumbnail-count">
                        +{mediaUrls.length - 4}
                      </div>
                    )}
                  </div>
                );
              } else {
                // Näytä vain yksi kuva
                return (
                  <img
                    src={post.thumbnail}
                    alt="thumbnail"
                    loading="lazy"
                    decoding="async"
                    className="post-thumbnail-image"
                    onLoad={(e) => {
                      e.target.classList.add('loaded')
                    }}
                    onError={(e) => {
                      if (e.target && e.target.style) {
                        e.target.style.display = 'none';
                      }
                      if (e.target && e.target.nextSibling && e.target.nextSibling.style) {
                        e.target.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                );
              }
            }
            
            // Placeholder jos ei mediaa
            return (
              <div className="placeholder-content">
                <img
                  src="/placeholder.png"
                  alt="Ei kuvaa"
                  className="placeholder-image"
                  onError={(e) => {
                    // Jos placeholder-kuva ei lataa, näytä tekstin
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="placeholder-fallback" style={{ display: 'none' }}>
                  <div className="placeholder-icon">🖼️</div>
                  <div className="placeholder-text">Ei kuvaa</div>
                </div>
              </div>
            );
          })()}
        </div>
        <div className="post-info">
          <div className="post-header">
            <h3 className="post-title">
              {post.title.includes('.') ? post.title.split('.')[0] + '.' : post.title}
            </h3>
            <div className="post-badges">
              <span className="post-type">
                {post.source === 'mixpost' && post.provider
                  ? (post.provider.charAt(0).toUpperCase() + post.provider.slice(1))
                  : (post.type === 'Carousel' ? 'Carousel' :  
                     post.type === 'Reels' ? 'Reels' :
                     post.type === 'Blog' ? 'Blog' : 
                     post.type === 'Newsletter' ? 'Newsletter' :  
                     post.type)}
              </span>
            </div>
          </div>
          <p className="post-caption post-caption-contain">
            {post.caption}
          </p>
          <div className="post-footer">
            {post.originalData?.created_at && (
              <span className="post-created-date">
                Luotu: {new Date(post.originalData.created_at).toLocaleDateString('fi-FI')}
              </span>
            )}
            <div className="post-actions">
              {/* Näytä napit vain jos ei ole "Julkaistu" sarakkeessa */}
              {!hideActions && post.status !== 'Julkaistu' && (
                <>
                  {post.status !== 'Tarkistuksessa' && (
                    <Button 
                      variant="secondary" 
                      onClick={() => onEdit(post)}
                      className="post-button-small"
                    >
                      {post.source === 'reels' ? 'Tarkista' : t('posts.actions.edit')}
                    </Button>
                  )}
                  
                  {/* Monista-nappi - näytetään vain Supabase-postauksille */}
                  {onDuplicate && post.source === 'supabase' && (
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDuplicate(post)
                      }}
                      className="post-button-small"
                      title="Monista postaus"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </Button>
                  )}
                  
                  {/* Siirtymispainikkeet */}
                  {post.status === 'Kesken' && post.source === 'supabase' && (
                    <Button
                      variant="primary"
                      onClick={() => onMoveToNext(post, 'Tarkistuksessa')}
                      className="post-button-primary"
                    >
                      {t('posts.columns.readyToPublish')}
                    </Button>
                  )}
                  
                  {/* Julkaisu-nappi vain jos status on "Valmiina julkaisuun" (Tarkistuksessa) */}
                  {post.status === 'Tarkistuksessa' && (
                    <Button
                      variant="primary"
                      onClick={() => onPublish(post)}
                      className="post-button-success"
                    >
                      {t('posts.actions.publish')}
                    </Button>
                  )}
                  
                  {post.status !== 'Aikataulutettu' && (
                    <Button 
                      ref={deleteButtonRef}
                      variant="danger" 
                      onClick={handleDeleteClick}
                      className="post-button-small"
                    >
                      {t('posts.actions.delete')}
                    </Button>
                  )}
                </>
              )}
            </div>
            {/* Monista-nappi julkaistuille postauksille */}
            {post.status === 'Julkaistu' && onDuplicate && post.source === 'supabase' && (
              <div className="published-post-actions">
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDuplicate(post)
                  }}
                  className="post-button-small"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  Monista uureksi
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmPopover
        show={showDeleteConfirm}
        message={t('posts.alerts.deleteConfirm') || 'Haluatko varmasti poistaa tämän postauksen? Tätä toimintoa ei voi perua.'}
        confirmText={t('posts.actions.delete') || 'Poista'}
        cancelText={t('ui.buttons.cancel') || 'Peruuta'}
        variant="danger"
        anchorElement={deleteButtonRef.current}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        t={t}
      />
    </div>
  )
}

export default PostCard



