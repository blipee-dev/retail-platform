# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants (like Claude) working on the blipee OS Retail Intelligence project.

## Project Overview

**blipee OS Retail Intelligence** is a comprehensive enterprise-grade retail analytics platform that integrates with people counting sensors to provide real-time analytics, heatmaps, and customer flow insights for retail environments. The platform supports global deployments with automatic timezone handling, multi-language support, and AI-powered insights.

## Current Project State (Last Updated: 2025-07-26)

### ✅ Completed Features
- **Core Platform**: Next.js 14 with App Router, TypeScript, Supabase
- **Authentication**: 6-tier RBAC with Row Level Security (RLS)
- **Multi-tenant**: Complete data isolation per organization
- **Internationalization**: EN/PT/ES with auto-detection
- **Sensor Integration**: Milesight and Omnia sensor support
- **API Architecture**: RESTful API for all operations
- **Timezone Support**: Global timezone detection and conversion (2025-07-22)
- **Data Collection**: Automated 30-minute collection via GitHub Actions
- **Frontend Components**: Date formatting with timezone indicators
- **Project Organization**: Clean structure with organized scripts (2025-07-22)
- **Documentation**: Enterprise-grade comprehensive guides and API docs (2025-07-26)
- **Database Optimization**: Enterprise features with 89% performance boost (2025-07-23)
- **Sensor Health Monitoring**: Real-time online/offline detection
- **Audit Trail**: Complete change tracking for compliance
- **Unified Alerts**: Consolidated alert management system
- **Analytics Aggregation**: Fixed hourly/daily pipelines with proper column mapping (2025-07-25)

### 🚧 In Progress
- WebSocket/real-time updates
- Advanced heat map visualizations
- Dashboard live data connection
- Custom domain configuration
- Mobile app development

## Clean Project Structure (Updated 2025-07-26)

```
blipee-os-retail-intelligence/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (sensors, auth, analytics)
│   ├── components/        # Reusable React components
│   ├── dashboard/         # Dashboard pages
│   ├── i18n/             # Internationalization
│   ├── lib/              # Core utilities
│   │   ├── auth/         # Auth utilities
│   │   ├── db/           # Database client
│   │   ├── migrations/   # SQL migrations
│   │   ├── services/     # Business logic
│   │   └── utils/        # Helpers (date-formatter.ts!)
│   └── providers/        # React contexts
│
├── scripts/               # Organized utility scripts
│   ├── archive/          # Historical reference
│   ├── debug/            # Debugging tools
│   │   ├── data/         # Data debugging
│   │   ├── timezone/     # Timezone testing
│   │   └── workflow/     # GitHub Actions debug
│   ├── migrations/       # Database migrations
│   │   └── rls/         # RLS SQL files
│   ├── data-collection/  # Sensor collection
│   ├── analysis/        # Data analysis
│   ├── deployment/      # Deploy scripts
│   └── utilities/       # General utilities
│
├── docs/                 # All documentation
│   ├── api/             # API reference
│   ├── architecture/    # System design
│   ├── deployment/      # Deploy guides
│   ├── guides/          # How-to guides
│   ├── implementation/  # Technical details
│   ├── maintenance/     # Housekeeping docs
│   └── setup/           # Setup guides
│
├── .github/workflows/    # GitHub Actions
│   ├── ci.yml           # Continuous Integration
│   ├── deploy.yml       # Auto-deployment
│   └── collect-sensor-data.yml  # Data collection (fixed timezones!)
│
└── [config files]       # Only essential files in root
```

## Database Schema (Updated 2025-07-23)

### Optimized Architecture: 11 Tables (from 34)

**Core Tables (4)**
- `organizations` - Multi-tenant foundation
- `stores` - Physical locations with timezone support
- `sensor_metadata` - Sensor configuration and health monitoring
- `user_profiles` - User management with RBAC

**Data Collection Tables (2)**
- `people_counting_raw` - Source of truth for traffic data
- `regional_counting_raw` - Zone occupancy data

**Analytics Tables (2)**
- `hourly_analytics` - Pre-aggregated for dashboards
- `daily_analytics` - Daily summaries and trends

**Configuration & Monitoring (3)**
- `region_configurations` - Zone definitions
- `alerts` - Unified alerting system
- `latest_sensor_data` - Real-time status view

