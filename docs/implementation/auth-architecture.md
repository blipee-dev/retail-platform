# Authentication Architecture

## System Integration Overview

This document describes how the authentication system integrates with the existing Retail Platform components.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js Frontend                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │   Auth UI   │  │  Dashboards  │  │  User Management UI   │  │
│  │  (Login)    │  │  (Protected) │  │  (Admin Only)         │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────┴─────────────────┴───────────────────────┴──────────┐  │
│  │                  Auth Context Provider                     │  │
│  │              (Manages user session & roles)                │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   Supabase Client  │
                    │  (Authentication)  │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────┼─────────────────────────────────┐
│                        Supabase Backend                         │
│  ┌──────────────┐  ┌───────┴────────┐  ┌──────────────────┐  │
│  │  Auth Service │  │  RLS Policies  │  │  Edge Functions  │  │
│  │  (Built-in)  │  │  (PostgreSQL)  │  │  (API Routes)    │  │
│  └──────┬───────┘  └────────────────┘  └─────────┬────────┘  │
│         │                                         │            │
│  ┌──────┴─────────────────────────────────────────┴────────┐  │
│  │                    PostgreSQL Database                    │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │  │
│  │  │ auth.users  │  │user_profiles │  │    stores     │  │  │
│  │  │ (Supabase)  │  │   (roles)    │  │   (data)      │  │  │
│  │  └─────────────┘  └──────────────┘  └───────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │  Python Connectors │
                    │  (Sensor Data)     │
                    └────────────────────┘
```

## Component Integration

### 1. Frontend Integration

#### Auth Context Provider
```typescript
// app/providers/auth-provider.tsx
export interface AuthContextType {
  user: User | null;
  role: UserRole;
  organization: Organization | null;
  permissions: Permission[];
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  canAccess: (resource: string, action: string) => boolean;
}
```

#### Protected Routes
```typescript
// app/components/protected-route.tsx
export function ProtectedRoute({ 
  children, 
  requiredRole,
  requiredPermission 
}: ProtectedRouteProps) {
  const { user, role, canAccess } = useAuth();
  
  if (!user) return <Navigate to="/login" />;
  if (requiredRole && !hasRole(role, requiredRole)) return <AccessDenied />;
  if (requiredPermission && !canAccess(...requiredPermission)) return <AccessDenied />;
  
  return children;
}
```

#### Dashboard Integration
```typescript
// app/dashboard/page.tsx
export default function Dashboard() {
  const { user, role } = useAuth();
  const { data: stores } = useStores(); // RLS filters based on user
  
  return (
    <DashboardLayout>
      {role === 'tenant_admin' && <AdminDashboard />}
      {role === 'regional_manager' && <RegionalDashboard stores={stores} />}
      {role === 'store_manager' && <StoreDashboard store={stores[0]} />}
      {role === 'analyst' && <AnalyticsDashboard />}
      {['store_staff', 'viewer'].includes(role) && <BasicDashboard />}
    </DashboardLayout>
  );
}
```

### 2. Backend Integration

#### API Route Protection
```typescript
// app/api/middleware/auth.ts
export async function requireAuth(
  request: Request,
  requiredRole?: UserRole
): Promise<User> {
  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('Unauthorized');
  }
  
  const profile = await getUserProfile(user.id);
  
  if (requiredRole && !hasRole(profile.role, requiredRole)) {
    throw new Error('Insufficient permissions');
  }
  
  return { ...user, profile };
}
```

#### Sensor Data Access Control
```typescript
// app/api/sensors/[id]/data/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireAuth(request);
  const supabase = createServerClient();
  
  // RLS automatically filters based on user's store assignments
  const { data, error } = await supabase
    .from('sensor_data')
    .select('*')
    .eq('sensor_id', params.id)
    .order('timestamp', { ascending: false });
  
  if (error) return NextResponse.json({ error }, { status: 403 });
  return NextResponse.json(data);
}
```

### 3. Database Integration

#### RLS Integration with Existing Tables
```sql
-- Add organization_id to existing tables
ALTER TABLE stores ADD COLUMN organization_id UUID REFERENCES organizations(id);
ALTER TABLE sensors ADD COLUMN store_id UUID REFERENCES stores(id);

