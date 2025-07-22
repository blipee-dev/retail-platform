import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { cookies } from 'next/headers'

// Test endpoint that doesn't require authentication
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const body = await request.json()
    const { data } = body

    if (!data || !Array.isArray(data)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    console.log('Received data:', JSON.stringify(data, null, 2))

    // Process each data point
    const processed = []
    const errors = []

    for (const item of data) {
      try {
        const { sensor_id, organization, store, timestamp, data: sensorData } = item

        console.log(`Processing sensor ${sensor_id} for store ${store}`)

        // Get store ID from database - try exact match first
        let { data: storeRecords, error: storeError } = await supabase
          .from('stores')
          .select('id, name')
          .eq('name', store)
        
        // If no exact match, try by code
        if (!storeRecords || storeRecords.length === 0) {
          // Extract store code from sensor_id or store name
          let storeCode = ''
          if (store.includes('J&J')) {
            storeCode = 'JJ-ARR-01'
          } else if (store.includes('OML01')) {
            storeCode = 'OML01'
          } else if (store.includes('OML02')) {
            storeCode = 'OML02'
          } else if (store.includes('OML03')) {
            storeCode = 'OML03'
          }
          
          if (storeCode) {
            const codeResult = await supabase
              .from('stores')
              .select('id, name')
              .eq('code', storeCode)
            
            if (codeResult.data && codeResult.data.length > 0) {
              storeRecords = codeResult.data
              storeError = null
            }
          }
        }

        if (storeError) {
          console.error('Store lookup error:', storeError)
          errors.push({ sensor_id, error: `Store lookup failed: ${storeError.message}` })
          continue
        }

        if (!storeRecords || storeRecords.length === 0) {
          console.log(`Available stores:`, await supabase.from('stores').select('name'))
          errors.push({ sensor_id, error: `Store not found: ${store}` })
          continue
        }

        if (storeRecords.length > 1) {
          errors.push({ sensor_id, error: `Multiple stores found with name: ${store}` })
          continue
        }

        const storeRecord = storeRecords[0]

        console.log(`Found store ID: ${storeRecord.id}`)

        // Insert people counting data
        const insertData = {
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
        }

        console.log('Inserting data:', insertData)

        const { data: insertResult, error: insertError } = await supabase
          .from('people_counting_data')
          .insert(insertData)
          .select()

        if (insertError) {
          console.error('Insert error:', insertError)
          errors.push({ sensor_id, error: insertError.message })
        } else {
          console.log('Insert successful:', insertResult)
          processed.push(sensor_id)
        }
      } catch (error) {
        console.error('Processing error:', error)
        errors.push({ sensor_id: item.sensor_id, error: error.message })
      }
    }

    const response = {
      message: 'Data ingestion completed',
      processed: processed.length,
      errors: errors.length,
      details: { processed, errors }
    }

    console.log('Response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in test ingestion:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}