#!/bin/bash
set -e

echo "🚀 Setting up Retail Platform development environment..."

# Copy environment template if .env doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file from template..."
    cp .env.example .env
fi

# Install Node.js dependencies
if [ -f package.json ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Create Python virtual environment
echo "🐍 Setting up Python environment..."
python -m venv venv || python3 -m venv venv

# Activate virtual environment and install dependencies
source venv/bin/activate

# Install common Python packages for the project
echo "📚 Installing Python packages..."
pip install --upgrade pip
pip install pytest pytest-cov
pip install requests pandas numpy
pip install matplotlib seaborn
pip install python-dotenv
pip install black isort pylint
pip install ipython jupyter

# Create requirements.txt if it doesn't exist
if [ ! -f requirements.txt ]; then
    echo "📝 Creating requirements.txt..."
    cat > requirements.txt << EOF
# Core dependencies
requests>=2.28.0
pandas>=1.5.0
numpy>=1.23.0
python-dotenv>=1.0.0

# Testing
pytest>=7.2.0
pytest-cov>=4.0.0
pytest-mock>=3.10.0

# Data visualization
matplotlib>=3.6.0
seaborn>=0.12.0

# Development tools
black>=23.0.0
isort>=5.11.0
pylint>=2.15.0
ipython>=8.10.0
jupyter>=1.0.0

# Type checking
mypy>=1.0.0
types-requests>=2.28.0
EOF
fi

# Install from requirements.txt
pip install -r requirements.txt

# Create necessary directories if they don't exist
echo "📁 Ensuring directory structure..."
mkdir -p logs
mkdir -p data
mkdir -p output

# Set up git hooks for code quality
echo "🔧 Setting up git hooks..."
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# Run black and isort before commit
source venv/bin/activate 2>/dev/null || true
black --check src/ tests/ scripts/
isort --check-only src/ tests/ scripts/
EOF
chmod +x .git/hooks/pre-commit

# Run initial tests to verify setup
echo "🧪 Running tests to verify setup..."
python -m pytest tests/ -v --tb=short || echo "⚠️  Some tests failed - this is expected if sensor credentials aren't configured"

echo "✅ Development environment setup complete!"
echo ""
echo "📌 Next steps:"
echo "   1. Edit .env file with your sensor credentials"
echo "   2. Run 'source venv/bin/activate' to activate Python environment"
echo "   3. Run 'python -m pytest tests/' to run tests"
echo "   4. Check out the CLAUDE.md file for project context"
echo ""
echo "Happy coding! 🎉"