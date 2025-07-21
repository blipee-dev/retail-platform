# Changelog

All notable changes to the Retail Platform project will be documented in this file.

## [Unreleased] - 2025-07-21

### Added
- Complete authentication system with 6-tier RBAC (tenant_admin, regional_manager, store_manager, analyst, store_staff, viewer)
- Multi-tenant Row Level Security (RLS) policies for all database tables
- Server-side API architecture for secure database access
- Authentication middleware with JWT validation and role-based access control
- Test authentication page for verifying auth flow
- All static HTML pages converted to Next.js with full internationalization support:
  - About page
  - Contact page
  - Blog page
  - Documentation page
  - Integrations page
  - Compliance page
  - Security page
  - Privacy and Terms pages
- European Portuguese translations (corrected from Brazilian Portuguese)
- Comprehensive database schema documentation
- API authorization middleware for secure endpoints

### Changed
- Updated Portuguese translations from Brazilian to European Portuguese
- Modified AuthProvider to use simplified profile loading to bypass Codespaces networking issues
- Enhanced documentation with current project state and authentication details
- Updated README.md with authentication and deployment information

### Fixed
- Hydration errors in i18n implementation
- Browser networking timeouts in Codespaces environment for Supabase queries
- RLS infinite recursion issues with proper policy implementation
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