# Environment Management Guide

This guide covers how to manage different environments (Development, Staging, Production) for the Retail Platform.

## 🌍 Environment Overview

| Environment | Branch | URL | Purpose |
|------------|--------|-----|---------|
| Development | `develop` | `https://retail-platform-development.vercel.app` | Active development and testing |
| Staging | `staging` | `https://retail-platform-staging.vercel.app` | Pre-production testing |
| Production | `main` | `https://retail-platform.vercel.app` | Live application |

## 🔀 Branch Strategy

```
main (production)
  ├── staging (pre-production)
  └── develop (development)
      └── feature/* (feature branches)
```

### Git Flow

1. **Feature Development**
   ```bash
   git checkout develop
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create PR to develop
   ```

2. **Deploy to Staging**
   ```bash
   git checkout staging
   git merge develop
   git push origin staging
   # Auto-deploys to staging
   ```

3. **Deploy to Production**
   ```bash
   git checkout main
   git merge staging
   git push origin main
   # Auto-deploys to production
   ```

## 🔐 Environment Variables

### Setting Environment-Specific Variables in Vercel

1. **Via Dashboard**
   - Go to Project Settings → Environment Variables
   - Select which environments the variable applies to:
     - [ ] Production
     - [ ] Preview (includes staging)
     - [ ] Development

2. **Via CLI**
   ```bash
   # Add variable to specific environment
   vercel env add DATABASE_URL production
   vercel env add DATABASE_URL preview
   vercel env add DATABASE_URL development
   ```

### Environment Variable Naming Convention

```
# Public variables (exposed to browser)
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_ENVIRONMENT

# Server-only variables
DATABASE_URL
SUPABASE_SERVICE_ROLE_KEY
API_SECRET_KEY
```

## 📁 Environment Files

### Local Development
```bash
# Use .env.local for local development
cp .env.development .env.local
# Edit .env.local with your local settings
```

### Environment-Specific Files
- `.env.development` - Development defaults
- `.env.staging` - Staging configuration
- `.env.production` - Production configuration
- `.env.local` - Local overrides (gitignored)

## 🚀 Deployment Commands

### Manual Deployment
```bash
# Deploy to specific environment
./scripts/deploy-env.sh development
./scripts/deploy-env.sh staging
./scripts/deploy-env.sh production
```

### Automatic Deployment
Push to the respective branch:
- `develop` → Development environment
- `staging` → Staging environment
- `main` → Production environment

## 🗄️ Database Management

### Separate Schemas per Environment
```sql
-- Development schema
CREATE SCHEMA IF NOT EXISTS development;

-- Staging schema
CREATE SCHEMA IF NOT EXISTS staging;

-- Production schema (default public)
```

### Supabase Projects
For better isolation, use separate Supabase projects:

1. **Development**: `project-dev.supabase.co`
2. **Staging**: `project-staging.supabase.co`
3. **Production**: `project-prod.supabase.co`

## 🔧 Configuration Management

### Environment Detection in Code
```typescript
// lib/env.ts
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isStaging: process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Feature flags
  enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
};
```

### Using Environment Config
```typescript
import { ENV } from '@/lib/env';

// Conditional logic based on environment
if (ENV.isProduction) {
  // Initialize analytics
}

if (ENV.debugMode) {
  console.log('Debug info:', data);
}
```

## 📊 Monitoring by Environment

### Development
- Console logging enabled
- Verbose error messages
- No analytics tracking

### Staging
- Error tracking enabled (Sentry)
- Performance monitoring
- Test analytics

### Production
- Full error tracking
- Real analytics (GA, Mixpanel)
- Performance monitoring
- Minimal logging

## 🔄 Environment Promotion

### Promoting Changes
```bash
# 1. Test in development
git checkout develop
# Make changes and test

# 2. Promote to staging
git checkout staging
git merge develop
git push origin staging
# Test in staging environment

# 3. Promote to production
git checkout main
git merge staging
git push origin main
# Monitor production
```

### Rollback Strategy
```bash
# Rollback production to previous version
vercel rollback

# Or revert git commit
git checkout main
git revert HEAD
git push origin main
```

## 🛡️ Security Best Practices

1. **Never commit sensitive data**
   - Use environment variables
   - Keep `.env.local` gitignored

2. **Different keys per environment**
   - Separate API keys
   - Different JWT secrets
   - Isolated databases

3. **Access control**
   - Limit production access
   - Use preview deployments for testing
   - Implement deployment approvals

## 📝 Environment Checklist

### Before Deploying to Staging
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Feature flags set correctly

### Before Deploying to Production
- [ ] Staging testing complete
- [ ] Performance benchmarks met
- [ ] Security scan passed
- [ ] Rollback plan ready
- [ ] Monitoring alerts configured

## 🔍 Debugging Environment Issues

### Check Current Environment
```typescript
// Add to any page
console.log({
  env: process.env.NODE_ENV,
  publicEnv: process.env.NEXT_PUBLIC_ENVIRONMENT,
  appUrl: process.env.NEXT_PUBLIC_APP_URL,
});
```

### Verify Environment Variables
```bash
# List all env vars in Vercel
vercel env ls

# Pull env vars locally
vercel env pull .env.local
```

### Common Issues

1. **Variables not loading**
   - Restart dev server after changing `.env.local`
   - Ensure `NEXT_PUBLIC_` prefix for client variables

2. **Wrong environment deployed**
   - Check branch in vercel.json
   - Verify Vercel project settings

3. **Database connection issues**
   - Check connection string for environment
   - Verify SSL settings
   - Check IP whitelist