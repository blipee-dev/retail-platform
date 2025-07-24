#!/bin/bash

# Quick test to see what's in the sensor_metadata table

if [ -z "$1" ]; then
  echo "Usage: $0 <SUPABASE_SERVICE_ROLE_KEY>"
  exit 1
fi

SUPABASE_URL="https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_KEY="$1"

echo "Testing Supabase sensor_metadata table..."
echo ""

# Query all sensors
curl -s "$SUPABASE_URL/rest/v1/sensor_metadata?select=sensor_id,sensor_name,status,store_id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" | jq '.'