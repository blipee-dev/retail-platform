#!/usr/bin/env python3
"""Test UPSERT behavior with Supabase"""

import requests
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates,return=representation'
}

def test_upsert():
    """Test UPSERT behavior"""
    print("🔧 Testing UPSERT Behavior")
    print("=" * 80)
    
    # Get OML01-PC sensor ID
    sensor_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?sensor_name=eq.OML01-PC&select=id,organization_id,store_id",
        headers=headers
    )
    
    if sensor_response.ok and sensor_response.json():
        sensor = sensor_response.json()[0]
        print(f"Using sensor OML01-PC: {sensor['id']}")
        
        # First, check current 11:00 data
        check_response = requests.get(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&timestamp=eq.2025-07-22T11:00:00.000Z&select=*",
            headers=headers
        )
        
        if check_response.ok and check_response.json():
            current = check_response.json()[0]
            print(f"\nCurrent 11:00 data:")
            print(f"  Total IN: {current['total_in']}, Total OUT: {current['total_out']}")
            print(f"  Line 4: {current['line4_in']} IN, {current['line4_out']} OUT")
        
        # Now test UPSERT with updated values
        print("\n🔄 Testing UPSERT with updated values...")
        
        upsert_data = {
            "sensor_id": sensor['id'],
            "organization_id": sensor['organization_id'],
            "store_id": sensor['store_id'],
            "timestamp": "2025-07-22T11:00:00.000Z",
            "end_time": "2025-07-22T11:59:59.000Z",
            "line1_in": 5,  # Updated from 3
            "line1_out": 5,  # Updated from 3
            "line2_in": 0,
            "line2_out": 0,
            "line3_in": 0,
            "line3_out": 0,
            "line4_in": 350,  # Updated from 303
            "line4_out": 120   # Updated from 93
        }
        
        # Test with merge-duplicates preference
        upsert_response = requests.post(
            f"{SUPABASE_URL}/rest/v1/people_counting_raw",
            json=upsert_data,
            headers=headers
        )
        
        if upsert_response.ok:
            print("✅ UPSERT successful!")
            
            # Check if data was updated
            verify_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw?sensor_id=eq.{sensor['id']}&timestamp=eq.2025-07-22T11:00:00.000Z&select=*",
                headers=headers
            )
            
            if verify_response.ok and verify_response.json():
                updated = verify_response.json()[0]
                print(f"\nUpdated 11:00 data:")
                print(f"  Total IN: {updated['total_in']}, Total OUT: {updated['total_out']}")
                print(f"  Line 4: {updated['line4_in']} IN, {updated['line4_out']} OUT")
                
                if updated['line4_in'] == 350:
                    print("\n✅ UPSERT is working correctly! Data was updated.")
                else:
                    print("\n❌ UPSERT didn't update the data as expected.")
        else:
            print(f"❌ UPSERT failed: {upsert_response.status_code}")
            print(f"   {upsert_response.text}")
    else:
        print("❌ Could not find OML01-PC sensor")

if __name__ == "__main__":
    test_upsert()