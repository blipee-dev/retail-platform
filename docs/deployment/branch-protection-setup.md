# Branch Protection & Vercel Setup Guide

## 🔒 GitHub Branch Protection Rules

### 1. Protect Main Branch (Production)

Go to **Settings → Branches → Add rule** for `main`:

- ✅ Require a pull request before merging
  - ✅ Require approvals (1-2)
  - ✅ Dismiss stale pull request approvals
  - ✅ Require review from CODEOWNERS
- ✅ Require status checks to pass
  - ✅ Require branches to be up to date
  - Add status checks: `vercel`, `build`, `test`
- ✅ Require conversation resolution
- ✅ Include administrators
- ❌ Allow force pushes (keep disabled)

### 2. Protect Staging Branch

Add rule for `staging`:

- ✅ Require a pull request before merging
  - ✅ Require approvals (1)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date

### 3. Develop Branch (Optional Protection)

For `develop` branch, you can be more lenient:

- ✅ Require pull request reviews (optional)
- ✅ Require status checks to pass

## 🚀 Vercel Configuration

### 1. Connect Branches to Environments

In Vercel Dashboard:

1. Go to **Project Settings → Git**
2. Configure Production Branch: `main`
3. Configure Preview Branches: `staging`, `develop`

### 2. Environment Variables Setup

Go to **Project Settings → Environment Variables**:

#### Production Variables
Select: [x] Production

```
NEXT_PUBLIC_APP_URL=https://retail-platform.vercel.app
NEXT_PUBLIC_ENVIRONMENT=production
NODE_ENV=production
```

#### Staging Variables
Select: [x] Preview (staging branch)

```
NEXT_PUBLIC_APP_URL=https://retail-platform-staging.vercel.app
NEXT_PUBLIC_ENVIRONMENT=staging
NODE_ENV=staging
```

#### Development Variables
Select: [x] Preview (develop branch)

```
NEXT_PUBLIC_APP_URL=https://retail-platform-development.vercel.app
NEXT_PUBLIC_ENVIRONMENT=development
NODE_ENV=development
```

### 3. Domain Configuration

1. **Production**: `retail-platform.vercel.app` (or custom domain)
2. **Staging**: `retail-platform-staging.vercel.app`
3. **Development**: `retail-platform-development.vercel.app`

To add custom domains:
- Go to **Project Settings → Domains**
- Add domain and configure DNS

## 📝 Quick Setup Commands

```bash
# 1. Set up Vercel project (if not done)
vercel

# 2. Link to existing project
vercel link

# 3. Set environment variables for each environment
./scripts/env-manager.sh push production
./scripts/env-manager.sh push staging
./scripts/env-manager.sh push development

# 4. Deploy to each environment
./scripts/deploy-env.sh production
./scripts/deploy-env.sh staging
./scripts/deploy-env.sh development
```

## 🔄 Workflow Example

```bash
# 1. Create feature branch
git checkout develop
git checkout -b feature/new-feature

# 2. Make changes and commit
git add .
git commit -m "feat: add new feature"

# 3. Push and create PR to develop
git push origin feature/new-feature
# Create PR on GitHub

# 4. After merge to develop, test in development environment
# Automatic deployment happens

# 5. Promote to staging
git checkout staging
git merge develop
git push origin staging
# Automatic deployment to staging

# 6. After testing, promote to production
git checkout main
git merge staging
git push origin main
# Automatic deployment to production
```

## ⚙️ GitHub Actions Integration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
      
      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=${{ github.ref_name }} --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      
      - name: Deploy to Vercel
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}
```

## 🔐 Required Secrets

Add to GitHub Secrets:
- `VERCEL_TOKEN` - Get from Vercel Dashboard → Account Settings → Tokens
- `VERCEL_ORG_ID` - From `.vercel/project.json`
- `VERCEL_PROJECT_ID` - From `.vercel/project.json`

## 📊 Monitoring Deployments

1. **Vercel Dashboard**: View all deployments and logs
2. **GitHub Actions**: See CI/CD pipeline status
3. **Deployment URLs**: Each PR gets a unique preview URL

## 🚨 Rollback Procedure

If something goes wrong:

```bash
# Option 1: Rollback via Vercel CLI
vercel rollback

# Option 2: Rollback via Git
git checkout main
git revert HEAD
git push origin main

# Option 3: Rollback via Vercel Dashboard
# Go to Deployments → Select previous deployment → Promote to Production
```