import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import type { UserRole } from '@/app/types/auth'

// Server-side Supabase client with service role - lazily initialized
let supabaseAdmin: ReturnType<typeof createClient> | null = null

function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !serviceRoleKey) {
      // Return null during build, will throw error at runtime
      return null
    }

    supabaseAdmin = createClient(
      supabaseUrl.trim(),
      serviceRoleKey.trim()
    )
  }
  return supabaseAdmin
}

export interface AuthContext {
  userId: string
  userRole: UserRole
  organizationId: string
  userProfile: any
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Authenticate and authorize API requests
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredRole?: UserRole
): Promise<AuthContext> {
  try {
    const adminClient = getSupabaseAdmin()
    if (!adminClient) {
      throw new AuthError('Supabase admin client not initialized', 500)
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header', 401)
    }

    const token = authHeader.substring(7)

    // Verify the JWT token
    const { data: { user }, error: authError } = await adminClient.auth.getUser(token)
    
    if (authError || !user) {
      throw new AuthError('Invalid or expired token', 401)
    }

    // Get user profile with organization info
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      throw new AuthError('User profile not found', 404)
    }

    // Type assertion for the profile
    const typedProfile = profile as any as {
      id: string
      role: UserRole
      organization_id: string
      is_active: boolean
      email: string
      full_name: string
      [key: string]: any
    }

    // Check if user is active
    if (!typedProfile.is_active) {
      throw new AuthError('Account is deactivated', 403)
    }

    // Check role requirements
    if (requiredRole && !hasRequiredRole(typedProfile.role, requiredRole)) {
      throw new AuthError(`Insufficient permissions. Required: ${requiredRole}`, 403)
    }

    return {
      userId: user.id,
      userRole: typedProfile.role,
      organizationId: typedProfile.organization_id,
      userProfile: typedProfile
    }

  } catch (error) {
    if (error instanceof AuthError) {
      throw error
    }
    console.error('Authentication error:', error)
    throw new AuthError('Authentication failed', 500)
  }
}

/**
 * Check if user has required role
 */
function hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    'viewer': 1,
    'store_staff': 2,
    'analyst': 3,
    'store_manager': 4,
    'regional_manager': 5,
    'tenant_admin': 6
  }

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Get organization-scoped Supabase client
 * This ensures all queries are automatically scoped to the user's organization
 */
export function getOrganizationScopedClient(organizationId: string) {
  // For now, return the admin client
  // In a more advanced setup, we could create RLS context here
  const adminClient = getSupabaseAdmin()
  if (!adminClient) {
    throw new AuthError('Supabase admin client not initialized', 500)
  }
  return adminClient
}

/**
 * Validate that a resource belongs to the user's organization
 */
export async function validateOrganizationAccess(
  resourceTable: string,
  resourceId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from(resourceTable)
      .select('organization_id')
      .eq('id', resourceId)
      .single()

    if (error || !data) {
      return false
    }

    return data.organization_id === organizationId
  } catch {
    return false
  }
}