# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants (like Claude) working on the Retail Platform project.

## Project Overview

**Retail Platform** is a comprehensive retail analytics system that integrates with people counting sensors (primarily Milesight) to provide real-time analytics, heatmaps, and customer flow insights for retail environments.

## Current Project State (Last Updated: 2025-07-21)

### ✅ Completed
- Basic connector system for Milesight sensors
- Test suite for connectors
- Heatmap visualization capabilities
- Customer pathway analysis
- Frontend mockups and dashboards
- Major repository reorganization (2025-07-20)
- Multi-environment deployment setup (2025-07-20)
- Next.js 14 application structure with App Router
- Vercel deployment with automatic branch deployments
- Environment-specific configurations
- CI/CD pipeline with GitHub Actions
- Internationalization (i18n) with support for EN/PT/ES (European Portuguese)
- Authentication system with 6-tier RBAC (tenant_admin, regional_manager, store_manager, analyst, store_staff, viewer)
- Multi-tenant Row Level Security (RLS) policies
- Server-side API architecture for secure database access
- All static pages converted to Next.js with full i18n support
- Database schema with organizations, stores, regions, and sensor tables
- Test user creation and authentication flow verification
- API endpoints for sensor data ingestion (2025-07-21)
- Python connector integration with Next.js API (2025-07-21)
- Comprehensive sensor management and analytics APIs
- Python bridge script for continuous data collection
- Migration cleanup - removed duplicate/unsuccessful migrations

### 🚧 In Progress
- Real-time data pipeline implementation (WebSocket/polling)
- Live data visualization in dashboards
- Heat map implementation
- Custom domain configuration

## Project Structure

```
retail-platform/
├── src/                    # Source code
│   ├── auth/              # Authentication modules
│   ├── connector_system/  # Core sensor connectors (CRITICAL)
│   ├── integrations/      # External integrations (Telegram bot)
│   ├── servers/           # Server implementations
│   └── utils/             # Utility modules (config, data collection)
├── tests/                 # Test suite
│   ├── api/              # API tests
│   ├── connectors/       # Connector tests (most test coverage here)
│   ├── integration/      # Integration tests
│   └── unit/             # Unit tests
├── scripts/              # Utility scripts
│   ├── analysis/         # Data analysis scripts
│   ├── demos/            # Demo scripts
│   └── archive/          # Old logs and scripts
├── frontend/             # Web interface
│   ├── pages/            # Organized by page type
│   ├── assets/           # CSS and JS files
│   └── archive/          # Old templates
├── config/               # Configuration files
│   ├── sensors/          # Sensor configs (Milesight, Omnia)
│   ├── examples/         # Example configurations
│   └── analytics/        # Analytics configurations
├── docs/                 # All documentation
└── assets/               # Images and visualizations
```

## Key Technologies

- **Backend**: Python 3.x, Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Deployment**: Vercel (automatic deployments)
- **Sensors**: Milesight API integration (primary), Omnia (secondary)
- **Frontend**: Next.js 14, React, TypeScript
- **Testing**: pytest (Python), Jest (JavaScript)
- **Data Processing**: pandas, numpy
- **Visualization**: matplotlib, seaborn
- **CI/CD**: GitHub Actions, Vercel

## Important Files to Know

1. **`src/connector_system/base_connector.py`** - Abstract base class for all connectors
2. **`src/connector_system/milesight_connector.py`** - Main Milesight integration
3. **`config/sensors/milesight_*.json`** - Sensor configuration files
4. **`tests/connectors/test_milesight_connector.py`** - Main test coverage
5. **`.env.example`** - Environment variables template

## Common Tasks

### Running Tests
```bash
python -m pytest tests/
```

### Testing a Connector
```bash
python tests/connectors/test_connector.py
```

### Running Analysis Scripts
```bash
python scripts/analysis/comprehensive_analysis.py
```

## Current Issues & Priorities

1. **Browser Networking in Codespaces**: Direct Supabase database queries timeout in browser environment. Implemented server-side API pattern as workaround.
2. **Real-time Data**: Need to implement WebSocket or polling for real-time updates
3. **Sensor Integration**: Python connectors need to be connected to Next.js API endpoints
4. **Production Deployment**: Ready for production deployment to main branch

## Code Style Guidelines

- Use type hints for all functions
- Follow PEP 8
- Add docstrings to all classes and functions
- Prefer configuration files over hardcoded values
- All new features need corresponding tests

