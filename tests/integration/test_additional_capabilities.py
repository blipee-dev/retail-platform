#!/usr/bin/env python3
"""
Test Additional Milesight API Capabilities
Demonstrates: Snapshots, System Info, VCA Status, Event Monitoring
"""

import requests
import json
from datetime import datetime
import base64
from PIL import Image
from io import BytesIO
import time

class MilesightAdvancedAPI:
    def __init__(self, host, port, username='admin', password='ms1234'):
        self.host = host
        self.port = port
        self.base_url = f"http://{host}:{port}"
        self.auth = (username, password)
        
    def get_snapshot(self):
        """Capture a snapshot from the camera"""
        print("\n📸 Testing Snapshot Capability...")
        
        # Try different snapshot endpoints
        endpoints = [
            "/snapshot.cgi",
            "/cgi-bin/operator/snapshot.cgi",
            "/jpg/image.jpg"  # Some models use this
        ]
        
        for endpoint in endpoints:
            try:
                url = f"{self.base_url}{endpoint}"
                print(f"   Trying: {url}")
                
                response = requests.get(url, auth=self.auth, timeout=10)
                
                if response.status_code == 200 and response.headers.get('content-type', '').startswith('image'):
                    # Save snapshot
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    filename = f"snapshot_{timestamp}.jpg"
                    
                    with open(filename, 'wb') as f:
                        f.write(response.content)
                    
                    # Get image info
                    img = Image.open(BytesIO(response.content))
                    print(f"   ✅ Success! Image: {img.size[0]}x{img.size[1]} pixels")
                    print(f"   📁 Saved as: {filename}")
                    
                    return True
                    
            except Exception as e:
                print(f"   ❌ Failed: {str(e)}")
                
        return False
    
    def get_system_info(self):
        """Get comprehensive system information"""
        print("\n🖥️ Testing System Information Access...")
        
        try:
            # Get basic system info
            url = f"{self.base_url}/cgi-bin/admin/admin.cgi?action=get.system.information"
            response = requests.get(url, auth=self.auth, timeout=10)
            
            if response.status_code == 200:
                print("   ✅ System info retrieved!")
                # Parse the response (usually in variable format)
                print(f"   Response preview: {response.text[:200]}...")
                
                # Try to get model info
                model_url = f"{self.base_url}/cgi-bin/viewer/viewer.cgi?action=get.Model"
                model_resp = requests.get(model_url, auth=self.auth, timeout=10)
                if model_resp.status_code == 200:
                    print(f"   📷 Camera model info: {model_resp.text[:100]}")
                
                return True
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            
        return False
    
    def get_stream_urls(self):
        """Get available stream URLs"""
        print("\n📹 Testing Stream URL Discovery...")
        
        try:
            url = f"{self.base_url}/cgi-bin/operator/operator.cgi?action=get.stream.url"
            response = requests.get(url, auth=self.auth, timeout=10)
            
            if response.status_code == 200:
                print("   ✅ Stream URLs retrieved!")
                # Parse the response
                lines = response.text.strip().split('\n')
                for line in lines:
                    if 'rtsp' in line or 'http' in line:
                        print(f"   🔗 {line}")
                        
                return True
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            
        return False
    
    def test_event_monitoring(self):
        """Test real-time event monitoring"""
        print("\n🚨 Testing Event Monitoring...")
        
        try:
            url = f"{self.base_url}/cgi-bin/notify.fcgi"
            print(f"   Connecting to: {url}")
            
            # Try to connect with streaming
            response = requests.get(url, auth=self.auth, stream=True, timeout=5)
            
            if response.status_code == 200:
                print("   ✅ Connected to event stream!")
                print("   Monitoring for 5 seconds...")
                
                start_time = time.time()
                event_count = 0
                
                for line in response.iter_lines():
                    if line:
                        event_count += 1
                        print(f"   📢 Event: {line.decode('utf-8')[:100]}...")
                        
                    if time.time() - start_time > 5:
                        break
                        
                print(f"   📊 Received {event_count} events")
                return True
                
        except requests.exceptions.Timeout:
            print("   ⏱️ Timeout - no events in 5 seconds")
            return True
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            
        return False
    
    def get_vca_configuration(self):
        """Get VCA (Video Content Analysis) configuration"""
        print("\n🎯 Testing VCA Configuration Access...")
        
        vca_endpoints = [
            ("VCA Config", "get.vca.configuration"),
            ("VCA Regions", "get.vca.regions"),
            ("VCA Lines", "get.vca.lines"),
            ("Regional Counting", "get.regional.counting"),
            ("Heatmap Config", "get.heatmap.config")
        ]
        
        results = {}
        
        for name, action in vca_endpoints:
            try:
                url = f"{self.base_url}/cgi-bin/operator/operator.cgi?action={action}"
                response = requests.get(url, auth=self.auth, timeout=10)
                
                if response.status_code == 200:
                    print(f"   ✅ {name}: Available")
                    results[name] = True
                else:
                    print(f"   ❌ {name}: Not available ({response.status_code})")
                    results[name] = False
                    
            except Exception as e:
                print(f"   ❌ {name}: Error - {str(e)}")
                results[name] = False
                
        return results
    
    def test_http_streaming(self):
        """Test HTTP video streaming"""
        print("\n🎥 Testing HTTP Video Streaming...")
        
        stream_types = ['main', 'cif', 'third']
        
        for stream_type in stream_types:
            try:
                url = f"{self.base_url}/ipcam/httpstream.cgi?streamtype={stream_type}"
                print(f"   Testing {stream_type} stream: {url}")
                
                # Just test connection, don't download full stream
                response = requests.get(url, auth=self.auth, stream=True, timeout=5)
                
                if response.status_code == 200:
                    # Read a small chunk to verify it's video data
                    chunk = next(response.iter_content(1024))
                    if chunk:
                        print(f"   ✅ {stream_type} stream: Active (received {len(chunk)} bytes)")
                        response.close()
                        return True
                else:
                    print(f"   ❌ {stream_type} stream: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"   ❌ {stream_type} stream: {str(e)}")
                
        return False
    
    def get_storage_info(self):
        """Get storage information"""
        print("\n💾 Testing Storage Information...")
        
        try:
            url = f"{self.base_url}/cgi-bin/operator/operator.cgi?action=get.storage.information"
            response = requests.get(url, auth=self.auth, timeout=10)
            
            if response.status_code == 200:
                print("   ✅ Storage info retrieved!")
                # Parse response
                if 'sd_status' in response.text:
                    print("   💾 SD card status found")
                if 'nas_status' in response.text:
                    print("   🗄️ NAS status found")
                    
                return True
                
        except Exception as e:
            print(f"   ❌ Error: {str(e)}")
            
        return False


def main():
    """Test all additional capabilities"""
    print("🚀 MILESIGHT ADVANCED API CAPABILITIES TEST")
    print("="*60)
    print("Testing camera at: OML01-Omnia GuimarãesShopping")
    print("IP: 93.108.96.96:21001")
    print("="*60)
    
    # Initialize API client
    api = MilesightAdvancedAPI('93.108.96.96', 21001)
    
    # Run all tests
    results = {
        'Snapshot': api.get_snapshot(),
        'System Info': api.get_system_info(),
        'Stream URLs': api.get_stream_urls(),
        'Event Monitoring': api.test_event_monitoring(),
        'VCA Configuration': api.get_vca_configuration(),
        'HTTP Streaming': api.test_http_streaming(),
        'Storage Info': api.get_storage_info()
    }
    
    # Summary
    print("\n📊 CAPABILITY TEST SUMMARY")
    print("="*60)
    
    available = []
    not_available = []
    
    for capability, result in results.items():
        if isinstance(result, dict):
            # VCA configuration returns dict
            for sub_cap, sub_result in result.items():
                if sub_result:
                    available.append(f"{capability} - {sub_cap}")
                else:
                    not_available.append(f"{capability} - {sub_cap}")
        elif result:
            available.append(capability)
        else:
            not_available.append(capability)
    
    print("\n✅ Available Capabilities:")
    for cap in available:
        print(f"   • {cap}")
        
    print("\n❌ Not Available:")
    for cap in not_available:
        print(f"   • {cap}")
        
    print(f"\n📈 Success Rate: {len(available)}/{len(available)+len(not_available)} capabilities")
    
    print("\n💡 KEY INSIGHTS:")
    print("   • The camera API capabilities depend on model and firmware")
    print("   • Some endpoints may require specific permissions or camera features")
    print("   • HTTP streaming and snapshots are often model-specific")
    print("   • Event monitoring requires camera to be configured with events")


if __name__ == "__main__":
    main()