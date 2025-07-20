# Retail Platform

A comprehensive retail analytics platform with people counting, sensor integration, and advanced analytics capabilities.

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
│   └── ...               # Other documentation
│
├── CLAUDE.md            # AI assistant context
├── package.json         # Node.js dependencies
├── LICENSE              # MIT License
├── .env.example         # Environment variables template
└── README.md            # This file
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd retail-platform
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Install dependencies**
   ```bash
   npm install
   # For Python dependencies (if requirements.txt exists):
   # pip install -r requirements.txt
   ```

4. **Configure sensors**
   - Edit configuration files in `config/sensors/` directory
   - See example configurations in `config/examples/`
   - Detailed setup: `docs/guides/getting-started.md`

5. **Run tests**
   ```bash
   # Run all tests
   python -m pytest tests/
   
   # Run specific test category
   python -m pytest tests/connectors/
   ```

6. **Start development**
   ```bash
   # Run a demo
   python scripts/demos/quick_sensor_test.py
   
   # Start analysis
   python scripts/analysis/comprehensive_analysis.py
   ```

## 📊 Key Features

- **People Counting**: Integration with Milesight and other sensors
- **Real-time Analytics**: Live data processing and visualization
- **Heatmap Generation**: Spatial and temporal analysis
- **Multi-sensor Support**: Flexible connector system
- **Web Dashboard**: Interactive frontend for data visualization

## 📚 Documentation

- [Technical Requirements](docs/TECHNICAL_REQUIREMENTS.md)
- [API Documentation](docs/api/README.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Deployment Guide](docs/deployment/README.md)

## 🤝 Contributing

Please read our contributing guidelines before submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.