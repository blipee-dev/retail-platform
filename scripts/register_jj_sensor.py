#!/usr/bin/env python3
"""
Register J&J sensor in the system via API
"""

import os
import sys
import json
import requests
from datetime import datetime

# Configuration
API_BASE_URL = os.getenv('API_BASE_URL', 'http://localhost:3000')
API_TOKEN = os.getenv('API_TOKEN', '')  # You'll need to set this

def register_sensor():
    """Register the J&J sensor"""
    
    # Load sensor configuration
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sensors', 'jj_01_arrábida.json')
    with open(config_path, 'r') as f:
        config_data = json.load(f)
    
    # Prepare sensor registration data
    sensor_data = {
        'sensor_name': config_data['sensor_name'],
        'sensor_ip': config_data['connection']['host'],
        'sensor_port': config_data['connection']['port'],
        'sensor_type': 'milesight_people_counter',
        'location': config_data['location'],
        'timezone': config_data['timezone'],
        'store_id': 'YOUR_STORE_ID',  # You need to set this
        'connection_config': {
            'auth': config_data['connection']['auth'],
            'endpoints': config_data.get('endpoints', {}),
            'data_mapping': config_data['data_mapping']
        },
        'is_active': True,
        'features': {
            'supports_people_counting': True,
            'supports_regional_counting': config_data['data_mapping'].get('supports_regional_counting', False),
            'supports_real_time_status': config_data['data_mapping'].get('supports_real_time_status', False),
            'line_count': config_data['data_mapping'].get('line_count', 4),
            'region_count': config_data['data_mapping'].get('region_count', 4),
            'capture_rate_enabled': True  # New feature
        }
    }
    
    # Make API request to register sensor
    headers = {
        'Authorization': f'Bearer {API_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    response = requests.post(
        f'{API_BASE_URL}/api/sensors',
        json=sensor_data,
        headers=headers
    )
    
    if response.status_code == 201:
        result = response.json()
        print(f"✅ Sensor registered successfully!")
        print(f"   Sensor ID: {result['sensor']['id']}")
        print(f"   Name: {result['sensor']['sensor_name']}")
        print(f"   Store: {result['sensor']['location']}")
        
        # Save sensor ID for future use
        sensor_id = result['sensor']['id']
        
        # Update config file with sensor ID
        config_data['registered_sensor_id'] = sensor_id
        config_data['registered_at'] = datetime.now().isoformat()
        
        with open(config_path, 'w') as f:
            json.dump(config_data, f, indent=2)
        
        print(f"\n📝 Configuration updated with sensor ID: {sensor_id}")
        
        return sensor_id
        
    else:
        print(f"❌ Failed to register sensor: {response.status_code}")
        print(f"   Response: {response.text}")
        return None


def test_sensor_api(sensor_id):
    """Test the sensor API endpoints"""
    print(f"\n🧪 Testing sensor API endpoints...")
    
    headers = {
        'Authorization': f'Bearer {API_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Test GET sensor details
    response = requests.get(
        f'{API_BASE_URL}/api/sensors/{sensor_id}',
        headers=headers
    )
    
    if response.status_code == 200:
        sensor = response.json()['sensor']
        print(f"✅ GET /api/sensors/{sensor_id} - Success")
        print(f"   Status: {'Active' if sensor['is_active'] else 'Inactive'}")
        print(f"   Last seen: {sensor.get('last_seen_at', 'Never')}")
    else:
        print(f"❌ GET /api/sensors/{sensor_id} - Failed ({response.status_code})")


def main():
    """Main function"""
    print("🚀 J&J Sensor Registration")
    print("=" * 50)
    
    if not API_TOKEN:
        print("❌ Error: API_TOKEN environment variable not set")
        print("   Please set: export API_TOKEN='your_token_here'")
        return
    
    # Register the sensor
    sensor_id = register_sensor()
    
    if sensor_id:
        # Test the API
        test_sensor_api(sensor_id)
        
        print(f"\n✨ Next steps:")
        print(f"1. Start data collection:")
        print(f"   python scripts/sensor_data_bridge.py \\")
        print(f"     --config config/sensors/jj_01_arrábida.json \\")
        print(f"     --api-url {API_BASE_URL} \\")
        print(f"     --api-token $API_TOKEN \\")
        print(f"     --store-id YOUR_STORE_ID \\")
        print(f"     --interval 300")
        print(f"\n2. View sensor dashboard:")
        print(f"   {API_BASE_URL}/dashboard/sensors/{sensor_id}")


if __name__ == "__main__":
    main()