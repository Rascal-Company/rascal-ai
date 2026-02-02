import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '../lib/supabase'
import { getUserOrgId } from '../lib/getUserOrgId'
import { useAuth } from '../contexts/AuthContext'
import Button from './Button'

const AvatarModal = ({ 
  show, 
  editingPost, 
  editModalStep, 
  setEditModalStep,
  selectedAvatar, 
  setSelectedAvatar,
  avatarImages, 
  setAvatarImages,
  avatarLoading, 
  setAvatarLoading,
  avatarError, 
  setAvatarError,
  voiceoverReadyChecked,
  setVoiceoverReadyChecked,
  user,
  onClose, 
  onSave,
  t 
}) => {
  if (!show || !editingPost) return null

  // Hae avatar-kuvat kun vaihe on 2
  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        if (editModalStep !== 2) return

        setAvatarLoading(true)
        setAvatarError('')

        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
        const userId = await getUserOrgId(user.id)

        if (!userId) {
          setAvatarImages([])
          setAvatarError('Käyttäjää ei löytynyt')
          return
        }

        // Hae company_id suoraan Supabasesta
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('company_id')
          .eq('id', userId)
          .single()

        if (userError || !userData?.company_id) {
          setAvatarImages([])
          setAvatarError('company_id puuttuu')
          return
        }

        // Kutsu avatar-status APIa
        const response = await fetch('/api/avatars/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ companyId: userData.company_id })
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log('Avatar data received:', data)
        
        // Käsittele data riippuen siitä, onko se array vai objekti avatars-kentällä
        let avatars = []
        if (Array.isArray(data)) {
          avatars = data
        } else if (data.avatars && Array.isArray(data.avatars)) {
          avatars = data.avatars
        } else if (data.avatarImages && Array.isArray(data.avatarImages)) {
          avatars = data.avatarImages
        }
        
        setAvatarImages(avatars)
      } catch (error) {
        console.error('Avatar fetch error:', error)
        setAvatarError('Avatar-kuvien haku epäonnistui')
        setAvatarImages([])
      } finally {
        setAvatarLoading(false)
      }
    }

    fetchAvatars()
  }, [editModalStep, user?.id])

  return createPortal(
    <div 
      className="modal-overlay modal-overlay--light"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="modal-container max-w-[800px]">
        <div className="modal-header pt-0 pb-0">
          <h2 className="modal-title">
            {editModalStep === 1 ? 'Voiceover-tarkistus' : 'Valitse avatar-kuva'}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-content">
          {/* Vaihe 1: Voiceover-tarkistus */}
          {editModalStep === 1 && (
            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              
              // Siirry vaiheeseen 2
              setEditModalStep(2)
            }}>
              <div className="form-group">
                <label className="form-label">Voiceover</label>
                <textarea
                  name="voiceover"
                  rows={8}
                  className="form-textarea"
                  defaultValue={editingPost.voiceover || ""}
                  placeholder="Kirjoita voiceover-teksti..."
                />
                <div className="voiceover-checkbox">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      name="voiceoverReady" 
                      checked={voiceoverReadyChecked}
                      onChange={(e) => setVoiceoverReadyChecked(e.target.checked)}
                    />
                    <span className="checkbox-text">Vahvistan että voiceover on valmis ja tarkistettu</span>
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <div className="modal-actions-left">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onClose}
                  >
                    Peruuta
                  </Button>
                </div>
                <div className="modal-actions-right">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={!voiceoverReadyChecked}
                  >
                    Seuraava
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Vaihe 2: Avatar-valinta */}
          {editModalStep === 2 && (
            <div>
              <div className="mb-5">
                <h3 className="text-lg mb-3">Valitse avatar-kuva</h3>
                <p className="text-gray-500 text-sm">
                  Valitse avatar-kuva, jota käytetään tässä postauksessa.
                </p>
              </div>

              {avatarLoading ? (
                <div className="text-center p-10">
                  <div className="loading-spinner"></div>
                  <p>Haetaan avatar-kuvia...</p>
                </div>
              ) : avatarError ? (
                <div className="text-center p-10 text-red-500 bg-red-50 rounded-lg border border-red-200">
                  <p>{avatarError}</p>
                </div>
              ) : avatarImages.length === 0 ? (
                <div className="text-center p-10 text-gray-500 bg-gray-50 rounded-lg border border-gray-200">
                  <p>Ei avatar-kuvia saatavilla</p>
                </div>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-5 max-h-[500px] overflow-y-auto p-6 bg-gray-50 rounded-xl border border-gray-200">
                  {avatarImages.map((img, idx) => {
                    // Käsittele eri data-muodot
                    let avatarId, imageUrl
                    
                    if (img.Media && img.Media[0]) {
                      // Dummy data muoto: { id: 'avatar-1', Media: [{ url: '...' }], "Variable ID": 'var-1' }
                      avatarId = img["Variable ID"] || img.id
                      imageUrl = img.Media[0].url
                    } else if (img.url) {
                      // Suora muoto: { id: '...', url: '...' }
                      avatarId = img.variableId || img.id
                      imageUrl = img.url
                    } else {
                      // Skip jos ei ole kunnollista dataa
                      return null
                    }
                    
                    const isSelected = selectedAvatar === avatarId
                    return (
                      <button
                        key={img.id || idx}
                        type="button"
                        onClick={() => {
                          console.log('Avatar clicked:', { avatarId, img })
                          setSelectedAvatar(avatarId)
                        }}
                        className={`rounded-lg overflow-hidden relative p-0 cursor-pointer outline-none bg-transparent border-2 ${
                          isSelected ? 'border-blue-500' : 'border-gray-200'
                        }`}
                        aria-pressed={isSelected}
                      >
                        <img
                          src={imageUrl}
                          alt={`Avatar ${idx + 1}`}
                          className="w-full h-[140px] object-cover block"
                        />
                        {isSelected && (
                          <span className="absolute top-2 right-2 bg-blue-500 text-white rounded-full py-1 px-2 text-xs">
                            Valittu
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="modal-actions m-0 pt-4 pb-0 px-0">
                <div className="modal-actions-left">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditModalStep(1)}
                  >
                    Edellinen
                  </Button>
                </div>
                <div className="modal-actions-right">
                  <Button
                    type="button"
                    variant="primary"
                    onClick={async () => {
                      try {
                        // Tarkista että avatar on valittu
                        if (!selectedAvatar) {
                          setAvatarError('Valitse avatar ennen jatkamista')
                          return
                        }

                        // Hae oikea user_id (organisaation ID kutsutuille käyttäjille)
                        const userId = await getUserOrgId(user.id)
                        
                        if (!userId) {
                          setAvatarError('Käyttäjää ei löytynyt')
                          return
                        }

                        // Hae company_id
                        const { data: userData, error: userError } = await supabase
                          .from('users')
                          .select('company_id')
                          .eq('id', userId)
                          .single()

                        if (userError || !userData?.company_id) {
                          setAvatarError('company_id puuttuu')
                          return
                        }

                        // Debug: tarkista selectedAvatar
                        console.log('Avatar selection debug:', {
                          selectedAvatar,
                          editingPostId: editingPost.id,
                          companyId: userData.company_id,
                          voiceoverReady: voiceoverReadyChecked
                        })

                        // Hae voiceover-teksti lomakkeesta
                        const voiceoverTextarea = document.querySelector('textarea[name="voiceover"]')
                        const voiceoverText = voiceoverTextarea ? voiceoverTextarea.value : (editingPost.voiceover || '')

                        // Hae session token
                        const { data: sessionData } = await supabase.auth.getSession()
                        const token = sessionData?.session?.access_token
                        
                        if (!token) {
                          throw new Error('Käyttäjä ei ole kirjautunut')
                        }

                        const requestData = {
                          recordId: editingPost.originalData?.['Record ID'] || editingPost.originalData?.id || editingPost.id,
                          voiceover: voiceoverText || null,
                          voiceoverReady: !!voiceoverReadyChecked,
                          selectedAvatarId: selectedAvatar,
                          action: 'avatar_selected'
                        }

                        console.log('DEBUG: Sending voiceover-ready data:', requestData)
                        console.log('DEBUG: editingPost.originalData:', editingPost.originalData)
                        console.log('DEBUG: Record ID options:', {
                          'Record ID': editingPost.originalData?.['Record ID'],
                          'id': editingPost.originalData?.id,
                          'editingPost.id': editingPost.id
                        })

                        // Lähetä endpointiin
                        const response = await fetch('/api/webhooks/voiceover-ready', {
                          method: 'POST',
                          headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify(requestData)
                        })

                        if (!response.ok) {
                          throw new Error(`HTTP error! status: ${response.status}`)
                        }

                        const result = await response.json()
                        console.log('Avatar selection response:', result)
                        
                        // Sulje modaali ja kutsu parentin onSave
                        onSave()
                      } catch (e) {
                        console.error('Avatar selection error:', e)
                        setAvatarError('Avatar-valinnan tallentaminen epäonnistui')
                      }
                    }}
                    disabled={!selectedAvatar}
                  >
                    Valmis
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

export default AvatarModal
