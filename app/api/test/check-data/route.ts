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

    // Get recent data from people_counting_raw
    const { data: rawData, error: rawError } = await supabase
      .from('people_counting_raw')
      .select(`
        *,
        sensor:sensor_metadata(sensor_name, sensor_ip),
        store:stores(name)
      `)
      .order('timestamp', { ascending: false })
      .limit(10)

    if (rawError) {
      return NextResponse.json({ error: 'Failed to fetch data', details: rawError }, { status: 500 })
    }

    // Calculate proper metrics
    const processedData = rawData?.map(d => ({
      sensor: d.sensor?.sensor_name,
      store: d.store?.name,
      timestamp: d.timestamp,
      store_entries: d.line1_in + d.line2_in + d.line3_in,
      store_exits: d.line1_out + d.line2_out + d.line3_out,
      passing_traffic_in: d.line4_in,
      passing_traffic_out: d.line4_out,
      total_passing: d.line4_in + d.line4_out,
      capture_rate: ((d.line1_in + d.line2_in + d.line3_in) / (d.line4_in + d.line4_out) * 100).toFixed(1),
      current_occupancy_change: (d.line1_in + d.line2_in + d.line3_in) - (d.line1_out + d.line2_out + d.line3_out)
    }))

    return NextResponse.json({
      message: 'Data check',
      count: rawData?.length || 0,
      data: processedData
    })
  } catch (error) {
    console.error('Error checking data:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}