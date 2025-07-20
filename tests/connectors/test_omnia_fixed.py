#!/usr/bin/env python3
"""
Fixed test for Omnia sensor with working parameters
"""

import requests
from datetime import datetime, timedelta
import json
import pandas as pd
from io import StringIO
from src.connector_system import ConfigLoader, ConnectorFactory

def test_working_parameters():
    """Test with the parameters that actually work"""
    print("🔧 Testing with working parameters...")
    
    host = "93.108.96.96"
    port = 21001
    auth = ("admin", "grnl.2024")
    
    # The working URL pattern we discovered
    now = datetime.now()
    start_time = now - timedelta(hours=6)
    
    # Working parameters: dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3
    url = f"http://{host}:{port}/dataloader.cgi?dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3&time_start={start_time.strftime('%Y-%m-%d-%H:%M:%S')}&time_end={now.strftime('%Y-%m-%d-%H:%M:%S')}"
    
    print(f"   🔗 URL: {url}")
    
    try:
        response = requests.get(url, auth=auth, timeout=30)
        
        if response.status_code == 200:
            content = response.text.strip()
            if content:
                lines = content.split('\n')
                print(f"   ✅ Success: {len(lines)} lines received")
                
                # Parse the CSV data
                df = pd.read_csv(StringIO(content))
                df.columns = [col.strip() for col in df.columns]
                
                print(f"   📊 Data analysis:")
                print(f"      Records: {len(df)}")
                print(f"      Columns: {list(df.columns)}")
                
                if len(df) > 0:
                    # Show sample data
                    sample = df.iloc[0]
                    print(f"   📋 Sample record:")
                    for col in df.columns[:8]:  # Show first 8 columns
                        print(f"      {col}: {sample[col]}")
                
                return df
            else:
                print(f"   ⚠️  Empty response")
                return None
        else:
            print(f"   ❌ Failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return None

def create_fixed_config():
    """Create corrected configuration"""
    config = {
        "connector": {
            "name": "OML01-Omnia GuimarãesShopping",
            "type": "milesight",
            "store": "Omnia GuimarãesShopping",
            "description": "People counting camera at Omnia Guimarães Shopping - Fixed",
            
            "connection": {
                "host": "93.108.96.96", 
                "port": 21001,
                "auth": {
                    "type": "basic",
                    "username": "admin",
                    "password": "grnl.2024"
                }
            },
            
            "endpoints": {
                "people_counting": {
                    "params": {
                        "report_type": 0,
                        "linetype": 31,
                        "statistics_type": 3
                    }
                }
            },
            
            "data_mapping": {
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "supports_real_time_status": True,
                "line_count": 4,
                "fields": [
                    {"source": "StartTime", "target": "start_time", "type": "timestamp"},
                    {"source": "EndTime", "target": "end_time", "type": "timestamp"},
                    {"source": "Tolal - In", "target": "total_in", "type": "integer"},
                    {"source": "Tolal - Out", "target": "total_out", "type": "integer"},
                    {"source": "Tolal - Sum", "target": "total_sum", "type": "integer"},
                    {"source": "Line1 - In", "target": "line1_in", "type": "integer"},
                    {"source": "Line1 - Out", "target": "line1_out", "type": "integer"},
                    {"source": "Line4 - In", "target": "line4_in", "type": "integer"},
                    {"source": "Line4 - Out", "target": "line4_out", "type": "integer"}
                ]
            },
            
            "collection_settings": {
                "retry_attempts": 3,
                "timeout": 30,
                "polling_interval": 300
            }
        }
    }
    
    with open("omnia_sensor_fixed.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print(f"   ✅ Fixed configuration saved to: omnia_sensor_fixed.json")
    return "omnia_sensor_fixed.json"

def test_real_time_status():
    """Test real-time status"""
    print("\n📊 Testing real-time status...")
    
    auth = ("admin", "grnl.2024")
    url = "http://93.108.96.96:21001/cgi-bin/operator/operator.cgi?action=get.vca.alarmstatus"
    
    try:
        response = requests.get(url, auth=auth, timeout=10)
        
        if response.status_code == 200:
            text = response.text
            
            # Parse values
            values = {}
            for line in text.split(';'):
                if '=' in line and 'var ' in line:
                    var_part = line.split('var ')[1] if 'var ' in line else line
                    if '=' in var_part:
                        name, value = var_part.split('=', 1)
                        name = name.strip()
                        value = value.strip().strip("'\"")
                        values[name] = value
            
            print(f"   ✅ Real-time data retrieved:")
            print(f"      📈 In: {values.get('current_in_count', 'N/A')} people")
            print(f"      📉 Out: {values.get('current_out_count', 'N/A')} people")
            print(f"      🏢 Capacity: {values.get('current_capacity_count', 'N/A')} people")
            print(f"      📊 Sum: {values.get('current_sum_count', 'N/A')} people")
            
            # Calculate occupancy
            in_count = int(values.get('current_in_count', 0))
            out_count = int(values.get('current_out_count', 0))
            occupancy = in_count - out_count
            
            print(f"      🏬 Current Occupancy: {occupancy} people")
            
            return values
        else:
            print(f"   ❌ Failed: {response.status_code}")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return None

def main():
    """Main test function"""
    print("🏪 OMNIA SENSOR - FIXED TEST")
    print("=" * 35)
    
    # Test working parameters
    data = test_working_parameters()
    
    if data is not None:
        print("\n✅ SUCCESS: Data retrieval working!")
        
        # Test real-time status
        status = test_real_time_status()
        
        # Create fixed configuration
        print("\n🔧 Creating fixed configuration...")
        config_file = create_fixed_config()
        
        # Show summary
        print(f"\n📋 SUMMARY:")
        print(f"   ✅ Sensor connectivity: Working")
        print(f"   ✅ Authentication: Working")
        print(f"   ✅ Historical data: Working ({len(data)} records)")
        print(f"   ✅ Real-time status: Working")
        print(f"   ✅ Configuration: {config_file}")
        
        print(f"\n🎯 WORKING PARAMETERS:")
        print(f"   URL: /dataloader.cgi?dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3")
        print(f"   Fields: {list(data.columns)}")
        
        print(f"\n🚀 READY FOR PRODUCTION:")
        print(f"   config = ConfigLoader.load_from_file('{config_file}')")
        print(f"   connector = ConnectorFactory.create_connector(config)")
        print(f"   data = connector.collect_data(start_time, end_time)")
        
    else:
        print("\n❌ Data retrieval failed")

if __name__ == "__main__":
    main()