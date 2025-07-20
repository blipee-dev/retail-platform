# Vercel Deployment Guide

This guide covers deploying the Retail Platform to Vercel.

## Prerequisites

- Vercel account
- GitHub repository connected to Vercel
- Environment variables configured

## Environment Variables

The following environment variables need to be set in your Vercel project settings:

### Supabase Configuration
```
BLIPEE_NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL
BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY - Supabase anonymous key
BLIPEE_SUPABASE_SERVICE_ROLE_KEY - Supabase service role key (keep secret!)
BLIPEE_SUPABASE_JWT_SECRET - JWT secret for Supabase
BLIPEE_POSTGRES_URL - PostgreSQL connection string
```

### Sensor Configuration
```
MILESIGHT_API_URL - Milesight sensor API endpoint
MILESIGHT_API_KEY - API key for Milesight sensors
MILESIGHT_USERNAME - Milesight username
MILESIGHT_PASSWORD - Milesight password
```

### Application Configuration
```
NEXT_PUBLIC_APP_URL - Your application URL (e.g., https://your-app.vercel.app)
NODE_ENV - Set to "production" for production deployments
```

## Deployment Steps

### 1. Initial Setup

1. Fork or clone this repository
2. Connect your GitHub repository to Vercel
3. Vercel will auto-detect Next.js framework

### 2. Configure Environment Variables

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all required variables listed above
4. Make sure to set them for the appropriate environments (Production, Preview, Development)

### 3. Deploy

#### Automatic Deployment
- Push to `main` branch triggers production deployment
- Pull requests create preview deployments

#### Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Project Structure for Vercel

```
/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── sensors/       # Sensor data endpoints
│   │   ├── analytics/     # Analytics endpoints
│   │   └── auth/          # Authentication endpoints
│   ├── (auth)/           # Auth pages
│   ├── (dashboard)/      # Dashboard pages
│   └── layout.tsx        # Root layout
├── components/           # React components
├── lib/                 # Utility functions
├── public/              # Static assets
├── .env.local          # Local environment variables (not committed)
├── next.config.js      # Next.js configuration
├── package.json        # Dependencies
└── vercel.json        # Vercel configuration
```

## API Routes

Next.js API routes are automatically deployed as serverless functions:

- `/api/sensors/*` - Sensor data endpoints
- `/api/analytics/*` - Analytics endpoints
- `/api/auth/*` - Authentication endpoints
- `/api/health` - Health check endpoint

## Python Integration

For Python-based sensor connectors, you have two options:

### Option 1: Separate Python API
Deploy Python code as a separate Vercel project with Python runtime:
```json
{
  "functions": {
    "api/*.py": {
      "runtime": "python3.9"
    }
  }
}
```

### Option 2: External Service
Run Python services on a separate platform (e.g., Railway, Render) and call them from Next.js API routes.

## Monitoring

1. **Vercel Analytics** - Automatically included
2. **Function Logs** - Available in Vercel dashboard
3. **Error Tracking** - Sentry integration configured in the app

## Troubleshooting

### Build Failures
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set

### Function Timeouts
- Default timeout is 10 seconds (Hobby plan)
- Increase to 60 seconds on Pro plan
- Configure in vercel.json:
```json
{
  "functions": {
    "app/api/sensors/*/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### CORS Issues
CORS headers are configured in vercel.json. Modify as needed for your domain.

## Security Best Practices

1. Never expose service role keys in client-side code
2. Use environment variables for all secrets
3. Enable Vercel's DDoS protection
4. Implement rate limiting for API routes
5. Use Vercel's Web Application Firewall (Pro plan)

## Performance Optimization

1. **Edge Functions** - Use for low-latency requirements
2. **ISR** - Incremental Static Regeneration for dashboards
3. **Image Optimization** - Use next/image for automatic optimization
4. **Caching** - Configure appropriate cache headers

## Useful Commands

```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Set environment variable
vercel env add VARIABLE_NAME

# Rollback deployment
vercel rollback

# Promote to production
vercel promote [deployment-url]
```

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)