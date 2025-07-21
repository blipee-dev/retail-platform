# Retail Platform

A comprehensive retail analytics platform with people counting, sensor integration, and advanced analytics capabilities. Built with Next.js 14, TypeScript, and Supabase, featuring multi-tenant support and real-time data visualization.

## 📁 Project Structure

```
retail-platform/
├── src/                    # Source code
│   ├── auth/              # Authentication modules
│   ├── connector_system/  # Core connector system for sensors
│   ├── integrations/      # External integrations (Telegram)
│   ├── servers/           # Server implementations
│   └── utils/             # Utility modules (config, data collection)
│
├── tests/                 # Test suite
│   ├── api/              # API tests
│   ├── connectors/       # Connector-specific tests
│   ├── integration/      # Integration tests
│   └── unit/             # Unit tests
│
├── scripts/               # Utility scripts
│   ├── analysis/         # Data analysis scripts
│   ├── demos/            # Demo and example scripts
│   └── archive/          # Archived logs and old scripts
│
├── frontend/              # Frontend HTML/CSS/JS files
│   ├── pages/            # Organized by page type
│   │   ├── auth/         # Authentication pages
│   │   ├── dashboards/   # Dashboard variations
│   │   ├── settings/     # Settings pages
│   │   └── static/       # Static pages
│   ├── assets/           # Frontend assets
│   │   ├── css/         # Stylesheets
│   │   └── js/          # JavaScript files
│   └── archive/          # Old templates and test pages
│
├── config/                # Configuration files
│   ├── sensors/          # Sensor configurations
│   ├── examples/         # Example configurations
│   └── analytics/        # Analytics configurations
│
├── assets/                # Static assets
│   └── images/           # Images and visualizations
│       ├── dashboards/   # Dashboard screenshots
│       ├── screenshots/  # App screenshots
│       └── visualizations/ # Heatmaps and diagrams
│
├── docs/                  # All documentation
│   ├── api/              # API documentation
│   ├── architecture/     # System architecture
│   ├── specifications/   # Technical specifications
│   ├── project/          # Project-level docs
│   ├── summaries/        # Analysis summaries
│   ├── implementation/   # Implementation guides
│   └── ...               # Other documentation
│
├── app/                 # Next.js 14 application (App Router)
│   ├── api/            # API routes for sensor data
│   ├── auth/           # Authentication pages
│   ├── components/     # Reusable components
│   ├── dashboard/      # Dashboard pages
│   ├── i18n/           # Internationalization setup
│   ├── lib/            # Utility libraries
│   ├── providers/      # React context providers
│   └── types/          # TypeScript type definitions
├── supabase/           # Database migrations and setup
├── CLAUDE.md           # AI assistant context
├── package.json         # Node.js dependencies
├── LICENSE              # MIT License
├── .env.example         # Environment variables template
└── README.md            # This file
```

## 🌍 Internationalization

The platform supports multiple languages out of the box:
- **English** (en) - Default
- **Portuguese** (pt) - European Portuguese
- **Spanish** (es) - Español

Language is automatically detected from the browser and can be changed using the language switcher available on all pages.

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd retail-platform
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your Supabase configuration
   ```

3. **Install dependencies**
   ```bash
   npm install
   # For Python dependencies (if requirements.txt exists):
   # pip install -r requirements.txt
   ```

4. **Setup database**
   ```bash
   # Run migrations in Supabase Dashboard SQL Editor in order:
   # 1. supabase/migrations/20240120000001_create_user_roles_enum.sql
   # 2. supabase/migrations/20240120000002_create_organizations_table.sql
   # 3. supabase/migrations/20240120000003_create_user_profiles_table.sql
   # 4. supabase/migrations/20240120000004_create_store_hierarchy_tables.sql
   # 5. supabase/migrations/20240120000005_create_helper_functions.sql
   # 6. supabase/migrations/20240120000006_create_rls_policies.sql
   # 7. supabase/migrations/20240120000007_create_sensor_tables.sql
   ```

4. **Configure sensors**
   - Edit configuration files in `config/sensors/` directory
   - See example configurations in `config/examples/`
   - Detailed setup: `docs/guides/getting-started.md`

5. **Run tests**
   ```bash
   # Run all Python tests
   python -m pytest tests/
   
   # Run specific test category
   python -m pytest tests/connectors/
   
   # Run Next.js lint and typecheck
   npm run lint
   npm run typecheck
   ```

6. **Start development**
   ```bash
   # Start Next.js development server
   npm run dev
   
   # Run Python sensor demo
   python scripts/demos/quick_sensor_test.py
   
   # Run analysis scripts
   python scripts/analysis/comprehensive_analysis.py
   ```

## 📊 Key Features

- **People Counting**: Integration with Milesight and other sensors
- **Real-time Analytics**: Live data processing and visualization
- **Heatmap Generation**: Spatial and temporal analysis
- **Multi-sensor Support**: Flexible connector system
- **Web Dashboard**: Interactive frontend for data visualization
- **RESTful API**: Comprehensive API for sensor data ingestion
- **Multi-tenant**: Row-level security with organization isolation
- **Internationalization**: Support for EN/PT/ES languages
- **Role-Based Access**: 6-tier RBAC system

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/profile` - Get user profile

### Sensor Management
- `GET /api/sensors` - List all sensors
- `POST /api/sensors` - Create new sensor
- `PATCH /api/sensors` - Update sensor
- `DELETE /api/sensors` - Delete sensor

### Data Ingestion
- `POST /api/sensors/data` - Ingest sensor data
- `POST /api/sensors/bulk-ingest` - Bulk data ingestion
- `GET /api/sensors/data` - Query historical data
- `GET /api/sensors/status` - Real-time sensor status

### Analytics
- `GET /api/analytics?type=hourly` - Hourly analytics
- `GET /api/analytics?type=daily` - Daily summaries
- `GET /api/analytics?type=comparison` - Multi-store comparison

## 📚 Documentation

- [Technical Requirements](docs/TECHNICAL_REQUIREMENTS.md)
- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Deployment Guide](docs/deployment/README.md)
- [Authentication Architecture](docs/implementation/auth-architecture.md)
- [Database Schema](docs/implementation/multi-tenant-schema.sql)
- [I18n Guidelines](docs/implementation/i18n-guidelines.md)

## 🔐 Authentication & Security

The platform implements a comprehensive 6-tier Role-Based Access Control (RBAC) system:
- **Tenant Admin**: Full access to organization
- **Regional Manager**: Access to assigned regions
- **Store Manager**: Access to assigned stores
- **Analyst**: Read-only access to all data
- **Store Staff**: Limited access to store operations
- **Viewer**: Read-only access to assigned stores

## 🌐 Deployment

- **Production**: Deploy to main branch → Vercel auto-deployment
- **Staging**: Deploy to staging branch → Preview deployment
- **Development**: Deploy to develop branch → Development deployment

## 🤝 Contributing

Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.