#!/usr/bin/env python3
"""Directly set up sensors in Supabase database"""

import requests
import json
from datetime import datetime

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def setup_organizations():
    """Create organizations"""
    print("📁 Setting up organizations...")
    
    organizations = [
        {
            "id": "c1d2e3f4-5678-90ab-cdef-123456789012",
            "name": "Jack & Jones",
            "slug": "jack-and-jones",
            "type": "retail",
            "subscription_tier": "professional",
            "is_active": True
        },
        {
            "id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "name": "Omnia",
            "slug": "omnia",
            "type": "retail",
            "subscription_tier": "professional",
            "is_active": True
        }
    ]
    
    for org in organizations:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/organizations",
            headers=headers,
            json=org
        )
        if response.ok:
            print(f"  ✅ Created organization: {org['name']}")
        else:
            print(f"  ⚠️  Organization might exist: {org['name']} - {response.status_code}")
    
    return organizations

def setup_stores():
    """Create stores"""
    print("\n🏪 Setting up stores...")
    
    stores = [
        {
            "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "organization_id": "c1d2e3f4-5678-90ab-cdef-123456789012",
            "name": "Jack & Jones Arrábida",
            "code": "jj-01-arrabida",
            "format": "fashion_retail",
            "status": "active",
            "size_sqm": 250,
            "location": {"city": "Arrábida", "country": "Portugal"}
        },
        {
            "id": "b2c3d4e5-6789-01ab-cdef-234567890123",
            "organization_id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "name": "Omnia Guimarães",
            "code": "omnia-01-guimaraes",
            "format": "fashion_retail",
            "status": "active",
            "size_sqm": 300,
            "location": {"city": "Guimarães", "country": "Portugal"}
        },
        {
            "id": "c3d4e5f6-7890-12ab-cdef-345678901234",
            "organization_id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "name": "Omnia Almada",
            "code": "omnia-02-almada",
            "format": "fashion_retail",
            "status": "active",
            "size_sqm": 280,
            "location": {"city": "Almada", "country": "Portugal"}
        },
        {
            "id": "d4e5f6a7-8901-23ab-cdef-456789012345",
            "organization_id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "name": "Omnia NorteShopping",
            "code": "omnia-03-norteshopping",
            "format": "fashion_retail",
            "status": "active",
            "size_sqm": 350,
            "location": {"city": "Porto", "country": "Portugal"}
        }
    ]
    
    for store in stores:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/stores",
            headers=headers,
            json=store
        )
        if response.ok:
            print(f"  ✅ Created store: {store['name']}")
        else:
            print(f"  ⚠️  Store might exist: {store['name']} - {response.status_code}")
    
    return stores

def setup_sensors():
    """Create sensor metadata"""
    print("\n📡 Setting up sensors...")
    
    sensors = [
        {
            "store_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            "organization_id": "c1d2e3f4-5678-90ab-cdef-123456789012",
            "sensor_name": "J&J-ARR-01-PC",
            "sensor_type": "people_counter",
            "sensor_model": "Milesight VS121",
            "sensor_ip": "188.82.28.148",
            "sensor_port": 2102,
            "api_endpoint": "/dataloader.cgi",
            "location": "Main Entrance",
            "is_active": True,
            "config": {
                "credentials": {
                    "username": "admin",
                    "password": "grnl.2024"
                },
                "line_config": {
                    "line1": "entrance_in",
                    "line2": "entrance_out",
                    "line3": "secondary_in",
                    "line4": "passing_traffic"
                }
            }
        },
        {
            "store_id": "b2c3d4e5-6789-01ab-cdef-234567890123",
            "organization_id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "sensor_name": "OML01-PC",
            "sensor_type": "people_counter",
            "sensor_model": "Milesight VS121",
            "sensor_ip": "93.108.96.96",
            "sensor_port": 21001,
            "api_endpoint": "/dataloader.cgi",
            "location": "Main Entrance",
            "is_active": True,
            "config": {
                "credentials": {
                    "username": "admin",
                    "password": "grnl.2024"
                },
                "line_config": {
                    "line1": "entrance_in",
                    "line2": "entrance_out",
                    "line3": "secondary_in",
                    "line4": "passing_traffic"
                }
            }
        },
        {
            "store_id": "c3d4e5f6-7890-12ab-cdef-345678901234",
            "organization_id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "sensor_name": "OML02-PC",
            "sensor_type": "people_counter",
            "sensor_model": "Milesight VS121",
            "sensor_ip": "188.37.175.41",
            "sensor_port": 2201,
            "api_endpoint": "/dataloader.cgi",
            "location": "Main Entrance",
            "is_active": True,
            "config": {
                "credentials": {
                    "username": "admin",
                    "password": "grnl.2024"
                },
                "line_config": {
                    "line1": "entrance_in",
                    "line2": "entrance_out",
                    "line3": "secondary_in",
                    "line4": "passing_traffic"
                }
            }
        },
        {
            "store_id": "d4e5f6a7-8901-23ab-cdef-456789012345",
            "organization_id": "a1b2c3d4-5678-90ab-cdef-987654321098",
            "sensor_name": "OML03-PC",
            "sensor_type": "people_counter",
            "sensor_model": "Milesight VS121",
            "sensor_ip": "188.37.124.33",
            "sensor_port": 21002,
            "api_endpoint": "/dataloader.cgi",
            "location": "Main Entrance",
            "is_active": True,
            "config": {
                "credentials": {
                    "username": "admin",
                    "password": "grnl.2024"
                },
                "line_config": {
                    "line1": "entrance_in",
                    "line2": "entrance_out",
                    "line3": "secondary_in",
                    "line4": "passing_traffic"
                }
            }
        }
    ]
    
    for sensor in sensors:
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/sensor_metadata",
            headers=headers,
            json=sensor
        )
        if response.ok:
            print(f"  ✅ Created sensor: {sensor['sensor_name']}")
        else:
            print(f"  ❌ Failed to create sensor: {sensor['sensor_name']} - {response.status_code}")
            print(f"     Response: {response.text}")

def verify_setup():
    """Verify the setup"""
    print("\n🔍 Verifying setup...")
    
    # Check sensors
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/sensor_metadata?is_active=eq.true&select=*",
        headers=headers
    )
    
    if response.ok:
        sensors = response.json()
        print(f"\n✅ Setup complete! Found {len(sensors)} active sensors:")
        for sensor in sensors:
            print(f"  - {sensor['sensor_name']} at {sensor['sensor_ip']}:{sensor['sensor_port']}")
    else:
        print(f"❌ Failed to verify: {response.status_code}")

if __name__ == "__main__":
    print("🚀 Setting up sensor infrastructure in Supabase...")
    print("=" * 50)
    
    setup_organizations()
    setup_stores()
    setup_sensors()
    verify_setup()
    
    print("\n✨ Setup complete! The GitHub Actions workflow should now be able to collect data.")