import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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

    // Get last 5 minutes of data
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    const { data, error } = await supabase
      .from('people_counting_raw')
      .select(`
        timestamp,
        sensor:sensor_metadata(sensor_name),
        store:stores(name),
        line1_in, line1_out,
        line2_in, line2_out, 
        line3_in, line3_out,
        line4_in, line4_out
      `)
      .gte('timestamp', fiveMinutesAgo.toISOString())
      .order('timestamp', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch data', details: error }, { status: 500 })
    }

    // Group by timestamp
    const byTimestamp = {}
    data?.forEach(record => {
      const time = new Date(record.timestamp).toLocaleTimeString()
      if (!byTimestamp[time]) {
        byTimestamp[time] = []
      }
      byTimestamp[time].push({
        sensor: record.sensor?.sensor_name,
        store: record.store?.name,
        entries: record.line1_in + record.line2_in + record.line3_in,
        exits: record.line1_out + record.line2_out + record.line3_out,
        passing: record.line4_in + record.line4_out
      })
    })

    return NextResponse.json({
      message: 'Data flow check',
      last_5_minutes: {
        total_records: data?.length || 0,
        timestamps: Object.keys(byTimestamp).length,
        data: byTimestamp
      }
    })
  } catch (error) {
    console.error('Error checking data flow:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}