#!/bin/bash

# Test Supabase Edge Function for Sensor Data Collection

echo "🧪 Testing Supabase Edge Function..."
echo ""

# Configuration
SUPABASE_URL="https://amqxsmdcvhyaudzbmhaf.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU"

# Make the request
echo "📡 Calling Edge Function..."
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${SUPABASE_URL}/functions/v1/collect-sensor-data" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}')

# Extract body and status code
body=$(echo "$response" | head -n -1)
status_code=$(echo "$response" | tail -n 1)

# Display results
echo ""
echo "📊 Response Status: $status_code"
echo ""
echo "📄 Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"
echo ""

# Check if successful
if [ "$status_code" = "200" ]; then
    echo "✅ Edge Function test successful!"
    
    # Parse results if jq is available
    if command -v jq &> /dev/null; then
        echo ""
        echo "📈 Collection Summary:"
        echo "$body" | jq -r '.results[] | "  - \(.sensor): \(.status) (\(.records_inserted // 0) records inserted)"'
    fi
else
    echo "❌ Edge Function test failed!"
    echo ""
    echo "Possible issues:"
    echo "1. Edge Function not deployed yet"
    echo "2. Authentication error"
    echo "3. Network connectivity issue"
    echo ""
    echo "To deploy the function:"
    echo "1. Go to https://app.supabase.com/project/amqxsmdcvhyaudzbmhaf/functions"
    echo "2. Create new function named 'collect-sensor-data'"
    echo "3. Copy content from supabase/functions/collect-sensor-data/index.ts"
fi