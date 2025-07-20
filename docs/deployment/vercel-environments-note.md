# Important: Vercel Environment Names

## Vercel's Environment Model

Vercel uses a simplified environment model with only 3 environments:

1. **`production`** - The main production deployment
2. **`preview`** - All preview deployments (includes staging, development, and PR previews)
3. **`development`** - Local development only (not used for deployments)

## How We Map Our Environments

| Our Environment | Vercel Environment | Branch | URL |
|-----------------|-------------------|--------|-----|
| Production | `production` | main | retail-platform.vercel.app |
| Staging | `preview` | staging | retail-platform-git-staging-*.vercel.app |
| Development | `preview` | develop | retail-platform-git-develop-*.vercel.app |

## Setting Environment-Specific Variables

Since both staging and development use Vercel's `preview` environment, we need to differentiate them using:

1. **Branch-specific deployments** - Each branch gets its own URL
2. **Environment variable `NEXT_PUBLIC_ENVIRONMENT`** - Set to "staging" or "development"
3. **Branch detection in code** - Use Git branch or deployment URL to determine environment

## Example: Environment Detection in Code

```typescript
// utils/environment.ts
export function getEnvironment() {
  // Check explicit environment variable first
  if (process.env.NEXT_PUBLIC_ENVIRONMENT) {
    return process.env.NEXT_PUBLIC_ENVIRONMENT;
  }
  
  // Fallback to URL-based detection
  const url = process.env.NEXT_PUBLIC_VERCEL_URL || '';
  
  if (url.includes('-git-staging-')) {
    return 'staging';
  } else if (url.includes('-git-develop-')) {
    return 'development';
  } else if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  return 'development';
}
```

## Setting Variables for Specific Branches

Unfortunately, Vercel doesn't support branch-specific environment variables through the CLI. You need to:

1. **Use the Vercel Dashboard**:
   - Go to Project Settings → Environment Variables
   - When adding a variable, you can specify which Git branches it applies to

2. **Or use different variable names**:
   ```bash
   # Instead of one APP_URL, use:
   NEXT_PUBLIC_APP_URL_PRODUCTION
   NEXT_PUBLIC_APP_URL_STAGING
   NEXT_PUBLIC_APP_URL_DEVELOPMENT
   ```

## Workaround for Branch-Specific Config

Create a configuration helper that selects the right values:

```typescript
// config/index.ts
const branch = process.env.VERCEL_GIT_COMMIT_REF || 'main';

const config = {
  production: {
    appUrl: 'https://retail-platform.vercel.app',
    environment: 'production'
  },
  staging: {
    appUrl: 'https://retail-platform-staging.vercel.app',
    environment: 'staging'
  },
  develop: {
    appUrl: 'https://retail-platform-development.vercel.app',
    environment: 'development'
  }
};

export const appConfig = config[branch] || config.production;
```

## Best Practices

1. **Use the Dashboard for complex setups** - It provides more granular control
2. **Keep secrets in production only** - Don't expose sensitive data in preview environments
3. **Use environment detection** - Always have fallbacks for environment detection
4. **Document your setup** - Make it clear which variables are needed for each environment