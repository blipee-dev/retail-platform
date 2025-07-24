#!/usr/bin/env python3
"""Manual analytics aggregation for retail platform"""

import requests
import json
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def aggregate_hourly_analytics(start_hour=None, end_hour=None):
    """Aggregate raw people counting data into hourly analytics"""
    
    if not start_hour:
        start_hour = datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=24)
    if not end_hour:
        end_hour = datetime.now().replace(minute=0, second=0, microsecond=0)
    
    print(f"Aggregating hourly data from {start_hour} to {end_hour}")
    
    # Get all stores with organization_id
    stores_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/stores?select=id,name,organization_id",
        headers=headers
    )
    stores = stores_response.json() if stores_response.ok else []
    
    results = {'inserted': 0, 'updated': 0, 'errors': 0}
    
    # Process each hour
    current_hour = start_hour
    while current_hour < end_hour:
        next_hour = current_hour + timedelta(hours=1)
        
        for store in stores:
            # Get raw data for this hour and store
            raw_response = requests.get(
                f"{SUPABASE_URL}/rest/v1/people_counting_raw"
                f"?store_id=eq.{store['id']}"
                f"&timestamp=gte.{current_hour.isoformat()}"
                f"&timestamp=lt.{next_hour.isoformat()}"
                f"&select=*",
                headers=headers
            )
            
            if not raw_response.ok:
                results['errors'] += 1
                continue
                
            raw_data = raw_response.json()
            
            if raw_data:
                # Calculate aggregates
                total_entries = sum(
                    sum([r.get(f'line{i}_in', 0) for i in range(1, 5)])
                    for r in raw_data
                )
                total_exits = sum(
                    sum([r.get(f'line{i}_out', 0) for i in range(1, 5)])
                    for r in raw_data
                )
                
                # Calculate occupancy
                occupancies = []
                current_occupancy = 0
                for r in sorted(raw_data, key=lambda x: x['timestamp']):
                    entries = sum([r.get(f'line{i}_in', 0) for i in range(1, 5)])
                    exits = sum([r.get(f'line{i}_out', 0) for i in range(1, 5)])
                    current_occupancy += (entries - exits)
                    occupancies.append(max(0, current_occupancy))
                
                avg_occupancy = sum(occupancies) / len(occupancies) if occupancies else 0
                peak_occupancy = max(occupancies) if occupancies else 0
                
                # Prepare hourly record - using actual table columns
                hourly_record = {
                    'store_id': store['id'],
                    'organization_id': store.get('organization_id'),
                    'hour_start': current_hour.isoformat(),
                    'total_entries': total_entries,
                    'total_exits': total_exits,
                    'total_in': total_entries,  # Duplicate for compatibility
                    'total_out': total_exits,   # Duplicate for compatibility
                    'avg_occupancy': round(avg_occupancy, 2),
                    'peak_occupancy': peak_occupancy,
                    'net_flow': total_entries - total_exits,
                    'sample_count': len(raw_data),
                    'date': current_hour.date().isoformat(),
                    'hour': current_hour.hour
                }
                
                # Add line-specific data if available
                line_totals = {'in': [0, 0, 0, 0], 'out': [0, 0, 0, 0]}
                for r in raw_data:
                    for i in range(1, 5):
                        line_totals['in'][i-1] += r.get(f'line{i}_in', 0)
                        line_totals['out'][i-1] += r.get(f'line{i}_out', 0)
                
                for i in range(1, 5):
                    hourly_record[f'line{i}_in'] = line_totals['in'][i-1]
                    hourly_record[f'line{i}_out'] = line_totals['out'][i-1]
                
                # Check if record exists
                check_response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/hourly_analytics"
                    f"?store_id=eq.{store['id']}"
                    f"&hour_start=eq.{current_hour.isoformat()}"
                    f"&select=id",
                    headers=headers
                )
                
                if check_response.ok and check_response.json():
                    # Update existing record
                    update_response = requests.patch(
                        f"{SUPABASE_URL}/rest/v1/hourly_analytics"
                        f"?store_id=eq.{store['id']}"
                        f"&hour_start=eq.{current_hour.isoformat()}",
                        headers=headers,
                        json=hourly_record
                    )
                    if update_response.ok:
                        results['updated'] += 1
                    else:
                        results['errors'] += 1
                        print(f"Error updating: {update_response.text}")
                else:
                    # Insert new record
                    insert_response = requests.post(
                        f"{SUPABASE_URL}/rest/v1/hourly_analytics",
                        headers=headers,
                        json=hourly_record
                    )
                    if insert_response.ok:
                        results['inserted'] += 1
                    else:
                        results['errors'] += 1
                        print(f"Error inserting: {insert_response.text}")
        
        current_hour = next_hour
    
    return results

def aggregate_regional_hourly(start_hour=None, end_hour=None):
    """Aggregate regional counting data"""
    
    if not start_hour:
        start_hour = datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=24)
    if not end_hour:
        end_hour = datetime.now().replace(minute=0, second=0, microsecond=0)
    
    print(f"Aggregating regional data from {start_hour} to {end_hour}")
    
    # Get regional data
    regional_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/regional_counting_raw"
        f"?timestamp=gte.{start_hour.isoformat()}"
        f"&timestamp=lt.{end_hour.isoformat()}"
        f"&select=*",
        headers=headers
    )
    
    if regional_response.ok:
        regional_data = regional_response.json()
        print(f"Found {len(regional_data)} regional records to process")
        
        # Group by hour and store
        hourly_groups = {}
        for record in regional_data:
            timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
            hour_key = timestamp.replace(minute=0, second=0, microsecond=0).isoformat()
            store_id = record['store_id']
            
            key = f"{store_id}_{hour_key}"
            if key not in hourly_groups:
                hourly_groups[key] = []
            hourly_groups[key].append(record)
        
        print(f"Processing {len(hourly_groups)} hour/store combinations")
        
        # You could insert this data into a regional_hourly_analytics table if it exists
        # For now, just return the count
        return len(hourly_groups)
    
    return 0

def main():
    print("📊 Manual Analytics Aggregation")
    print("=" * 60)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run hourly aggregation for last 24 hours
    print("1️⃣ Aggregating People Counting Data...")
    pc_results = aggregate_hourly_analytics()
    print(f"   ✅ Inserted: {pc_results['inserted']}")
    print(f"   📝 Updated: {pc_results['updated']}")
    print(f"   ❌ Errors: {pc_results['errors']}")
    
    # Run regional aggregation
    print("\n2️⃣ Processing Regional Data...")
    regional_count = aggregate_regional_hourly()
    print(f"   ✅ Processed {regional_count} hour/store combinations")
    
    # Verify results
    print("\n3️⃣ Verification...")
    
    # Check recent hourly analytics
    recent_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/hourly_analytics?select=*&order=hour_start.desc&limit=5",
        headers=headers
    )
    
    if recent_response.ok:
        recent_data = recent_response.json()
        if recent_data:
            print("\nRecent hourly analytics:")
            for record in recent_data:
                print(f"   {record['hour_start']}: {record['total_entries']} IN, {record['total_exits']} OUT")
    
    print("\n✅ Aggregation complete!")

if __name__ == "__main__":
    main()