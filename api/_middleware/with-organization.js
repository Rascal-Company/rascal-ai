// api/middleware/with-organization.js
// Middleware joka tekee organisaatiotarkistuksen automaattisesti
// ja lisää organisaatiotiedot request-objektiin

import { createClient } from '@supabase/supabase-js'
import logger from '../_lib/logger.js'

function getRolePriority(role) {
  switch (role) {
    case 'owner':
      return 3
    case 'admin':
      return 2
    case 'moderator':
      return 1
    case 'member':
    default:
      return 0
  }
}

export function withOrganization(handler) {
  return async (req, res) => {
    try {
      // 1. Hae token headerista (case-insensitive)
      const authHeader = req.headers.authorization
      if (!authHeader) {
        return res.status(401).json({ error: 'Authorization token required' })
      }

      // Käytä regexia joka hyväksyy Bearer, bearer, BEARER jne.
      const match = authHeader.match(/^Bearer\s+(.+)$/i)
      if (!match) {
        return res.status(401).json({ 
          error: 'Invalid authorization header format',
          hint: 'Expected format: Bearer <token>'
        })
      }

      const token = match[1].trim()
      if (!token) {
        return res.status(401).json({ error: 'Authorization token required' })
      }

      // 2. Luo Supabase client käyttäjän tokenilla (RLS käytössä)
      const supabaseUrl =
        process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL
      const supabaseAnonKey =
        process.env.SUPABASE_ANON_KEY ||
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY
      
      if (!supabaseUrl) {
        logger.error('Supabase URL missing')
        return res.status(500).json({ error: 'Internal server error' })
      }
      
      if (!supabaseAnonKey) {
        logger.error('Supabase key missing')
        return res.status(500).json({ error: 'Internal server error' })
      }
      
      // Luodaan Supabase client käyttäjän tokenilla
      // Dokumentaation mukaan kun käytämme anon keyta, token asetetaan Authorization headerissa
      // Tämä mahdollistaa auth.uid() funktion toimimisen RLS-politiikoissa
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        global: { 
          headers: { 
            Authorization: `Bearer ${token}`
          } 
        }
      })

      // 3. Hae auth käyttäjä - tämä varmistaa että token on voimassa
      // ja asettaa käyttäjän kontekstin RLS-politiikoille
      // Käytetään getUser(token) token-parametrilla, kuten muissakin API-endpointeissa
      const { data: authResult, error: authError } = await supabase.auth.getUser(token)
      if (authError || !authResult?.user) {
        logger.warn('Auth error in withOrganization middleware', { 
          error: authError?.message || authError,
          code: authError?.status || authError?.code,
          hasToken: !!token,
          tokenLength: token?.length
        })
        return res.status(401).json({ 
          error: 'Invalid token',
          details: authError?.message || 'Token validation failed'
        })
      }
      const user = authResult.user

      // 4. Hae käyttäjän organisaatio org_members taulusta
      // HUOM: maybeSingle() kaatuu, jos käyttäjällä on useampi org_members-rivi (PGRST116).
      // Haetaan rivit listana ja valitaan deterministisesti paras (owner > admin > moderator > member).
      logger.debug('withOrganization: Fetching org_members for auth_user_id', { auth_user_id: user.id })
      const { data: orgMembers, error: orgError } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('auth_user_id', user.id) // Tarkista että haetaan oikean käyttäjän organisaatio
      
      const orgMember = Array.isArray(orgMembers) && orgMembers.length > 0
        ? [...orgMembers].sort((a, b) => getRolePriority(b.role) - getRolePriority(a.role))[0]
        : null

      logger.debug('withOrganization: org_members query result', { hasOrgMember: !!orgMember, hasError: !!orgError })

      if (orgError) {
        logger.error('Error fetching org_members', {
          message: orgError.message,
          code: orgError.code,
          user_id: user.id
        })
        return res.status(500).json({ 
          error: 'Internal server error'
        })
      }

      if (!orgMember) {
        logger.warn('withOrganization: User not found in org_members', { auth_user_id: user.id })
        
        // Tarkista onko käyttäjä globaali admin tai moderator users-taulussa
        const { data: adminCheck, error: adminError } = await supabase
          .from('users')
          .select('*')
          .eq('auth_user_id', user.id)
          .maybeSingle()
        
        logger.debug('withOrganization: Admin check result', {
          hasAdminCheck: !!adminCheck,
          hasError: !!adminError,
          role: adminCheck?.role,
          isAdmin: adminCheck?.role === 'admin',
          isSuperAdmin: adminCheck?.role === 'superadmin',
          isModerator: adminCheck?.role === 'moderator'
        })

        if (!adminError && adminCheck && (adminCheck.role === 'admin' || adminCheck.role === 'superadmin' || adminCheck.role === 'moderator')) {
          // Globaali admin / moderator -käyttäjä, käytä users.id organisaatio-ID:nä
          // ja aseta rooli suoraan users-taulun roolin mukaan
          logger.info('withOrganization: Setting organization for global admin/moderator', {
            id: adminCheck.id,
            role: adminCheck.role
          })
          req.organization = {
            id: adminCheck.id,
            role: adminCheck.role, // 'admin' tai 'moderator'
            data: adminCheck
          }
          req.authUser = user
          req.supabase = supabase
          return handler(req, res)
        }
        
        logger.error('withOrganization: User not found in org_members and not admin/moderator', {
          user_id: user.id,
          hasAdminCheck: !!adminCheck,
          hasAdminError: !!adminError
        })
        
        return res.status(403).json({ 
          error: 'User not member of any organization'
        })
      }

      logger.debug('withOrganization: Found org member', { org_id: orgMember.org_id, role: orgMember.role })

      // 5. Hae organisaation tiedot users taulusta erikseen
      const { data: orgData, error: orgDataError } = await supabase
        .from('users')
        .select('*')
        .eq('id', orgMember.org_id)
        .single()

      if (orgDataError) {
        logger.error('Error fetching organization data', { message: orgDataError.message, code: orgDataError.code })
        return res.status(500).json({ 
          error: 'Internal server error'
        })
      }

      // 6. Lisää organisaatiotiedot request-objektiin
      req.organization = {
        id: orgMember.org_id,           // public.users.id (organisaatio)
        role: orgMember.role,           // 'owner', 'admin', 'member'
        data: orgData                   // public.users rivi (kaikki organisaation tiedot)
      }
      req.authUser = user
      req.supabase = supabase

      // 6. Kutsu alkuperäinen handler
      return handler(req, res)
    } catch (error) {
      logger.error('withOrganization middleware error', { message: error.message, stack: error.stack, name: error.name })
      return res.status(500).json({ error: 'Internal server error' })
    }
  }
}

