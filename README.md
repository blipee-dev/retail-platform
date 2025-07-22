# Retail Platform

A comprehensive retail analytics platform with people counting, sensor integration, and advanced analytics capabilities. Built with Next.js 14, TypeScript, and Supabase, featuring multi-tenant support, real-time data visualization, and global timezone support.

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repository-url>
cd retail-platform
cp .env.example .env.local

# Install and run
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## 🌟 Key Features

- **🌍 Global Timezone Support**: Automatic timezone detection and conversion for sensors worldwide
- **📊 Real-time Analytics**: Live data processing with 30-minute automated collection
- **🔐 Multi-tenant Architecture**: Complete data isolation with Row-Level Security (RLS)
- **🌐 Internationalization**: Support for English, Portuguese, and Spanish
- **👥 6-Tier RBAC**: Fine-grained access control from viewer to tenant admin
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices
- **🔌 Multi-sensor Support**: Milesight and Omnia sensor integration

## 📁 Project Structure

```
retail-platform/
├── app/                   # Next.js 14 App Router application
│   ├── api/              # API routes for sensor data and auth
│   ├── components/       # Reusable React components
│   ├── dashboard/        # Dashboard pages with analytics
│   ├── i18n/            # Internationalization configuration
│   ├── lib/             # Core utilities and services
│   │   ├── auth/        # Authentication utilities
│   │   ├── db/          # Database client and queries
│   │   ├── migrations/  # SQL migration files
│   │   └── utils/       # Helper functions (date formatting, etc.)
│   └── providers/       # React context providers
│
├── scripts/              # Utility and maintenance scripts
│   ├── archive/         # Historical scripts for reference
│   ├── debug/           # Debugging and testing utilities
│   │   ├── data/        # Data debugging scripts
│   │   ├── timezone/    # Timezone testing utilities
│   │   └── workflow/    # GitHub Actions debugging
│   ├── migrations/      # Database migration scripts
│   │   └── rls/         # Row-Level Security SQL files
│   ├── data-collection/ # Sensor data collection scripts
│   ├── analysis/        # Data analysis utilities
│   ├── deployment/      # Deployment scripts
│   └── utilities/       # General utility scripts
│
├── docs/                 # Comprehensive documentation
│   ├── api/             # API endpoint documentation
│   ├── architecture/    # System design documents
│   ├── deployment/      # Deployment guides
│   ├── guides/          # How-to guides
│   ├── implementation/  # Technical implementation details
│   ├── maintenance/     # Housekeeping and maintenance docs
│   └── setup/           # Setup and configuration guides
│
├── supabase/            # Database schema and migrations
├── public/              # Static assets
├── .github/             # GitHub Actions workflows
│   └── workflows/       # CI/CD and automation
└── config files...      # Various configuration files
```

## 🔧 Technical Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Shadcn/ui components
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with custom RBAC
- **Real-time**: GitHub Actions for automated data collection
- **Deployment**: Vercel with automatic branch deployments
- **Monitoring**: Built-in analytics and error tracking

## 🌍 Timezone Support

The platform automatically handles timezone conversions for global deployments:

- **Automatic Detection**: Sensors' timezones are detected and stored
- **Smart Conversion**: All timestamps stored in UTC, displayed in local time
- **Visual Indicators**: Times shown with timezone abbreviations (e.g., "14:30 WEST")
- **Store-aware**: Each store can have its own timezone configuration

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/signin      # User authentication
POST   /api/auth/signup      # User registration
POST   /api/auth/signout     # Sign out
GET    /api/auth/profile     # Get user profile
```

### Sensor Management
```
GET    /api/sensors          # List all sensors
POST   /api/sensors          # Create new sensor
PATCH  /api/sensors          # Update sensor
DELETE /api/sensors          # Delete sensor
```

### Data Collection
```
POST   /api/sensors/data     # Ingest sensor data
POST   /api/sensors/bulk-ingest  # Bulk data ingestion
GET    /api/sensors/data     # Query historical data
GET    /api/sensors/status   # Real-time sensor status
```

### Analytics
```
GET    /api/analytics?type=hourly      # Hourly analytics
GET    /api/analytics?type=daily       # Daily summaries
GET    /api/analytics?type=comparison  # Multi-store comparison
```

## 🔐 Security & Access Control

### Role-Based Access Control (RBAC)
- **Tenant Admin**: Full organizational access
- **Regional Manager**: Multi-store regional access
- **Store Manager**: Single store management
- **Analyst**: Read-only analytics access
- **Store Staff**: Limited operational access
- **Viewer**: Read-only dashboard access

### Security Features
- Row-Level Security (RLS) for data isolation
- JWT-based authentication
- API rate limiting
- Secure environment variable management
- HTTPS-only in production

## 🚀 Deployment

### Environments
- **Production**: `main` branch → [production-url]
- **Staging**: `staging` branch → [staging-url]
- **Development**: `develop` branch → [dev-url]

### Automated Workflows
- **CI/CD**: Automatic testing and deployment on push
- **Data Collection**: Runs every 30 minutes via GitHub Actions
- **Database Backups**: Daily automated backups

## 📚 Documentation

- [Getting Started Guide](docs/guides/getting-started.md)
- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Deployment Guide](docs/deployment/README.md)
- [Sensor Setup Guide](docs/implementation/sensor-integration-guide.md)
- [Timezone Handling](docs/implementation/timezone-support.md)

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Git

### Environment Setup
```bash
# Copy environment template
cp .env.example .env.local

# Required environment variables:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Database Setup
Run migrations in order through Supabase SQL editor:
1. Create user roles enum
2. Create organizations table
3. Create user profiles
4. Create store hierarchy
5. Create helper functions
6. Enable RLS policies
7. Create sensor tables

### Running Tests
```bash
# Frontend tests
npm run test
npm run lint
npm run typecheck

# E2E tests
npm run test:e2e
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- UI components from [Shadcn/ui](https://ui.shadcn.com/)

---

For more information, visit our [documentation](docs/) or contact the development team.