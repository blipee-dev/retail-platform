# Retail Platform - Project Roadmap

## Overview

This roadmap outlines the development phases for the Retail Platform, focusing on sensor integration, analytics, and visualization capabilities.

## Current State (2025-07-22)

### ✅ Completed Components
- **Connector System**: Modular sensor integration framework
- **Milesight Integration**: Full API integration with people counting
- **Test Suite**: Comprehensive tests for all connectors
- **Frontend Mockups**: Multiple dashboard designs ready
- **Analysis Scripts**: Customer pathway and heatmap visualization
- **Repository Organization**: Clean, well-structured codebase
- **Multi-Environment Deployment**: Staging and development environments live
- **Next.js 14 Setup**: Full app structure with App Router
- **Supabase Integration**: Database with complete schema and RLS
- **CI/CD Pipeline**: GitHub Actions and Vercel auto-deployments
- **Authentication System**: 6-tier RBAC with tenant isolation (2025-07-21)
- **Internationalization**: Full i18n support for EN/PT/ES (2025-07-21)
- **API Endpoints**: Complete sensor data ingestion API (2025-07-21)
- **Python Bridge**: Connector-to-API integration script (2025-07-21)
- **All Static Pages**: Converted to Next.js with i18n (2025-07-21)
- **Global Timezone Support**: Automatic detection and conversion for worldwide sensors (2025-07-22)
- **Project Reorganization**: Complete housekeeping with 50% cleaner root directory (2025-07-22)
- **GitHub Actions Data Collection**: Fixed timezone handling in automated workflows (2025-07-22)

### 🚧 In Progress
- **Real-time Data Processing**: Need WebSocket/polling implementation
- **Live Dashboard Integration**: Connect real data to dashboard components
- **Heat Map Visualization**: Implement interactive heat maps
- **Custom Domain Configuration**: Need to set up domain aliases

## Development Phases

### 🚀 Phase 1: Foundation (Weeks 1-4)
**Goal**: Core infrastructure and authentication

#### Week 1-2: Project Setup
- [x] Repository initialization
- [x] Documentation structure
- [x] Repository organization and cleanup (2025-07-20)
- [x] CLAUDE.md for AI assistant context
- [x] Environment configuration (.env.example)
- [x] GitHub Codespaces configuration (2025-07-20)
- [x] Supabase project setup with credentials (2025-07-20)
- [x] Vercel project setup and configuration (2025-07-20)
- [x] Next.js app structure implementation (2025-07-20)
- [x] CI/CD pipeline (GitHub Actions) (2025-07-20)
- [x] Multi-environment deployment (staging/dev/prod) (2025-07-20)
- [x] Complete project housekeeping with organized structure (2025-07-22)
- [ ] Docker configuration for local development (moved to Week 9)

#### Week 3-4: Authentication & Multi-tenancy (MVP) ✅ COMPLETED (2025-07-21)
- [x] Supabase Auth implementation with email/password only
- [x] 6-tier role hierarchy implementation:
  - [x] Tenant Admin (full organization control)
  - [x] Regional Manager (multi-store oversight)
  - [x] Store Manager (single store control)
  - [x] Analyst (cross-store read-only analytics)
  - [x] Store Staff (operational access)
  - [x] Viewer (dashboard read-only)
- [x] Organization (tenant) management
- [x] User profile system with role assignments
- [x] Store and region assignment tables
- [x] Row Level Security (RLS) policies for tenant isolation
- [x] Basic user management UI (admin only)
- [ ] Audit logging for auth events (moved to Week 15-16)

**Deliverables**: Working auth system with complete role hierarchy and tenant isolation

**Deferred to Phase 5 (Enterprise Features)**:
- OAuth providers (Google, Microsoft, etc.)
- SAML 2.0 / Enterprise SSO
- Multi-Factor Authentication (MFA)
- Self-service invitation codes
- Advanced compliance features (GDPR/CCPA tools)

---

### 📊 Phase 2: Core Analytics (Weeks 5-8)
**Goal**: Basic people counting and analytics

#### Week 5-6: Data Ingestion ✅ COMPLETED (2025-07-21)
- [x] Sensor data models
- [x] API endpoints for data collection
- [x] CSV/HTTP data ingestion
- [x] Data validation and processing
- [x] Batch import functionality
- [x] Timezone-aware data collection (2025-07-22)
- [ ] Real-time data pipeline (WebSocket - in progress)

#### Week 7-8: Dashboard & Visualization (CURRENT PHASE)
- [ ] Main dashboard layout
- [ ] Real-time metrics display
- [ ] Basic charts (footfall, occupancy)
- [ ] Date range selectors
- [ ] Site/store selector
- [ ] Export functionality
- [ ] Convert forgot-password page to Next.js
- [ ] Implement password reset flow with email

**Deliverables**: MVP with basic people counting analytics

---

### 💰 Phase 3: Sales Integration (Weeks 9-12)
**Goal**: POS integration and conversion metrics

