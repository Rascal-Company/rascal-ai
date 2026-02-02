import React, { useEffect, useRef } from 'react'

/**
 * Elävä pallo joka reagoi puheeseen
 * - Sininen + pulssoiva = AI puhuu
 * - Vihreä + pulssoiva = Käyttäjä puhuu
 * - Harmaa = Odottaa
 */
const VoiceOrb = ({ conversation }) => {
  const orbRef = useRef(null)
  const animationFrameRef = useRef(null)

  useEffect(() => {
    if (!conversation || !orbRef.current) return

    const updateOrb = () => {
      const orb = orbRef.current
      if (!orb) return

      // Hae audio-tasot
      const inputVolume = conversation.getInputVolume?.() || 0
      const outputVolume = conversation.getOutputVolume?.() || 0
      
      // Määritä tila
      const isAISpeaking = conversation.isSpeaking
      const isUserSpeaking = inputVolume > 0.1 && !isAISpeaking
      
      // Skaalaa pallon koko volumin mukaan
      let scale = 1
      let intensity = 0
      
      if (isAISpeaking) {
        intensity = Math.max(0.3, outputVolume)
        scale = 1 + (intensity * 0.5) // Max 1.5x koko
      } else if (isUserSpeaking) {
        intensity = Math.max(0.3, inputVolume)
        scale = 1 + (intensity * 0.4) // Max 1.4x koko
      }
      
      // Päivitä CSS custom properties
      orb.style.setProperty('--scale', scale)
      orb.style.setProperty('--intensity', intensity)
      
      animationFrameRef.current = requestAnimationFrame(updateOrb)
    }

    updateOrb()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [conversation])

  // Määritä tila
  const isConnected = conversation?.status === 'connected'
  const isAISpeaking = conversation?.isSpeaking
  
  // CSS-luokat tilan mukaan
  const orbClasses = [
    'voice-orb',
    isConnected && 'connected',
    isAISpeaking && 'ai-speaking',
    !isAISpeaking && isConnected && 'user-listening'
  ].filter(Boolean).join(' ')

  return (
    <div className="voice-orb-container">
      <div ref={orbRef} className={orbClasses}>
        <div className="orb-outer-ring" />
        <div className="orb-glow" />
        <div className="orb-core">
          <div className="orb-inner-glow" />
        </div>
        <div className="orb-pulse" />
      </div>
      
      <div className="orb-status">
        {!isConnected && '⏸️ Odottaa...'}
        {isConnected && isAISpeaking && '🗣️ AI puhuu'}
        {isConnected && !isAISpeaking && '🎤 Kuuntelen sinua'}
      </div>
    </div>
  )
}

export default VoiceOrb

