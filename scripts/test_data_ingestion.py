#!/usr/bin/env python3
"""Test data ingestion by sending sample data to the API."""

import requests
import json
from datetime import datetime, timedelta

def test_ingestion():
    """Test sending data to the ingestion API."""
    
    # API endpoint
    api_url = "http://localhost:3000/api/analytics/test-ingestion"
    
    # Create sample data from actual sensor readings
    now = datetime.now()
    
    test_data = {
        "data": [
            {
                "sensor_id": "176.79.62.167:2102",
                "organization": "jack-jones",
                "store": "J&J - 01 - ArrábidaShopping",
                "timestamp": now.isoformat(),
                "data": {
                    "line1_in": 9,
                    "line1_out": 10,
                    "line2_in": 0,
                    "line2_out": 0,
                    "line3_in": 0,
                    "line3_out": 0,
                    "line4_in": 27,
                    "line4_out": 54,
                    "total_in": 9,
                    "total_out": 10,
                    "passing_traffic": 81,
                    "capture_rate": 11.1
                }
            },
            {
                "sensor_id": "93.108.96.96:21001",
                "organization": "omnia",
                "store": "OML01 - Omnia Guimarães Shopping",
                "timestamp": now.isoformat(),
                "data": {
                    "line1_in": 14,
                    "line1_out": 11,
                    "line2_in": 0,
                    "line2_out": 0,
                    "line3_in": 0,
                    "line3_out": 0,
                    "line4_in": 391,
                    "line4_out": 124,
                    "total_in": 14,
                    "total_out": 11,
                    "passing_traffic": 515,
                    "capture_rate": 2.7
                }
            },
            {
                "sensor_id": "188.37.175.41:2201",
                "organization": "omnia",
                "store": "OML02 - Omnia Fórum Almada",
                "timestamp": (now - timedelta(minutes=5)).isoformat(),
                "data": {
                    "line1_in": 4,
                    "line1_out": 6,
                    "line2_in": 4,
                    "line2_out": 7,
                    "line3_in": 0,
                    "line3_out": 0,
                    "line4_in": 222,
                    "line4_out": 204,
                    "total_in": 8,
                    "total_out": 13,
                    "passing_traffic": 426,
                    "capture_rate": 1.9
                }
            },
            {
                "sensor_id": "188.37.124.33:21002",
                "organization": "omnia",
                "store": "OML03 - Omnia NorteShopping",
                "timestamp": (now - timedelta(minutes=10)).isoformat(),
                "data": {
                    "line1_in": 13,
                    "line1_out": 8,
                    "line2_in": 0,
                    "line2_out": 0,
                    "line3_in": 0,
                    "line3_out": 0,
                    "line4_in": 97,
                    "line4_out": 199,
                    "total_in": 13,
                    "total_out": 8,
                    "passing_traffic": 296,
                    "capture_rate": 4.4
                }
            }
        ]
    }
    
    print("📤 Sending test data to ingestion API...")
    print(f"   URL: {api_url}")
    print(f"   Records: {len(test_data['data'])}")
    
    try:
        # Send the request
        response = requests.post(
            api_url,
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Data ingestion successful!")
            result = response.json()
            print(f"   Message: {result.get('message', 'No message')}")
            if 'processed' in result:
                print(f"   Processed: {result['processed']} records")
            if 'details' in result:
                print(f"   Details: {json.dumps(result['details'], indent=2)}")
        else:
            print("❌ Data ingestion failed!")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        

def test_regional_data():
    """Test sending regional data to the API."""
    
    # API endpoint
    api_url = "http://localhost:3000/api/analytics/regions"
    
    # Create sample regional data
    now = datetime.now()
    
    test_data = {
        "data": [
            {
                "sensor_id": "93.108.96.96:21001",
                "organization": "omnia",
                "store": "OML01 - Omnia Guimarães Shopping",
                "timestamp": now.isoformat(),
                "data": {
                    "region1_count": 232,
                    "region2_count": 985,
                    "region3_count": 1120,
                    "region4_count": 35,
                    "total_regional_count": 2372
                }
            }
        ]
    }
    
    print("\n📤 Sending regional test data...")
    print(f"   URL: {api_url}")
    
    try:
        response = requests.post(
            api_url,
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\n📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Regional data ingestion successful!")
        else:
            print("❌ Regional data ingestion failed!")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def check_data():
    """Check if data was stored by querying the API."""
    
    # API endpoint
    api_url = "http://localhost:3000/api/analytics/unified?endpoint=realtime"
    
    print("\n🔍 Checking stored data...")
    print(f"   URL: {api_url}")
    
    try:
        response = requests.get(api_url)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Data retrieval successful!")
            
            if 'stores' in data:
                print(f"\n📊 Found data for {len(data['stores'])} stores:")
                for store in data['stores']:
                    print(f"\n   Store: {store['name']}")
                    print(f"   - Current Occupancy: {store['occupancy']['current']}")
                    print(f"   - Total In: {store['totals']['in']}")
                    print(f"   - Total Out: {store['totals']['out']}")
                    print(f"   - Capture Rate: {store['captureRate']:.1f}%")
        else:
            print("❌ Data retrieval failed!")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def main():
    """Run all tests."""
    print("="*60)
    print("TESTING DATA INGESTION API")
    print("="*60)
    
    # Test people counting data ingestion
    test_ingestion()
    
    # Test regional data ingestion
    test_regional_data()
    
    # Check if data was stored
    check_data()
    
    print("\n" + "="*60)
    print("TEST COMPLETE")
    print("="*60)


if __name__ == "__main__":
    main()