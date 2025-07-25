#!/usr/bin/env python3
"""Check complete database schema and compare with migrations"""

import requests
import json
import os
from pathlib import Path

# Supabase configuration
SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M"

headers = {
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
    'Content-Type': 'application/json'
}

def get_all_tables():
    """Get all tables from database using information_schema"""
    query = """
    SELECT 
        table_name,
        table_type
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
    """
    
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/sql",
        headers=headers,
        json={"query": query}
    )
    
    if response.ok:
        return response.json()
    else:
        # Try alternative method - list all accessible tables
        print("Using alternative method to list tables...")
        return None

def check_table_columns(table_name):
    """Get columns for a specific table"""
    # Try to get schema info
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=0",
        headers=headers
    )
    
    if response.ok:
        # Get column info from response headers or by fetching one row
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?select=*&limit=1",
            headers=headers
        )
        if response.ok and response.json():
            return list(response.json()[0].keys())
    return None

def get_table_count(table_name):
    """Get row count for a table"""
    response = requests.head(
        f"{SUPABASE_URL}/rest/v1/{table_name}?select=*",
        headers={**headers, 'Prefer': 'count=exact'}
    )
    
    if response.ok:
        count = response.headers.get('content-range', '').split('/')[-1]
        return count
    return "?"

def scan_migrations():
    """Scan migration files to see what should exist"""
    migrations_dir = Path("/workspaces/retail-platform/app/lib/migrations")
    migrations = {}
    
    if migrations_dir.exists():
        for file in sorted(migrations_dir.glob("*.sql")):
            if file.is_file():
                print(f"\n📄 Migration: {file.name}")
                with open(file, 'r') as f:
                    content = f.read()
                    # Look for CREATE TABLE statements
                    import re
                    tables = re.findall(r'CREATE TABLE (?:IF NOT EXISTS )?(\w+)', content, re.IGNORECASE)
                    if tables:
                        print(f"   Creates tables: {', '.join(set(tables))}")
                        for table in tables:
                            migrations[table.lower()] = file.name
    
    return migrations

def main():
    print("🔍 Complete Database Schema Analysis")
    print("=" * 80)
    
    # First scan migrations
    print("\n📁 MIGRATION FILES:")
    print("-" * 80)
    expected_tables = scan_migrations()
    
    # Known tables to check (including auth schema)
    print("\n\n📊 DATABASE TABLES:")
    print("-" * 80)
    
    # Tables we know should exist
    known_tables = [
        # Core tables
        "organizations", "stores", "profiles", "user_profiles",
        
        # Sensor tables
        "sensor_metadata", "sensors",
        
        # People counting tables
        "people_counting_raw", "people_counting_data", 
        "hourly_analytics", "daily_analytics",
        
        # Regional analytics
        "regions", "regional_analytics", 
        "entrance_exit_analytics", "occupancy_tracking",
        
        # Alerts and analytics
        "analytics_alerts", "alert_rules",
        
        # Auth tables
        "users", "user_roles", "role_permissions"
    ]
    
    found_tables = {}
    missing_tables = []
    
    for table in known_tables:
        count = get_table_count(table)
        if count != "?":
            found_tables[table] = count
            columns = check_table_columns(table)
            print(f"\n✅ {table} ({count} records)")
            if columns and len(columns) < 15:  # Only show columns for smaller tables
                print(f"   Columns: {', '.join(columns[:10])}")
                if len(columns) > 10:
                    print(f"   ... and {len(columns) - 10} more columns")
        else:
            missing_tables.append(table)
            print(f"\n❌ {table} - NOT FOUND")
    
    # Check for potential duplicates
    print("\n\n🔍 ANALYSIS:")
    print("-" * 80)
    
    # Look for similar table names
    similar_pairs = []
    table_names = list(found_tables.keys())
    for i, t1 in enumerate(table_names):
        for t2 in table_names[i+1:]:
            if t1 != t2 and (t1 in t2 or t2 in t1):
                similar_pairs.append((t1, t2))
    
    if similar_pairs:
        print("\n⚠️  Potentially duplicate/similar tables:")
        for t1, t2 in similar_pairs:
            print(f"   - {t1} ({found_tables[t1]} records) vs {t2} ({found_tables[t2]} records)")
    
    # Missing tables that should exist based on migrations
    print(f"\n❌ Missing tables ({len(missing_tables)}):")
    for table in missing_tables:
        if table in expected_tables:
            print(f"   - {table} (should be created by {expected_tables[table]})")
        else:
            print(f"   - {table} (no migration file found)")
    
    # Tables in migrations but not checked
    print("\n📋 Tables in migrations not checked above:")
    for table in expected_tables:
        if table not in known_tables:
            print(f"   - {table} (from {expected_tables[table]})")
    
    # Summary
    print("\n\n📊 SUMMARY:")
    print("-" * 80)
    print(f"✅ Found tables: {len(found_tables)}")
    print(f"❌ Missing tables: {len(missing_tables)}")
    print(f"📄 Migration files: {len(expected_tables)} tables defined")
    
    # Check for empty tables that should have data
    print("\n\n⚠️  Empty tables that might need data:")
    for table, count in found_tables.items():
        if count == "0" and table not in ["analytics_alerts", "alert_rules", "daily_analytics"]:
            print(f"   - {table}")

if __name__ == "__main__":
    main()