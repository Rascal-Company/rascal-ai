import React from 'react'

export default function TarkistuksessaSection({ editingPost }) {
  if (!editingPost) return null
  const mediaUrls = editingPost.media_urls || editingPost.mediaUrls || []
  const firstUrl = mediaUrls[0] || editingPost.thumbnail || null
  const isVideo = firstUrl && (firstUrl.includes('.mp4') || firstUrl.includes('.webm') || firstUrl.includes('.mov') || firstUrl.includes('.avi'))
  return (
    <>
      {firstUrl && (
        <div className="edit-modal-media mb-3">
          {isVideo ? (
            <video src={firstUrl} controls className="video-element" />
          ) : (
            <img src={firstUrl} alt="thumbnail" className="video-element" />
          )}
        </div>
      )}
      <div className="form-group">
        <label className="form-label">Kuvaus</label>
        <textarea
          name="caption"
          rows={6}
          className="form-textarea bg-gray-50 text-gray-500"
          defaultValue={editingPost.caption || ""}
          placeholder="Kuvaus (vain luku)"
          readOnly
        />
      </div>
      {(editingPost.source === 'reels' || editingPost.type === 'Reels' || editingPost.type === 'Avatar') && (
        <div className="form-group">
          <label className="form-label">Voiceover (vain luku)</label>
          <textarea
            name="voiceover"
            rows={4}
            className="form-textarea bg-gray-50 text-gray-500"
            defaultValue={editingPost.voiceover || ""}
            placeholder="Voiceover-teksti..."
            readOnly
          />
        </div>
      )}
    </>
  )
}


