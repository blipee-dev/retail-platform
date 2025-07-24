#!/bin/bash

echo "🔐 Running sensor collection with GitHub secrets..."
echo ""
echo "This script helps you run the collection locally with the same secrets as GitHub Actions."
echo ""
echo "Please set these environment variables first:"
echo "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
echo ""
echo "You can get the service role key from:"
echo "1. GitHub repository settings → Secrets → SUPABASE_SERVICE_ROLE_KEY"
echo "2. Or from your Supabase project settings"
echo ""

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY is not set"
  echo ""
  echo "Run this command with your actual key:"
  echo "  SUPABASE_SERVICE_ROLE_KEY='your-key' $0"
  exit 1
fi

# Set up environment
export NEXT_PUBLIC_SUPABASE_URL="https://amqxsmdcvhyaudzbmhaf.supabase.co"
export SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"

# Run the collection
echo "✅ Environment configured, starting collection..."
echo ""

cd /workspaces/retail-platform-develop
node scripts/workflows/collect-sensor-data.js