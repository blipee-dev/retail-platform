# GitHub Workflows

This directory contains GitHub Actions workflows for CI/CD and automation.

## Active Workflows

### ci.yml
- **Purpose**: Continuous Integration
- **Triggers**: Pull requests to main, develop, staging branches
- **Actions**: 
  - Runs tests
  - Checks code quality
  - Validates build

### deploy.yml
- **Purpose**: Automated deployment to Vercel
- **Triggers**: Push to main, develop, staging branches
- **Actions**:
  - Deploys to corresponding Vercel environment
  - Updates deployment status

### collect-sensor-data.yml
- **Purpose**: Automated sensor data collection
- **Schedule**: Every 30 minutes
- **Actions**:
  - Fetches data from all active sensors
  - Handles timezone conversion properly
  - Stores data in Supabase

## Environment Variables

All workflows use GitHub Secrets for sensitive data:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Manual Triggers

Some workflows support manual triggering via `workflow_dispatch`.
You can trigger them from the Actions tab in GitHub.