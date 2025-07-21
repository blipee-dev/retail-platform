# Authentication & Multi-Tenant Implementation Plan

## Overview

This document outlines the implementation plan for a multi-tenant authentication system with role hierarchies for the Retail Platform. We're implementing a complete multi-tenant architecture from the start to support multiple organizations (tenants) with proper data isolation.

## Implementation Scope

### ✅ What We're Building (MVP)

1. **Multi-Tenant Architecture**
   - Complete tenant isolation using Row Level Security (RLS)
   - Organization-based data segregation
   - Tenant-specific URLs (subdomain or slug-based)
   
2. **Email/Password Authentication** using Supabase Auth
   - Tenant-aware signup process
   - Organization creation during first admin signup

3. **6 Role Hierarchies** per organization:
   - Tenant Admin (Organization owner)
   - Regional Manager  
   - Store Manager
   - Analyst
   - Store Staff
   - Viewer

4. **Tenant Management**
   - Organization settings and profile
   - User invitation system
   - Billing/subscription management hooks

5. **Complete Data Isolation**
   - All data scoped to organizations
   - RLS policies enforcing tenant boundaries
   - No cross-tenant data leakage

6. **Basic Audit Logging** per tenant

### ⏸️ What We're Deferring (Future Phases)

1. OAuth Providers (Google, Microsoft, etc.)
2. SAML/SSO Integration
3. Multi-Factor Authentication (MFA)
4. Invitation Code System
5. Platform-Level Roles
6. Advanced Compliance Features

## Role Hierarchy Design

```
Tenant Admin (Level 1)
    ├── Regional Manager (Level 2)
    │   └── Store Manager (Level 3)
    │       └── Store Staff (Level 4)
    │
    ├── Analyst (Level 3 - parallel branch)
    └── Viewer (Level 5 - limited access)
```

### Role Definitions

| Role | Purpose | Key Permissions | Can Manage |
|------|---------|----------------|------------|
| **Tenant Admin** | Organization owner | Full access | All users & settings |
| **Regional Manager** | Oversees multiple stores | Regional data & stores | Store Managers & below |
| **Store Manager** | Manages single store | Store data & config | Store Staff |
| **Analyst** | Data analysis across stores | Read & export data | No user management |
| **Store Staff** | Daily operations | Limited store data | No user management |
| **Viewer** | Stakeholder access | Read-only dashboards | No user management |

## Database Schema

### Core Tables

```sql
-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extended user profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    role user_role_enum NOT NULL,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User role enum
CREATE TYPE user_role_enum AS ENUM (
    'tenant_admin',
    'regional_manager',
    'store_manager',
    'analyst',
    'store_staff',
    'viewer'
);

-- Regional assignments (for Regional Managers)
CREATE TABLE user_regions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES user_profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, region_id)
);

-- Store assignments (for Store Managers, Staff, and Viewers)
CREATE TABLE user_stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES user_profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Audit log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES user_profiles(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

### Key RLS Principles

1. **Tenant Isolation**: Users can only see data from their organization
2. **Role-Based Access**: Different roles have different data access
3. **Hierarchical Access**: Higher roles can see data from lower roles
4. **Assignment-Based**: Access to specific stores/regions based on assignments

### Example RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

-- Organization isolation
CREATE POLICY "Users can only see their organization"
ON user_profiles
FOR ALL
USING (organization_id = auth.jwt()->>'organization_id');

-- Store access based on role
CREATE POLICY "Store access based on role and assignment"
ON stores
FOR SELECT
USING (
    -- Tenant Admin sees all stores
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND organization_id = stores.organization_id
        AND role = 'tenant_admin'
    )
    OR
    -- Regional Manager sees stores in their regions
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_regions ur ON ur.user_id = up.id
        WHERE up.id = auth.uid()
        AND stores.region_id = ur.region_id
        AND up.role = 'regional_manager'
    )
    OR
    -- Store Manager/Staff see their assigned stores
    EXISTS (
        SELECT 1 FROM user_profiles up
        JOIN user_stores us ON us.user_id = up.id
        WHERE up.id = auth.uid()
        AND stores.id = us.store_id
        AND up.role IN ('store_manager', 'store_staff', 'viewer')
    )
    OR
    -- Analyst sees all stores in organization
    EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND organization_id = stores.organization_id
        AND role = 'analyst'
    )
);
```

