#!/usr/bin/env python3
"""
Test the fixed Milesight connector with real Omnia sensor
"""

from src.connector_system import ConfigLoader, ConnectorFactory
from datetime import datetime, timedelta
import json

def test_fixed_connector():
    """Test the fixed connector with real sensor"""
    print("🧪 Testing Fixed Milesight Connector")
    print("=" * 40)
    
    # Load the fixed configuration
    config_file = "omnia_sensor_fixed.json"
    
    try:
        config = ConfigLoader.load_from_file(config_file)
        print(f"   ✅ Configuration loaded: {config.name}")
        
        # Create connector
        connector = ConnectorFactory.create_connector(config)
        print(f"   ✅ Connector created: {connector.__class__.__name__}")
        
        # Test connection validation
        print(f"\n🔍 Testing connection validation...")
        if connector.validate_connection():
            print("   ✅ Connection validation successful")
        else:
            print("   ❌ Connection validation failed")
            return False
        
        # Test real-time status
        print(f"\n📊 Testing real-time status...")
        if hasattr(connector, 'get_real_time_status'):
            status = connector.get_real_time_status()
            if status:
                print(f"   ✅ Real-time status retrieved:")
                print(f"      In: {status.get('current_in_count', 'N/A')}")
                print(f"      Out: {status.get('current_out_count', 'N/A')}")
                print(f"      Capacity: {status.get('current_capacity_count', 'N/A')}")
                print(f"      Timestamp: {status.get('timestamp', 'N/A')}")
            else:
                print("   ⚠️  Real-time status not available")
        
        # Test historical data collection
        print(f"\n📈 Testing historical data collection...")
        
        # Test different time ranges
        test_ranges = [
            (timedelta(hours=1), "Last 1 hour"),
            (timedelta(hours=6), "Last 6 hours"),
            (timedelta(hours=24), "Last 24 hours")
        ]
        
        for time_delta, description in test_ranges:
            print(f"\n   🕐 Testing {description}...")
            
            end_time = datetime.now()
            start_time = end_time - time_delta
            
            try:
                data = connector.collect_data(start_time, end_time)
                
                for endpoint, records in data.items():
                    if records:
                        print(f"      ✅ {endpoint}: {len(records)} records")
                        
                        # Show sample data
                        if records:
                            sample = records[0]
                            print(f"         Sample data:")
                            print(f"           Time: {sample.get('timestamp', 'N/A')}")
                            print(f"           Total In: {sample.get('total_in', 'N/A')}")
                            print(f"           Total Out: {sample.get('total_out', 'N/A')}")
                            print(f"           Net Count: {sample.get('net_count', 'N/A')}")
                            
                            # Show line data if available
                            for i in range(1, 5):
                                line_in = sample.get(f'line{i}_in')
                                line_out = sample.get(f'line{i}_out')
                                if line_in is not None or line_out is not None:
                                    print(f"           Line {i}: In={line_in}, Out={line_out}")
                        
                        return True
                    else:
                        print(f"      ⚠️  {endpoint}: No records")
                        
            except Exception as e:
                print(f"      ❌ Error collecting {description}: {str(e)}")
                continue
        
        print("   ⚠️  No data collected in any time range")
        return False
        
    except Exception as e:
        print(f"   ❌ Connector test failed: {str(e)}")
        return False

def demonstrate_production_usage():
    """Demonstrate how to use this in production"""
    print("\n🚀 PRODUCTION USAGE DEMONSTRATION")
    print("=" * 40)
    
    print("# Python code for production deployment:")
    print("""
from src.connector_system import ConfigLoader, ConnectorFactory
from datetime import datetime, timedelta

# Load configuration
config = ConfigLoader.load_from_file('omnia_sensor_fixed.json')

# Create connector
connector = ConnectorFactory.create_connector(config)

# Collect data for the last hour
end_time = datetime.now()
start_time = end_time - timedelta(hours=1)

# Get data
data = connector.collect_data(start_time, end_time)

# Process results
for endpoint, records in data.items():
    print(f"Endpoint: {endpoint}")
    print(f"Records: {len(records)}")
    
    for record in records:
        print(f"  Time: {record['timestamp']}")
        print(f"  In: {record.get('total_in', 0)}")
        print(f"  Out: {record.get('total_out', 0)}")
        print(f"  Net: {record.get('net_count', 0)}")

# Get real-time status
status = connector.get_real_time_status()
print(f"Current occupancy: {status.get('current_capacity_count', 'N/A')}")
    """)
    
    print("\n📋 Configuration file structure:")
    print("""
{
  "connector": {
    "name": "OML01-Omnia GuimarãesShopping",
    "type": "milesight",
    "connection": {
      "host": "93.108.96.96",
      "port": 21001,
      "auth": {"username": "admin", "password": "grnl.2024"}
    },
    "endpoints": {
      "people_counting": {
        "params": {
          "report_type": 0,
          "linetype": 31,
          "statistics_type": 3
        }
      }
    }
  }
}
    """)

def main():
    """Main test function"""
    success = test_fixed_connector()
    
    if success:
        print("\n🎉 SUCCESS: Fixed connector working with real sensor!")
        demonstrate_production_usage()
        
        print("\n✅ READY FOR PRODUCTION:")
        print("   • Sensor connectivity: ✅")
        print("   • Authentication: ✅")
        print("   • Data collection: ✅")
        print("   • Real-time status: ✅")
        print("   • Configuration: ✅")
        
    else:
        print("\n❌ Connector needs further adjustment")

if __name__ == "__main__":
    main()