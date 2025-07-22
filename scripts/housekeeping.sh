#!/bin/bash
# Housekeeping script for Retail Platform
# This script helps organize the project structure

set -e

echo "🧹 Retail Platform Housekeeping Script"
echo "======================================"

# Create directory structure
echo "📁 Creating organized directory structure..."

mkdir -p scripts/archive
mkdir -p scripts/debug/timezone
mkdir -p scripts/debug/data
mkdir -p scripts/debug/workflow
mkdir -p scripts/migrations
mkdir -p scripts/data-collection
mkdir -p scripts/analysis
mkdir -p scripts/utilities

# Function to move files safely
move_files() {
    local pattern=$1
    local destination=$2
    local description=$3
    
    echo "  Moving $description..."
    for file in scripts/$pattern; do
        if [ -f "$file" ] && [ "$(basename "$file")" != "housekeeping.sh" ]; then
            echo "    → $(basename "$file")"
            git mv "$file" "$destination/" 2>/dev/null || mv "$file" "$destination/"
        fi
    done
}

# Move debug and test files
echo "🔍 Organizing debug and test scripts..."
move_files "debug_*.py" "scripts/debug/data" "Python debug scripts"
move_files "debug_*.js" "scripts/debug/workflow" "JavaScript debug scripts"
move_files "test_*.py" "scripts/debug/data" "Python test scripts"
move_files "test_*.js" "scripts/debug/workflow" "JavaScript test scripts"
move_files "check_*.py" "scripts/debug/data" "Check scripts"
move_files "*timezone*.py" "scripts/debug/timezone" "Timezone scripts"
move_files "*timezone*.js" "scripts/debug/timezone" "Timezone scripts"

# Move old and fixed versions to archive
echo "📦 Archiving old versions..."
move_files "*_old.*" "scripts/archive" "old versions"
move_files "*_fixed.*" "scripts/archive" "fixed versions"

# Move SQL files
echo "🗄️ Organizing SQL migrations..."
move_files "*.sql" "scripts/migrations" "SQL files"

# Move collection scripts
echo "📊 Organizing collection scripts..."
move_files "collect_*.py" "scripts/data-collection" "collection scripts"
move_files "manual*.py" "scripts/data-collection" "manual collection scripts"

# Move analysis scripts
echo "📈 Organizing analysis scripts..."
move_files "analyze_*.py" "scripts/analysis" "analysis scripts"
move_files "find_*.py" "scripts/analysis" "find scripts"

# Create README files
echo "📝 Creating README files..."

cat > scripts/README.md << 'EOF'
# Scripts Directory

This directory contains various scripts for the Retail Platform project.

## Directory Structure

- **archive/** - Old scripts kept for reference
- **debug/** - Debugging and testing scripts
  - **timezone/** - Timezone-related debugging
  - **data/** - Data debugging scripts
  - **workflow/** - GitHub workflow debugging
- **migrations/** - Database migration scripts
- **data-collection/** - Active data collection scripts
- **analysis/** - Data analysis scripts
- **utilities/** - General utility scripts

## Usage

Most Python scripts can be run directly:
```bash
python scripts/data-collection/collect_sensor_data.py
```

## Adding New Scripts

1. Place scripts in the appropriate subdirectory
2. Follow naming convention: `verb_noun.py`
3. Add documentation at the top of the script
4. Update this README if adding a new category
EOF

echo "✅ Housekeeping complete!"
echo ""
echo "📋 Summary:"
echo "  - Created organized directory structure"
echo "  - Moved scripts to appropriate folders"
echo "  - Created README documentation"
echo ""
echo "⚠️  Note: Review the changes before committing!"
echo "   Use 'git status' to see all changes"
echo "   Use 'git diff --staged' to review moved files"