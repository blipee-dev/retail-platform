#!/usr/bin/env python3
"""Test single data ingestion."""

import requests
import json
from datetime import datetime

# API endpoint
api_url = "http://localhost:3000/api/analytics/test-ingestion"

# Create sample data with just one record
test_data = {
    "data": [
        {
            "sensor_id": "176.79.62.167:2102",
            "organization": "jack-jones",
            "store": "J&J Store",  # Simplified name
            "timestamp": datetime.now().isoformat(),
            "data": {
                "line1_in": 9,
                "line1_out": 10,
                "total_in": 9,
                "total_out": 10,
                "passing_traffic": 81,
                "capture_rate": 11.1
            }
        }
    ]
}

print("📤 Sending test data...")
print(f"   Store name: {test_data['data'][0]['store']}")

response = requests.post(
    api_url,
    json=test_data,
    headers={"Content-Type": "application/json"}
)

print(f"\n📥 Response Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")