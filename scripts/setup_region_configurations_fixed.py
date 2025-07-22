#!/usr/bin/env python3
"""Set up region configurations with correct schema"""

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
    """Set up region configurations with correct schema"""
    print("🗺️  Setting Up Region Configurations (Fixed)")
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
    
    # Region templates
    region_templates = {
        "OML01-PC": [
            {"num": 1, "name": "Entrance Area", "type": "entrance", "capacity": 50, "purpose": "Main store entrance monitoring"},
            {"num": 2, "name": "Central Plaza", "type": "shopping", "capacity": 200, "purpose": "Main shopping area analytics"},
            {"num": 3, "name": "Food Court Queue", "type": "queue", "capacity": 30, "purpose": "Queue management and wait times"},
            {"num": 4, "name": "Premium Stores", "type": "high-value", "capacity": 80, "purpose": "Premium zone engagement tracking"}
        ],
        "OML02-PC": [
            {"num": 1, "name": "Entrance Zone", "type": "entrance", "capacity": 40, "purpose": "Store entrance and exit tracking"},
            {"num": 2, "name": "Main Shopping Area", "type": "shopping", "capacity": 150, "purpose": "Product browsing behavior"},
            {"num": 3, "name": "Checkout Queue", "type": "queue", "capacity": 25, "purpose": "Checkout efficiency monitoring"},
            {"num": 4, "name": "Storefront Display", "type": "window", "capacity": 20, "purpose": "Window shopping conversion"}
        ],
        "OML03-PC": [
            {"num": 1, "name": "Mall Entrance", "type": "entrance", "capacity": 60, "purpose": "Mall traffic flow analysis"},
            {"num": 2, "name": "Central Corridor", "type": "shopping", "capacity": 250, "purpose": "Main corridor navigation patterns"},
            {"num": 3, "name": "Food Court", "type": "dining", "capacity": 100, "purpose": "Dining area occupancy"},
            {"num": 4, "name": "Premium Wing", "type": "high-value", "capacity": 40, "purpose": "Luxury retail engagement"}
        ],
        "default": [
            {"num": 1, "name": "Entrance Zone", "type": "entrance", "capacity": 30, "purpose": "Entry/exit monitoring"},
            {"num": 2, "name": "Shopping Zone", "type": "shopping", "capacity": 100, "purpose": "Shopping behavior analysis"},
            {"num": 3, "name": "Checkout Zone", "type": "queue", "capacity": 20, "purpose": "Queue and service monitoring"},
            {"num": 4, "name": "Window Zone", "type": "window", "capacity": 15, "purpose": "External capture rate"}
        ]
    }
    
    successful_configs = 0
    
    for sensor in sensors:
        if not sensor.get('stores'):
            print(f"⚠️  Sensor {sensor['sensor_name']} has no store associated")
            continue
            
        store = sensor['stores']
        sensor_name = sensor['sensor_name']
        
        print(f"\n📍 Setting up regions for {sensor_name} at {store['name']}...")
        
        # Get region template
        template = region_templates.get(sensor_name, region_templates["default"])
        
        for region in template:
            # Check if already exists
            check_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/region_configurations?sensor_id=eq.{sensor['id']}&region_number=eq.{region['num']}",
                headers=headers
            )
            
            if check_response.ok and check_response.json():
                print(f"  · Region {region['num']}: {region['name']} - already configured")
                continue
            
            # Create configuration with correct schema
            config_data = {
                "store_id": store['id'],
                "sensor_id": sensor['id'],
                "region_number": region['num'],
                "region_type": region['type'],
                "region_name": region['name'],
                "business_purpose": region['purpose'],
                "capacity": region['capacity'],
                "physical_location": {
                    "zone": f"region{region['num']}",
                    "description": region['purpose']
                },
                "alert_thresholds": {
                    "warning": 0.7,  # 70% capacity
                    "critical": 0.9,  # 90% capacity
                    "min_dwell_seconds": 10 if region['type'] == 'entrance' else 60
                },
                "custom_properties": {
                    "calculation_method": "sensor_direct" if "OML" in sensor_name else "virtual_from_lines",
                    "metrics": ["occupancy", "dwell_time", "flow_rate"]
                },
                "is_active": True
            }
            
            insert_response = requests.post(
                f"{SUPABASE_URL}/rest/v1/region_configurations",
                json=config_data,
                headers=headers
            )
            
            if insert_response.ok:
                print(f"  ✅ Region {region['num']}: {region['name']} - configured")
                successful_configs += 1
            else:
                print(f"  ❌ Failed to configure {region['name']}: {insert_response.text}")
    
    print(f"\n\n📊 Configuration Summary:")
    print(f"Successfully configured: {successful_configs} regions")
    
    # Show summary
    summary_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/region_configurations?select=store_id,sensor_id,region_number,region_name&order=sensor_id,region_number",
        headers=headers
    )
    
    if summary_response.ok:
        configs = summary_response.json()
        print(f"\nTotal regions in database: {len(configs)}")
        
        # Group by sensor
        by_sensor = {}
        for config in configs:
            sensor_id = config['sensor_id'][:8]  # Short ID for display
            if sensor_id not in by_sensor:
                by_sensor[sensor_id] = []
            by_sensor[sensor_id].append(f"R{config['region_number']}: {config['region_name']}")
        
        print(f"\nRegions by sensor:")
        for sensor_id, regions in by_sensor.items():
            print(f"  {sensor_id}: {', '.join(regions)}")

if __name__ == "__main__":
    setup_regions()