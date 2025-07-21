export type UserRole = 
  | 'tenant_admin'
  | 'regional_manager'
  | 'store_manager'
  | 'analyst'
  | 'store_staff'
  | 'viewer'

export interface Organization {
  id: string
  name: string
  slug: string
  settings?: Record<string, any>
  subscription_tier: string
  subscription_status: string
  trial_ends_at?: string
  created_at: string
  updated_at: string
}

export interface UserProfile {
  id: string
  organization_id: string
  email: string
  full_name?: string
  role: UserRole
  permissions?: Record<string, any>
  is_active: boolean
  last_login_at?: string
  created_at: string
  updated_at: string
  organization?: Organization
}

export interface Store {
  id: string
  organization_id: string
  region_id?: string
  name: string
  code?: string
  address?: string
  timezone: string
  metadata?: Record<string, any>
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Region {
  id: string
  organization_id: string
  name: string
  code?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
  organization?: Organization
  stores?: Store[]
  regions?: Region[]
}

// Permission helpers
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  tenant_admin: 1,
  regional_manager: 2,
  store_manager: 3,
  analyst: 3, // Same level as store_manager but different permissions
  store_staff: 4,
  viewer: 5,
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole]
}

export function canManageUsers(userRole: UserRole, targetRole: UserRole): boolean {
  // Tenant admins can manage everyone
  if (userRole === 'tenant_admin') return true
  
  // Regional managers can manage store managers and below
  if (userRole === 'regional_manager' && ROLE_HIERARCHY[targetRole] >= 3) return true
  
  // Store managers can manage store staff
  if (userRole === 'store_manager' && targetRole === 'store_staff') return true
  
  return false
}