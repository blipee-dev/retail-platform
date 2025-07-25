#!/usr/bin/env python3
"""
Quick one-time check of the data pipeline status
"""

import os
import sys
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def check_pipeline_status():
    """Check current status of all pipeline stages"""
    
    # Initialize Supabase client
    url = os.environ.get("SUPABASE_URL") or os.environ.get("BLIPEE_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("BLIPEE_SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return
    
    supabase: Client = create_client(url, key)
    
    print("🔍 Data Pipeline Status Check")
    print(f"📅 Current UTC time: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    now = datetime.utcnow()
    one_hour_ago = now - timedelta(hours=1)
    today = now.date()
    
    # 1. Check raw data collection
    try:
        result = supabase.table('people_counting_raw')\
            .select('*', count='exact')\
            .gte('timestamp', one_hour_ago.isoformat())\
            .execute()
        
        raw_count = len(result.data) if result.data else 0
        latest_raw = None
        if result.data and len(result.data) > 0:
            latest_raw = max(r['timestamp'] for r in result.data)
        
        print(f"\n📥 Raw Data Collection:")
        print(f"   Status: {'✅ Active' if raw_count > 0 else '❌ No recent data'}")
        print(f"   Records (last hour): {raw_count}")
        if latest_raw:
            print(f"   Latest timestamp: {latest_raw}")
    except Exception as e:
        print(f"\n📥 Raw Data Collection: ❌ Error - {str(e)}")
    
    # 2. Check processed data
    try:
        result = supabase.table('people_counting_data')\
            .select('*', count='exact')\
            .gte('timestamp', one_hour_ago.isoformat())\
            .execute()
        
        processed_count = len(result.data) if result.data else 0
        print(f"\n📊 Processed Data:")
        print(f"   Status: {'✅ Active' if processed_count > 0 else '❌ No recent data'}")
        print(f"   Records (last hour): {processed_count}")
    except Exception as e:
        print(f"\n📊 Processed Data: ❌ Error - {str(e)}")
    
    # 3. Check hourly analytics
    try:
        result = supabase.table('hourly_analytics')\
            .select('*')\
            .eq('date', today.isoformat())\
            .execute()
        
        hourly_count = len(result.data) if result.data else 0
        current_hour = now.hour
        expected_hours = current_hour + 1
        
        print(f"\n📈 Hourly Analytics:")
        print(f"   Status: {'✅ Working' if hourly_count > 0 else '❌ No data'}")
        print(f"   Today's records: {hourly_count}/{expected_hours} hours")
        print(f"   Coverage: {(hourly_count / expected_hours * 100):.0f}%" if expected_hours > 0 else "0%")
        
        if result.data and len(result.data) > 0:
            latest_hour = max(r.get('hour', 0) for r in result.data)
            print(f"   Latest hour processed: {latest_hour}:00")
    except Exception as e:
        print(f"\n📈 Hourly Analytics: ❌ Error - {str(e)}")
    
    # 4. Check daily analytics
    try:
        result = supabase.table('daily_analytics')\
            .select('*')\
            .eq('date', today.isoformat())\
            .execute()
        
        daily_count = len(result.data) if result.data else 0
        print(f"\n📊 Daily Analytics:")
        print(f"   Status: {'✅ Generated' if daily_count > 0 else '⏳ Not yet generated'}")
        print(f"   Today's records: {daily_count}")
        
        if result.data and len(result.data) > 0:
            total_traffic = sum(r.get('total_in', 0) + r.get('total_out', 0) for r in result.data)
            print(f"   Total traffic today: {total_traffic}")
    except Exception as e:
        print(f"\n📊 Daily Analytics: ❌ Error - {str(e)}")
    
    # 5. Check sensor health
    try:
        # Get active sensors
        sensors = supabase.table('sensor_metadata')\
            .select('id, sensor_name, is_active')\
            .eq('is_active', True)\
            .execute()
        
        active_sensors = len(sensors.data) if sensors.data else 0
        
        # Check which sensors have recent data
        sensors_with_data = 0
        if sensors.data:
            for sensor in sensors.data:
                sensor_data = supabase.table('people_counting_raw')\
                    .select('id')\
                    .eq('sensor_id', sensor['id'])\
                    .gte('timestamp', one_hour_ago.isoformat())\
                    .limit(1)\
                    .execute()
                
                if sensor_data.data and len(sensor_data.data) > 0:
                    sensors_with_data += 1
                    print(f"\n   ✅ {sensor['sensor_name']}: Active")
                else:
                    print(f"\n   ⚠️  {sensor['sensor_name']}: No recent data")
        
        print(f"\n🔧 Sensor Health:")
        print(f"   Active sensors: {active_sensors}")
        print(f"   Reporting data: {sensors_with_data}/{active_sensors}")
        print(f"   Health: {(sensors_with_data / active_sensors * 100):.0f}%" if active_sensors > 0 else "0%")
    except Exception as e:
        print(f"\n🔧 Sensor Health: ❌ Error - {str(e)}")
    
    # 6. Summary
    print("\n" + "=" * 60)
    print("📋 Summary:")
    print("   - Raw data collection: Check GitHub Actions for recent runs")
    print("   - Analytics aggregation: Should run every hour at :05")
    print("   - Regional data: Should run every hour")
    print("   - Next aggregation: Check GitHub Actions schedule")
    
    # Check for any issues
    issues = []
    if raw_count == 0:
        issues.append("No raw data in last hour")
    if processed_count == 0:
        issues.append("No processed data in last hour")
    if hourly_count == 0:
        issues.append("No hourly analytics for today")
    
    if issues:
        print("\n⚠️  Issues detected:")
        for issue in issues:
            print(f"   - {issue}")
        print("\n💡 Suggestions:")
        print("   1. Check GitHub Actions for workflow errors")
        print("   2. Verify sensor credentials are correct")
        print("   3. Run 'SELECT run_all_aggregations()' in Supabase")
    else:
        print("\n✅ All systems operational!")

if __name__ == "__main__":
    check_pipeline_status()