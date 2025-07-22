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

    // Process each regional data point
    const processed = []
    const errors = []

    for (const item of data) {
      try {
        const { sensor_id, organization, store, timestamp, data: regionalData } = item

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

        // Insert regional counts for each region
        const regionalInserts = []
        for (let i = 1; i <= 4; i++) {
          const count = regionalData[`region${i}_count`]
          if (count !== undefined && count !== null) {
            regionalInserts.push({
              sensor_id,
              store_id: storeRecord.id,
              region_id: `region_${i}`,
              timestamp: timestamp,
              count: count
            })
          }
        }

        if (regionalInserts.length > 0) {
          const { error: insertError } = await supabase
            .from('regional_counts')
            .insert(regionalInserts)

          if (insertError) {
            console.error('Insert error:', insertError)
            errors.push({ sensor_id, error: insertError.message })
          } else {
            processed.push(sensor_id)
          }
        }
      } catch (error) {
        console.error('Processing error:', error)
        errors.push({ sensor_id: item.sensor_id, error: error.message })
      }
    }

    return NextResponse.json({
      message: 'Regional data ingestion completed',
      processed: processed.length,
      errors: errors.length,
      details: { processed, errors }
    })
  } catch (error) {
    console.error('Error in regional ingestion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const hours = parseInt(searchParams.get('hours') || '24')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Get regional data for the specified time period
    const { data, error } = await supabase
      .from('regional_counts')
      .select('*')
      .eq('store_id', storeId)
      .gte('timestamp', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      console.error('Error fetching regional data:', error)
      return NextResponse.json({ error: 'Failed to fetch regional data' }, { status: 500 })
    }

    // Aggregate data by region
    const regionTotals = new Map()
    const regionTimeSeries = new Map()

    data?.forEach(item => {
      // Update totals
      if (!regionTotals.has(item.region_id)) {
        regionTotals.set(item.region_id, 0)
      }
      regionTotals.set(item.region_id, regionTotals.get(item.region_id) + item.count)

      // Build time series
      if (!regionTimeSeries.has(item.region_id)) {
        regionTimeSeries.set(item.region_id, [])
      }
      regionTimeSeries.get(item.region_id).push({
        timestamp: item.timestamp,
        count: item.count
      })
    })

    return NextResponse.json({
      totals: Object.fromEntries(regionTotals),
      timeSeries: Object.fromEntries(regionTimeSeries),
      period: `${hours} hours`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in GET regional data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}