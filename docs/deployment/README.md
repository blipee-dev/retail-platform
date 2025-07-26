# blipee OS Retail Intelligence - Deployment Guide

This guide covers deployment procedures for blipee OS Retail Intelligence using our cloud-first architecture with Supabase and Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Strategies](#deployment-strategies)
- [Vercel Deployment](#vercel-deployment)
- [Supabase Setup](#supabase-setup)
- [GitHub Actions](#github-actions)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts
- GitHub account with repository access
- Vercel account (Pro recommended for production)
- Supabase account (Pro recommended for production)
- Domain name and DNS access (optional)

### Cloud-First Architecture
- **GitHub Codespaces**: Development environment
- **GitHub Actions**: Automated workflows and data collection
- **Vercel**: Hosting and edge functions
- **Supabase**: PostgreSQL database with RLS
- **No containers needed**: Everything runs in managed services

## Environment Setup

### Environment Strategy

```
main branch     → Production (https://retail-platform.vercel.app)
staging branch  → Staging (https://retail-platform-git-staging.vercel.app)
develop branch  → Development (https://retail-platform-git-develop.vercel.app)
feature/*      → Preview deployments (auto-generated URLs)
```

### Current Deployment Status

- ✅ **Production**: Live at https://retail-platform.vercel.app
- ✅ **Staging**: Live at https://retail-platform-git-staging.vercel.app
- ✅ **Development**: Live at https://retail-platform-git-develop.vercel.app
- ✅ **Preview**: Automatic deployments for all PRs

### Environment Variables

Required environment variables for each environment:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# GitHub Actions (set in GitHub Secrets)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Email (optional)
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@blipee.com

# Feature Flags
ENABLE_DAILY_REPORTS=true
ENABLE_REGIONAL_DATA=true
```

## Deployment Strategies

### 1. Continuous Deployment (Active)

Automatic deployment on git push:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        # Handled automatically by Vercel GitHub integration
```

### 2. Manual Deployment

For controlled releases:

```bash
# Deploy to staging
git checkout staging
git merge develop
git push origin staging

# Deploy to production
git checkout main
git merge staging
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags
```

## Vercel Deployment

### Initial Setup

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click "Import Project"
   - Select GitHub repository
   - Configure project settings

2. **Configure Project**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all required variables for each environment
   - Use different values for Preview/Development/Production

4. **Domain Configuration**
   ```
   Production: retail-platform.vercel.app (custom domain pending)
   Staging: retail-platform-git-staging.vercel.app
   Dev: retail-platform-git-develop.vercel.app
   ```

### Deployment Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "functions": {
    "app/api/sensors/data/route.ts": {
      "maxDuration": 60
    },
    "app/api/analytics/route.ts": {
      "maxDuration": 120
    }
  },
  "github": {
    "silent": false
  }
}
```

## Supabase Setup

### 1. Create Projects

Create separate projects for each environment:
- `blipee-retail-prod`
- `blipee-retail-staging`
- `blipee-retail-dev`

### 2. Database Setup

Run migrations in order through Supabase SQL editor:

```sql
-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Run migration files from app/lib/migrations/ in order:
-- - 20250721_core_schema.sql
-- - 20250721_create_profiles_table.sql
-- - 20250721_people_counting_base_schema.sql
-- - 20250721_sensor_metadata_schema.sql
-- - 20250721_regional_analytics_schema.sql
-- - 20250722_create_hourly_aggregation.sql
-- - 20250722_create_daily_analytics.sql
```

### 3. Row Level Security

RLS is automatically enabled by migration scripts. Verify with:

```sql
-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%';
```

### 4. Authentication Setup

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates
4. Set up redirect URLs

### 5. API Configuration

1. Go to Settings → API
2. Note your project URL and anon key
3. Configure CORS if needed

## GitHub Actions

### Automated Workflows

The platform uses GitHub Actions for:

1. **Data Collection** (`main-pipeline.yml`)
   - Runs every 30 minutes
   - Collects sensor data
   - Updates analytics

2. **Daily Reports** (`daily-reports.yml`)
   - Runs at 9 AM store local time
   - Sends email summaries

3. **CI/CD** (`ci.yml`)
   - Runs on every push
   - Linting and type checking
   - Test execution

### Setting up GitHub Secrets

Go to Settings → Secrets and variables → Actions:

```
SUPABASE_URL
SUPABASE_SERVICE_KEY
RESEND_API_KEY
VERCEL_TOKEN (optional)
```

## Monitoring

### 1. Vercel Analytics

Automatically enabled for all deployments:
- Real User Monitoring (RUM)
- Web Vitals tracking
- Error tracking

### 2. Supabase Monitoring

Available in Supabase dashboard:
- Query performance
- Database size
- API usage
- Error logs

### 3. GitHub Actions Monitoring

Check workflow runs:
- Go to Actions tab
- View workflow history
- Check for failures

### 4. Application Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    api: 'healthy',
    timestamp: new Date().toISOString()
  };
  
  return Response.json(checks);
}
```

## Rollback Procedures

### Vercel Rollback

Instant rollback to previous deployment:

```bash
# Via Vercel CLI
vercel rollback

# Via Dashboard
# Go to Deployments → Select previous deployment → Promote to Production
```

### Database Rollback

For critical database issues:

```sql
-- Restore from Supabase backup
-- Go to Database → Backups → Restore

-- Or manual restore from backup
psql $DATABASE_URL < backup.sql
```

### GitHub Actions Rollback

Revert workflow changes:

```bash
git revert <commit-hash>
git push origin main
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Check build logs in Vercel
# Common issues:
- Missing environment variables
- TypeScript errors
- Dependency issues

# Local debugging
npm run build
```

#### 2. Database Connection Issues

```typescript
// Check connection pool settings
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true
  }
});
```

#### 3. API Rate Limiting

```bash
# Check rate limit headers
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1627584000
```

### Debug Mode

Enable debug logging:

```bash
# Local development
DEBUG=* npm run dev

# Production (temporary)
# Add to environment variables
NEXT_PUBLIC_DEBUG=true
```

### Performance Issues

1. **Check Vercel Functions logs**
   - Go to Functions tab
   - Review execution times
   - Check for timeouts

2. **Database query optimization**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM hourly_analytics
   WHERE store_id = '...'
   AND start_time > NOW() - INTERVAL '7 days';
   ```

3. **Enable caching**
   ```typescript
   export const revalidate = 3600; // Cache for 1 hour
   ```

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets to git
   - Use different keys per environment
   - Rotate keys regularly

2. **API Security**
   - Always validate input
   - Use RLS for data access
   - Implement rate limiting

3. **Deployment Security**
   - Review code before deploying
   - Use preview deployments for testing
   - Monitor for vulnerabilities

## Support

- **Documentation**: [Project Docs](../README.md)
- **GitHub Issues**: [Report Issues](https://github.com/blipee/retail-intelligence/issues)
- **Vercel Support**: [Vercel Docs](https://vercel.com/docs)
- **Supabase Support**: [Supabase Docs](https://supabase.com/docs)
- **Email**: support@blipee.com

---

**Last Updated**: 2025-07-26  
**Version**: 2.0  
**Maintained By**: blipee Engineering Team