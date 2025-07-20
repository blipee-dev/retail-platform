# CLAUDE.md - AI Assistant Context

This file provides context for AI assistants (like Claude) working on the Retail Platform project.

## Project Overview

**Retail Platform** is a comprehensive retail analytics system that integrates with people counting sensors (primarily Milesight) to provide real-time analytics, heatmaps, and customer flow insights for retail environments.

## Current Project State (Last Updated: 2025-07-20)

### ✅ Completed
- Basic connector system for Milesight sensors
- Test suite for connectors
- Heatmap visualization capabilities
- Customer pathway analysis
- Frontend mockups and dashboards
- Major repository reorganization (2025-07-20)

### 🚧 In Progress
- Real-time data processing
- Advanced analytics features
- API standardization
- Production deployment setup

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

- **Backend**: Python 3.x
- **Sensors**: Milesight API integration (primary), Omnia (secondary)
- **Frontend**: HTML/CSS/JavaScript (mockups ready, not fully integrated)
- **Testing**: pytest
- **Data Processing**: pandas, numpy
- **Visualization**: matplotlib, seaborn

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

1. **Import Paths**: All imports now use `src.connector_system` format after reorganization
2. **Real-time Data**: Need to implement WebSocket or polling for real-time updates
3. **Authentication**: Auth system exists but needs integration with frontend
4. **Deployment**: No production deployment setup yet

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

## Recent Changes (2025-07-20)

- Reorganized entire repository structure
- Created logical folder hierarchy
- Updated all import paths
- Consolidated documentation into single docs/ folder
- Archived old/unused files

## Contact & Support

- Check `docs/ROADMAP.md` for development priorities
- See `docs/CHANGELOG.md` for recent changes
- Review `docs/api/` for API documentation

---

**Note for AI Assistants**: When working on this project, prioritize maintaining the existing structure and patterns. Always run tests after making changes. The connector system is the core of the application - handle with care.