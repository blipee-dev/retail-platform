#!/bin/bash

# Backfill data from June 1st using existing workflows
# This script triggers the GitHub Actions workflows for historical data

echo "🔄 Backfill Script - Using GitHub Actions Workflows"
echo "=================================================="
echo ""
echo "This script will help you backfill data from June 1st, 2024"
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "   Please install it: https://cli.github.com/"
    exit 1
fi

# Configuration
START_DATE="2024-06-01"
END_DATE=$(date +%Y-%m-%d)
REPO="blipee-dev/retail-platform"

echo "📅 Date range: $START_DATE to $END_DATE"
echo ""
echo "⚠️  Prerequisites:"
echo "   1. Run clean-and-rebuild-analytics.sql first"
echo "   2. Ensure workflows are on main branch"
echo "   3. Have GitHub CLI authenticated"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# For manual approach, we need to modify the collection scripts to accept date parameters
# For now, let's create a step-by-step guide

cat << 'EOF' > backfill-steps.md
# Manual Backfill Steps

## 1. Clean the database
Run in Supabase SQL editor:
```sql
-- From clean-and-rebuild-analytics.sql
TRUNCATE TABLE hourly_analytics CASCADE;
TRUNCATE TABLE daily_analytics CASCADE;
TRUNCATE TABLE people_counting_raw CASCADE;
TRUNCATE TABLE regional_counting_raw CASCADE;
```

## 2. Modify collection scripts temporarily
Add date parameter support to:
- scripts/workflows/collect-sensor-data.js
- scripts/workflows/collect-regional-data.js

## 3. Run collections for each day
```bash
# Example for a specific date
cd scripts/workflows
COLLECTION_DATE="2024-06-01" node collect-sensor-data.js
COLLECTION_DATE="2024-06-01" node collect-regional-data.js
```

## 4. Run aggregations
```bash
# After collecting raw data
cd scripts
AGGREGATION_DATE="2024-06-01" node run_hourly_aggregation.js
AGGREGATION_DATE="2024-06-01" node run_daily_aggregation.js
```

## Alternative: Use existing data
If you have historical CSV files from sensors:
1. Parse them with proper timezone handling
2. Insert into raw tables with correct timestamps
3. Run aggregations on the historical data

## Batch Processing Script
Create a loop to process multiple days:
```bash
#!/bin/bash
START_DATE="2024-06-01"
END_DATE="2024-06-30"

current_date="$START_DATE"
while [[ "$current_date" < "$END_DATE" ]]; do
    echo "Processing $current_date"
    
    # Run collection for this date
    COLLECTION_DATE="$current_date" node collect-sensor-data.js
    COLLECTION_DATE="$current_date" node collect-regional-data.js
    
    # Run aggregations
    AGGREGATION_DATE="$current_date" node run_hourly_aggregation.js
    AGGREGATION_DATE="$current_date" node run_daily_aggregation.js
    
    # Move to next day
    current_date=$(date -I -d "$current_date + 1 day")
done
```
EOF

echo "📝 Created backfill-steps.md with detailed instructions"
echo ""
echo "🎯 Recommended approach:"
echo "   1. Clean the database (run SQL script)"
echo "   2. If you have historical CSV files, process them directly"
echo "   3. Otherwise, modify collection scripts to accept date parameters"
echo "   4. Run collections and aggregations for each day"
echo ""
echo "💡 Tip: For large date ranges, consider:"
echo "   - Processing in weekly batches"
echo "   - Running during off-peak hours"
echo "   - Monitoring Supabase usage limits"