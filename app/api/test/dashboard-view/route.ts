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

    // Get stores with their latest data
    const { data: stores } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        organization:organizations(name),
        sensors:sensor_metadata(
          id,
          sensor_name,
          latest_data:people_counting_raw(
            timestamp,
            line1_in, line1_out,
            line2_in, line2_out,
            line3_in, line3_out,
            line4_in, line4_out
          )
        )
      `)
      .order('name')

    const dashboard = []

    for (const store of stores || []) {
      for (const sensor of store.sensors || []) {
        const latestData = sensor.latest_data?.[0]
        if (latestData) {
          const entries = latestData.line1_in + latestData.line2_in + latestData.line3_in
          const exits = latestData.line1_out + latestData.line2_out + latestData.line3_out
          const passing = latestData.line4_in + latestData.line4_out
          const captureRate = passing > 0 ? ((entries / passing) * 100).toFixed(1) : '0.0'

          dashboard.push({
            store: store.name,
            organization: store.organization?.name,
            sensor: sensor.sensor_name,
            timestamp: latestData.timestamp,
            metrics: {
              entries,
              exits,
              passing,
              captureRate: `${captureRate}%`,
              occupancyChange: entries - exits
            }
          })
        }
      }
    }

    return NextResponse.json({
      dashboard,
      timestamp: new Date().toISOString(),
      summary: {
        totalStores: stores?.length || 0,
        activeStores: dashboard.length,
        message: dashboard.length > 0 ? 'Live data is flowing!' : 'Waiting for sensor data...'
      }
    })
  } catch (error) {
    console.error('Error creating dashboard view:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}