## Testing Guidelines

- Write tests for all new connectors
- Use mock data for API testing (see test files for examples)
- Integration tests should use the mock HTTP server pattern
- Keep test files organized by type

## Environment Setup

1. Copy `.env.example` to `.env`
2. Configure Milesight credentials
3. Install dependencies: `pip install -r requirements.txt` (if exists)
4. Run tests to verify setup

## Useful Commands

```bash
# Lint and typecheck (when implemented)
npm run lint
npm run typecheck

# Run specific test file
python -m pytest tests/connectors/test_milesight_connector.py -v

# Run analysis
python scripts/analysis/analyze_customer_pathways.py
```

## Architecture Notes

- The system is designed to be modular with pluggable connectors
- Each sensor type has its own connector inheriting from BaseConnector
- Configuration is JSON-based for easy modification
- Frontend and backend are currently separate (not fully integrated)

## Recent Changes

### 2025-07-21
- Completed authentication system implementation with 6-tier RBAC
- Implemented comprehensive Row Level Security (RLS) policies
- Fixed browser networking issues in Codespaces with server-side API pattern
- Converted all remaining static pages to Next.js with i18n
- Created test authentication flow and verified functionality
- Fixed hydration errors and European Portuguese translations
- Implemented comprehensive sensor data ingestion API endpoints
- Created Python-to-API bridge for connecting Milesight sensors
- Added sensor management endpoints (CRUD operations)
- Built analytics API with hourly/daily/comparison views
- Cleaned up duplicate/unsuccessful migration files
- Fixed Vercel build errors with force-dynamic exports

### 2025-07-20

- Reorganized entire repository structure
- Created logical folder hierarchy
- Updated all import paths
- Consolidated documentation into single docs/ folder
- Archived old/unused files
- Set up multi-environment deployment:
  - Staging: https://retail-platform-git-staging-blipee.vercel.app
  - Development: https://retail-platform-git-develop-blipee.vercel.app
  - Production: Ready for deployment to main branch
- Created Next.js 14 app structure with environment awareness
- Configured Supabase database integration
- Set up GitHub Actions for CI/CD

## Deployment Information

### Environments
- **Production**: Deploy to main branch → https://retail-platform-blipee.vercel.app
- **Staging**: Deploy to staging branch → https://retail-platform-git-staging-blipee.vercel.app  
- **Development**: Deploy to develop branch → https://retail-platform-git-develop-blipee.vercel.app

### Environment Variables
- Use `scripts/env-manager.sh` to manage Vercel environment variables
- Environment files: `.env.development`, `.env.staging`, `.env.production`
- Supabase credentials are configured in all environments

### Deployment Commands
```bash
# Push environment variables to Vercel
./scripts/env-manager.sh push staging
./scripts/env-manager.sh push production

# Deploy to specific environment
git push origin staging  # Auto-deploys to staging
git push origin develop  # Auto-deploys to development
git push origin main     # Auto-deploys to production
```

## Internationalization (i18n) Guidelines

### Supported Languages
- **English (en)** - Default language
- **Portuguese (pt)** - European Portuguese  
- **Spanish (es)** - Latin American Spanish

### Implementation Requirements
1. **All new pages and components must include translations**
2. **Use the useTranslation hook in client components**
3. **Browser language is auto-detected, with cookie persistence**
4. **Language switcher must be available on all public pages**

### Quick i18n Implementation
```typescript
// Client Component
import { useTranslation } from '@/app/i18n/client'

export default function MyComponent() {
  const { t } = useTranslation('common')
  return <h1>{t('title')}</h1>
}
```

### Translation File Structure
```
app/i18n/locales/
├── en/
│   ├── common.json    # Shared UI elements
│   ├── auth.json      # Authentication pages
│   └── dashboard.json # Dashboard content
├── pt/                # Portuguese translations
└── es/                # Spanish translations
```

## Contact & Support

- Check `docs/ROADMAP.md` for development priorities
- See `docs/CHANGELOG.md` for recent changes
- Review `docs/api/` for API documentation
- See `docs/implementation/i18n-guidelines.md` for detailed i18n documentation

---

**Note for AI Assistants**: When working on this project, prioritize maintaining the existing structure and patterns. Always run tests after making changes. The connector system is the core of the application - handle with care. **All user-facing pages must support internationalization.**