# Environment Setup Checklist

## ✅ Completed Automatically

- [x] Created `develop` and `staging` branches
- [x] Pushed branches to GitHub
- [x] Created environment configuration files (.env.development, .env.staging, .env.production)
- [x] Created deployment scripts
- [x] Created GitHub Actions workflow
- [x] Updated vercel.json for multi-environment support
- [x] Created comprehensive documentation

## 📋 Manual Steps Required

### 1. Vercel Setup

1. [ ] **Login to Vercel CLI**
   ```bash
   vercel login
   ```

2. [ ] **Link Project**
   ```bash
   vercel link
   ```
   - Choose your Vercel account
   - Link to existing project or create new one

3. [ ] **Get Vercel IDs** (for GitHub Actions)
   ```bash
   cat .vercel/project.json
   ```
   Note down:
   - `orgId` → VERCEL_ORG_ID
   - `projectId` → VERCEL_PROJECT_ID

### 2. GitHub Configuration

1. [ ] **Add GitHub Secrets**
   Go to Settings → Secrets → Actions and add:
   - `VERCEL_TOKEN` (get from https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` (from step above)
   - `VERCEL_PROJECT_ID` (from step above)

2. [ ] **Set Branch Protection Rules**
   Go to Settings → Branches:
   - Protect `main` branch (require PR, reviews, status checks)
   - Protect `staging` branch (require PR)
   - Optionally protect `develop`

### 3. Vercel Dashboard Configuration

1. [ ] **Set Production Branch**
   - Go to Project Settings → Git
   - Set Production Branch: `main`

2. [ ] **Configure Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env` file
   - Set appropriate environments for each variable

3. [ ] **Configure Domains** (optional)
   - Production: `retail-platform.vercel.app`
   - Staging: `retail-platform-staging.vercel.app`
   - Development: `retail-platform-development.vercel.app`

### 4. Test Deployments

1. [ ] **Deploy to Development**
   ```bash
   git checkout develop
   ./scripts/deploy-env.sh development
   ```

2. [ ] **Deploy to Staging**
   ```bash
   git checkout staging
   ./scripts/deploy-env.sh staging
   ```

3. [ ] **Deploy to Production**
   ```bash
   git checkout main
   ./scripts/deploy-env.sh production
   ```

## 🚀 Quick Commands

```bash
# View setup guide
./scripts/vercel-setup.sh

# Deploy to specific environment
./scripts/deploy-env.sh [development|staging|production]

# Manage environment variables
./scripts/env-manager.sh [push|pull|list|sync] [environment]

# Check branch status
git branch -a
```

## 📚 Documentation

- [Environment Management Guide](docs/deployment/environment-management.md)
- [Vercel Deployment Guide](docs/deployment/vercel.md)
- [Branch Protection Setup](docs/deployment/branch-protection-setup.md)

## 🔄 Workflow Reminder

1. Feature development → `develop` branch
2. Testing → `staging` branch
3. Production → `main` branch

Each push to these branches triggers automatic deployment!