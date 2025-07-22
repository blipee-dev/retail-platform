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

    // Get last hour's data
    const oneHourAgo = new Date()
    oneHourAgo.setHours(oneHourAgo.getHours() - 1)

    const { data: rawData, error: rawError } = await supabase
      .from('people_counting_raw')
      .select(`
        *,
        sensor:sensor_metadata(sensor_name, sensor_ip),
        store:stores(name)
      `)
      .gte('timestamp', oneHourAgo.toISOString())
      .order('timestamp', { ascending: false })

    if (rawError) {
      return NextResponse.json({ error: 'Failed to fetch data', details: rawError }, { status: 500 })
    }

    // Count by timestamp
    const countByTime = {}
    rawData?.forEach(d => {
      const time = new Date(d.timestamp).toISOString().split('.')[0]
      countByTime[time] = (countByTime[time] || 0) + 1
    })

    return NextResponse.json({
      message: 'Recent data check',
      total_records: rawData?.length || 0,
      unique_timestamps: Object.keys(countByTime).length,
      timestamps: Object.keys(countByTime).sort().reverse().slice(0, 10),
      records_by_sensor: rawData?.reduce((acc, d) => {
        const name = d.sensor?.sensor_name || 'Unknown'
        acc[name] = (acc[name] || 0) + 1
        return acc
      }, {})
    })
  } catch (error) {
    console.error('Error checking recent data:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}