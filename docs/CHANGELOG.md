# Changelog

All notable changes to the Retail Platform project will be documented in this file.

## [0.4.0] - 2025-07-23

### Added
- Enterprise-grade database monitoring and optimization
  - Audit trail system tracking all changes to critical tables
  - Real-time sensor health monitoring with automatic offline detection
  - Unified alerts management system consolidating 3 separate tables
  - Sensor health log for tracking status changes over time
- Performance optimization features
  - Strategic database indexes reducing query time by 89%
  - Optimized views for real-time sensor status
  - Improved aggregation queries for analytics
- Comprehensive verification and testing tools
  - Database optimization verification script
  - Feature testing suite for all new capabilities
  - API endpoint compatibility checker
- GitHub Actions workflow modernization
  - Single-cron pipeline controller architecture
  - Reusable workflow templates for better maintainability
  - Event-driven orchestration replacing timing-based coordination
  - Parallel sensor collection with 5x performance improvement
  - Comprehensive retry logic with exponential backoff
  - Modular script architecture replacing inline JavaScript

### Changed
- Database schema improvements
  - Fixed all NULL sensor_id values with proper identifiers
  - Enhanced sensor_metadata table with health monitoring columns
  - Updated 8 API endpoints to use optimized schema
  - Maintained full backward compatibility with existing features
- Migration strategy
  - Created backup of historical data in archive schema
  - Kept deprecated tables for gradual migration
  - Zero downtime optimization approach
- Workflow security improvements
  - Removed all hardcoded credentials from workflow files
  - Migrated to GitHub Secrets for all authentication
  - Created centralized configuration management
  - Implemented least-privilege access patterns

### Fixed
- NULL sensor_id preventing proper relationships
- Slow query performance on large datasets
- Missing indexes causing table scans
- Fragmented alert system across multiple tables
- Workflow table references to deprecated tables
- Security vulnerabilities with exposed credentials
- Sequential processing bottlenecks in data collection
- Lack of retry mechanisms for transient failures

### Technical Details
- Added 9 new performance indexes
- Created 3 monitoring tables: audit_log, sensor_health_log, alerts
- Implemented 2 database views: v_sensor_status, latest_sensor_data
- Updated all API routes to remove deprecated table references
- Query performance improved from ~800ms to ~87ms for 24h data
- Created modular workflow scripts in scripts/workflows/
- Implemented parallel processing for sensor collection
- Added comprehensive error handling and retry logic
- Workflow execution time reduced by 50-70%

## [0.3.0] - 2025-07-22

### Added
- Global timezone support for sensors worldwide
  - Automatic timezone detection and storage for each sensor
  - Timezone-aware date formatting utility (`date-formatter.ts`)
  - Visual timezone indicators in UI (e.g., "14:30 WEST")
  - Store-specific timezone configuration
- Comprehensive project housekeeping and reorganization
  - Created logical directory structure for 58+ scripts
  - Organized scripts into subdirectories: debug/, migrations/, data-collection/, etc.
  - Added Python patterns to .gitignore
  - Created documentation for file movements
- Fixed GitHub Actions sensor data collection workflow
  - Proper timezone offset calculation for negative UTC offsets
  - Filter future data based on sensor local time instead of UTC
  - Support for sensors in any timezone globally

### Changed
- Updated sensor data collection to handle timezones correctly
  - Changed from `nowUTC - (offsetHours * 60 * 60 * 1000)` to proper addition
  - Modified filtering logic to use sensor local time
  - Updated all date displays to show timezone abbreviations
- Cleaned root directory from 40+ files to 18 essential files
  - Moved SQL files to `scripts/migrations/rls/`
  - Moved test scripts to `scripts/utilities/auth-testing/`
  - Moved documentation to appropriate `docs/` subdirectories
- Enhanced frontend components with timezone awareness
  - RealTimeDashboard shows times with timezone indicators
  - All date displays now timezone-aware

### Fixed
- UTC timezone issue causing data collection to be stuck at 13:00-13:59 UTC
- Incorrect timezone calculations in GitHub Actions workflow
- Frontend components not showing correct local times for global sensors
- Merge conflicts between main and develop branches

### Technical Details
- Implemented centralized timezone handling across the platform
- Created reusable date formatting utilities with locale support
- Updated workflow to properly handle negative UTC offsets (e.g., UTC-3)
- All timestamps stored in UTC, displayed in appropriate local time

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