#!/bin/bash

# Deploy Supabase Edge Function for Sensor Data Collection

echo "🚀 Deploying Supabase Edge Function..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if we're in the right directory
if [ ! -f "supabase/functions/collect-sensor-data/index.ts" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Deploy the function
echo "📦 Deploying collect-sensor-data function..."
supabase functions deploy collect-sensor-data

if [ $? -eq 0 ]; then
    echo "✅ Function deployed successfully!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Go to your Supabase dashboard"
    echo "2. Navigate to Edge Functions → collect-sensor-data"
    echo "3. Set the required environment variables"
    echo "4. Set up the cron schedule as described in docs/setup/supabase-edge-function-setup.md"
    echo ""
    echo "🧪 Test the function with:"
    echo "curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/collect-sensor-data \\"
    echo "  -H 'Authorization: Bearer YOUR_ANON_KEY' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{}'"
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi