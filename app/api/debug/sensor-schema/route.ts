import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get a sample sensor or check what columns are required
    const { data: sensors, error: sensorError } = await supabase
      .from('sensor_metadata')
      .select('*')
      .limit(1)

    // Try minimal insert to see required fields
    const { data: testInsert, error: insertError } = await supabase
      .from('sensor_metadata')
      .insert({
        store_id: 'd719cc6b-1715-4721-8897-6f6cd0c025b0' // J&J store
      })
      .select()

    return NextResponse.json({
      message: 'Sensor metadata schema',
      existing_sensors: sensors || [],
      columns: sensors?.[0] ? Object.keys(sensors[0]) : [],
      insert_error: insertError?.message || 'No error',
      insert_details: insertError
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}