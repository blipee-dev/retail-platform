#!/usr/bin/env python3
"""Analyze where the data is coming from"""

import requests
from datetime import datetime, timezone
from collections import defaultdict

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def analyze_data():
    """Analyze data patterns to understand source"""
    print("🔍 Analyzing data in people_counting_raw...")
    print("=" * 80)
    
    # Get ALL data
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&order=created_at.desc",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        print(f"\nTotal records: {len(data)}")
        
        # Group by created_at time (when inserted)
        by_created = defaultdict(list)
        by_timestamp_pattern = defaultdict(int)
        
        for record in data:
            created = record['created_at'][:19]  # Remove microseconds
            by_created[created].append(record)
            
            # Check timestamp patterns
            ts = record['timestamp']
            minute = datetime.fromisoformat(ts.replace('Z', '+00:00')).minute
            by_timestamp_pattern[minute] += 1
        
        print(f"\n📅 Data insertion patterns:")
        print(f"Number of different insertion times: {len(by_created)}")
        
        # Show insertion batches
        print("\n🔄 Insertion batches (by created_at):")
        for created, records in sorted(by_created.items(), reverse=True)[:10]:
            print(f"\n{created}: {len(records)} records")
            # Show sample of what was inserted
            sensors = set(r['sensor_id'][:8] for r in records)
            print(f"  Sensors: {', '.join(sensors)}")
            timestamps = sorted(set(r['timestamp'] for r in records))
            if len(timestamps) <= 3:
                print(f"  Timestamps: {', '.join(timestamps)}")
            else:
                print(f"  Timestamps: {timestamps[0]} to {timestamps[-1]} ({len(timestamps)} different times)")
        
        print(f"\n⏰ Timestamp minute patterns:")
        for minute, count in sorted(by_timestamp_pattern.items()):
            print(f"  :{minute:02d} - {count} records")
        
        # Check for GitHub Actions pattern (should be every 30 minutes)
        print("\n🤖 Checking for GitHub Actions pattern...")
        
        # Get recent data only
        recent_cutoff = "2025-07-22T00:00:00"
        recent_data = [r for r in data if r['created_at'] > recent_cutoff]
        
        if recent_data:
            print(f"\nRecords created after {recent_cutoff}: {len(recent_data)}")
            
            # Group recent data by created_at
            recent_batches = defaultdict(list)
            for record in recent_data:
                created = record['created_at'][:16]  # Group by minute
                recent_batches[created].append(record)
            
            print("\nRecent insertion times:")
            for created, records in sorted(recent_batches.items(), reverse=True):
                print(f"  {created}: {len(records)} records")
        else:
            print("\n❌ No records created after midnight today!")
        
        # Check for test data pattern
        print("\n🧪 Checking for test data patterns...")
        test_pattern_count = 0
        for record in data:
            # Test data often has round numbers or all zeros
            if (record['line1_in'] == 0 and record['line1_out'] == 0 and 
                record['line2_in'] == 0 and record['line2_out'] == 0 and
                record['line3_in'] == 0 and record['line3_out'] == 0 and
                record['line4_in'] == 0 and record['line4_out'] == 0):
                test_pattern_count += 1
        
        print(f"Records with all zeros: {test_pattern_count} ({test_pattern_count/len(data)*100:.1f}%)")
        
        # Show actual movement data
        print("\n📊 Sample of actual movement data:")
        movement_data = [r for r in data if r['total_in'] > 0 or r['total_out'] > 0]
        print(f"Records with movement: {len(movement_data)}")
        
        for record in movement_data[:5]:
            print(f"\n{record['timestamp']} (created {record['created_at'][:19]})")
            print(f"  Sensor: {record['sensor_id'][:8]}...")
            print(f"  Movement: IN={record['total_in']}, OUT={record['total_out']}")

if __name__ == "__main__":
    analyze_data()