### Key Improvements
- **68% reduction** in table count (34 → 11)
- **89% performance improvement** in query execution
- **No duplicate data** - single source of truth
- **Sensor health monitoring** - automatic offline detection
- **Audit trail** - track all configuration changes
- **Performance optimized** - proper indexes and partitioning ready
- **Complete documentation** - enterprise-grade database schema docs

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Custom RBAC
- **Deployment**: Vercel with branch deployments
- **Data Collection**: GitHub Actions (every 30 minutes)
- **Date/Time**: date-fns-tz for timezone handling
- **Testing**: Jest, React Testing Library
- **Styling**: Tailwind CSS + Shadcn/ui

## Recent Major Changes

### 2025-07-26 - Enterprise Documentation Overhaul
- **Complete documentation update**
  - Updated all docs to use "blipee OS Retail Intelligence" branding
  - Created comprehensive database schema documentation
  - Fixed all outdated API references and table names
  - Added enterprise-grade deployment guide
  - Created CONTRIBUTING.md for community contributions
- **Fixed documentation inconsistencies**
  - Corrected all deployment URLs
  - Updated API endpoints to match implementation
  - Removed references to unimplemented features
  - Added missing setup guides references

### 2025-07-25 - Analytics Aggregation Pipeline Fixed
- **Fixed hourly and daily aggregation**
  - Removed hardcoded API keys from aggregation scripts
  - Added proper error logging and debugging
  - Fixed column name mismatches in daily_analytics table
  - Added start_time and end_time fields to aggregations
- **Integrated daily aggregation into main pipeline**
  - Daily aggregation now runs automatically during midnight window (00:00-02:59 UTC)
  - Uses `run_daily_aggregation_fixed.js` with all correct column mappings
  - No need for separate manual workflow triggers
- **Created comprehensive debugging tools**
  - Data verification scripts
  - Column listing utilities  
  - Delete scripts for testing fresh aggregations
- **Organized project structure**
  - Moved 50+ scripts into logical subdirectories
  - Created proper documentation for script organization

### 2025-07-23 - Database Optimization & Enterprise Features
- **Implemented enterprise-grade monitoring**
  - Added audit trail system for compliance tracking
  - Real-time sensor health monitoring with offline detection
  - Unified alerts table consolidating 3 separate systems
- **Performance optimization**
  - Added strategic indexes reducing query time by 89%
  - Fixed all NULL sensor_id relationships
  - Optimized data aggregation queries
- **Updated 8 API endpoints**
  - Removed references to deprecated tables
  - Maintained full backward compatibility
  - Created comprehensive backup system
- **Documentation**
  - Created DATABASE_OPTIMIZATION_2025_07_23.md
  - Updated all migration scripts
  - Added verification and testing tools

### 2025-07-23 - GitHub Actions Workflow Modernization
- **Security improvements**
  - Removed all hardcoded credentials from workflows
  - Migrated to GitHub Secrets for authentication
  - Created centralized configuration management
- **Architecture overhaul**
  - Implemented single-cron pipeline controller pattern
  - Created reusable workflow templates
  - Event-driven orchestration replacing timing-based coordination
- **Performance enhancements**
  - Added parallel sensor collection (5x performance improvement)
  - Implemented retry logic with exponential backoff
  - Batch processing for efficient resource usage
- **Reliability features**
  - Sensor health monitoring integration
  - Automatic alert creation on failures
  - Comprehensive error handling and recovery
- **Created modular script structure**
  - Extracted 400+ lines of inline JavaScript to organized modules
  - Created reusable libraries for common operations
  - Standardized error handling and logging

### 2025-07-22 - Timezone Support & Project Cleanup
- **Fixed timezone handling** in sensor data collection workflow
  - Proper timezone detection for sensors globally
  - Filters based on sensor local time (not UTC)
  - Correct UTC conversion for database storage
- **Added date formatting utility** (`app/lib/utils/date-formatter.ts`)
  - Centralized timezone-aware formatting
  - Shows timezone indicators (WEST, BST, CEST, etc.)
  - Store-specific timezone support
- **Major project cleanup**
  - Organized 58 scripts into logical subdirectories
  - Moved 20+ files from root to appropriate locations
  - Updated .gitignore with Python patterns
  - Created documentation for all major directories

### 2025-07-21 - API Implementation
- Comprehensive sensor data ingestion endpoints
- Python-to-API bridge for Milesight integration
- Analytics API with hourly/daily views
- Fixed browser networking in Codespaces

