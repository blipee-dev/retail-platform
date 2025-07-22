#!/usr/bin/env python3
"""Find data inserted by GitHub Actions"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}'
}

def find_github_actions_data():
    """Find data that was likely inserted by GitHub Actions"""
    print("🔍 Finding GitHub Actions data...")
    print("=" * 60)
    
    # GitHub Actions data characteristics:
    # 1. created_at is close to timestamp (within 10 minutes)
    # 2. Not inserted in large batches
    # 3. Timestamps not exactly on the hour
    
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/people_counting_raw?select=*&order=created_at.desc",
        headers=headers
    )
    
    if response.ok:
        data = response.json()
        
        github_data = []
        test_data = []
        
        for record in data:
            created = datetime.fromisoformat(record['created_at'].replace('Z', '+00:00'))
            timestamp = datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))
            
            # Time between data timestamp and insertion
            delay = abs((created - timestamp).total_seconds())
            
            # If inserted within 10 minutes of timestamp, likely GitHub Actions
            if delay < 600:  # 10 minutes
                github_data.append(record)
            else:
                test_data.append(record)
        
        print(f"\n📊 Data Classification:")
        print(f"GitHub Actions data: {len(github_data)} records")
        print(f"Test/Manual data: {len(test_data)} records")
        
        if github_data:
            print(f"\n✅ GitHub Actions Data Found:")
            for record in github_data[:10]:  # Show first 10
                print(f"\n{record['timestamp']} (inserted {record['created_at'][:19]})")
                print(f"  Sensor: {record['sensor_id'][:8]}...")
                print(f"  Movement: IN={record.get('total_in', 0)}, OUT={record.get('total_out', 0)}")
                print(f"  Delay: {abs((datetime.fromisoformat(record['created_at'].replace('Z', '+00:00')) - datetime.fromisoformat(record['timestamp'].replace('Z', '+00:00'))).total_seconds())/60:.1f} minutes")
        
        # Check last 24 hours for GitHub Actions runs
        print(f"\n\n📅 Last 24 hours GitHub Actions activity:")
        yesterday = datetime.now() - timedelta(days=1)
        
        recent_github = [r for r in github_data if datetime.fromisoformat(r['created_at'].replace('Z', '+00:00')) > yesterday]
        
        if recent_github:
            print(f"Found {len(recent_github)} records from GitHub Actions in last 24 hours")
            
            # Group by hour
            by_hour = {}
            for record in recent_github:
                hour = record['created_at'][:13]
                if hour not in by_hour:
                    by_hour[hour] = 0
                by_hour[hour] += 1
            
            print("\nGitHub Actions runs by hour:")
            for hour, count in sorted(by_hour.items()):
                print(f"  {hour}:00 - {count} records")
        else:
            print("❌ No GitHub Actions data found in last 24 hours!")
            print("\nPossible reasons:")
            print("1. GitHub Actions workflow might be failing")
            print("2. Workflow might have been recently started")
            print("3. Check GitHub Actions logs for errors")

if __name__ == "__main__":
    find_github_actions_data()