#### Week 9: Infrastructure & DevOps
- [ ] Docker configuration for local development
- [ ] Docker Compose for full stack setup
- [ ] Database migration automation
- [ ] Environment configuration management
- [ ] Basic monitoring setup (health checks)
- [ ] Backup and restore procedures

#### Week 10-11: POS Connectivity
- [ ] Shopify integration
- [ ] Square integration
- [ ] Generic API framework
- [ ] Transaction data models
- [ ] Webhook handlers
- [ ] Data synchronization

#### Week 12: Advanced Metrics & Performance
- [ ] Conversion rate calculations
- [ ] Revenue analytics
- [ ] Capture rate (mall traffic)
- [ ] Staff performance metrics
- [ ] Hourly/daily/weekly comparisons
- [ ] Correlation analysis
- [ ] Remove Codespaces database query workarounds
- [ ] Implement Redis caching layer
- [ ] API response optimization

**Deliverables**: Full sales integration with advanced metrics

---

### 🎯 Phase 4: Smart Features (Weeks 13-16)
**Goal**: KPI management and targets

#### Week 13-14: Smart Targets
- [ ] Target setting interface
- [ ] Cascading targets algorithm
- [ ] Progress tracking
- [ ] Alert system
- [ ] Target vs actual reporting
- [ ] Forecast vs actual

#### Week 15-16: Reporting, Alerts & Real-time
- [ ] Report builder
- [ ] Scheduled reports
- [ ] Email notifications
- [ ] SMS alerts (critical)
- [ ] Slack/Teams integration
- [ ] Custom alert rules
- [ ] Audit logging for all auth events
- [ ] WebSocket implementation for real-time data
- [ ] Server-Sent Events (SSE) as fallback
- [ ] Live sensor status updates dashboard

**Deliverables**: Complete KPI management system

---

### 🤖 Phase 5: AI & Advanced Analytics (Weeks 17-20)
**Goal**: Predictive analytics and intelligent insights

#### Week 17-18: AI Integration
- [ ] OpenAI integration for insights
- [ ] Footfall predictions
- [ ] Revenue forecasting
- [ ] Anomaly detection
- [ ] Natural language report summaries
- [ ] Automated recommendations

#### Week 19-20: Advanced Analytics
- [ ] Trend analysis and forecasting
- [ ] What-if scenario modeling
- [ ] Competitive benchmarking
- [ ] Customer journey analytics
- [ ] Heat map intelligence
- [ ] Conversion optimization insights

**Deliverables**: AI-powered analytics with predictive capabilities

---

### 🔌 Phase 6: Enterprise Features & Integrations (Weeks 21-24)
**Goal**: Enterprise authentication, compliance, and integrations

#### Week 21-22: Enterprise Authentication
- [ ] OAuth providers integration (Google, Microsoft, etc.)
- [ ] SAML 2.0 for Enterprise SSO (Okta, Azure AD, Auth0)
- [ ] Multi-Factor Authentication (MFA/2FA)
- [ ] Self-service invitation code system
- [ ] Advanced permission delegation
- [ ] Session management enhancements

#### Week 23-24: Enterprise Integrations & Compliance
- [ ] Power BI embedding and connectivity
- [ ] Dynamics 365 synchronization
- [ ] GDPR compliance tools (data export, deletion)
- [ ] CCPA compliance features
- [ ] Advanced audit logging and reporting
- [ ] White-labeling capabilities
- [ ] API rate limiting and management
- [ ] Webhook system for integrations

**Deliverables**: Enterprise-ready platform with advanced auth and compliance

---

## Feature Rollout Schedule

### MVP Features (Month 1-2) ✅ CORE COMPLETED
- ✅ Email/password authentication (2025-07-21)
- ✅ 6-tier role hierarchy (Admin → Viewer) (2025-07-21)
- ✅ Multi-tenancy with RLS (2025-07-21)
- ✅ Basic people counting API (2025-07-21)
- ✅ Sensor data ingestion (2025-07-21)
- ✅ User management (admin only) (2025-07-21)
- ✅ Internationalization (EN/PT/ES) (2025-07-21)
- 🚧 Real-time dashboard (frontend integration needed)
- 🚧 Live data visualization

### Beta Features (Month 2-3)
- 🚧 Live dashboards (Week 7-8)
- 🚧 Docker deployment (Week 9)
- 🚧 Sales integration (Week 10-11)
- 🚧 Performance optimization (Week 12)
- 🚧 Smart targets & KPIs (Week 13-14)
- 🚧 Real-time WebSocket (Week 15-16)
- 🚧 Alert system (Week 15-16)
- 🚧 Report builder (Week 15-16)

### GA Features (Month 5-6)
- 📅 AI predictions & insights
- 📅 OAuth providers (Google/Microsoft)
- 📅 Enterprise SSO (SAML)
- 📅 MFA/2FA security
- 📅 Power BI integration
- 📅 API access & webhooks
- 📅 White-labeling
- 📅 Compliance tools (GDPR/CCPA)

## Technical Milestones

### Performance Targets

