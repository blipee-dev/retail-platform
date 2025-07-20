#!/usr/bin/env python3
"""
Test all data types from the real Omnia sensor: people counting, regional counting, heatmap
"""

import requests
from datetime import datetime, timedelta
import json
import pandas as pd
from io import StringIO

def test_endpoint(name, url, auth, expected_format="csv"):
    """Test a specific endpoint"""
    print(f"\n🧪 Testing {name}...")
    print(f"   🔗 URL: {url}")
    
    try:
        response = requests.get(url, auth=auth, timeout=30)
        
        if response.status_code == 200:
            content = response.text.strip()
            if content:
                print(f"   ✅ Success: {len(content)} characters received")
                
                if expected_format == "csv":
                    lines = content.split('\n')
                    print(f"   📊 CSV Lines: {len(lines)}")
                    
                    # Show header
                    if lines:
                        print(f"   📋 Header: {lines[0]}")
                    
                    # Show sample data
                    if len(lines) > 1:
                        print(f"   📄 Sample: {lines[1]}")
                        
                        # Try to parse as CSV
                        try:
                            df = pd.read_csv(StringIO(content))
                            df.columns = [col.strip() for col in df.columns]
                            print(f"   📈 Parsed: {len(df)} records, {len(df.columns)} columns")
                            print(f"   🏷️  Columns: {list(df.columns)}")
                            
                            if len(df) > 0:
                                print(f"   📋 Sample Record:")
                                sample = df.iloc[0]
                                for col in df.columns[:6]:  # Show first 6 columns
                                    print(f"      {col}: {sample[col]}")
                            
                            return df
                        except Exception as e:
                            print(f"   ⚠️  CSV parsing error: {str(e)}")
                            return content
                    
                elif expected_format == "json":
                    try:
                        data = json.loads(content)
                        print(f"   📊 JSON parsed successfully")
                        if isinstance(data, dict):
                            print(f"   🔑 Keys: {list(data.keys())}")
                            if 'data' in data:
                                print(f"   📈 Data points: {len(data['data'])}")
                        return data
                    except Exception as e:
                        print(f"   ⚠️  JSON parsing error: {str(e)}")
                        return content
                
                return content
            else:
                print(f"   ⚠️  Empty response")
                return None
        else:
            print(f"   ❌ Failed: {response.status_code}")
            if response.text:
                print(f"   📄 Error: {response.text[:200]}...")
            return None
            
    except Exception as e:
        print(f"   ❌ Error: {str(e)}")
        return None

def test_all_omnia_endpoints():
    """Test all available endpoints on the Omnia sensor"""
    print("🏪 TESTING ALL OMNIA SENSOR DATA TYPES")
    print("=" * 50)
    
    host = "93.108.96.96"
    port = 21001
    auth = ("admin", "grnl.2024")
    base_url = f"http://{host}:{port}"
    
    # Time range for testing
    now = datetime.now()
    start_time = now - timedelta(hours=6)
    time_start = start_time.strftime('%Y-%m-%d-%H:%M:%S')
    time_end = now.strftime('%Y-%m-%d-%H:%M:%S')
    
    results = {}
    
    # 1. People Counting (we know this works)
    print("\n1️⃣ PEOPLE COUNTING DATA")
    url = f"{base_url}/dataloader.cgi?dw=vcalogcsv&report_type=0&linetype=31&statistics_type=3&time_start={time_start}&time_end={time_end}"
    results['people_counting'] = test_endpoint("People Counting", url, auth)
    
    # 2. Regional People Counting
    print("\n2️⃣ REGIONAL PEOPLE COUNTING DATA")
    regional_urls = [
        f"{base_url}/dataloader.cgi?dw=regionalcountlogcsv&time_start={time_start}&report_type=0&lengthtype=0&length=0&region1=1&region2=1&region3=1&region4=1",
        f"{base_url}/dataloader.cgi?dw=regionalcountlogcsv&time_start={time_start}&report_type=0",
        f"{base_url}/dataloader.cgi?dw=regionalcountlogcsv&time_start={time_start}"
    ]
    
    for i, url in enumerate(regional_urls):
        result = test_endpoint(f"Regional Counting (variant {i+1})", url, auth)
        if result is not None:
            results['regional_counting'] = result
            break
    
    # 3. Heatmap Data
    print("\n3️⃣ HEATMAP DATA")
    heatmap_urls = [
        f"{base_url}/dataloader.cgi?dw=heatmapcsv&sub_type=0&time_start={time_start}",
        f"{base_url}/dataloader.cgi?dw=heatmapcsv&sub_type=1&time_start={time_start}",
        f"{base_url}/dataloader.cgi?dw=heatmapcsv&time_start={time_start}"
    ]
    
    for i, url in enumerate(heatmap_urls):
        result = test_endpoint(f"Heatmap (variant {i+1})", url, auth)
        if result is not None:
            results['heatmap'] = result
            break
    
    # 4. Space Heatmap
    print("\n4️⃣ SPACE HEATMAP DATA")
    space_heatmap_urls = [
        f"{base_url}/dataloader.cgi?dw=spaceheatmap&sub_type=0&time_start={time_start}",
        f"{base_url}/dataloader.cgi?dw=spaceheatmap&time_start={time_start}"
    ]
    
    for i, url in enumerate(space_heatmap_urls):
        result = test_endpoint(f"Space Heatmap (variant {i+1})", url, auth, "json")
        if result is not None:
            results['space_heatmap'] = result
            break
    
    # 5. Alternative data endpoints
    print("\n5️⃣ ALTERNATIVE DATA ENDPOINTS")
    alternative_urls = [
        f"{base_url}/dataloader.cgi?dw=vcalogcsv&type=0&time_start={time_start}&time_end={time_end}",
        f"{base_url}/dataloader.cgi?dw=vcalogcsv&type=1&time_start={time_start}&time_end={time_end}",
        f"{base_url}/dataloader.cgi?dw=vcalogcsv&type=2&time_start={time_start}&time_end={time_end}",
        f"{base_url}/dataloader.cgi?dw=vcalogcsv&type=3&time_start={time_start}&time_end={time_end}",
        f"{base_url}/dataloader.cgi?dw=vcalogcsv&type=4&time_start={time_start}&time_end={time_end}"
    ]
    
    for i, url in enumerate(alternative_urls):
        result = test_endpoint(f"VCA Log Type {i}", url, auth)
        if result is not None and i == 0:  # Only store the first successful one
            results['alternative_people_counting'] = result
    
    return results