## API Structure

### Authentication Endpoints

```typescript
// Using Supabase Auth
POST   /auth/signup          // Email/password registration
POST   /auth/signin          // Email/password login
POST   /auth/signout         // Logout
POST   /auth/reset-password  // Password reset
GET    /auth/user            // Current user

// Custom user management (admin only)
GET    /api/users            // List users (with role filtering)
POST   /api/users            // Create user with role
PUT    /api/users/:id        // Update user role/assignments
DELETE /api/users/:id        // Deactivate user
POST   /api/users/:id/assign-stores   // Assign stores
POST   /api/users/:id/assign-regions  // Assign regions
```

## Implementation Phases

### Phase 1: Core Authentication (Week 1)
- [ ] Set up Supabase Auth with email/password
- [ ] Create database schema and enums
- [ ] Implement basic RLS policies
- [ ] Create authentication context in Next.js

### Phase 2: Role Management (Week 2)
- [ ] Build user profile system
- [ ] Implement role assignment logic
- [ ] Create store/region assignment tables
- [ ] Add permission checking utilities

### Phase 3: User Interface (Week 3)
- [ ] Login/signup pages
- [ ] User management dashboard
- [ ] Role assignment interface
- [ ] Profile management

### Phase 4: Testing & Documentation (Week 4)
- [ ] Comprehensive testing of all roles
- [ ] API documentation
- [ ] Admin guide
- [ ] Security review

## Permission Matrix

| Action | Tenant Admin | Regional Manager | Store Manager | Analyst | Store Staff | Viewer |
|--------|--------------|------------------|---------------|---------|-------------|---------|
| View all organization data | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| View regional data | ✅ | ✅ Own regions | ❌ | ✅ | ❌ | ❌ |
| View store data | ✅ | ✅ Region stores | ✅ Own store | ✅ | ✅ Own store | ✅ Own store |
| Manage users | ✅ All | ✅ Below only | ✅ Staff only | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Configure settings | ✅ | ❌ | ✅ Store only | ❌ | ❌ | ❌ |
| View sensitive data | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## Security Considerations

1. **Password Requirements**:
   - Minimum 8 characters
   - Mix of letters, numbers, special characters
   - Password history (no reuse of last 5)

2. **Session Management**:
   - 24-hour session timeout
   - Refresh token rotation
   - Secure cookie settings

3. **Audit Logging**:
   - All authentication events
   - Role changes
   - Data access for sensitive operations

## Future Expansion Points

### OAuth Integration (When needed)
```typescript
// Placeholder for OAuth configuration
const oauthProviders = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    // Implementation deferred
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    // Implementation deferred
  }
};
```

### MFA Support (When needed)
```typescript
// Placeholder for MFA
interface MFAConfig {
  required_for_roles: ['tenant_admin', 'regional_manager'];
  methods: ['totp', 'sms'];
  // Implementation deferred
}
```

### Enterprise SSO (When needed)
```typescript
// Placeholder for SAML
interface SAMLConfig {
  providers: ['okta', 'azure_ad', 'auth0'];
  // Implementation deferred
}
```

## Testing Strategy

1. **Unit Tests**: Permission utilities, role checks
2. **Integration Tests**: Auth flow, RLS policies
3. **E2E Tests**: Complete user journeys for each role
4. **Security Tests**: SQL injection, authorization bypass attempts

## Success Metrics

- All 6 roles implemented with correct permissions
- RLS policies preventing unauthorized access
- User management UI functional
- Audit trail for all auth events
- Documentation complete and accurate

## Notes for Future Development

When adding OAuth/SSO:
1. Extend the user_profiles table with provider info
2. Add provider-specific fields to organizations table
3. Implement JIT provisioning for SSO users
4. Map external groups/roles to internal roles

When adding MFA:
1. Add mfa_secret and mfa_enabled to user_profiles
2. Implement TOTP generation/validation
3. Add backup codes table
4. Create MFA enrollment flow

When adding invitation codes:
1. Create invitation_codes table as specified in enterprise doc
2. Add code generation/validation logic
3. Support pre-assigned roles and stores
4. Add expiration and usage limits

---

This plan provides a solid foundation that can grow into the full enterprise system while delivering value quickly with the MVP implementation.