| Milestone | Target | Timeline |
|-----------|--------|----------|
| Page Load Time | < 3s | Week 4 |
| API Response | < 200ms | Week 8 |
| Real-time Latency | < 2s | Week 12 |
| Concurrent Users | 100+ | Week 16 |
| Uptime | 99.9% | Week 20 |

### Quality Gates

- [ ] **Week 4**: Security audit (auth system)
- [ ] **Week 8**: Performance testing (1000 users)
- [ ] **Week 12**: Penetration testing
- [ ] **Week 16**: GDPR compliance review
- [ ] **Week 20**: SOC 2 preparation
- [ ] **Week 24**: Full security audit

## Resource Requirements

### Team Structure
```yaml
technical_lead: 1
frontend_developers: 2
backend_developers: 2
ui_ux_designer: 1
devops_engineer: 1
qa_engineer: 1
product_manager: 1
```

### Infrastructure Costs (Monthly)
```yaml
vercel_pro: $20/user
supabase_pro: $25/project x 3
upstash_redis: ~$50 (usage-based)
resend_email: ~$20
openai_api: ~$200
monitoring: ~$100
total_estimate: ~$500-800/month
```

## Risk Management

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase limits | High | Monitor usage, plan for scaling |
| API rate limits | Medium | Implement caching, queue systems |
| Browser compatibility | Low | Progressive enhancement |
| Data accuracy | High | Validation, duplicate detection |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Competitor features | Medium | Rapid iteration, unique features |
| Enterprise requirements | High | Early customer feedback |
| Compliance changes | Medium | Regular legal reviews |
| Scaling costs | Medium | Usage-based pricing model |

## Success Metrics

### Technical KPIs
- [ ] < 2s page load time
- [ ] < 100ms API response time
- [ ] 99.9% uptime
- [ ] < 0.1% error rate
- [ ] 80%+ test coverage

### Business KPIs
- [ ] 10 beta customers (Month 2)
- [ ] 50 paying customers (Month 4)
- [ ] 100 sites connected (Month 6)
- [ ] $10k MRR (Month 6)
- [ ] 95% customer satisfaction

## Go-to-Market Timeline

### Soft Launch (Week 8)
- Private beta with 5 customers
- Feature feedback collection
- Performance optimization

### Beta Launch (Week 16)
- Public beta announcement
- 50 beta users target
- Feature completion

### General Availability (Week 24)
- Marketing campaign
- Pricing announcement
- Enterprise sales enablement

## Communication Plan

### Weekly Updates
- GitHub project board
- Slack channel updates
- Stakeholder emails

### Monthly Reviews
- Progress vs roadmap
- Budget review
- Risk assessment
- Customer feedback

---

**Note**: This roadmap is a living document and will be updated based on customer feedback, technical discoveries, and business priorities.

**Last Updated**: 2025-07-22  
**Version**: 1.3  
**Owner**: blipee Product Team

## Next Activities (Updated 2025-07-22)

Based on completed work and roadmap, the next immediate priorities are:

### 1. ✅ Authentication MVP (Week 3-4) - COMPLETED
- ✅ Implemented Supabase Auth with email/password
- ✅ Created 6-tier role hierarchy system
- ✅ Built organization (tenant) management
- ✅ Implemented Row Level Security policies
- ✅ Created user management UI for admins
- ⏸️ Audit logging (deferred to later phase)

### 2. ✅ Data Ingestion Pipeline (Week 5-6) - COMPLETED
- ✅ Created sensor data models in Supabase
- ✅ Built authenticated API endpoints
- ✅ Applied RLS to sensor data
- ✅ Created data validation layer
- ✅ Built Python-to-API bridge
- 🚧 Real-time updates (WebSocket implementation needed)

### 3. ✅ Global Timezone Support - COMPLETED (2025-07-22)
- ✅ Fixed UTC timezone issue in GitHub Actions workflow
- ✅ Implemented automatic timezone detection for sensors
- ✅ Created centralized date formatting utility
- ✅ Added timezone indicators to frontend displays
- ✅ Updated filtering logic to use sensor local time

### 4. ✅ Project Housekeeping - COMPLETED (2025-07-22)
- ✅ Reorganized 58 scripts into logical subdirectories
- ✅ Cleaned root directory from 40+ files to 18 essentials
- ✅ Updated .gitignore with Python patterns
- ✅ Documented new structure in README and CLAUDE.md
- ✅ Created comprehensive documentation structure

### 5. 🚧 Connect Frontend to Backend (Week 7-8) - IN PROGRESS
- ✅ Converted HTML mockups to Next.js components
- ✅ Created protected routes based on roles
- ✅ Added timezone-aware date displays
- 🚧 Connect live sensor data to dashboards
- 🚧 Implement real-time data updates
- 🚧 Build interactive heat map visualization

### 6. Next Phase: Week 7-8 Dashboard & Visualization
The immediate focus is on:
- Connecting live sensor data to dashboards
- Real-time metrics display with timezone support
- Heat map visualization
- Forgot password functionality
- Basic charts and export features