#!/usr/bin/env python3
"""Check what stores exist in the database."""

import os
from supabase import create_client, Client

# Get Supabase credentials
url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL', '')
key = os.environ.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

if not url or not key:
    print("❌ Missing Supabase credentials in environment")
    exit(1)

# Create Supabase client
supabase: Client = create_client(url, key)

print("🔍 Checking stores in database...\n")

# Get all stores
try:
    response = supabase.table('stores').select('*').execute()
    stores = response.data
    
    print(f"Found {len(stores)} stores:\n")
    
    for store in stores:
        print(f"Store: {store['name']}")
        print(f"  ID: {store['id']}")
        print(f"  Organization ID: {store['organization_id']}")
        print(f"  Active: {store['is_active']}")
        print()
        
except Exception as e:
    print(f"❌ Error: {str(e)}")