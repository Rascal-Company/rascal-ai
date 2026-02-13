import { withOrganization } from '../_middleware/with-organization.js'

/**
 * GET /api/users/me
 * Palauttaa kirjautuneen käyttäjän tiedot
 */
async function handler(req, res) {
  if (req.method === 'PATCH') {
    return handlePatch(req, res)
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // withOrganization on jo tarkistanut autentikaation ja hakenut organisaatiotiedot
    // req.organization sisältää:
    // - id: organisaation ID (public.users.id)
    // - role: käyttäjän rooli organisaatiossa
    // - data: täydelliset organisaation tiedot users-taulusta

    const { data: orgData } = req.organization

    // Hae käyttäjän oma rivi users-taulusta, jotta saadaan globaali rooli/company_id
    // HUOM: Admin-oikeudet tulevat AINA users.role === 'admin', EI org_members.role === 'admin'
    let effectiveRole = req.organization.role // org_members rooli: 'owner', 'admin', 'member' (organisaation sisäisiin oikeuksiin)
    let effectiveCompanyId = orgData.company_id

    try {
      const { data: accountRow, error: accountError } = await req.supabase
        .from('users')
        .select('role, company_id')
        .eq('auth_user_id', req.authUser.id)
        .maybeSingle()

      if (!accountError && accountRow) {
        // Admin-oikeudet tulevat AINA users.role === 'admin' tai company_id === 1
        // org_members.role === 'admin' ei anna admin-oikeuksia!
        console.log('[api/users/me] users row:', { 
          role: accountRow.role, 
          company_id: accountRow.company_id,
          org_members_role: req.organization.role 
        })
        
        if (accountRow.role === 'superadmin') {
          effectiveRole = 'superadmin'
          console.log('[api/users/me] Setting role to superadmin')
        } else if (accountRow.role === 'admin' || accountRow.company_id === 1) {
          effectiveRole = 'admin'
          console.log('[api/users/me] Setting role to admin (users.role or company_id check)')
        } else if (accountRow.role === 'moderator') {
          // Globaali moderaattori
          effectiveRole = 'moderator'
          console.log('[api/users/me] Setting role to moderator')
        } else {
          console.log('[api/users/me] Using org_members role:', effectiveRole, '(NOT admin, users.role:', accountRow.role, ')')
        }
        // Muuten käytetään org_members roolia (organisaation sisäisiin oikeuksiin)

        // Käytä company_id:tä käyttäjän riviltä jos saatavilla
        if (accountRow.company_id != null) {
          effectiveCompanyId = accountRow.company_id
        }
      } else {
        console.log('[api/users/me] No users row found, using org_members role:', effectiveRole, '(NOT admin)')
      }
      // Jos users-taulussa ei ole riviä, käytetään org_members roolia (ei admin-oikeuksia)
    } catch (e) {
      console.error('Error fetching account row in /api/users/me:', e)
      // Jatketaan silti org-tason roolilla ja company_id:llä
    }

    const organization = {
      id: req.organization.id,
      role: req.organization.role,
      data: orgData
    }

    const features = Array.isArray(orgData.features) ? orgData.features : null

    // Turvallisesti hae krediitit (uudet kentät voivat olla null tai undefined)
    const enrichmentCreditsMonthly = orgData.enrichment_credits_monthly != null 
      ? orgData.enrichment_credits_monthly 
      : 100
    const enrichmentCreditsUsed = orgData.enrichment_credits_used != null 
      ? orgData.enrichment_credits_used 
      : 0

    // Palautetaan turvallisesti vain tarvittavat kentät
    const userData = {
      id: orgData.id,
      auth_user_id: req.authUser.id,
      email: req.authUser.email,
      company_id: effectiveCompanyId,
      company_name: orgData.company_name,
      vector_store_id: orgData.vector_store_id,
      role: effectiveRole,
      logo_url: orgData.logo_url,
      voice_id: orgData.voice_id,
      contact_email: orgData.contact_email,
      contact_person: orgData.contact_person,
      vapi_inbound_assistant_id: orgData.vapi_inbound_assistant_id,
      organization_id: req.organization.id,
      organization_role: req.organization.role,
      organization: organization,
      features: features,
      enrichment_credits_monthly: enrichmentCreditsMonthly,
      enrichment_credits_used: enrichmentCreditsUsed,
      buyer_persona: orgData.buyer_persona ?? null,
      created_at: orgData.created_at,
      updated_at: orgData.updated_at,
    }

    console.log('[api/users/me] Returning userData:', { 
      role: userData.role, 
      company_id: userData.company_id,
      email: userData.email 
    })

    return res.status(200).json(userData)
  } catch (error) {
    console.error('Error in /api/users/me:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

async function handlePatch(req, res) {
  try {
    const { buyer_persona } = req.body || {}
    const allowedFields = {}

    if (buyer_persona !== undefined) {
      allowedFields.buyer_persona = buyer_persona
    }

    if (Object.keys(allowedFields).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const { error } = await req.supabase
      .from('users')
      .update(allowedFields)
      .eq('id', req.organization.id)

    if (error) {
      console.error('[api/users/me] PATCH error:', error)
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/users/me:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default withOrganization(handler)
