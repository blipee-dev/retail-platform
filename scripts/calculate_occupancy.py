#!/usr/bin/env python3
"""
Calculate current store occupancy from sensor data
"""

import os
import sys
import json
from datetime import datetime, timedelta, time

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig


def calculate_daily_occupancy(connector: MilesightConnector, store_opening_hour: int = 10):
    """Calculate occupancy throughout the day"""
    
    # Get today's data from store opening
    now = datetime.now()
    today_opening = datetime.combine(now.date(), time(store_opening_hour, 0))
    
    print(f"📊 Calculating occupancy for {now.date()}")
    print(f"   Store opening: {today_opening.strftime('%H:%M')}")
    print(f"   Current time: {now.strftime('%H:%M:%S')}\n")
    
    # Fetch all data since opening
    raw_data = connector.fetch_data(today_opening, now, 'people_counting')
    if not raw_data:
        print("❌ No data available for today")
        return
    
    parsed_data = connector.parse_data(raw_data, 'people_counting')
    if not parsed_data:
        print("❌ No parsed data available")
        return
    
    # Calculate cumulative occupancy
    total_entries = 0
    total_exits = 0
    hourly_data = []
    
    print("⏰ Hourly Breakdown:")
    print("-" * 80)
    print(f"{'Hour':<12} {'Entries':<10} {'Exits':<10} {'Net':<10} {'Occupancy':<12} {'Capture Rate':<12}")
    print("-" * 80)
    
    for record in parsed_data:
        hour = record['timestamp'].strftime('%H:00-%H:59')
        entries = record['total_in']
        exits = record['total_out']
        net_change = record['occupancy_change']
        passing = record.get('passing_traffic', 0)
        capture_rate = record.get('capture_rate', 0)
        
        total_entries += entries
        total_exits += exits
        current_occupancy = total_entries - total_exits
        
        print(f"{hour:<12} {entries:<10} {exits:<10} {net_change:<10} {current_occupancy:<12} {capture_rate:<10.1f}%")
        
        hourly_data.append({
            'hour': hour,
            'entries': entries,
            'exits': exits,
            'occupancy': current_occupancy,
            'passing_traffic': passing,
            'capture_rate': capture_rate
        })
    
    print("-" * 80)
    
    # Summary
    current_occupancy = total_entries - total_exits
    avg_capture_rate = sum(h['capture_rate'] for h in hourly_data if h['capture_rate'] > 0) / len(hourly_data) if hourly_data else 0
    
    print(f"\n📈 Daily Summary:")
    print(f"   Total Entries: {total_entries}")
    print(f"   Total Exits: {total_exits}")
    print(f"   Current Occupancy: {current_occupancy} people")
    print(f"   Average Capture Rate: {avg_capture_rate:.1f}%")
    
    # Peak hour analysis
    if hourly_data:
        peak_hour = max(hourly_data, key=lambda x: x['entries'])
        print(f"\n🎯 Peak Hour: {peak_hour['hour']} with {peak_hour['entries']} entries")
        
        best_capture = max(hourly_data, key=lambda x: x['capture_rate'])
        print(f"   Best Capture Rate: {best_capture['hour']} at {best_capture['capture_rate']:.1f}%")
    
    # Warnings
    if current_occupancy < 0:
        print(f"\n⚠️  WARNING: Negative occupancy ({current_occupancy})! More exits than entries recorded.")
        print("   This could indicate:")
        print("   - People were already in store at opening")
        print("   - Sensor misconfiguration")
        print("   - Missing entry data")
    
    return current_occupancy, hourly_data


def main():
    """Main function"""
    # Load J&J sensor configuration
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sensors', 'jj_01_arrábida.json')
    with open(config_path, 'r') as f:
        config_data = json.load(f)
    
    # Create connector
    connector_config = ConnectorConfig(
        name=config_data['sensor_name'],
        type='milesight_people_counter',
        store=config_data['location'],
        connection=config_data['connection'],
        endpoints=config_data.get('endpoints', {}),
        data_mapping=config_data['data_mapping']
    )
    
    connector = MilesightConnector(connector_config)
    
    # Authenticate
    if not connector.authenticate():
        print("❌ Authentication failed!")
        return
    
    # Calculate occupancy (assume store opens at 10 AM)
    calculate_daily_occupancy(connector, store_opening_hour=10)


if __name__ == "__main__":
    main()