-- Update RLS policies for sensor data
CREATE POLICY "Users see sensor data from their stores"
ON sensor_data
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM sensors s
    JOIN stores st ON st.id = s.store_id
    WHERE s.id = sensor_data.sensor_id
    AND (
      -- Check store access based on user role
      check_store_access(auth.uid(), st.id)
    )
  )
);

-- Helper function for store access
CREATE FUNCTION check_store_access(user_id UUID, store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles up
    LEFT JOIN user_stores us ON us.user_id = up.id
    LEFT JOIN user_regions ur ON ur.user_id = up.id
    LEFT JOIN stores s ON s.id = store_id
    WHERE up.id = user_id
    AND (
      up.role = 'tenant_admin' OR
      up.role = 'analyst' OR
      (up.role IN ('regional_manager') AND s.region_id = ur.region_id) OR
      (up.role IN ('store_manager', 'store_staff', 'viewer') AND us.store_id = store_id)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4. Python Connector Integration

#### Authenticated Data Collection
```python
# src/connector_system/authenticated_connector.py
from supabase import create_client
import os

class AuthenticatedConnector(BaseConnector):
    def __init__(self, config):
        super().__init__(config)
        self.supabase = create_client(
            os.environ.get("SUPABASE_URL"),
            os.environ.get("SUPABASE_SERVICE_KEY")  # Service key for backend
        )
    
    def push_data(self, sensor_id: str, data: dict):
        """Push sensor data with proper store association"""
        # Get sensor's store for RLS
        sensor = self.supabase.table('sensors').select('store_id').eq('id', sensor_id).single().execute()
        
        # Insert data with store context
        result = self.supabase.table('sensor_data').insert({
            'sensor_id': sensor_id,
            'store_id': sensor.data['store_id'],
            'data': data,
            'timestamp': datetime.now().isoformat()
        }).execute()
        
        return result
```

## Migration Strategy

### Step 1: Add Auth Tables (No Breaking Changes)
```sql
-- These can be added without affecting existing functionality
CREATE TABLE organizations (...);
CREATE TABLE user_profiles (...);
CREATE TABLE user_stores (...);
CREATE TABLE user_regions (...);
```

### Step 2: Add Foreign Keys to Existing Tables
```sql
-- Add nullable columns first
ALTER TABLE stores ADD COLUMN organization_id UUID;
ALTER TABLE sensors ADD COLUMN store_id UUID;

-- Populate with default organization
UPDATE stores SET organization_id = (SELECT id FROM organizations LIMIT 1);

-- Then add constraints
ALTER TABLE stores ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE stores ADD CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id);
```

### Step 3: Enable RLS Gradually
```sql
-- Start with new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Test thoroughly, then enable on existing tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
```

## Security Considerations

1. **Service Keys**: Python connectors use service keys (bypass RLS)
2. **User Tokens**: Frontend uses user JWT tokens (RLS enforced)
3. **API Routes**: Validate permissions in middleware
4. **Audit Trail**: Log all data access for compliance

## Performance Optimization

1. **Indexes for RLS**:
```sql
CREATE INDEX idx_user_stores_user_id ON user_stores(user_id);
CREATE INDEX idx_user_regions_user_id ON user_regions(user_id);
CREATE INDEX idx_stores_organization_id ON stores(organization_id);
```

2. **Caching Strategy**:
- Cache user permissions in Redis/Memory
- Cache store assignments for session duration
- Invalidate on role/assignment changes

## Testing Integration Points

1. **Frontend Tests**:
- Mock auth context for component tests
- Test role-based rendering
- Test protected route behavior

2. **API Tests**:
- Test each role's data access
- Test RLS policy enforcement
- Test permission denial scenarios

3. **Database Tests**:
- Test RLS policies with different roles
- Test data isolation between orgs
- Test permission inheritance

## Rollback Plan

If issues arise:
1. Disable RLS policies (immediate)
2. Remove foreign key constraints
3. Keep auth tables (no data loss)
4. Revert to previous authentication method

---

This architecture ensures smooth integration with existing components while maintaining security and extensibility for future enhancements.