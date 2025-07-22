import { NextRequest, NextResponse } from 'next/server'
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

    // Get all sensors with their store info
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .select('*, store:stores(*)')

    if (sensorsError) {
      return NextResponse.json({ error: 'Failed to fetch sensors', details: sensorsError }, { status: 500 })
    }

    // Create test data for each sensor
    const now = new Date()
    const testData = []

    for (const sensor of sensors || []) {
      // Map external_id to test data
      let lineData = {}
      
      if (sensor.config?.external_id === '176.79.62.167:2102') {
        // J&J data
        lineData = {
          line1_in: 9,
          line1_out: 10,
          line2_in: 0,
          line2_out: 0,
          line3_in: 0,
          line3_out: 0,
          line4_in: 27,
          line4_out: 54
        }
      } else if (sensor.config?.external_id === '93.108.96.96:21001') {
        // OML01 data
        lineData = {
          line1_in: 14,
          line1_out: 11,
          line2_in: 0,
          line2_out: 0,
          line3_in: 0,
          line3_out: 0,
          line4_in: 391,
          line4_out: 124
        }
      } else if (sensor.config?.external_id === '188.37.175.41:2201') {
        // OML02 data
        lineData = {
          line1_in: 4,
          line1_out: 6,
          line2_in: 4,
          line2_out: 7,
          line3_in: 0,
          line3_out: 0,
          line4_in: 222,
          line4_out: 204
        }
      } else if (sensor.config?.external_id === '188.37.124.33:21002') {
        // OML03 data
        lineData = {
          line1_in: 13,
          line1_out: 8,
          line2_in: 0,
          line2_out: 0,
          line3_in: 0,
          line3_out: 0,
          line4_in: 97,
          line4_out: 199
        }
      }

      testData.push({
        sensor_id: sensor.id,
        organization_id: sensor.organization_id,
        store_id: sensor.store_id,
        timestamp: now,
        end_time: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour later
        ...lineData
      })
    }

    // Insert into people_counting_raw table
    const { data: insertedData, error: insertError } = await supabase
      .from('people_counting_raw')
      .insert(testData)
      .select()

    if (insertError) {
      return NextResponse.json({ 
        error: 'Failed to insert data',
        details: insertError 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Test data inserted successfully',
      count: insertedData?.length || 0,
      data: insertedData?.map(d => ({
        sensor_name: sensors?.find(s => s.id === d.sensor_id)?.sensor_name,
        timestamp: d.timestamp,
        total_in: d.total_in,
        total_out: d.total_out,
        line4_in: d.line4_in,
        line4_out: d.line4_out
      }))
    })
  } catch (error) {
    console.error('Error in test insert:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}