#!/bin/bash

# Manual trigger script for daily reports
# This will trigger the GitHub Actions workflow for a specific store

echo "🚀 Manually triggering daily report..."
echo ""

# Get the first store ID from the database
STORE_ID=$(node -e "
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  const { data } = await supabase.from('stores').select('id, name').eq('is_active', true).limit(1).single();
  if (data) {
    console.log(data.id);
    console.error('Store:', data.name);
  }
})();
" 2>&1 | grep -E '^[a-f0-9-]{36}$')

if [ -z "$STORE_ID" ]; then
  echo "❌ Could not find an active store"
  exit 1
fi

echo "📍 Triggering report for store ID: $STORE_ID"
echo ""

# Create workflow dispatch event
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/blipee-dev/retail-platform/actions/workflows/daily-reports.yml/dispatches \
  -d "{\"ref\":\"main\",\"inputs\":{\"specific_store\":\"$STORE_ID\"}}"

echo ""
echo "✅ Workflow triggered! Check the Actions tab on GitHub to monitor progress."
echo "🔗 https://github.com/blipee-dev/retail-platform/actions/workflows/daily-reports.yml"