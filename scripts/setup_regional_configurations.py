#!/usr/bin/env python3
"""Setup region configurations for Omnia sensors"""

import requests
import json
import sys

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

# Omnia sensors with their region definitions
omnia_sensors = [
    {
        'sensor_id': 'f63ef2e9-344e-4373-aedf-04dd05cf8f8b',
        'sensor_name': 'OML01-PC',
        'regions': {
            1: {'name': 'Entrance Area', 'type': 'entrance', 'capacity': 100},
            2: {'name': 'Central Plaza', 'type': 'shopping', 'capacity': 800},
            3: {'name': 'Food Court Queue', 'type': 'service', 'capacity': 200},
            4: {'name': 'Premium Stores', 'type': 'shopping', 'capacity': 150}
        }
    },
    {
        'sensor_id': '7976051c-980b-45e1-b099-45d032f3c7aa',
        'sensor_name': 'OML02-PC',
        'regions': {
            1: {'name': 'Entrance Zone', 'type': 'entrance', 'capacity': 80},
            2: {'name': 'Main Shopping Area', 'type': 'shopping', 'capacity': 500},
            3: {'name': 'Checkout Queue', 'type': 'service', 'capacity': 100},
            4: {'name': 'Storefront Display', 'type': 'shopping', 'capacity': 200}
        }
    },
    {
        'sensor_id': '29e75799-328f-4143-9a2f-2bcc1269f77e',
        'sensor_name': 'OML03-PC',
        'regions': {
            1: {'name': 'Mall Entrance', 'type': 'entrance', 'capacity': 150},
            2: {'name': 'Central Corridor', 'type': 'transition', 'capacity': 600},
            3: {'name': 'Food Court', 'type': 'service', 'capacity': 400},
            4: {'name': 'Premium Wing', 'type': 'shopping', 'capacity': 300}
        }
    }
]

def get_sensor_store_id(sensor_id):
    """Get store_id for a sensor"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?id=eq.{sensor_id}",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        if data:
            return data[0].get('store_id')
    return None

def check_existing_regions(sensor_id):
    """Check if regions already exist for a sensor"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/region_configurations?sensor_id=eq.{sensor_id}",
        headers=headers
    )
    
    if response.ok:
        return response.json()
    return []

def create_region_configuration(sensor_id, store_id, region_number, region_info):
    """Create a region configuration"""
    data = {
        'sensor_id': sensor_id,
        'store_id': store_id,
        'region_number': region_number,
        'region_type': region_info['type'],
        'region_name': region_info['name'],
        'capacity': region_info['capacity'],
        'business_purpose': f"{region_info['type'].title()} area for customer {region_info['type']}",
        'is_active': True,
        'alert_thresholds': {
            'high_occupancy_percent': 0.8,
            'critical_occupancy_percent': 0.95
        }
    }
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/region_configurations",
        headers=headers,
        json=data
    )
    
    return response.ok, response.text

def main():
    print("🔧 Setting up Regional Configurations for Omnia Sensors")
    print("=" * 60)
    
    for sensor in omnia_sensors:
        print(f"\n📡 Processing {sensor['sensor_name']} ({sensor['sensor_id']})")
        
        # Get store ID
        store_id = get_sensor_store_id(sensor['sensor_id'])
        if not store_id:
            print(f"  ❌ Could not find store_id for sensor {sensor['sensor_id']}")
            continue
            
        print(f"  ✅ Found store_id: {store_id}")
        
        # Check existing regions
        existing = check_existing_regions(sensor['sensor_id'])
        existing_numbers = [r['region_number'] for r in existing]
        
        if existing:
            print(f"  ℹ️  Found {len(existing)} existing region configurations")
            for r in existing:
                print(f"     - Region {r['region_number']}: {r['region_name']}")
        
        # Create missing regions
        created_count = 0
        for region_num, region_info in sensor['regions'].items():
            if region_num not in existing_numbers:
                success, result = create_region_configuration(
                    sensor['sensor_id'], 
                    store_id, 
                    region_num, 
                    region_info
                )
                
                if success:
                    print(f"  ✅ Created Region {region_num}: {region_info['name']}")
                    created_count += 1
                else:
                    print(f"  ❌ Failed to create Region {region_num}: {result}")
            else:
                print(f"  ⏭️  Region {region_num} already exists")
        
        if created_count > 0:
            print(f"  📊 Created {created_count} new region configurations")
    
    print("\n✅ Regional configuration setup complete!")
    
    # Verify all configurations
    print("\n📊 Verification Summary:")
    for sensor in omnia_sensors:
        existing = check_existing_regions(sensor['sensor_id'])
        print(f"  {sensor['sensor_name']}: {len(existing)} regions configured")

if __name__ == "__main__":
    main()