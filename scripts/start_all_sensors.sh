#!/bin/bash

# Start All Sensors Data Collection
# This script starts data collection for all configured sensors

echo "Starting sensor data collection..."

# Set API endpoint
API_URL="${API_URL:-http://localhost:3000}"
API_TOKEN="${API_TOKEN:-your-api-token}"

# Jack & Jones sensor
echo "Starting J&J Arrábida sensor..."
python scripts/sensor_data_bridge.py \
  --config config/sensors/jj_01_arrábida.json \
  --api-url $API_URL \
  --api-token $API_TOKEN \
  --store-id f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  --interval 300 &

# Omnia sensors
echo "Starting Omnia Guimarães sensor..."
python scripts/sensor_data_bridge.py \
  --config config/sensors/omnia_oml01_guimaraes.json \
  --api-url $API_URL \
  --api-token $API_TOKEN \
  --store-id f1234567-89ab-cdef-0123-456789abcdef \
  --interval 300 &

echo "Starting Omnia Almada sensor..."
python scripts/sensor_data_bridge.py \
  --config config/sensors/omnia_oml02_almada.json \
  --api-url $API_URL \
  --api-token $API_TOKEN \
  --store-id f2345678-9abc-def0-1234-56789abcdef0 \
  --interval 300 &

echo "Starting Omnia NorteShopping sensor..."
python scripts/sensor_data_bridge.py \
  --config config/sensors/omnia_oml03_norteshopping.json \
  --api-url $API_URL \
  --api-token $API_TOKEN \
  --store-id f3456789-abcd-ef01-2345-6789abcdef01 \
  --interval 300 &

echo "All sensors started. Use 'ps aux | grep sensor_data_bridge' to check status."
echo "Logs will be written to logs/sensor_*.log"

# Keep script running
wait