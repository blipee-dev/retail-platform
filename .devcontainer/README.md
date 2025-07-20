# GitHub Codespaces Configuration

This directory contains the development container configuration for GitHub Codespaces, providing a consistent cloud-based development environment for the Retail Platform project.

## 🚀 Quick Start

1. **Open in Codespaces**: Click the "Code" button on GitHub and select "Create codespace on main"
2. **Wait for setup**: The container will automatically configure itself (takes ~3-5 minutes first time)
3. **Start coding**: Everything is pre-configured and ready to go!

## 📦 What's Included

### Languages & Runtimes
- **Python 3.10** with pip and venv
- **Node.js 18** with npm
- **Git** and **GitHub CLI** pre-configured

### VS Code Extensions
- Python development tools (Pylance, Black formatter, pytest)
- JavaScript/TypeScript tools (ESLint, Prettier)
- GitHub Copilot (if you have access)
- Markdown tools and spell checker
- Git tools (GitLens)

### Pre-configured Services
- Python virtual environment with all dependencies
- Pre-commit hooks for code quality
- Test runner configured for pytest
- Live Server for frontend development

## 🔧 Configuration Details

### Ports
- `3000` - Frontend development server
- `8000` - Python API server
- `8080` - Alternative server port
- `5000` - Flask/FastAPI server

### Environment Variables
The post-create script automatically:
1. Copies `.env.example` to `.env`
2. Sets up `PYTHONPATH` for proper imports
3. Configures development environment variables

### Python Setup
The environment includes:
- Core packages: requests, pandas, numpy
- Testing: pytest with coverage
- Visualization: matplotlib, seaborn
- Development: black, isort, pylint
- Interactive: ipython, jupyter

## 📝 Customization

### Adding Dependencies
1. **Python**: Add to `requirements.txt` and run `pip install -r requirements.txt`
2. **Node.js**: Add to `package.json` and run `npm install`

### VS Code Settings
Edit `.devcontainer/devcontainer.json` to:
- Add more extensions
- Change editor settings
- Add port forwards
- Configure secrets

### Post-Create Tasks
Edit `.devcontainer/post-create.sh` to add custom setup steps.

## 🔐 Secrets Management

For sensitive data like API keys:
1. Go to Settings → Secrets → Codespaces
2. Add secrets like `MILESIGHT_API_KEY`
3. They'll be available as environment variables

## 🐛 Troubleshooting

### Python Import Errors
- Make sure to activate the virtual environment: `source venv/bin/activate`
- Check that `PYTHONPATH` includes `/workspaces/retail-platform`

### Permission Errors
- The default user is `codespace` with sudo access
- Use `sudo` for system-level operations

### Extension Issues
- Extensions are installed automatically on container creation
- If missing, check the Extensions panel and install manually

## 📚 Resources

- [GitHub Codespaces Documentation](https://docs.github.com/en/codespaces)
- [Dev Containers Documentation](https://containers.dev/)
- [VS Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)