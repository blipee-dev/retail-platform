#!/bin/bash

# Run hourly and daily aggregations for July 2025 data
# This script calls the existing aggregation endpoints directly

echo "📊 Running July 2025 Aggregations"
echo "=================================="
echo ""

# Supabase credentials
export SUPABASE_URL='https://amqxsmdcvhyaudzbmhaf.supabase.co'
export SUPABASE_SERVICE_ROLE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkJXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M'

# Call Supabase RPC function to aggregate all historical data
echo "🔧 Calling Supabase aggregation function..."

# Aggregate all hourly data from July 1st
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/aggregate_hourly_data_range" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2025-07-01T00:00:00Z",
    "end_date": "2025-07-24T23:59:59Z"
  }'

echo ""
echo "✅ Aggregation request sent!"
echo ""
echo "Note: If the RPC function doesn't exist, you'll need to create it or"
echo "modify the hourly aggregation script to accept date parameters."