import { authenticateRequest, AuthError } from '@/app/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize admin Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || ''

// Only create client if we have valid credentials and URL
let supabaseAdmin: ReturnType<typeof createClient> | null = null
if (supabaseUrl && serviceRoleKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error)
  }
}

export const dynamic = 'force-dynamic'

// GET /api/sensors/status - Get real-time sensor status
export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const auth = await authenticateRequest(request, 'viewer')
    const url = request.url.startsWith('http') 
      ? request.url 
      : `https://example.com${request.url}`
    const { searchParams } = new URL(url)
    
    const sensorId = searchParams.get('sensor_id')
    const storeId = searchParams.get('store_id')

    let query = supabaseAdmin
      .from('sensor_metadata')
      .select(`
        id,
        sensor_name,
        sensor_type,
        is_active,
        last_seen_at,
        stores (
          id,
          name
        )
      `)
      .eq('organization_id', auth.organizationId)

    if (sensorId) {
      query = query.eq('id', sensorId)
    }

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    const { data: sensors, error: sensorError } = await query

    if (sensorError) throw sensorError

    // Get latest data for each sensor
    const sensorStatuses = await Promise.all(
      sensors.map(async (sensor) => {
        // Get latest people counting data
        const { data: latestCount } = await supabaseAdmin
          .from('people_counting_raw')
          .select('timestamp, total_in, total_out, net_flow')
          .eq('sensor_id', sensor.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        // Get latest regional data
        const { data: latestRegional } = await supabaseAdmin
          .from('regional_counting_raw')
          .select('timestamp, region1_count, region2_count, region3_count, region4_count, total_regional_count')
          .eq('sensor_id', sensor.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        // Get current hour analytics
        const currentHour = new Date()
        currentHour.setMinutes(0, 0, 0)
        
        const { data: hourlyStats } = await supabaseAdmin
          .from('hourly_analytics')
          .select('total_entries, total_exits, net_flow, avg_occupancy')
          .eq('sensor_id', sensor.id)
          .eq('hour_start', currentHour.toISOString())
          .single()

        // Get active alerts
        const { data: activeAlerts } = await supabaseAdmin
          .from('alerts')
          .select('id, severity, title, triggered_at')
          .eq('sensor_id', sensor.id)
          .is('resolved_at', null)
          .order('triggered_at', { ascending: false })
          .limit(5)

        // Calculate sensor health
        const now = new Date()
        const lastSeen = sensor.last_seen_at ? new Date(sensor.last_seen_at) : null
        const minutesSinceLastSeen = lastSeen ? 
          Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60)) : null

        let health = 'unknown'
        if (sensor.is_active && minutesSinceLastSeen !== null) {
          if (minutesSinceLastSeen < 5) {
            health = 'healthy'
          } else if (minutesSinceLastSeen < 30) {
            health = 'warning'
          } else {
            health = 'error'
          }
        } else if (!sensor.is_active) {
          health = 'inactive'
        }

        return {
          sensor: {
            id: sensor.id,
            name: sensor.sensor_name,
            type: sensor.sensor_type,
            store: sensor.stores,
            is_active: sensor.is_active,
            last_seen_at: sensor.last_seen_at,
            minutes_since_last_seen: minutesSinceLastSeen,
            health
          },
          latest_data: {
            people_counting: latestCount,
            regional_counting: latestRegional
          },
          current_hour_stats: hourlyStats || {
            total_entries: 0,
            total_exits: 0,
            net_flow: 0,
            avg_occupancy: 0
          },
          active_alerts: activeAlerts || []
        }
      })
    )

    // Calculate organization-wide summary
    const summary = {
      total_sensors: sensorStatuses.length,
      active_sensors: sensorStatuses.filter(s => s.sensor.is_active).length,
      healthy_sensors: sensorStatuses.filter(s => s.sensor.health === 'healthy').length,
      warning_sensors: sensorStatuses.filter(s => s.sensor.health === 'warning').length,
      error_sensors: sensorStatuses.filter(s => s.sensor.health === 'error').length,
      total_alerts: sensorStatuses.reduce((sum, s) => sum + s.active_alerts.length, 0),
      current_hour_traffic: sensorStatuses.reduce((sum, s) => 
        sum + (s.current_hour_stats?.total_entries || 0), 0
      )
    }

    return NextResponse.json({
      summary,
      sensors: sensorStatuses
    })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error fetching sensor status:', error)
    return NextResponse.json({ error: 'Failed to fetch sensor status' }, { status: 500 })
  }
}