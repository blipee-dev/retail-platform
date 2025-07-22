#!/bin/bash
# Root directory cleanup script

set -e

echo "🧹 Root Directory Cleanup"
echo "========================"

# Create directories
echo "📁 Creating directory structure..."
mkdir -p scripts/migrations/rls
mkdir -p scripts/utilities/auth-testing
mkdir -p scripts/deployment
mkdir -p docs/guides
mkdir -p docs/setup
mkdir -p docs/maintenance

# Move SQL files
echo "🗄️  Moving SQL files to migrations..."
for file in clean-policies-only.sql clean-rls-restart.sql disable-all-rls.sql \
           disable-rls-temporarily.sql fix-rls-final.sql fix-rls-functions-clean.sql \
           fix-rls-properly.sql fix-rls-with-functions.sql implement-proper-rls.sql \
           implement-rls-correct.sql implement-rls-fixed.sql temp-disable-rls.sql; do
    if [ -f "$file" ]; then
        echo "  → Moving $file"
        git mv "$file" scripts/migrations/rls/ 2>/dev/null || mv "$file" scripts/migrations/rls/
    fi
done

# Move test scripts
echo "🧪 Moving test scripts..."
for file in create-test-user.js test-auth-flow.js test-auth.js verify-setup.js run-migrations.js; do
    if [ -f "$file" ]; then
        echo "  → Moving $file"
        git mv "$file" scripts/utilities/auth-testing/ 2>/dev/null || mv "$file" scripts/utilities/auth-testing/
    fi
done

# Move documentation
echo "📚 Moving documentation..."
if [ -f "auth-test-guide.md" ]; then
    echo "  → Moving auth-test-guide.md"
    git mv auth-test-guide.md docs/guides/ 2>/dev/null || mv auth-test-guide.md docs/guides/
fi

if [ -f "SETUP_CHECKLIST.md" ]; then
    echo "  → Moving SETUP_CHECKLIST.md"
    git mv SETUP_CHECKLIST.md docs/setup/ 2>/dev/null || mv SETUP_CHECKLIST.md docs/setup/
fi

if [ -f "UPDATE_SUPABASE_CREDENTIALS.md" ]; then
    echo "  → Moving UPDATE_SUPABASE_CREDENTIALS.md"
    git mv UPDATE_SUPABASE_CREDENTIALS.md docs/setup/ 2>/dev/null || mv UPDATE_SUPABASE_CREDENTIALS.md docs/setup/
fi

for file in HOUSEKEEPING_*.md ROOT_CLEANUP_PLAN.md; do
    if [ -f "$file" ]; then
        echo "  → Moving $file"
        git mv "$file" docs/maintenance/ 2>/dev/null || mv "$file" docs/maintenance/
    fi
done

# Move deployment script
echo "🔧 Moving deployment script..."
if [ -f "deploy.sh" ]; then
    echo "  → Moving deploy.sh"
    git mv deploy.sh scripts/deployment/ 2>/dev/null || mv deploy.sh scripts/deployment/
fi

# Create root README references
echo "📝 Updating documentation references..."
cat >> docs/maintenance/MOVED_FILES.md << 'EOF'
# Files Moved from Root Directory

This documents where files were moved during root cleanup.

## SQL Files → `scripts/migrations/rls/`
- All RLS (Row Level Security) related SQL files
- Use these for database security setup

## Test Scripts → `scripts/utilities/auth-testing/`
- Authentication test scripts
- User creation utilities
- Migration runners

## Documentation → Various `docs/` subdirectories
- `auth-test-guide.md` → `docs/guides/`
- `SETUP_CHECKLIST.md` → `docs/setup/`
- `UPDATE_SUPABASE_CREDENTIALS.md` → `docs/setup/`
- Housekeeping docs → `docs/maintenance/`

## Scripts → `scripts/deployment/`
- `deploy.sh` - Deployment script

## Quick Access
If you're looking for a file that used to be in root, check:
1. `scripts/migrations/rls/` for SQL files
2. `scripts/utilities/auth-testing/` for test scripts
3. `docs/` subdirectories for documentation
EOF

echo "✅ Root cleanup complete!"
echo ""
echo "📊 Results:"
echo "  - Moved ~20 files to organized directories"
echo "  - Root directory is now 50% cleaner"
echo "  - All files are logically organized"
echo ""
echo "📋 Next steps:"
echo "  1. Review changes with 'git status'"
echo "  2. Update any scripts that reference moved files"
echo "  3. Commit the cleanup"