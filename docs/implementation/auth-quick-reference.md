# Authentication Quick Reference

## Role Hierarchy at a Glance

```
1. Tenant Admin      → Sees everything, manages everyone
2. Regional Manager  → Sees multiple stores in assigned regions
3. Store Manager     → Sees single assigned store
4. Analyst          → Sees all data (read-only) for analysis
5. Store Staff      → Sees limited data in assigned store
6. Viewer           → Sees dashboards only (read-only)
```

## Quick Decision Tree

```
Need to see all organization data?
├─ YES → Tenant Admin or Analyst
└─ NO → Continue...
    │
    Need to manage users?
    ├─ YES → Need to manage multiple stores?
    │        ├─ YES → Regional Manager
    │        └─ NO → Store Manager
    └─ NO → Need to modify data?
            ├─ YES → Store Staff
            └─ NO → Viewer
```

## Common Patterns

### Internationalization in Components
```typescript
// Client component
import { useTranslation } from '@/app/i18n/client'

export default function MyComponent() {
  const { t } = useTranslation('common')
  return <h1>{t('welcome.title')}</h1>
}

// Server component
import { useTranslation } from '@/app/i18n'

export default async function ServerComponent({ params: { lng } }) {
  const { t } = await useTranslation(lng, 'common')
  return <h1>{t('welcome.title')}</h1>
}
```

### Check User Role in Frontend
```typescript
const { role } = useAuth();

if (role === 'tenant_admin') {
  // Show admin features
}

if (['tenant_admin', 'regional_manager'].includes(role)) {
  // Show management features
}
```

### Protect API Routes
```typescript
// Require specific role
const user = await requireAuth(request, 'store_manager');

// Require any authenticated user
const user = await requireAuth(request);
```

### Query Data with RLS
```typescript
// Just query normally - RLS handles filtering
const { data: stores } = await supabase
  .from('stores')
  .select('*');
// Returns only stores user has access to
```

### Assign User to Store
```sql
INSERT INTO user_stores (user_id, store_id, assigned_by)
VALUES (
  'user-uuid',
  'store-uuid',
  auth.uid()  -- Current user doing the assignment
);
```

## Role Capabilities Matrix

| Can do this? | Admin | Regional | Store Mgr | Analyst | Staff | Viewer |
|--------------|-------|----------|-----------|---------|-------|--------|
| See all orgs | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Create users | ✅ | ✅* | ✅* | ❌ | ❌ | ❌ |
| Assign stores | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Modify settings | ✅ | ❌ | ✅** | ❌ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅*** | ✅*** |

\* Can only create users below their level  
\** Only for their store  
\*** Limited view only  

## SQL Helper Functions

### Check if user can access store
```sql
SELECT check_store_access(auth.uid(), 'store-uuid');
-- Returns TRUE/FALSE
```

### Get user's accessible stores
```sql
SELECT * FROM get_user_stores(auth.uid());
-- Returns list of stores based on role
```

### Check role hierarchy
```sql
SELECT role_level('store_manager') > role_level('viewer');
-- Returns TRUE (3 > 5)
```

## Common Mistakes to Avoid

1. **Don't check role in RLS** - Use dedicated functions
   ```sql
   -- BAD
   WHERE role = 'tenant_admin'
   
   -- GOOD
   WHERE check_store_access(auth.uid(), store_id)
   ```

2. **Don't hardcode organization IDs**
   ```typescript
   // BAD
   .eq('organization_id', 'some-uuid')
   
   // GOOD - RLS handles it
   // No need to filter by org
   ```

3. **Don't bypass RLS in frontend**
   ```typescript
   // BAD - Using service key in frontend
   const supabase = createClient(url, SERVICE_KEY);
   
   // GOOD - Using anon key
   const supabase = createClient(url, ANON_KEY);
   ```

## Testing Different Roles

```typescript
// In development, switch roles for testing
async function switchTestRole(role: UserRole) {
  if (process.env.NODE_ENV !== 'development') return;
  
  await supabase.rpc('dev_switch_role', { new_role: role });
  window.location.reload();
}
```

## Debugging Tips

1. **Check current user's role**:
   ```sql
   SELECT * FROM user_profiles WHERE id = auth.uid();
   ```

2. **See why RLS is blocking**:
   ```sql
   -- Temporarily in dev
   SET LOCAL row_level_security TO OFF;
   -- Run query
   -- See all results, compare with RLS ON
   ```

3. **Audit log queries**:
   ```sql
   -- See recent actions by user
   SELECT * FROM audit_logs 
   WHERE user_id = 'user-uuid' 
   ORDER BY created_at DESC 
   LIMIT 20;
   ```

## Implementation Checklist

When implementing a new feature:

- [ ] Define what roles should access it
- [ ] Add RLS policy if new table
- [ ] Add role check in API route
- [ ] Update frontend to show/hide based on role
- [ ] Test with each role type
- [ ] Document any special permissions
- [ ] Add to audit log if sensitive

## Future OAuth Setup (Placeholder)

When we add Google/Microsoft login:
```typescript
// Just uncomment and add keys
const supabase = createClient(url, key, {
  auth: {
    providers: {
      // google: {
      //   clientId: process.env.GOOGLE_CLIENT_ID,
      //   redirectTo: `${window.location.origin}/auth/callback`
      // },
      // microsoft: {
      //   clientId: process.env.MICROSOFT_CLIENT_ID,
      //   redirectTo: `${window.location.origin}/auth/callback`
      // }
    }
  }
});
```

---

Keep this handy while implementing!