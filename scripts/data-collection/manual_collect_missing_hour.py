#!/usr/bin/env python3
"""Manually trigger collection for missing hour"""

import requests
from datetime import datetime, timedelta

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

def main():
    """Check what we're missing"""
    print("🔍 Checking for Missing Data")
    print("=" * 60)
    
    now = datetime.now()
    print(f"Current time: {now.strftime('%Y-%m-%d %H:%M:%S')} UTC")
    
    # The workflow runs at :00 and :30
    # If we're at 10:46, the last run was at 10:30
    # The 10:00 data might not have been ready at 10:30
    
    print("\n📊 GitHub Actions Schedule:")
    print("Runs every 30 minutes: :00 and :30")
    
    last_run = now.replace(minute=30 if now.minute >= 30 else 0, second=0, microsecond=0)
    next_run = last_run + timedelta(minutes=30)
    
    print(f"Last run: {last_run.strftime('%H:%M')} UTC")
    print(f"Next run: {next_run.strftime('%H:%M')} UTC")
    
    print("\n💡 Explanation:")
    print("The 10:00 UTC sensor data might not have been ready at 10:30 UTC")
    print("(sensors might have a slight delay in making data available)")
    print(f"\nThe workflow will collect the missing 10:00 data at {next_run.strftime('%H:%M')} UTC")
    
    print("\n🚀 To collect missing data NOW:")
    print("1. Go to: https://github.com/blipee-dev/retail-platform/actions")
    print("2. Click 'Direct Sensor Data Collection' workflow")
    print("3. Click 'Run workflow' button")
    print("4. This will immediately collect any missing data")

if __name__ == "__main__":
    main()