#!/usr/bin/env python3
"""Set up region configurations for all stores"""

import requests
import json

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def setup_regions():
    """Set up region configurations"""
    print("🗺️  Setting Up Region Configurations")
    print("=" * 80)
    
    # Get all active sensors with store info
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*,stores(*)",
        headers=headers
    )
    
    if not response.ok:
        print(f"❌ Failed to get sensors: {response.status_code}")
        return
        
    sensors = response.json()
    
    # Region templates based on sensor configurations
    region_templates = {
        "OML01-PC": [
            {"id": "region1", "name": "Entrance Area", "type": "entrance", "capacity": 50},
            {"id": "region2", "name": "Central Plaza", "type": "shopping", "capacity": 200},
            {"id": "region3", "name": "Food Court Queue", "type": "queue", "capacity": 30},
            {"id": "region4", "name": "Premium Stores", "type": "high-value", "capacity": 80}
        ],
        "OML02-PC": [
            {"id": "region1", "name": "Entrance Zone", "type": "entrance", "capacity": 40},
            {"id": "region2", "name": "Main Shopping Area", "type": "shopping", "capacity": 150},
            {"id": "region3", "name": "Checkout Queue", "type": "queue", "capacity": 25},
            {"id": "region4", "name": "Storefront Display", "type": "window", "capacity": 20}
        ],
        "OML03-PC": [
            {"id": "region1", "name": "Mall Entrance", "type": "entrance", "capacity": 60},
            {"id": "region2", "name": "Central Corridor", "type": "shopping", "capacity": 250},
            {"id": "region3", "name": "Food Court", "type": "dining", "capacity": 100},
            {"id": "region4", "name": "Premium Wing", "type": "high-value", "capacity": 40}
        ],
        "J&J-ARR-01-PC": [
            {"id": "region1", "name": "Entrance Zone", "type": "entrance", "capacity": 30},
            {"id": "region2", "name": "Shopping Zone", "type": "shopping", "capacity": 100},
            {"id": "region3", "name": "Checkout Zone", "type": "queue", "capacity": 20},
            {"id": "region4", "name": "Window Zone", "type": "window", "capacity": 15}
        ]
    }
    
    for sensor in sensors:
        if not sensor.get('stores'):
            print(f"⚠️  Sensor {sensor['sensor_name']} has no store associated")
            continue
            
        store = sensor['stores']
        sensor_name = sensor['sensor_name']
        
        print(f"\n📍 Setting up regions for {sensor_name} at {store['name']}...")
        
        # Get region template
        template = region_templates.get(sensor_name, region_templates["J&J-ARR-01-PC"])
        
        for region in template:
            # Check if already exists
            check_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/region_configurations?store_id=eq.{store['id']}&region_id=eq.{region['id']}",
                headers=headers
            )
            
            if check_response.ok and check_response.json():
                print(f"  · {region['id']}: {region['name']} - already configured")
                continue
            
            # Create configuration
            config_data = {
                "store_id": store['id'],
                "organization_id": store['organization_id'],
                "region_id": region['id'],
                "region_name": region['name'],
                "region_type": region['type'],
                "description": f"{region['name']} - {region['type']} area",
                "configuration": {
                    "capacity": region['capacity'],
                    "thresholds": {
                        "warning": 0.7,  # 70% capacity
                        "critical": 0.9  # 90% capacity
                    },
                    "metrics": ["occupancy", "dwell_time", "flow_rate"],
                    "calculation_method": "sensor_direct" if "OML" in sensor_name else "virtual_calculation"
                },
                "is_active": True
            }
            
            insert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/region_configurations",
                json=config_data,
                headers=headers
            )
            
            if insert_response.ok:
                print(f"  ✅ {region['id']}: {region['name']} - configured")
            else:
                print(f"  ❌ Failed to configure {region['name']}: {insert_response.text}")
    
    print("\n\n📊 Region Configuration Summary:")
    
    # Get summary
    summary_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/region_configurations?select=store_id,region_id,region_name",
        headers=headers
    )
    
    if summary_response.ok:
        configs = summary_response.json()
        print(f"Total regions configured: {len(configs)}")
        
        # Group by store
        by_store = {}
        for config in configs:
            store_id = config['store_id']
            if store_id not in by_store:
                by_store[store_id] = []
            by_store[store_id].append(config['region_name'])
        
        print(f"Stores with regions: {len(by_store)}")

if __name__ == "__main__":
    setup_regions()