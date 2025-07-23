import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const body = await request.json()
    const { data } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Process each data point
    const processed = []
    const errors = []

    for (const item of data) {
      try {
        const { sensor_id, organization, store, timestamp, data: sensorData } = item

        // Get store ID from database
        const { data: storeRecord } = await supabase
          .from('stores')
          .select('id')
          .eq('name', store)
          .single()

        if (!storeRecord) {
          errors.push({ sensor_id, error: 'Store not found' })
          continue
        }

        // Insert people counting data
        const { error: insertError } = await supabase
          .from('people_counting_raw')
          .insert({
            sensor_id,
            store_id: storeRecord.id,
            timestamp: timestamp,
            line1_in: sensorData.line1_in || 0,
            line1_out: sensorData.line1_out || 0,
            line2_in: sensorData.line2_in || 0,
            line2_out: sensorData.line2_out || 0,
            line3_in: sensorData.line3_in || 0,
            line3_out: sensorData.line3_out || 0,
            line4_in: sensorData.line4_in || 0,
            line4_out: sensorData.line4_out || 0,
            total_in: sensorData.total_in || 0,
            total_out: sensorData.total_out || 0,
            passing_traffic: sensorData.passing_traffic || 0,
            capture_rate: sensorData.capture_rate || 0
          })

        if (insertError) {
          console.error('Insert error:', insertError)
          errors.push({ sensor_id, error: insertError.message })
        } else {
          processed.push(sensor_id)
        }
      } catch (error) {
        console.error('Processing error:', error)
        errors.push({ sensor_id: item.sensor_id, error: error.message })
      }
    }

    return NextResponse.json({
      message: 'Data ingestion completed',
      processed: processed.length,
      errors: errors.length,
      details: { processed, errors }
    })
  } catch (error) {
    console.error('Error in bulk ingestion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}