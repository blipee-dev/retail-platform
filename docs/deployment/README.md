# Deployment Guide

This guide covers deployment procedures for blipee OS Retail Intelligence using our cloud-first architecture with Supabase and Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Strategies](#deployment-strategies)
- [Vercel Deployment](#vercel-deployment)
- [Supabase Setup](#supabase-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Accounts
- GitHub account with repository access
- Vercel account (Pro/Enterprise for production)
- Supabase account (Pro/Enterprise for production)
- Domain name and DNS access (for custom domains)

### Cloud-First Deployment
**No local tools required!** Everything deploys from:
- GitHub Codespaces (development)
- GitHub Actions (CI/CD)
- Vercel (automatic deployments)
- Supabase (managed database & functions)

## Environment Setup

### Environment Strategy

```
main branch     → Production (https://retail-platform-blipee.vercel.app)
staging branch  → Staging (https://retail-platform-git-staging-blipee.vercel.app)
develop branch  → Development (https://retail-platform-git-develop-blipee.vercel.app)
feature/*      → Preview deployments (auto-generated URLs)
codespaces     → Individual development environments
```

### Current Deployment Status

- ✅ **Staging**: Deployed and accessible at https://retail-platform-git-staging-blipee.vercel.app
- ✅ **Development**: Deployed and accessible at https://retail-platform-git-develop-blipee.vercel.app
- ⏳ **Production**: Ready to deploy when main branch is updated

### Environment Variables

Create `.env` files for each environment:

```bash
# .env.production
NEXT_PUBLIC_APP_URL=https://app.blipee.com
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key
SUPABASE_SERVICE_KEY=your-prod-service-key

# API Keys
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-newrelic-key

# Email
RESEND_API_KEY=your-resend-key
EMAIL_FROM=noreply@blipee.com

# Feature Flags
ENABLE_AI_INSIGHTS=true
ENABLE_BENCHMARKING=false
```

## Deployment Strategies

### 1. Continuous Deployment (Recommended)

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
      - uses: actions/checkout@v3
      - name: Deploy to Vercel
        run: |
          if [ "${{ github.ref }}" = "refs/heads/main" ]; then
            vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
          else
            vercel --token=${{ secrets.VERCEL_TOKEN }}
          fi
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
   ```bash
   vercel
   # Follow prompts to link to GitHub repo
   ```

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
   Production: app.retailintelligence.io
   Staging: staging.retailintelligence.io
   Dev: dev.retailintelligence.io
   ```

### Deployment Configuration

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1", "sfo1", "lhr1"],
  "functions": {
    "app/api/sensors/ingest/route.ts": {
      "maxDuration": 60
    },
    "app/api/ai/insights/route.ts": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/hourly-aggregation",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/daily-reports",
      "schedule": "0 0 * * *"
    }
  ]
}
```

### Edge Functions Configuration

```typescript
// app/api/realtime/route.ts
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Edge function implementation
}
```

## Supabase Setup

### 1. Create Projects

Create separate projects for each environment:
- `retail-platform-prod`
- `retail-platform-staging`
- `retail-platform-dev`

### 2. Database Setup

```bash
# Run migrations
supabase db push

# Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### 3. Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM organization_members 
    WHERE organization_id = organizations.id
  ));
```

### 4. Edge Functions

```bash
# Deploy edge functions
supabase functions deploy sensor-processor
supabase functions deploy ai-insights
supabase functions deploy webhook-handler
```

### 5. Realtime Configuration

```sql
-- Enable realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE people_counts;
ALTER PUBLICATION supabase_realtime ADD TABLE performance_metrics;
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

env:
  NODE_VERSION: '20'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run type checking
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:ci
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
      
      - name: Build application
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level=high
      
      - name: Run Snyk scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
      
      - name: Run E2E tests
        if: success()
        run: npm run test:e2e
        env:
          PLAYWRIGHT_BASE_URL: ${{ steps.vercel.outputs.preview-url }}
      
      - name: Notify deployment
        if: github.ref == 'refs/heads/main'
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Pre-deployment Checklist

```yaml
# .github/PULL_REQUEST_TEMPLATE/deploy.md
## Deployment Checklist

### Code Quality
- [ ] All tests passing
- [ ] No linting errors
- [ ] Type checking passes
- [ ] Code reviewed and approved

### Database
- [ ] Migrations tested
- [ ] Rollback script prepared
- [ ] Data backup completed

### Configuration
- [ ] Environment variables updated
- [ ] Feature flags configured
- [ ] API rate limits reviewed

### Monitoring
- [ ] Error tracking configured
- [ ] Performance baselines established
- [ ] Alerts configured

### Documentation
- [ ] CHANGELOG updated
- [ ] API docs updated
- [ ] Runbook updated
```

## Monitoring

### 1. Application Monitoring

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';
import { Analytics } from '@vercel/analytics/react';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    return event;
  }
});

// Custom error boundary
export function MonitoringProvider({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback}>
      {children}
      <Analytics />
    </Sentry.ErrorBoundary>
  );
}
```

### 2. Performance Monitoring

```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const start = Date.now();
  
  const response = NextResponse.next();
  
  // Add performance headers
  response.headers.set('X-Response-Time', `${Date.now() - start}ms`);
  response.headers.set('X-Region', process.env.VERCEL_REGION || 'unknown');
  
  // Log slow requests
  if (Date.now() - start > 1000) {
    console.warn('Slow request:', {
      path: request.url,
      duration: Date.now() - start
    });
  }
  
  return response;
}
```

### 3. Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    app: 'healthy',
    database: 'unknown',
    cache: 'unknown',
    external: 'unknown'
  };
  
  try {
    // Check database
    await supabase.from('health_check').select('id').single();
    checks.database = 'healthy';
  } catch {
    checks.database = 'unhealthy';
  }
  
  // Check Redis
  try {
    await redis.ping();
    checks.cache = 'healthy';
  } catch {
    checks.cache = 'unhealthy';
  }
  
  const status = Object.values(checks).every(s => s === 'healthy') ? 200 : 503;
  
  return Response.json({
    status: status === 200 ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    checks
  }, { status });
}
```

## Rollback Procedures

### Immediate Rollback

```bash
# Vercel instant rollback
vercel rollback

# Or via dashboard
# Vercel Dashboard → Project → Deployments → Promote to Production
```

### Database Rollback

```bash
# Revert last migration
supabase db reset --version [previous-version]

# Or manual rollback
psql $DATABASE_URL < backups/backup-[timestamp].sql
```

### Feature Flag Rollback

```typescript
// Disable problematic feature immediately
await updateFeatureFlag('new-feature', false);
```

## Troubleshooting

### Common Issues

#### 1. Build Failures

```bash
# Clear cache and rebuild
vercel --force

# Check build logs
vercel logs [deployment-url]
```

#### 2. Database Connection Issues

```typescript
// Add connection pooling
const supabase = createClient(url, key, {
  db: {
    pooling: {
      max: 10,
      min: 2,
      idle: 30000
    }
  }
});
```

#### 3. Performance Issues

```bash
# Enable debug mode
DEBUG=* vercel dev

# Check function logs
vercel logs --function [function-name]
```

### Emergency Procedures

1. **Site Down**
   - Check Vercel status page
   - Review recent deployments
   - Rollback if necessary
   - Enable maintenance mode

2. **Data Issues**
   - Stop write operations
   - Backup current state
   - Investigate root cause
   - Apply fixes
   - Verify data integrity

3. **Security Breach**
   - Rotate all API keys
   - Review access logs
   - Apply security patches
   - Notify affected users

## Support

- **Vercel Support**: enterprise@vercel.com
- **Supabase Support**: support@supabase.io
- **Internal**: devops@retailintelligence.io
- **Emergency**: +1-555-0123 (24/7 on-call)