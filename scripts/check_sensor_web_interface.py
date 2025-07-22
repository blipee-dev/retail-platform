#!/usr/bin/env python3
"""Check sensor web interfaces to find API information."""

import requests
from bs4 import BeautifulSoup
import urllib3

# Disable SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def check_web_interface(name, host, port, username, password):
    """Check the web interface of a sensor."""
    print(f"\n{'='*60}")
    print(f"Checking web interface for: {name}")
    print(f"URL: http://{host}:{port}/")
    print('='*60)
    
    base_url = f"http://{host}:{port}"
    session = requests.Session()
    session.auth = (username, password)
    session.verify = False
    
    try:
        # Get the main page
        response = session.get(base_url)
        
        if response.status_code == 200:
            print(f"✅ Web interface accessible")
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Look for title
            title = soup.find('title')
            if title:
                print(f"   Page title: {title.text}")
            
            # Look for version info
            version_elements = soup.find_all(text=lambda text: 'version' in text.lower() if text else False)
            for elem in version_elements[:3]:  # Show first 3 matches
                print(f"   Version info: {elem.strip()}")
            
            # Look for API references
            scripts = soup.find_all('script')
            api_found = False
            for script in scripts:
                if script.string and ('api' in script.string.lower() or 'report' in script.string.lower()):
                    # Extract potential API URLs
                    lines = script.string.split('\n')
                    for line in lines:
                        if 'api' in line.lower() or 'url' in line.lower():
                            print(f"   Found in script: {line.strip()[:100]}...")
                            api_found = True
                            break
                    if api_found:
                        break
            
            # Look for links
            links = soup.find_all('a')
            relevant_links = []
            for link in links:
                href = link.get('href', '')
                text = link.text.strip()
                if any(word in href.lower() or word in text.lower() for word in ['report', 'data', 'count', 'api']):
                    relevant_links.append((text, href))
            
            if relevant_links:
                print("\n   Relevant links found:")
                for text, href in relevant_links[:5]:
                    print(f"   - {text}: {href}")
            
            # Check common CGI endpoints
            print("\n   Checking common endpoints...")
            common_endpoints = [
                '/cgi-bin/data.cgi',
                '/cgi-bin/report.cgi',
                '/cgi-bin/count.cgi',
                '/report.html',
                '/data.html',
                '/api.html'
            ]
            
            for endpoint in common_endpoints:
                try:
                    resp = session.get(f"{base_url}{endpoint}", timeout=2)
                    if resp.status_code == 200:
                        print(f"   ✅ Found: {endpoint}")
                except:
                    pass
                    
        else:
            print(f"❌ Could not access web interface (status: {response.status_code})")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")


def main():
    """Check all sensors."""
    sensors = [
        {
            "name": "J&J Arrábida (WORKING)",
            "host": "176.79.62.167",
            "port": 2102
        },
        {
            "name": "OML01-Omnia Guimarães",
            "host": "93.108.96.96",
            "port": 21001
        },
        {
            "name": "OML02-Omnia Almada",
            "host": "188.37.175.41",
            "port": 2201
        },
        {
            "name": "OML03-Omnia NorteShopping",
            "host": "188.37.124.33",
            "port": 21002
        }
    ]
    
    username = "admin"
    password = "grnl.2024"
    
    print("CHECKING SENSOR WEB INTERFACES")
    print("Looking for API information...")
    
    for sensor in sensors:
        check_web_interface(
            sensor['name'],
            sensor['host'],
            sensor['port'],
            username,
            password
        )


if __name__ == "__main__":
    main()