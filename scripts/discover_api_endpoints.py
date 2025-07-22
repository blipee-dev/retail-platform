#!/usr/bin/env python3
"""Discover API endpoints for Milesight sensors."""

import requests
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def discover_endpoints(name, host, port, username, password):
    """Try to discover working endpoints for a sensor."""
    print(f"\n{'='*60}")
    print(f"Discovering endpoints for: {name}")
    print(f"Host: {host}:{port}")
    print('='*60)
    
    base_url = f"http://{host}:{port}"
    auth = (username, password)
    
    # Common Milesight API endpoints to try
    endpoints = [
        # API v1 endpoints
        "/api/v1/data",
        "/api/v1/data/line_counting",
        "/api/v1/data/regional_counting",
        "/api/v1/data/people_counting",
        "/api/v1/system/status",
        "/api/v1/device/info",
        
        # API v2 endpoints
        "/api/v2/data",
        "/api/v2/people-counting",
        "/api/v2/line-counting",
        "/api/v2/regional-counting",
        
        # CGI endpoints
        "/cgi-bin/data.cgi",
        "/cgi-bin/count.cgi",
        "/cgi-bin/system.cgi",
        
        # Other possible endpoints
        "/api/data",
        "/api/count",
        "/api/people_count",
        "/api/line_count",
        "/api/regional_count",
        "/data",
        "/count",
        
        # Root paths
        "/",
        "/api",
        "/api/v1",
        "/api/v2"
    ]
    
    found_endpoints = []
    
    for endpoint in endpoints:
        try:
            response = requests.get(
                f"{base_url}{endpoint}",
                auth=auth,
                timeout=5,
                verify=False
            )
            
            if response.status_code in [200, 201]:
                print(f"✅ Found working endpoint: {endpoint} (Status: {response.status_code})")
                found_endpoints.append(endpoint)
                
                # Try to show some response content
                try:
                    if response.headers.get('content-type', '').startswith('application/json'):
                        data = response.json()
                        if isinstance(data, dict):
                            print(f"   Response keys: {list(data.keys())[:5]}")
                        elif isinstance(data, list):
                            print(f"   Response: List with {len(data)} items")
                    else:
                        print(f"   Content-Type: {response.headers.get('content-type', 'unknown')}")
                except:
                    pass
                    
            elif response.status_code == 400:
                print(f"⚠️  Endpoint exists but needs parameters: {endpoint}")
                found_endpoints.append(f"{endpoint} (needs params)")
            elif response.status_code == 401:
                print(f"⚠️  Auth required for: {endpoint}")
            elif response.status_code == 405:
                print(f"⚠️  Method not allowed: {endpoint} (might need POST)")
                
        except requests.exceptions.Timeout:
            pass  # Skip timeout errors
        except requests.exceptions.RequestException:
            pass  # Skip connection errors
    
    # Try to get data with parameters
    print("\n🔍 Testing data endpoints with parameters...")
    
    data_endpoints = ["/api/v1/data", "/api/data", "/data"]
    
    for endpoint in data_endpoints:
        if any(endpoint in e for e in found_endpoints):
            # Try with report_type parameter
            for report_type in [0, 1, 2]:  # 0=line, 1=regional, 2=heatmap
                try:
                    response = requests.get(
                        f"{base_url}{endpoint}",
                        params={"report_type": report_type},
                        auth=auth,
                        timeout=5,
                        verify=False
                    )
                    
                    if response.status_code == 200:
                        data = response.json()
                        if data:
                            print(f"✅ {endpoint}?report_type={report_type} returns data!")
                            if isinstance(data, list):
                                print(f"   Data: List with {len(data)} items")
                            break
                except:
                    pass
    
    return found_endpoints


def main():
    """Discover endpoints for all sensors."""
    sensors = [
        {
            "name": "J&J Arrábida",
            "host": "176.79.62.167",
            "port": 2102,
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "Omnia Guimarães",
            "host": "93.108.96.96",
            "port": 21001,
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "Omnia Almada",
            "host": "188.37.175.41",
            "port": 2201,
            "username": "admin",
            "password": "grnl.2024"
        },
        {
            "name": "Omnia NorteShopping",
            "host": "188.37.124.33",
            "port": 21002,
            "username": "admin",
            "password": "grnl.2024"
        }
    ]
    
    for sensor in sensors:
        discover_endpoints(
            sensor['name'],
            sensor['host'],
            sensor['port'],
            sensor['username'],
            sensor['password']
        )


if __name__ == "__main__":
    main()