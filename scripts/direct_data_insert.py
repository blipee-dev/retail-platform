#!/usr/bin/env python3
"""Directly insert data using store IDs."""

import requests
import json
from datetime import datetime

# First, get the store IDs
stores_url = "http://localhost:3000/api/debug/stores-list"
response = requests.get(stores_url)
stores_data = response.json()

print("Available stores:")
for store in stores_data['stores']:
    print(f"  {store['code']}: {store['name']}")

# Now let's create a direct insert endpoint
print("\nCreating direct insert data...")

# Create the direct insert endpoint first
direct_insert_code = '''import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const body = await request.json()
    
    // Get stores to map codes to IDs
    const { data: stores } = await supabase
      .from('stores')
      .select('id, code')
    
    const storeMap = {}
    stores?.forEach(s => {
      storeMap[s.code] = s.id
    })

    // Insert test data for each store
    const inserts = [
      {
        sensor_id: '176.79.62.167:2102',
        store_id: storeMap['JJ-ARR-01'],
        timestamp: new Date().toISOString(),
        line1_in: 9,
        line1_out: 10,
        line2_in: 0,
        line2_out: 0,
        line3_in: 0,
        line3_out: 0,
        line4_in: 27,
        line4_out: 54,
        total_in: 9,
        total_out: 10,
        passing_traffic: 81,
        capture_rate: 11.1
      },
      {
        sensor_id: '93.108.96.96:21001',
        store_id: storeMap['OML01'],
        timestamp: new Date().toISOString(),
        line1_in: 14,
        line1_out: 11,
        line2_in: 0,
        line2_out: 0,
        line3_in: 0,
        line3_out: 0,
        line4_in: 391,
        line4_out: 124,
        total_in: 14,
        total_out: 11,
        passing_traffic: 515,
        capture_rate: 2.7
      },
      {
        sensor_id: '188.37.175.41:2201',
        store_id: storeMap['OML02'],
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        line1_in: 4,
        line1_out: 6,
        line2_in: 4,
        line2_out: 7,
        line3_in: 0,
        line3_out: 0,
        line4_in: 222,
        line4_out: 204,
        total_in: 8,
        total_out: 13,
        passing_traffic: 426,
        capture_rate: 1.9
      },
      {
        sensor_id: '188.37.124.33:21002',
        store_id: storeMap['OML03'],
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        line1_in: 13,
        line1_out: 8,
        line2_in: 0,
        line2_out: 0,
        line3_in: 0,
        line3_out: 0,
        line4_in: 97,
        line4_out: 199,
        total_in: 13,
        total_out: 8,
        passing_traffic: 296,
        capture_rate: 4.4
      }
    ]

    const { data, error } = await supabase
      .from('people_counting_data')
      .insert(inserts)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Data inserted successfully',
      count: data?.length || 0,
      data
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}'''

# Save it to a file
with open('/tmp/direct_insert.ts', 'w') as f:
    f.write(direct_insert_code)

print("\nDirect insert endpoint code saved to /tmp/direct_insert.ts")
print("\nTo use it, create the endpoint at:")
print("  /workspaces/retail-platform/app/api/test/direct-insert/route.ts")
print("\nThen run:")
print("  curl -X POST http://localhost:3000/api/test/direct-insert")