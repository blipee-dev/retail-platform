#!/bin/bash

echo "🚀 Setting up Supabase database..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local not found. Please create it from .env.example"
    exit 1
fi

# Source environment variables
source .env.local

echo "📊 Running migrations..."

# Note: In production, you would use Supabase CLI
# For now, we'll create a SQL file that combines all migrations

cat > /tmp/combined_migrations.sql << 'EOF'
-- Combined migrations for initial setup

EOF

# Append all migration files
for file in supabase/migrations/*.sql; do
    echo "-- Migration: $(basename $file)" >> /tmp/combined_migrations.sql
    echo "" >> /tmp/combined_migrations.sql
    cat "$file" >> /tmp/combined_migrations.sql
    echo "" >> /tmp/combined_migrations.sql
done

echo "✅ Migrations combined. Please run the following:"
echo ""
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of /tmp/combined_migrations.sql"
echo "4. Run the SQL"
echo ""
echo "Or use Supabase CLI:"
echo "  npx supabase db push"
echo ""
echo "📝 Optional: Run seed data from supabase/seed.sql for test data"