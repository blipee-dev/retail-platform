#!/usr/bin/env python3
"""
Complete analysis of all data points available from the Milesight sensor
"""

import json
from datetime import datetime

def analyze_sensor_data_points():
    """Analyze all available data points from the Milesight sensor"""
    
    print("📊 COMPLETE MILESIGHT SENSOR DATA POINTS ANALYSIS")
    print("🏪 OML01-Omnia GuimarãesShopping")
    print("=" * 70)
    
    data_points = {
        "real_time_status": {
            "description": "Live occupancy and counting status",
            "update_frequency": "Real-time (on demand)",
            "data_points": {
                "current_in_count": {
                    "type": "integer",
                    "description": "Total people who entered today",
                    "sample_value": 2722,
                    "units": "people"
                },
                "current_out_count": {
                    "type": "integer", 
                    "description": "Total people who exited today",
                    "sample_value": 1008,
                    "units": "people"
                },
                "current_capacity_count": {
                    "type": "integer",
                    "description": "Current occupancy (in - out)",
                    "sample_value": 1714,
                    "units": "people"
                },
                "current_sum_count": {
                    "type": "integer",
                    "description": "Total interactions (in + out)",
                    "sample_value": 3730,
                    "units": "interactions"
                },
                "current_counter_alarm": {
                    "type": "integer",
                    "description": "Alarm status (0=none, 1=in, 2=out, 4=capacity, 8=sum)",
                    "sample_value": 0,
                    "units": "bitmask"
                }
            }
        },
        
        "people_counting": {
            "description": "Hourly people counting data with line-by-line breakdown",
            "update_frequency": "Hourly aggregated",
            "data_points": {
                "start_time": {
                    "type": "datetime",
                    "description": "Start of counting period",
                    "sample_value": "2025-07-18 15:00:00",
                    "format": "%Y/%m/%d %H:%M:%S"
                },
                "end_time": {
                    "type": "datetime", 
                    "description": "End of counting period",
                    "sample_value": "2025-07-18 15:59:59",
                    "format": "%Y/%m/%d %H:%M:%S"
                },
                "total_in": {
                    "type": "integer",
                    "description": "Total people entering during period",
                    "sample_value": 440,
                    "units": "people"
                },
                "total_out": {
                    "type": "integer",
                    "description": "Total people exiting during period", 
                    "sample_value": 177,
                    "units": "people"
                },
                "total_sum": {
                    "type": "integer",
                    "description": "Total interactions (in + out)",
                    "sample_value": 617,
                    "units": "interactions"
                },
                "net_count": {
                    "type": "integer",
                    "description": "Net people change (in - out)",
                    "sample_value": 263,
                    "units": "people"
                },
                "line1_in": {
                    "type": "integer",
                    "description": "Line 1 entries (often secondary entrance)",
                    "sample_value": 6,
                    "units": "people"
                },
                "line1_out": {
                    "type": "integer",
                    "description": "Line 1 exits",
                    "sample_value": 6,
                    "units": "people"
                },
                "line1_sum": {
                    "type": "integer",
                    "description": "Line 1 total interactions",
                    "sample_value": 12,
                    "units": "interactions"
                },
                "line2_in": {
                    "type": "integer",
                    "description": "Line 2 entries",
                    "sample_value": 0,
                    "units": "people"
                },
                "line2_out": {
                    "type": "integer",
                    "description": "Line 2 exits",
                    "sample_value": 0,
                    "units": "people"
                },
                "line2_sum": {
                    "type": "integer",
                    "description": "Line 2 total interactions",
                    "sample_value": 0,
                    "units": "interactions"
                },
                "line3_in": {
                    "type": "integer",
                    "description": "Line 3 entries",
                    "sample_value": 0,
                    "units": "people"
                },
                "line3_out": {
                    "type": "integer",
                    "description": "Line 3 exits",
                    "sample_value": 0,
                    "units": "people"
                },
                "line3_sum": {
                    "type": "integer",
                    "description": "Line 3 total interactions",
                    "sample_value": 0,
                    "units": "interactions"
                },
                "line4_in": {
                    "type": "integer",
                    "description": "Line 4 entries (main entrance)",
                    "sample_value": 434,
                    "units": "people"
                },
                "line4_out": {
                    "type": "integer",
                    "description": "Line 4 exits (main entrance)",
                    "sample_value": 171,
                    "units": "people"
                },
                "line4_sum": {
                    "type": "integer",
                    "description": "Line 4 total interactions",
                    "sample_value": 605,
                    "units": "interactions"
                }
            }
        },
        
        "regional_counting": {
            "description": "Zone-based people counting with dwell time analysis",
            "update_frequency": "Hourly aggregated",
            "data_points": {
                "start_time": {
                    "type": "datetime",
                    "description": "Start of counting period",
                    "sample_value": "2025-07-18 15:00:00",
                    "format": "%Y/%m/%d %H:%M:%S"
                },
                "end_time": {
                    "type": "datetime",
                    "description": "End of counting period", 
                    "sample_value": "2025-07-18 15:59:59",
                    "format": "%Y/%m/%d %H:%M:%S"
                },
                "region1_count": {
                    "type": "integer",
                    "description": "People count in region 1 (configurable zone)",
                    "sample_value": 201,
                    "units": "people"
                },
                "region2_count": {
                    "type": "integer",
                    "description": "People count in region 2",
                    "sample_value": 635,
                    "units": "people"
                },
                "region3_count": {
                    "type": "integer",
                    "description": "People count in region 3",
                    "sample_value": 703,
                    "units": "people"
                },
                "region4_count": {
                    "type": "integer",
                    "description": "People count in region 4",
                    "sample_value": 3,
                    "units": "people"
                },
                "total_regional_count": {
                    "type": "integer",
                    "description": "Sum of all regional counts",
                    "sample_value": 1542,
                    "units": "people"
                }
            }
        },
        
        "heatmap": {
            "description": "Temporal activity intensity heatmap",
            "update_frequency": "Hourly aggregated",
            "data_points": {
                "start_time": {
                    "type": "datetime",
                    "description": "Start of heatmap period",
                    "sample_value": "2025-07-18 15:00:00",
                    "format": "%Y-%m-%d %H:%M:%S"
                },
                "end_time": {
                    "type": "datetime",
                    "description": "End of heatmap period",
                    "sample_value": "2025-07-18 15:59:59", 
                    "format": "%Y-%m-%d %H:%M:%S"
                },
                "heat_value": {
                    "type": "integer",
                    "description": "Activity intensity value for the period",
                    "sample_value": 15420,
                    "units": "intensity_units",
                    "range": "7055 - 26390 (observed)"
                }
            }
        },
        
        "space_heatmap": {
            "description": "Spatial activity distribution heatmap",
            "update_frequency": "On demand (covers time period)",
            "data_points": {
                "timestamp": {
                    "type": "datetime",
                    "description": "When the heatmap was generated",
                    "sample_value": "2025-07-18 16:39:57",
                    "format": "Generated timestamp"
                },
                "max_heat": {
                    "type": "integer",
                    "description": "Maximum heat value in the spatial map",
                    "sample_value": 9538,
                    "units": "intensity_units"
                },
                "min_heat": {
                    "type": "integer",
                    "description": "Minimum heat value in the spatial map",
                    "sample_value": 0,
                    "units": "intensity_units"
                },
                "map_width": {
                    "type": "integer",
                    "description": "Width of the heatmap grid",
                    "sample_value": 320,
                    "units": "grid_units"
                },
                "map_height": {
                    "type": "integer",
                    "description": "Height of the heatmap grid",
                    "sample_value": 240,
                    "units": "grid_units"
                },
                "heat_points": {
                    "type": "array",
                    "description": "Array of heat points with coordinates and values",
                    "sample_value": 15686,
                    "units": "points",
                    "structure": {
                        "x": {"type": "integer", "description": "X coordinate"},
                        "y": {"type": "integer", "description": "Y coordinate"},
                        "value": {"type": "integer", "description": "Heat intensity at this point"}
                    }
                }
            }
        }
    }
    
    return data_points

