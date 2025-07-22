#!/usr/bin/env python3
"""
Analyze how to use regional data from the J&J sensor
"""

import os
import sys
import json
from datetime import datetime, timedelta

# Add the src directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.connector_system.milesight_connector import MilesightConnector
from src.connector_system.base_connector import ConnectorConfig


def analyze_regional_capabilities():
    """Analyze regional capabilities and propose usage"""
    
    print("🔍 Analyzing Regional Capabilities for J&J Sensor")
    print("=" * 60)
    
    # Load configuration
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sensors', 'jj_01_arrábida.json')
    with open(config_path, 'r') as f:
        config_data = json.load(f)
    
    connector_config = ConnectorConfig(
        name=config_data['sensor_name'],
        type='milesight_people_counter',
        store=config_data['location'],
        connection=config_data['connection'],
        endpoints=config_data.get('endpoints', {}),
        data_mapping=config_data['data_mapping']
    )
    
    connector = MilesightConnector(connector_config)
    
    if not connector.authenticate():
        print("❌ Authentication failed!")
        return
    
    # Get real-time status
    print("\n📊 Current Counter Values:")
    status = connector.get_real_time_status()
    if status:
        print(f"   Current In Count: {status.get('current_in_count', 'N/A')}")
        print(f"   Current Out Count: {status.get('current_out_count', 'N/A')}")
        print(f"   Current Sum: {status.get('current_sum_count', 'N/A')}")
        print(f"   Current Capacity: {status.get('current_capacity_count', 'N/A')}")
    
    print("\n💡 Regional Data Usage Recommendations:")
    print("-" * 60)
    
    print("\nSince regional counting returns zeros, we can use regions for:")
    print("\n1. **Virtual Zone Mapping** (Map lines to store areas)")
    print("   - Line 1: Main Entrance → Region 1 (Entrance Zone)")
    print("   - Line 2: Checkout Area → Region 2 (Checkout Zone)")
    print("   - Line 3: Secondary Exit → Region 3 (Exit Zone)")
    print("   - Line 4: Storefront → Region 4 (Window Shopping Zone)")
    
    print("\n2. **Customer Journey Tracking**")
    print("   - Use line crossings to infer movement between zones")
    print("   - Calculate dwell time in different areas")
    print("   - Identify popular paths through the store")
    
    print("\n3. **Zone-Based Analytics**")
    print("   - Conversion rates per zone")
    print("   - Peak hours per zone")
    print("   - Queue detection at checkout (Line 2)")
    
    print("\n4. **Heat Map Alternative**")
    print("   - Use line crossing frequency as heat indicators")
    print("   - Create virtual heat zones based on traffic patterns")
    
    # Analyze line patterns
    print("\n📈 Analyzing Line Usage Patterns...")
    now = datetime.now()
    yesterday = now - timedelta(days=1)
    
    raw_data = connector.fetch_data(yesterday, now, 'people_counting')
    if raw_data:
        parsed_data = connector.parse_data(raw_data, 'people_counting')
        
        if parsed_data:
            # Aggregate by line
            line_stats = {
                'line1': {'in': 0, 'out': 0, 'total': 0},
                'line2': {'in': 0, 'out': 0, 'total': 0},
                'line3': {'in': 0, 'out': 0, 'total': 0},
                'line4': {'in': 0, 'out': 0, 'total': 0}
            }
            
            for record in parsed_data:
                for i in range(1, 5):
                    line_stats[f'line{i}']['in'] += record.get(f'line{i}_in', 0)
                    line_stats[f'line{i}']['out'] += record.get(f'line{i}_out', 0)
                    line_stats[f'line{i}']['total'] = line_stats[f'line{i}']['in'] + line_stats[f'line{i}']['out']
            
            print("\n📊 24-Hour Line Activity Summary:")
            print(f"{'Line':<10} {'In':<10} {'Out':<10} {'Total':<10} {'Usage %':<10}")
            print("-" * 50)
            
            total_activity = sum(stats['total'] for stats in line_stats.values())
            
            for line, stats in line_stats.items():
                usage_pct = (stats['total'] / total_activity * 100) if total_activity > 0 else 0
                print(f"{line:<10} {stats['in']:<10} {stats['out']:<10} {stats['total']:<10} {usage_pct:<10.1f}%")
            
            # Suggest zone mapping based on usage
            print("\n🗺️  Suggested Zone Mapping Based on Usage:")
            sorted_lines = sorted(line_stats.items(), key=lambda x: x[1]['total'], reverse=True)
            
            zone_suggestions = {
                0: "Main Traffic Zone (Primary Entrance/Exit)",
                1: "Secondary Traffic Zone (Alternative Path)",
                2: "Low Traffic Zone (Service/Emergency)",
                3: "Monitoring Zone (External/Passing)"
            }
            
            for idx, (line, stats) in enumerate(sorted_lines):
                if idx < len(zone_suggestions):
                    print(f"   {line}: {zone_suggestions[idx]}")
                    print(f"      Activity: {stats['total']} crossings ({stats['in']} in, {stats['out']} out)")


def create_virtual_regions():
    """Create virtual region mapping configuration"""
    
    virtual_regions = {
        "region_mapping": {
            "region1": {
                "name": "Entrance Zone",
                "description": "Main store entrance area",
                "associated_lines": [1],
                "metrics": ["entry_rate", "bounce_rate", "morning_rush"]
            },
            "region2": {
                "name": "Shopping Zone", 
                "description": "Main shopping floor",
                "associated_lines": [2, 3],
                "metrics": ["dwell_time", "browsing_patterns", "conversion_potential"]
            },
            "region3": {
                "name": "Checkout Zone",
                "description": "Payment and checkout area",
                "associated_lines": [2],
                "metrics": ["queue_length", "transaction_time", "abandonment_rate"]
            },
            "region4": {
                "name": "Window Zone",
                "description": "Storefront and window shopping",
                "associated_lines": [4],
                "metrics": ["capture_rate", "window_effectiveness", "passing_patterns"]
            }
        },
        "zone_rules": {
            "entrance_to_shopping": {
                "trigger": "line1_in > 0",
                "action": "increment region1 and region2 occupancy"
            },
            "shopping_to_checkout": {
                "trigger": "line2_in > line2_out",
                "action": "increment region3 occupancy, potential conversion"
            },
            "window_to_entrance": {
                "trigger": "line4 activity followed by line1_in",
                "action": "successful capture from window"
            }
        }
    }
    
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sensors', 'jj_01_virtual_regions.json')
    with open(config_path, 'w') as f:
        json.dump(virtual_regions, f, indent=2)
    
    print(f"\n✅ Virtual region configuration saved to: {config_path}")
    
    return virtual_regions


if __name__ == "__main__":
    analyze_regional_capabilities()
    print("\n" + "=" * 60)
    create_virtual_regions()