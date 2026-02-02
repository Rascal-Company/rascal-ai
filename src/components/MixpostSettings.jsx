import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { getUserOrgId } from '../lib/getUserOrgId'
import Button from './Button'

export default function WorkspaceSettings() {
  const { user, organization } = useAuth()
  const [orgId, setOrgId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    mixpost_api_token: '',
    mixpost_workspace_uuid: '',
    is_active: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [testResult, setTestResult] = useState(null)

  useEffect(() => {
    const fetchOrgId = async () => {
      if (organization?.id) {
        setOrgId(organization.id);
      } else if (user?.id) {
        const id = await getUserOrgId(user.id);
        setOrgId(id);
      }
    };
    fetchOrgId();
  }, [user?.id, organization?.id]);

  useEffect(() => {
    if (orgId) {
      loadWorkspaceConfig()
    }
  }, [orgId])

  const loadWorkspaceConfig = async () => {
    if (!orgId) return;
    
    try {
      setLoading(true)
      setError('')

      const { data, error } = await supabase
        .from('user_mixpost_config')
        .select('*')
        .eq('user_id', orgId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setConfig({
          mixpost_api_token: data.mixpost_api_token || '',
          mixpost_workspace_uuid: data.mixpost_workspace_uuid || '',
          is_active: data.is_active || false
        })
      }
    } catch (err) {
      console.error('Error loading Mixpost config:', err)
      setError('Virhe konfiguraation lataamisessa')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setSuccess('')

      if (!orgId) {
        setError('Organisaation ID puuttuu')
        return;
      }

      const { error } = await supabase
        .from('user_mixpost_config')
        .upsert({
          user_id: orgId,
          mixpost_api_token: config.mixpost_api_token,
          mixpost_workspace_uuid: config.mixpost_workspace_uuid,
          is_active: config.is_active,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setSuccess('Workspace konfiguraatio tallennettu!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Error saving Mixpost config:', err)
      setError('Virhe konfiguraation tallentamisessa')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    try {
      setTestResult(null)
      setError('')

      const response = await fetch('/api/integrations/mixpost/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          api_token: config.mixpost_api_token,
          workspace_uuid: config.mixpost_workspace_uuid
        })
      })

      const result = await response.json()

      if (response.ok) {
        setTestResult({ success: true, message: 'Yhteys onnistui!' })
      } else {
        setTestResult({ success: false, message: result.error || 'Yhteys epäonnistui' })
      }
    } catch (err) {
      console.error('Error testing connection:', err)
      setTestResult({ success: false, message: 'Virhe yhteyden testaamisessa' })
    }
  }

  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div className="p-5 text-center">
        <div>Ladataan workspace konfiguraatiota...</div>
      </div>
    )
  }

  return (
    <div className="max-w-[600px] mx-auto p-5">
      <h2 className="text-2xl font-bold text-gray-800 mb-5">
        Workspace Yhdistäminen
      </h2>

      <form onSubmit={handleSave} className="flex flex-col gap-5">
        {/* API Token */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            API Token
          </label>
          <input
            type="password"
            value={config.mixpost_api_token}
            onChange={(e) => handleInputChange('mixpost_api_token', e.target.value)}
            placeholder="Syötä API token"
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm bg-white"
          />
          <div className="text-xs text-gray-500 mt-1">
            Löydät API tokenin workspace dashboardista
          </div>
        </div>



        {/* Workspace UUID */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Workspace UUID
          </label>
          <input
            type="text"
            value={config.mixpost_workspace_uuid}
            onChange={(e) => handleInputChange('mixpost_workspace_uuid', e.target.value)}
            placeholder="Syötä workspace UUID"
            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-sm bg-white"
          />
          <div className="text-xs text-gray-500 mt-1">
            Workspace UUID löytyy workspace dashboardista
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={config.is_active}
            onChange={(e) => handleInputChange('is_active', e.target.checked)}
            className="w-[18px] h-[18px]"
          />
          <label htmlFor="is_active" className="text-sm font-semibold text-gray-700">
            Aktivoi workspace yhdistäminen
          </label>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-600">
            {success}
          </div>
        )}

        {/* Test Result */}
        {testResult && (
          <div className={`p-3 rounded-lg border ${
            testResult.success
              ? 'bg-green-50 border-green-200 text-green-600'
              : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            className="min-w-[120px]"
          >
            {saving ? 'Tallennetaan...' : 'Tallenna'}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={!config.mixpost_api_token || !config.mixpost_workspace_uuid}
            className="min-w-[120px]"
          >
            Testaa Yhteys
          </Button>
        </div>
      </form>

      {/* Help Section */}
      <div className="mt-10 p-5 bg-gray-50 rounded-xl">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Miten löydän workspace tiedot?
        </h3>
        <div className="text-sm text-gray-500 leading-relaxed">
          <p>1. Kirjaudu workspace dashboardiin</p>
          <p>2. Mene Settings → API</p>
          <p>3. Kopioi API token ja workspace UUID</p>
          <p>4. Syötä tiedot yllä oleviin kenttiin</p>
          <p>5. Testaa yhteys ja tallenna konfiguraatio</p>
        </div>
      </div>
    </div>
  )
} 