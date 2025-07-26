# blipee OS Retail Intelligence - Authentication API

The Authentication API handles user authentication, session management, and role-based access control for the platform.

## Base URL

```
https://retail-platform.vercel.app/api/auth
```

## Authentication Flow

blipee OS uses Supabase Auth for authentication with custom RBAC implementation:

1. User signs in with email/password
2. Supabase returns JWT tokens
3. User profile with role is fetched
4. Permissions are enforced via RLS

## Endpoints

### Sign In

Authenticate a user with email and password.

```http
POST /api/auth/signin
```

#### Request Body

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Response

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "role": "store_manager",
    "organization_id": "456e7890-e89b-12d3-a456-426614174000",
    "full_name": "John Doe",
    "assigned_stores": ["789e0123-e89b-12d3-a456-426614174000"]
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "expires_at": 1627584000
  }
}
```

### Sign Up

Register a new user (requires tenant_admin permission).

```http
POST /api/auth/signup
```

#### Request Body

```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "Jane Smith",
  "role": "store_staff",
  "organization_id": "456e7890-e89b-12d3-a456-426614174000",
  "assigned_stores": ["789e0123-e89b-12d3-a456-426614174000"]
}
```

#### Response

```json
{
  "user": {
    "id": "234e5678-e89b-12d3-a456-426614174000",
    "email": "newuser@example.com",
    "role": "store_staff",
    "organization_id": "456e7890-e89b-12d3-a456-426614174000",
    "full_name": "Jane Smith"
  },
  "message": "User created successfully. Confirmation email sent."
}
```

### Sign Out

End the current user session.

```http
POST /api/auth/signout
```

#### Response

```json
{
  "message": "Successfully signed out"
}
```

### Get Profile

Retrieve the current user's profile.

```http
GET /api/auth/profile
```

#### Headers

```
Authorization: Bearer <access_token>
```

#### Response

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "store_manager",
    "organization": {
      "id": "456e7890-e89b-12d3-a456-426614174000",
      "name": "Acme Retail",
      "subscription_tier": "pro"
    },
    "assigned_stores": [
      {
        "id": "789e0123-e89b-12d3-a456-426614174000",
        "name": "Downtown Store",
        "timezone": "America/New_York"
      }
    ],
    "permissions": {
      "can_view_analytics": true,
      "can_manage_sensors": true,
      "can_manage_users": false,
      "can_view_all_stores": false
    },
    "preferences": {
      "language": "en",
      "date_format": "MM/DD/YYYY",
      "timezone": "America/New_York"
    },
    "last_login_at": "2025-07-26T10:30:00Z",
    "created_at": "2025-01-15T08:00:00Z"
  }
}
```

### Update Profile

Update the current user's profile information.

```http
PATCH /api/auth/profile
```

#### Request Body

```json
{
  "full_name": "John Smith",
  "preferences": {
    "language": "pt",
    "date_format": "DD/MM/YYYY"
  }
}
```

#### Response

```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@example.com",
    "full_name": "John Smith",
    "preferences": {
      "language": "pt",
      "date_format": "DD/MM/YYYY",
      "timezone": "America/New_York"
    }
  }
}
```

### Refresh Token

Exchange a refresh token for a new access token.

```http
POST /api/auth/refresh
```

#### Request Body

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "expires_at": 1627587600
}
```

### Reset Password

Request a password reset email.

```http
POST /api/auth/reset-password
```

#### Request Body

```json
{
  "email": "user@example.com"
}
```

#### Response

```json
{
  "message": "Password reset email sent if account exists"
}
```

### Update Password

Update password with reset token.

```http
POST /api/auth/update-password
```

#### Request Body

```json
{
  "token": "reset-token-from-email",
  "password": "newSecurePassword"
}
```

#### Response

```json
{
  "message": "Password updated successfully"
}
```

## Role-Based Access Control (RBAC)

The platform uses a 6-tier role hierarchy:

| Role | Description | Permissions |
|------|-------------|-------------|
| `tenant_admin` | Organization administrator | Full access to all organization data |
| `regional_manager` | Regional oversight | Access to multiple assigned stores |
| `store_manager` | Store administrator | Full access to single store |
| `analyst` | Data analyst | Read-only access to analytics across stores |
| `store_staff` | Store employee | Limited operational access to single store |
| `viewer` | Dashboard viewer | Read-only access to dashboards |

### Permission Matrix

| Permission | Tenant Admin | Regional Manager | Store Manager | Analyst | Store Staff | Viewer |
|------------|--------------|------------------|---------------|---------|-------------|---------|
| View all stores | ✅ | ✅ (assigned) | ❌ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Manage sensors | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Export data | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Manage alerts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## Session Management

### Token Lifecycle
- **Access Token**: Valid for 1 hour
- **Refresh Token**: Valid for 7 days
- **Session**: Automatically refreshed before expiration

### Security Headers
```
X-Session-ID: Unique session identifier
X-Request-ID: Request tracking ID
```

## Error Codes

| Code | Description |
|------|-------------|
| `INVALID_CREDENTIALS` | Incorrect email or password |
| `USER_NOT_FOUND` | User does not exist |
| `ACCOUNT_DISABLED` | User account is disabled |
| `INVALID_TOKEN` | Invalid or expired token |
| `INSUFFICIENT_PERMISSIONS` | User lacks required role |
| `SESSION_EXPIRED` | Session has expired |
| `RATE_LIMITED` | Too many authentication attempts |

## Security Best Practices

1. **Password Requirements**
   - Minimum 8 characters
   - At least one uppercase letter
   - At least one number
   - No common passwords

2. **Session Security**
   - Tokens stored securely (httpOnly cookies)
   - CSRF protection enabled
   - Session timeout after 30 minutes of inactivity

3. **Rate Limiting**
   - 5 login attempts per 15 minutes
   - 3 password reset requests per hour

## Examples

### JavaScript/TypeScript

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Sign out
await supabase.auth.signOut();
```

### cURL

```bash
# Sign in
curl -X POST https://retail-platform.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Get profile
curl -X GET https://retail-platform.vercel.app/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Multi-Factor Authentication (MFA)

**Status**: Planned for Phase 6

Future support will include:
- TOTP (Time-based One-Time Password)
- SMS verification
- Email verification codes

## Single Sign-On (SSO)

**Status**: Planned for Phase 6

Future support will include:
- SAML 2.0
- OAuth providers (Google, Microsoft)
- OpenID Connect