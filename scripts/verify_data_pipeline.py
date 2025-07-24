#!/usr/bin/env python3
"""Comprehensive verification of the retail platform data pipeline"""

import requests
import json
from datetime import datetime, timedelta
from tabulate import tabulate

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def check_table_data(table_name, order_by="created_at", limit=5):
    """Check if a table has data and show recent records"""
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&order={order_by}.desc&limit={limit}",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        count_response = requests.head(
            f"{SUPABASE_URL}/rest/v1/{table_name}?select=*",
            headers={**headers, 'Prefer': 'count=exact'}
        )
        total_count = count_response.headers.get('content-range', '').split('/')[-1] or '0'
        return {
            'count': int(total_count),
            'recent_data': data,
            'status': 'ok'
        }
    else:
        return {
            'count': 0,
            'recent_data': [],
            'status': 'error',
            'error': response.text
        }

def format_timestamp(ts):
    """Format timestamp for display"""
    if ts:
        try:
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00'))
            return dt.strftime('%Y-%m-%d %H:%M')
        except:
            return ts
    return 'N/A'

def main():
    print("🔍 Retail Platform Data Pipeline Verification")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # 1. Check Sensors
    print("1️⃣ SENSOR STATUS")
    print("-" * 80)
    
    sensors_data = check_table_data('sensor_metadata', 'created_at')
    if sensors_data['status'] == 'ok':
        print(f"✅ Active sensors: {sensors_data['count']}")
        if sensors_data['recent_data']:
            sensor_table = []
            for s in sensors_data['recent_data']:
                sensor_table.append([
                    s['sensor_name'],
                    s['sensor_type'],
                    'Active' if s.get('is_active', True) else 'Inactive',
                    s.get('sensor_ip', 'N/A')
                ])
            print(tabulate(sensor_table, headers=['Name', 'Type', 'Status', 'IP'], tablefmt='simple'))
    else:
        print(f"❌ Error checking sensors: {sensors_data['error']}")
    
    # 2. Check People Counting Data
    print("\n2️⃣ PEOPLE COUNTING DATA")
    print("-" * 80)
    
    pc_data = check_table_data('people_counting_raw', 'timestamp')
    if pc_data['status'] == 'ok':
        print(f"✅ Total records: {pc_data['count']}")
        if pc_data['recent_data']:
            print("\nRecent entries:")
            pc_table = []
            for r in pc_data['recent_data'][:3]:
                total_in = sum([r.get(f'line{i}_in', 0) for i in range(1, 5)])
                total_out = sum([r.get(f'line{i}_out', 0) for i in range(1, 5)])
                pc_table.append([
                    format_timestamp(r['timestamp']),
                    total_in,
                    total_out,
                    total_in - total_out
                ])
            print(tabulate(pc_table, headers=['Timestamp', 'In', 'Out', 'Net'], tablefmt='simple'))
    else:
        print(f"❌ Error: {pc_data['error']}")
    
    # 3. Check Regional Counting Data
    print("\n3️⃣ REGIONAL COUNTING DATA")
    print("-" * 80)
    
    rc_data = check_table_data('regional_counting_raw', 'timestamp')
    if rc_data['status'] == 'ok':
        print(f"✅ Total records: {rc_data['count']}")
        if rc_data['recent_data']:
            print("\nRecent entries:")
            rc_table = []
            for r in rc_data['recent_data'][:3]:
                rc_table.append([
                    format_timestamp(r['timestamp']),
                    r.get('region1_count', 0),
                    r.get('region2_count', 0),
                    r.get('region3_count', 0),
                    r.get('region4_count', 0),
                    r.get('total_regional_count', 0)
                ])
            print(tabulate(rc_table, headers=['Timestamp', 'R1', 'R2', 'R3', 'R4', 'Total'], tablefmt='simple'))
    else:
        print(f"❌ Error: {rc_data['error']}")
    
    # 4. Check Hourly Analytics
    print("\n4️⃣ HOURLY ANALYTICS")
    print("-" * 80)
    
    ha_data = check_table_data('hourly_analytics', 'hour_start')
    if ha_data['status'] == 'ok':
        print(f"✅ Total records: {ha_data['count']}")
        if ha_data['recent_data']:
            print("\nRecent hourly data:")
            ha_table = []
            for r in ha_data['recent_data'][:3]:
                ha_table.append([
                    format_timestamp(r['hour_start']),
                    r.get('total_entries', 0),
                    r.get('total_exits', 0),
                    r.get('peak_occupancy', 0),
                    r.get('avg_occupancy', 0)
                ])
            print(tabulate(ha_table, headers=['Hour', 'Entries', 'Exits', 'Peak', 'Avg'], tablefmt='simple'))
    else:
        print(f"❌ Error: {ha_data['error']}")
    
    # 5. Check Data Freshness
    print("\n5️⃣ DATA FRESHNESS CHECK")
    print("-" * 80)
    
    # Check most recent data timestamps
    tables_to_check = [
        ('people_counting_raw', 'timestamp', 'People Counting'),
        ('regional_counting_raw', 'timestamp', 'Regional Counting'),
        ('hourly_analytics', 'hour_start', 'Hourly Analytics')
    ]
    
    freshness_table = []
    for table, ts_field, name in tables_to_check:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table}?select={ts_field}&order={ts_field}.desc&limit=1",
            headers=headers
        )
        
        if response.ok and response.json():
            last_ts = response.json()[0][ts_field]
            last_dt = datetime.fromisoformat(last_ts.replace('Z', '+00:00'))
            age = datetime.now(last_dt.tzinfo) - last_dt
            
            if age < timedelta(hours=2):
                status = "✅ Fresh"
            elif age < timedelta(hours=6):
                status = "⚠️  Stale"
            else:
                status = "❌ Old"
            
            freshness_table.append([
                name,
                format_timestamp(last_ts),
                f"{int(age.total_seconds() / 60)} min ago",
                status
            ])
        else:
            freshness_table.append([name, "No data", "N/A", "❌ No data"])
    
    print(tabulate(freshness_table, headers=['Data Type', 'Last Update', 'Age', 'Status'], tablefmt='simple'))
    
    # 6. Check Analytics Aggregation
    print("\n6️⃣ ANALYTICS AGGREGATION STATUS")
    print("-" * 80)
    
    # Check if hourly analytics is being generated from raw data
    one_hour_ago = (datetime.now() - timedelta(hours=1)).isoformat()
    
    # Count raw records in last hour
    raw_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?timestamp=gte.{one_hour_ago}&select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    # Count hourly analytics for last hour
    hourly_response = requests.get(
        f"{SUPABASE_URL}/rest/v1/hourly_analytics?hour_start=gte.{one_hour_ago}&select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    raw_count = int(raw_response.headers.get('content-range', '0/0').split('/')[-1])
    hourly_count = int(hourly_response.headers.get('content-range', '0/0').split('/')[-1])
    
    print(f"Raw records (last hour): {raw_count}")
    print(f"Hourly analytics records: {hourly_count}")
    
    if raw_count > 0 and hourly_count == 0:
        print("⚠️  Warning: Raw data exists but no hourly analytics generated")
    elif raw_count > 0 and hourly_count > 0:
        print("✅ Analytics aggregation is working")
    else:
        print("ℹ️  No recent data to aggregate")
    
    # 7. Check Region Configurations
    print("\n7️⃣ REGION CONFIGURATIONS")
    print("-" * 80)
    
    regions_data = check_table_data('region_configurations', 'region_number')
    if regions_data['status'] == 'ok':
        print(f"✅ Configured regions: {regions_data['count']}")
        
        # Group by sensor
        sensors_with_regions = {}
        for r in regions_data['recent_data']:
            sensor_id = r.get('sensor_id', 'Unknown')
            if sensor_id not in sensors_with_regions:
                sensors_with_regions[sensor_id] = []
            sensors_with_regions[sensor_id].append(r['region_number'])
        
        print(f"Sensors with regions: {len(sensors_with_regions)}")
    else:
        print(f"❌ Error: {regions_data['error']}")
    
    # 8. Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("-" * 80)
    
    issues = []
    
    # Check for issues
    if pc_data['count'] == 0:
        issues.append("No people counting data")
    if rc_data['count'] == 0:
        issues.append("No regional counting data")
    if ha_data['count'] == 0:
        issues.append("No hourly analytics data")
    if raw_count > 0 and hourly_count == 0:
        issues.append("Analytics aggregation not working")
    
    if issues:
        print("⚠️  Issues found:")
        for issue in issues:
            print(f"   - {issue}")
    else:
        print("✅ All systems operational!")
    
    print("\n📌 Next Steps:")
    print("1. Ensure GitHub Actions workflows are running on schedule")
    print("2. Check workflow logs for any errors")
    print("3. Verify sensor connectivity and credentials")
    print("4. Monitor data freshness regularly")

if __name__ == "__main__":
    main()