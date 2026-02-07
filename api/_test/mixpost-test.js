import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://enrploxjigoyqajoqgkj.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // JWT token validointi
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const { data: authUser, error: authError } = await supabase.auth.getUser(token)
    if (authError || !authUser) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    const { api_token, workspace_uuid } = req.body

    if (!api_token || !workspace_uuid) {
      return res.status(400).json({ error: 'API token and workspace UUID required' })
    }

    // Testaa Mixpost API yhteys
    try {
      const response = await fetch(`https://api.mixpost.app/v1/workspaces/${workspace_uuid}/accounts`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${api_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return res.status(200).json({
          success: true,
          message: 'Mixpost yhteys onnistui!',
          accounts: data.data?.length || 0
        })
      } else {
        const errorData = await response.json()
        return res.status(400).json({
          success: false,
          error: errorData.message || 'Mixpost API virhe',
          status: response.status
        })
      }
    } catch (apiError) {
      console.error('Mixpost API error:', apiError)
      return res.status(500).json({
        success: false,
        error: 'Virhe Mixpost API:n kutsumisessa'
      })
    }

  } catch (error) {
    console.error('Mixpost test API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
} 