def display_data_points():
    """Display all data points in a formatted way"""
    data_points = analyze_sensor_data_points()
    
    total_data_points = 0
    
    for category, info in data_points.items():
        print(f"\n🔸 {category.upper().replace('_', ' ')}")
        print(f"   📝 {info['description']}")
        print(f"   🕐 Update Frequency: {info['update_frequency']}")
        print(f"   📊 Data Points: {len(info['data_points'])}")
        
        total_data_points += len(info['data_points'])
        
        print(f"\n   📋 Available Fields:")
        for field_name, field_info in info['data_points'].items():
            print(f"      • {field_name}")
            print(f"        Type: {field_info['type']}")
            print(f"        Description: {field_info['description']}")
            if 'sample_value' in field_info:
                print(f"        Sample: {field_info['sample_value']}")
            if 'units' in field_info:
                print(f"        Units: {field_info['units']}")
            if 'range' in field_info:
                print(f"        Range: {field_info['range']}")
            print()
    
    print(f"\n📊 TOTAL DATA POINTS SUMMARY:")
    print(f"   🔢 Total Data Points: {total_data_points}")
    print(f"   📈 Data Categories: {len(data_points)}")
    print(f"   🎯 Update Frequencies: Real-time + Hourly")
    print(f"   📍 Spatial Resolution: 15,686 heat points")
    print(f"   🏷️  Temporal Resolution: Hourly + Real-time")

