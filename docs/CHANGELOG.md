# Changelog

All notable changes to the Retail Platform project will be documented in this file.

## [0.2.0] - 2025-07-21

### Added
- Complete authentication system with 6-tier RBAC (tenant_admin, regional_manager, store_manager, analyst, store_staff, viewer)
- Multi-tenant Row Level Security (RLS) policies for all database tables
- Server-side API architecture for secure database access
- Comprehensive API endpoints for sensor data ingestion:
  - `/api/sensors` - CRUD operations for sensor management
  - `/api/sensors/data` - Data ingestion and queries
  - `/api/sensors/bulk-ingest` - Bulk data ingestion from Python connectors
  - `/api/sensors/status` - Real-time sensor health monitoring
  - `/api/analytics` - Pre-calculated analytics (hourly, daily, comparison)
- Python-to-API bridge script (`sensor_data_bridge.py`) for continuous data collection
- Systemd service configuration for Linux deployment
- Complete internationalization (i18n) support for EN/PT/ES
- All static pages converted to Next.js with i18n support
- Force-dynamic exports to fix Vercel build issues
- Mock Supabase client for build-time compatibility
- Comprehensive sensor integration documentation

### Changed
- Updated authentication to use server-side API pattern to work around Codespaces browser networking limitations
- Migrated all HTML mockup pages to Next.js components
- Improved environment variable handling for Vercel deployments
- Enhanced TypeScript type safety in translation components

### Fixed
- Browser networking timeouts in Codespaces by implementing server-side API routes
- Vercel build errors with missing environment variables
- TypeScript errors in translation array/object handling
- Hydration mismatches in i18n implementation
- European Portuguese translation formatting issues

### Removed
- Duplicate/unsuccessful migration files (combined_migrations.sql, safe_migrations.sql, fix-rls-policies.sql, fix-rls-final.sql)
- Authentication flow hanging on getSession() calls
- Cookie provider warnings in Next.js
- Favicon loading errors

### Technical Details
- Implemented workaround for Codespaces browser networking limitations
- Created server-side API pattern for database access
- Fixed RLS policies using public schema functions
- Proper JWT authentication in API routes
- Organization-scoped data access patterns

## [0.1.0-alpha] - 2025-07-20

### Added
- Major repository reorganization
- Next.js 14 application structure with App Router
- Multi-environment deployment setup (development, staging, production)
- Vercel deployment configuration with automatic branch deployments
- GitHub Actions CI/CD pipeline
- Internationalization (i18n) support for EN/PT/ES
- Authentication pages (signin, signup)
- Supabase database integration
- Environment-specific configuration files

### Changed
- Reorganized entire repository structure into logical folders
- Updated all Python import paths to use `src.connector_system` format
- Consolidated documentation into single docs/ folder
- Archived old and unused files

### Technical Details
- Set up deployment URLs for all environments
- Configured Supabase credentials for all environments
- Created environment manager script for Vercel deployments