def create_comprehensive_config(results):
    """Create a comprehensive configuration based on successful endpoints"""
    print("\n📝 CREATING COMPREHENSIVE CONFIGURATION")
    print("=" * 50)
    
    config = {
        "connector": {
            "name": "OML01-Omnia GuimarãesShopping - Full Analytics",
            "type": "milesight",
            "store": "Omnia GuimarãesShopping",
            "description": "Full analytics suite with all available data types",
            
            "connection": {
                "host": "93.108.96.96",
                "port": 21001,
                "auth": {
                    "type": "basic",
                    "username": "admin",
                    "password": "grnl.2024"
                }
            },
            
            "endpoints": {},
            
            "data_mapping": {
                "timestamp_format": "%Y/%m/%d %H:%M:%S",
                "heatmap_timestamp_format": "%Y-%m-%d %H:%M:%S",
                "supports_real_time_status": True,
                "line_count": 4,
                "region_count": 4,
                "fields": []
            },
            
            "collection_settings": {
                "retry_attempts": 3,
                "timeout": 30,
                "polling_interval": 300,
                "batch_size_hours": 6
            }
        }
    }
    
    # Add endpoints based on successful tests
    if 'people_counting' in results and results['people_counting'] is not None:
        config["connector"]["endpoints"]["people_counting"] = {
            "params": {
                "report_type": 0,
                "linetype": 31,
                "statistics_type": 3
            }
        }
        print("   ✅ Added people counting endpoint")
    
    if 'regional_counting' in results and results['regional_counting'] is not None:
        config["connector"]["endpoints"]["regional_counting"] = {
            "params": {
                "report_type": 0,
                "lengthtype": 0,
                "length": 0,
                "region1": 1,
                "region2": 1,
                "region3": 1,
                "region4": 1
            }
        }
        print("   ✅ Added regional counting endpoint")
    
    if 'heatmap' in results and results['heatmap'] is not None:
        config["connector"]["endpoints"]["heatmap"] = {
            "params": {
                "sub_type": 0
            }
        }
        print("   ✅ Added heatmap endpoint")
    
    if 'space_heatmap' in results and results['space_heatmap'] is not None:
        config["connector"]["endpoints"]["space_heatmap"] = {
            "params": {
                "sub_type": 0
            }
        }
        print("   ✅ Added space heatmap endpoint")
    
    # Add field mappings based on discovered data
    if 'people_counting' in results and hasattr(results['people_counting'], 'columns'):
        df = results['people_counting']
        for col in df.columns:
            field_map = {"source": col, "target": col.lower().replace(' ', '_').replace('-', '_'), "type": "string"}
            
            # Determine data type
            if 'time' in col.lower():
                field_map["type"] = "timestamp"
            elif any(keyword in col.lower() for keyword in ['in', 'out', 'sum', 'total']):
                field_map["type"] = "integer"
            
            config["connector"]["data_mapping"]["fields"].append(field_map)
    
    # Save comprehensive configuration
    with open("omnia_comprehensive_config.json", "w") as f:
        json.dump(config, f, indent=2)
    
    print("   ✅ Comprehensive configuration saved to: omnia_comprehensive_config.json")
    return config

def main():
    """Main test function"""
    # Test all endpoints
    results = test_all_omnia_endpoints()
    
    # Summary
    print("\n📊 SUMMARY OF RESULTS")
    print("=" * 30)
    
    successful_endpoints = []
    failed_endpoints = []
    
    for endpoint, result in results.items():
        if result is not None:
            successful_endpoints.append(endpoint)
            print(f"   ✅ {endpoint}: Working")
        else:
            failed_endpoints.append(endpoint)
            print(f"   ❌ {endpoint}: Failed")
    
    print(f"\n📈 SUCCESS RATE: {len(successful_endpoints)}/{len(results)} endpoints working")
    
    if successful_endpoints:
        print(f"\n🎯 WORKING ENDPOINTS:")
        for endpoint in successful_endpoints:
            print(f"   • {endpoint}")
        
        # Create comprehensive configuration
        config = create_comprehensive_config(results)
        
        print(f"\n🚀 NEXT STEPS:")
        print(f"   1. Use omnia_comprehensive_config.json for full data collection")
        print(f"   2. Test with: python test_comprehensive_connector.py")
        print(f"   3. Deploy to production with all available data types")
        
    else:
        print(f"\n⚠️  Only basic people counting is working")
        print(f"   Regional counting and heatmap may not be configured on this camera")

if __name__ == "__main__":
    main()