### 2025-07-20 - Major Reorganization
- Complete repository restructure
- Multi-environment deployment setup
- Supabase integration
- GitHub Actions CI/CD

## Important Files

### Configuration
- `.env.example` - Environment template
- `vercel.json` - Deployment config
- `middleware.ts` - Auth middleware
- `LICENSE` - MIT License
- `CONTRIBUTING.md` - Contribution guidelines

### Core Components
- `app/lib/utils/date-formatter.ts` - Timezone formatting
- `app/providers/auth-provider.tsx` - Auth context
- `app/lib/services/analytics.service.ts` - Analytics logic

### Workflows
- `.github/workflows/main-pipeline.yml` - Single-cron orchestrator
- `.github/workflows/collect-sensor-data-v2.yml` - Modular sensor collection
- `.github/workflows/run-analytics-aggregation-v2.yml` - Hourly + Daily aggregation
- `.github/workflows/run-daily-aggregation.yml` - Standalone daily aggregation
- `.github/workflows/deploy.yml` - Auto-deployment
- `.github/workflows/ci.yml` - Testing

### Scripts
- `scripts/workflows/` - Modular workflow scripts
  - `collect-sensor-data.js` - Main collection logic
  - `lib/supabase-client.js` - Database operations
  - `lib/retry-handler.js` - Retry logic
  - `lib/sensor-client.js` - Sensor communication
- `scripts/run_hourly_aggregation.js` - Hourly analytics aggregation
- `scripts/run_daily_aggregation_fixed.js` - Daily analytics with correct columns
- `scripts/debug/` - Debugging utilities
  - `verify-inserts.js` - Verify data insertions
  - `delete-all-daily-analytics.sql` - Clear daily data for testing
- `scripts/housekeeping.sh` - Organize project files
- `scripts/cleanup-root.sh` - Clean root directory

## Common Tasks

### Development
```bash
# Start development
npm run dev

# Run tests
npm run test
npm run lint
npm run typecheck

# Run housekeeping
./scripts/housekeeping.sh
```

### Database
```bash
# Run migrations (in Supabase SQL editor)
# See app/lib/migrations/ for SQL files
```

### Deployment
```bash
# Deploy to staging
git push origin staging

# Deploy to production
git push origin main
```

## Timezone Handling

The platform now properly handles timezones globally:

1. **Detection**: Automatically detects sensor timezone offset
2. **Storage**: All timestamps stored in UTC
3. **Display**: Shows times with timezone indicators
4. **Conversion**: Uses `date-fns-tz` for accurate conversion

Example usage:
```typescript
import { formatTableDate } from '@/app/lib/utils/date-formatter'

// Shows: "2025-07-22 14:30:00 WEST"
const formatted = formatTableDate(timestamp, 'Europe/Lisbon')
```

## Code Guidelines

### TypeScript
- Use strict typing
- Define interfaces for all data structures
- Avoid `any` type

### React
- Functional components with hooks
- Use Context for global state
- Implement error boundaries

### API Design
- RESTful endpoints
- Consistent error responses
- Rate limiting on all endpoints

### Testing
- Unit tests for utilities
- Integration tests for API
- E2E tests for critical flows

## Current Priorities

1. **Dashboard Integration**: Connect live data to UI components
2. **Real-time**: Implement WebSocket updates
3. **Performance**: Optimize data queries
4. **Mobile**: Responsive improvements
5. **Analytics**: Advanced visualizations

## Deployment

### Environments
- **Production**: `main` → https://retail-platform.vercel.app
- **Staging**: `staging` → https://retail-platform-git-staging.vercel.app
- **Development**: `develop` → https://retail-platform-git-develop.vercel.app

### Environment Variables
Required in all environments:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Tips for AI Assistants

1. **Always use "blipee OS Retail Intelligence"** as the project name
2. **Check timezone handling** when working with timestamps
3. **Use the organized script directories** - don't create files in root
4. **Follow the established patterns** - check similar files first
5. **Test with multiple timezones** when working on time-related features
6. **Update documentation** when making significant changes
7. **Use correct table names** - people_counting_raw, not people_counting_data
8. **Reference actual URLs** - retail-platform.vercel.app, not placeholder domains

---

**Remember**: 
- The platform must work globally. Always consider timezone implications.
- All user-facing content must support i18n (EN/PT/ES).
- This is an enterprise-grade platform - maintain professional documentation.
- The project name is **blipee OS Retail Intelligence**, not "Retail Platform".

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.