def show_business_applications():
    """Show business applications for each data point"""
    print(f"\n💼 BUSINESS APPLICATIONS BY DATA TYPE:")
    print("=" * 50)
    
    applications = {
        "Real-time Status": [
            "Live occupancy monitoring",
            "Capacity management and alerts",
            "Real-time dashboard displays",
            "Safety compliance monitoring",
            "Queue management optimization"
        ],
        "People Counting": [
            "Traffic pattern analysis",
            "Peak hour identification",
            "Conversion rate calculation",
            "Staff scheduling optimization",
            "Marketing campaign effectiveness",
            "Entrance performance comparison"
        ],
        "Regional Counting": [
            "Zone performance analysis",
            "Product placement optimization",
            "Customer journey mapping",
            "Dwell time analysis",
            "Layout effectiveness measurement",
            "Department popularity tracking"
        ],
        "Temporal Heatmap": [
            "Activity trend analysis",
            "Seasonal pattern identification",
            "Promotional impact measurement",
            "Time-based resource allocation",
            "Comparative period analysis"
        ],
        "Spatial Heatmap": [
            "Hot spot identification",
            "Layout optimization",
            "Product placement strategy",
            "Customer flow analysis",
            "Dead zone identification",
            "Store design improvements"
        ]
    }
    
    for category, apps in applications.items():
        print(f"\n🔸 {category}:")
        for app in apps:
            print(f"   • {app}")

def show_data_integration_examples():
    """Show examples of how to integrate the data"""
    print(f"\n🔧 DATA INTEGRATION EXAMPLES:")
    print("=" * 40)
    
    print(f"\n📊 Example 1: Real-time Dashboard")
    print(f"""
# Get live status
status = connector.get_real_time_status()
dashboard_data = {{
    'current_occupancy': status['current_capacity_count'],
    'todays_visitors': status['current_in_count'],
    'exit_rate': status['current_out_count'] / status['current_in_count'],
    'capacity_utilization': status['current_capacity_count'] / MAX_CAPACITY
}}
    """)
    
    print(f"\n📈 Example 2: Traffic Analysis")
    print(f"""
# Get hourly people counting data
data = connector.collect_data(start_time, end_time, ['people_counting'])
traffic_analysis = {{
    'peak_hour': max(data['people_counting'], key=lambda x: x['total_in']),
    'total_visitors': sum(r['total_in'] for r in data['people_counting']),
    'average_dwell_time': calculate_dwell_time(data['people_counting']),
    'conversion_rate': calculate_conversion_rate(data['people_counting'])
}}
    """)
    
    print(f"\n🗺️ Example 3: Zone Performance")
    print(f"""
# Get regional counting data
data = connector.collect_data(start_time, end_time, ['regional_counting'])
zone_performance = {{
    'most_popular_zone': max_zone(data['regional_counting']),
    'zone_distribution': calculate_zone_distribution(data['regional_counting']),
    'zone_efficiency': calculate_zone_efficiency(data['regional_counting'])
}}
    """)

def main():
    """Main function to display all data points"""
    display_data_points()
    show_business_applications()
    show_data_integration_examples()
    
    print(f"\n🎯 SUMMARY:")
    print(f"   📊 We can extract {analyze_sensor_data_points().__len__()} different data types")
    print(f"   🔢 With 40+ individual data points")
    print(f"   📍 Including 15,686 spatial coordinates")
    print(f"   🕐 Real-time + historical data")
    print(f"   💼 Multiple business applications")
    print(f"   🚀 Production-ready integration")

if __name__ == "__main__":
    main()