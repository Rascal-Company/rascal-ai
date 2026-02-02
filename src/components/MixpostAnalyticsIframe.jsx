import React, { useState, useEffect } from 'react'

const MixpostAnalyticsIframe = () => {
  const [workspaceConfig, setWorkspaceConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchWorkspaceConfig = async () => {
      try {
        // Hae käyttäjän session token Supabasesta
        const { data: { session } } = await import('../lib/supabase').then(m => m.supabase.auth.getSession())
        
        if (!session?.access_token) {
          setError('Kirjaudu sisään nähdäksesi analytics dataa')
          setLoading(false)
          return
        }

        // Käytä backend API:a authorization headerilla
        const response = await fetch('/api/workspace/config', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (response.ok) {
          const config = await response.json()
          setWorkspaceConfig(config)
        } else {
          setError('Workspace ei ole yhdistetty')
        }
      } catch (err) {
        console.error('Error fetching workspace config:', err)
        setError('Virhe workspace konfiguraation haussa')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaceConfig()
  }, [])

  if (loading) {
    return (
      <div className="analytics-iframe-container">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Ladataan analytics dataa...</p>
        </div>
      </div>
    )
  }

  if (error || !workspaceConfig?.mixpost_workspace_uuid) {
    return (
      <div className="analytics-iframe-container">
        <div className="analytics-error">
          <h3>Analytics ei saatavilla</h3>
          <p>Yhdistä workspace asetuksista nähdäksesi analytics dataa.</p>
          <button 
            className="connect-workspace-btn"
            onClick={() => window.location.href = '/settings'}
          >
            Mene asetuksiin
          </button>
        </div>
      </div>
    )
  }

  // Mixpost analytics URL
  const mixpostAnalyticsUrl = `https://mixpost.mak8r.fi/workspace/${workspaceConfig.mixpost_workspace_uuid}/analytics`

  return (
    <div className="analytics-iframe-container">
      <div className="analytics-header">
        <h2>Workspace Analytics</h2>
        <p>Reaaliaikainen analytics data workspace:sta</p>
      </div>
      
      <div className="iframe-wrapper">
        <iframe
          src={mixpostAnalyticsUrl}
          title="Mixpost Analytics Dashboard"
          className="analytics-iframe"
          frameBorder="0"
          allowFullScreen
        />
      </div>
      
      <div className="analytics-footer">
        <p>
          <small>
            Analytics data päivittyy automaattisesti. Jos data ei näy, 
            <a href={mixpostAnalyticsUrl} target="_blank" rel="noopener noreferrer">
              avaa analytics uudessa välilehdessä
            </a>
          </small>
        </p>
      </div>
    </div>
  )
}

export default MixpostAnalyticsIframe 