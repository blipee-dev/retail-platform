#!/usr/bin/env python3
"""
Quick script to check if live data is being collected
"""
import requests
import json
from datetime import datetime

def check_live_data():
    """Check recent data from the API"""
    try:
        # Check recent data
        response = requests.get('http://localhost:3001/api/test/check-recent-data')
        if response.status_code == 200:
            data = response.json()
            print("=== LIVE DATA CHECK ===")
            print(f"Total records in last hour: {data['total_records']}")
            print(f"Unique timestamps: {data['unique_timestamps']}")
            print(f"\nRecords by sensor:")
            for sensor, count in data.get('records_by_sensor', {}).items():
                print(f"  {sensor}: {count} records")
            
            print(f"\nLatest timestamps:")
            for ts in data.get('timestamps', [])[:5]:
                print(f"  {ts}")
                
            # Check specific data
            response2 = requests.get('http://localhost:3001/api/test/check-data')
            if response2.status_code == 200:
                latest = response2.json()
                print(f"\n=== LATEST METRICS ===")
                for record in latest.get('data', [])[:4]:
                    print(f"\n{record['sensor']} @ {record['timestamp']}")
                    print(f"  Entries: {record['store_entries']}, Exits: {record['store_exits']}")
                    print(f"  Passing: {record['total_passing']}, Capture Rate: {record['capture_rate']}")
                    print(f"  Current Occupancy Change: {record['current_occupancy_change']}")
                    
        else:
            print(f"Error: {response.status_code}")
            
    except Exception as e:
        print(f"Error checking data: {str(e)}")

if __name__ == "__main__":
    check_live_data()