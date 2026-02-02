import React from 'react'

export default function AvatarSection({ editingPost, voiceoverReadyChecked, setVoiceoverReadyChecked }) {
  if (!editingPost) return null
  return (
    <>
      {editingPost.caption && (
        <div className="form-group">
          <label className="form-label">Postauksen sisältö (vain luku)</label>
          <textarea
            name="caption"
            rows={4}
            className="form-textarea bg-gray-50 text-gray-500"
            defaultValue={editingPost.caption || ""}
            placeholder="Postauksen sisältö..."
            readOnly
          />
        </div>
      )}
      <div className="form-group">
        <label className="form-label">{editingPost.type === 'Carousel' ? 'Kuvaus' : 'Voiceover'}</label>
        <textarea
          name="voiceover"
          rows={8}
          className="form-textarea"
          defaultValue={editingPost.voiceover || ""}
          placeholder={editingPost.type === 'Carousel' ? "Kirjoita kuvaus..." : "Kirjoita voiceover-teksti..."}
        />
        <div className="voiceover-checkbox">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              name="voiceoverReady" 
              checked={voiceoverReadyChecked}
              onChange={(e) => setVoiceoverReadyChecked(e.target.checked)}
            />
            <span className="checkbox-text">Vahvistan että {editingPost.type === 'Carousel' ? 'kuvaus' : 'voiceover'} on valmis ja tarkistettu</span>
          </label>
        </div>
      </div>
    </>
  )
}


