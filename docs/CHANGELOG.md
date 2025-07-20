# Changelog

All notable changes to blipee OS Retail Intelligence will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with Next.js 14 and Supabase
- Multi-tenant architecture with Row Level Security
- Authentication system with email and OAuth support
- Documentation structure for enterprise-grade platform
- CI/CD pipeline with GitHub Actions and Vercel
- Cloud-first development environment with GitHub Codespaces
- Complete branding update to blipee OS Retail Intelligence
- Zero local installation development workflow

### Changed
- Updated all documentation with blipee branding
- Reorganized repository structure for cleaner root directory
- Updated deployment strategy to cloud-only approach
- **Major repository reorganization (2025-07-20)**:
  - Created organized folder structure: `src/`, `tests/`, `scripts/`, `frontend/`, `config/`, `assets/`
  - Moved all source files to appropriate subdirectories
  - Organized `src/` with modules: `auth/`, `connector_system/`, `integrations/`, `servers/`, `utils/`
  - Organized `tests/` by type: `unit/`, `integration/`, `connectors/`, `api/`
  - Organized `scripts/` with `analysis/`, `demos/`, and `archive/` for old files
  - Organized `frontend/` with `pages/` (auth, dashboards, settings, static) and `assets/` (css, js)
  - Organized `config/` with `sensors/`, `examples/`, `analytics/`
  - Consolidated all documentation into single `docs/` folder with proper subfolder structure
  - Updated all Python import paths to reflect new structure
  - Created comprehensive `.env.example` file
- **GitHub Codespaces configuration (2025-07-20)**:
  - Created `.devcontainer/devcontainer.json` with Python and Node.js setup
  - Added comprehensive VS Code extensions for Python development
  - Created post-create script for automatic environment setup
  - Configured ports for various development servers
  - Added development container documentation
- **Supabase integration (2025-07-20)**:
  - Added Supabase credentials to environment configuration
  - Updated `.env.example` with all Supabase environment variables
  - Configured database connection for both pooled and non-pooled connections
- **Vercel deployment configuration (2025-07-20)**:
  - Created `vercel.json` for Next.js deployment
  - Configured environment variables mapping
  - Added security headers and caching rules
  - Created comprehensive Vercel deployment documentation
  - Set up API routes structure for serverless functions
- **Multi-environment deployment setup (2025-07-20)**:
  - Created staging and develop branches with automatic deployments
  - Configured environment-specific variables (.env.development, .env.staging, .env.production)
  - Set up branch protection and deployment workflows
  - Created deployment scripts: `env-manager.sh`, `deploy.sh`, `configure-domains.sh`
  - Implemented GitHub Actions for CI/CD
  - Successfully deployed to Vercel with branch-based previews
  - Staging URL: https://retail-platform-git-staging-blipee.vercel.app
  - Development URL: https://retail-platform-git-develop-blipee.vercel.app
- **Next.js application structure (2025-07-20)**:
  - Created basic Next.js app with App Router
  - Added environment-aware pages showing deployment status
  - Fixed Vercel build errors by creating proper app structure
  - Successfully handled GitHub secret scanning for Stripe test keys

### Security
- Implemented Row Level Security for all database tables
- Added audit logging system
- Configured secure environment variable handling
- Handled GitHub secret scanning alerts for test API keys

## Version Guidelines

### Version Format: MAJOR.MINOR.PATCH

- **MAJOR**: Incompatible API changes or architectural shifts
- **MINOR**: New functionality in a backwards compatible manner
- **PATCH**: Backwards compatible bug fixes

### Pre-release versions
- Alpha: `0.x.x-alpha.n` - Early development, unstable
- Beta: `0.x.x-beta.n` - Feature complete, testing phase
- RC: `0.x.x-rc.n` - Release candidate, production ready

### Branch Strategy
- `main` - Production releases only
- `staging` - Pre-production testing
- `develop` - Active development
- `feature/*` - New features
- `hotfix/*` - Emergency fixes

## [0.1.0-alpha.1] - 2025-07-16

### Added
- Project initialization
- Core folder structure
- Enterprise documentation framework
- Technology stack decisions:
  - Frontend: Next.js 14 with App Router
  - Backend: Supabase (PostgreSQL + Auth)
  - Hosting: Vercel
  - Real-time: Supabase Realtime
  - AI: OpenAI API integration

### Documentation
- README.md with comprehensive project overview
- CHANGELOG.md with versioning guidelines
- Documentation folder structure for all aspects

### Infrastructure
- Cloud-first architecture design
- No local installation requirements
- GitHub Codespaces / Gitpod support

---

## Release Process

### 1. Version Bump
```bash
# Update version in package.json
npm version [major|minor|patch|prerelease]
```

### 2. Update Changelog
- Document all changes under "Unreleased"
- Move to new version section on release
- Include migration notes if needed

### 3. Create Release
```bash
# Create git tag
git tag -a v0.1.0 -m "Release version 0.1.0"

# Push to GitHub
git push origin v0.1.0
```

### 4. Deploy
- Merge to `staging` for testing
- After validation, merge to `main`
- Vercel auto-deploys to production

### 5. Post-Release
- Create GitHub Release with changelog
- Update documentation if needed
- Notify stakeholders

## Migration Notes

### From 0.x to 1.0
- Database schema changes will be documented here
- API breaking changes will be listed
- Migration scripts will be provided

[Unreleased]: https://github.com/blipee/os-retail-intelligence/compare/v0.1.0-alpha.1...HEAD
[0.1.0-alpha.1]: https://github.com/blipee/os-retail-intelligence/releases/tag/v0.1.0-alpha.1