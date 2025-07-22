#!/usr/bin/env python3
"""
Implement virtual regions based on line crossing data
Since sensors may not provide actual regional counting, we calculate it
"""

import requests
from datetime import datetime, timedelta
import json

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def setup_virtual_regions():
    """Set up virtual region configurations based on line mappings"""
    print("🗺️  Setting Up Virtual Regional Counting")
    print("=" * 80)
    
    # Get stores
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/stores?select=*",
        headers=headers
    )
    
    if not response.ok:
        print(f"❌ Failed to get stores: {response.status_code}")
        return
        
    stores = response.json()
    
    # Virtual region configurations
    # Based on typical retail layout and jj_01_virtual_regions.json
    virtual_regions = {
        "entrance": {
            "name": "Entrance Zone",
            "description": "Store entrance and immediate area",
            "lines": [1],  # Line 1 is typically the main entrance
            "type": "entry_exit"
        },
        "shopping": {
            "name": "Shopping Zone", 
            "description": "Main shopping floor",
            "lines": [2, 3],  # Lines 2 & 3 for internal movement
            "type": "browsing"
        },
        "checkout": {
            "name": "Checkout Zone",
            "description": "Payment and checkout area",
            "lines": [2],  # Line 2 often leads to checkout
            "type": "transaction"
        },
        "window": {
            "name": "Window Zone",
            "description": "Storefront and window shopping",
            "lines": [4],  # Line 4 for passing traffic
            "type": "attraction"
        }
    }
    
    # Insert region configurations for each store
    for store in stores:
        print(f"\n📍 Setting up regions for {store['name']}...")
        
        region_num = 1
        for region_key, region_config in virtual_regions.items():
            # Check if configuration already exists
            check_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/region_configurations?store_id=eq.{store['id']}&region_name=eq.{region_config['name']}",
                headers=headers
            )
            
            if check_response.ok and check_response.json():
                print(f"  · Region {region_num}: {region_config['name']} already configured")
            else:
                # Insert new configuration
                config_data = {
                    "store_id": store['id'],
                    "organization_id": store['organization_id'],
                    "region_id": f"region{region_num}",
                    "region_name": region_config['name'],
                    "region_type": region_config['type'],
                    "description": region_config['description'],
                    "configuration": {
                        "associated_lines": region_config['lines'],
                        "calculation_method": "line_based",
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
                    print(f"  ✅ Region {region_num}: {region_config['name']} configured")
                else:
                    print(f"  ❌ Failed to configure {region_config['name']}: {insert_response.status_code}")
                    print(f"     {insert_response.text}")
                    
            region_num += 1
    
    print("\n\n📊 Virtual Region Calculation Logic:")
    print("Since sensors provide line crossing data, we calculate regional occupancy as:")
    print("\n1. Entrance Zone Occupancy = Line1_in - Line1_out")
    print("2. Shopping Zone Occupancy = (Line2_in + Line3_in) - (Line2_out + Line3_out)")
    print("3. Checkout Zone Activity = Line2 movement patterns")
    print("4. Window Zone Activity = Line4 traffic (capture rate)")
    
    print("\n✅ Virtual regions configured!")
    print("\nNext steps:")
    print("1. Process historical line data to calculate regional occupancy")
    print("2. Set up real-time regional analytics based on line crossings")
    print("3. Create dashboards to visualize regional data")

if __name__ == "__main__":
    setup_virtual_regions()