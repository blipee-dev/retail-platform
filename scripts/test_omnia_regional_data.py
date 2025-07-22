#!/usr/bin/env python3
"""Test regional data collection from Omnia sensors"""

import requests
from datetime import datetime, timedelta
import json

def test_omnia_regional():
    """Test Omnia sensors for regional data"""
    print("🗺️  Testing Omnia Regional Data Collection")
    print("=" * 80)
    
    # Omnia sensors with regional configuration
    sensors = [
        {
            "name": "OML01-Guimarães",
            "base_url": "http://93.108.96.96:21001",
            "auth": ("admin", "grnl.2024"),
            "regions": {
                "region1": "Entrance Area",
                "region2": "Central Plaza", 
                "region3": "Food Court Queue",
                "region4": "Premium Stores"
            }
        },
        {
            "name": "OML02-Almada",
            "base_url": "http://93.108.96.96:21002",
            "auth": ("admin", "grnl.2024"),
            "regions": {
                "region1": "Entrance Zone",
                "region2": "Main Shopping Area",
                "region3": "Checkout Queue", 
                "region4": "Storefront Display"
            }
        },
        {
            "name": "OML03-NorteShopping",
            "base_url": "http://93.108.96.96:21003",
            "auth": ("admin", "grnl.2024"),
            "regions": {
                "region1": "Mall Entrance",
                "region2": "Central Corridor",
                "region3": "Food Court",
                "region4": "Premium Wing"
            }
        }
    ]
    
    # Time range
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=2)
    
    for sensor in sensors:
        print(f"\n📡 Testing {sensor['name']}...")
        
        # Try regional counting endpoint
        try:
            url = f"{sensor['base_url']}/api/v1/data"
            params = {
                "report_type": "regional_counting",
                "data_type": "15min",
                "start_time": start_time.strftime("%Y-%m-%d %H:%M:%S"),
                "end_time": end_time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            print(f"  URL: {url}")
            print(f"  Params: {json.dumps(params, indent=2)}")
            
            # Note: This will fail from Codespaces, but shows the correct API format
            response = requests.get(
                url,
                params=params,
                auth=sensor['auth'],
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Got regional data!")
                print(f"  Response: {json.dumps(data[:2] if isinstance(data, list) else data, indent=2)}")
                
                # Check for regional fields
                if isinstance(data, list) and len(data) > 0:
                    sample = data[0]
                    regional_fields = [k for k in sample.keys() if 'region' in k.lower()]
                    if regional_fields:
                        print(f"  ✅ Regional fields found: {regional_fields}")
                        for region_num in range(1, 5):
                            region_key = f"region{region_num}"
                            if region_key in sample:
                                print(f"    {sensor['regions'][region_key]}: {sample[region_key]}")
            else:
                print(f"  ❌ HTTP {response.status_code}: {response.text[:200]}")
                
        except requests.exceptions.Timeout:
            print(f"  ❌ Timeout - sensors not accessible from Codespaces")
            print(f"  💡 This needs to run from GitHub Actions")
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
    
    print("\n\n📋 Implementation Plan for Omnia Regional Data:")
    print("1. Modify GitHub Actions workflow to collect regional data")
    print("2. Add regional_counting endpoint to data collection")
    print("3. Store regional counts in regional_analytics table")
    print("4. Process data to calculate:")
    print("   - Regional occupancy over time")
    print("   - Dwell time per region")
    print("   - Flow between regions")
    print("   - Queue lengths (especially region3)")

if __name__ == "__main__":
    test_omnia_regional()