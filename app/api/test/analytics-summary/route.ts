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

    // Get stores
    const { data: stores } = await supabase
      .from('stores')
      .select('id, name, organization:organizations(name)')

    const analytics = []

    for (const store of stores || []) {
      // Get latest data for this store
      const { data: latestData } = await supabase
        .from('people_counting_raw')
        .select('*')
        .eq('store_id', store.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (latestData) {
        // Calculate metrics
        const storeEntries = latestData.line1_in + latestData.line2_in + latestData.line3_in
        const storeExits = latestData.line1_out + latestData.line2_out + latestData.line3_out
        const passingTraffic = latestData.line4_in + latestData.line4_out
        const captureRate = passingTraffic > 0 ? ((storeEntries / passingTraffic) * 100).toFixed(1) : '0.0'

        // Get today's totals
        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        const { data: todayData } = await supabase
          .from('people_counting_raw')
          .select('line1_in, line1_out, line2_in, line2_out, line3_in, line3_out, line4_in, line4_out')
          .eq('store_id', store.id)
          .gte('timestamp', todayStart.toISOString())

        let todayEntries = 0
        let todayExits = 0
        let todayPassing = 0

        todayData?.forEach(d => {
          todayEntries += d.line1_in + d.line2_in + d.line3_in
          todayExits += d.line1_out + d.line2_out + d.line3_out
          todayPassing += d.line4_in + d.line4_out
        })

        const currentOccupancy = todayEntries - todayExits
        const todayCaptureRate = todayPassing > 0 ? ((todayEntries / todayPassing) * 100).toFixed(1) : '0.0'

        analytics.push({
          store: store.name,
          organization: store.organization?.name,
          lastUpdate: latestData.timestamp,
          currentHour: {
            entries: storeEntries,
            exits: storeExits,
            passing: passingTraffic,
            captureRate: captureRate + '%'
          },
          today: {
            entries: todayEntries,
            exits: todayExits,
            passing: todayPassing,
            occupancy: currentOccupancy,
            captureRate: todayCaptureRate + '%'
          }
        })
      }
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      analytics
    })
  } catch (error) {
    console.error('Error getting analytics summary:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}