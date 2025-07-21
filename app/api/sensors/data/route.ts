import { authenticateRequest, AuthError } from '@/app/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize admin Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export const dynamic = 'force-dynamic'

interface PeopleCountingData {
  sensor_id: string
  timestamp: string
  end_time: string
  line1_in?: number
  line1_out?: number
  line2_in?: number
  line2_out?: number
  line3_in?: number
  line3_out?: number
  line4_in?: number
  line4_out?: number
}

interface RegionalCountingData {
  sensor_id: string
  timestamp: string
  end_time: string
  region1_count?: number
  region2_count?: number
  region3_count?: number
  region4_count?: number
}

interface HeatmapData {
  sensor_id: string
  timestamp: string
  heat_value: number
}

interface VCAAlarmData {
  sensor_id: string
  timestamp: string
  counter_alarm_status?: number
  region1_in_alarm?: number
  region1_out_alarm?: number
  region2_in_alarm?: number
  region2_out_alarm?: number
  region3_in_alarm?: number
  region3_out_alarm?: number
  region4_in_alarm?: number
  region4_out_alarm?: number
}

// POST /api/sensors/data - Ingest sensor data
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, 'store_staff')
    const body = await request.json()
    
    const { data_type, data } = body

    if (!data_type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: data_type, data' },
        { status: 400 }
      )
    }

    // Validate sensor exists and belongs to organization
    const sensorIds = Array.isArray(data) 
      ? [...new Set(data.map((d: any) => d.sensor_id))]
      : [data.sensor_id]

    const { data: sensors, error: sensorError } = await supabaseAdmin
      .from('sensor_metadata')
      .select('id, store_id, organization_id')
      .in('id', sensorIds)
      .eq('organization_id', auth.organizationId)

    if (sensorError || !sensors || sensors.length !== sensorIds.length) {
      return NextResponse.json({ error: 'Invalid sensor ID(s)' }, { status: 404 })
    }

    // Create a map for quick lookup
    const sensorMap = new Map(sensors.map(s => [s.id, s]))

    // Prepare data with organization and store IDs
    const enrichData = (record: any) => {
      const sensor = sensorMap.get(record.sensor_id)
      return {
        ...record,
        organization_id: sensor.organization_id,
        store_id: sensor.store_id
      }
    }

    const dataArray = Array.isArray(data) ? data : [data]
    const enrichedData = dataArray.map(enrichData)

    let result
    switch (data_type) {
      case 'people_counting':
        result = await supabaseAdmin
          .from('people_counting_raw')
          .insert(enrichedData)
        break

      case 'regional_counting':
        result = await supabaseAdmin
          .from('regional_counting_raw')
          .insert(enrichedData)
        break

      case 'heatmap':
        result = await supabaseAdmin
          .from('heatmap_temporal_raw')
          .insert(enrichedData)
        break

      case 'vca_alarm':
        result = await supabaseAdmin
          .from('vca_alarm_status')
          .insert(enrichedData)
        break

      default:
        return NextResponse.json(
          { error: `Invalid data_type: ${data_type}. Valid types: people_counting, regional_counting, heatmap, vca_alarm` },
          { status: 400 }
        )
    }

    if (result.error) throw result.error

    // Update sensor last_seen_at
    await supabaseAdmin
      .from('sensor_metadata')
      .update({ last_seen_at: new Date().toISOString() })
      .in('id', sensorIds)

    return NextResponse.json({ 
      message: 'Data ingested successfully',
      count: enrichedData.length 
    }, { status: 201 })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error ingesting sensor data:', error)
    return NextResponse.json({ error: 'Failed to ingest sensor data' }, { status: 500 })
  }
}

// GET /api/sensors/data - Query sensor data
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, 'viewer')
    const { searchParams } = new URL(request.url)
    
    const dataType = searchParams.get('data_type')
    const sensorId = searchParams.get('sensor_id')
    const storeId = searchParams.get('store_id')
    const startTime = searchParams.get('start_time')
    const endTime = searchParams.get('end_time')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!dataType) {
      return NextResponse.json(
        { error: 'data_type parameter is required' },
        { status: 400 }
      )
    }

    let query
    switch (dataType) {
      case 'people_counting':
        query = supabaseAdmin
          .from('people_counting_raw')
          .select('*')
          .eq('organization_id', auth.organizationId)
        break

      case 'regional_counting':
        query = supabaseAdmin
          .from('regional_counting_raw')
          .select('*')
          .eq('organization_id', auth.organizationId)
        break

      case 'heatmap':
        query = supabaseAdmin
          .from('heatmap_temporal_raw')
          .select('*')
          .eq('organization_id', auth.organizationId)
        break

      case 'vca_alarm':
        query = supabaseAdmin
          .from('vca_alarm_status')
          .select('*')
          .eq('organization_id', auth.organizationId)
        break

      case 'hourly_analytics':
        query = supabaseAdmin
          .from('hourly_analytics')
          .select('*')
          .eq('organization_id', auth.organizationId)
        break

      case 'daily_summary':
        query = supabaseAdmin
          .from('daily_summary')
          .select('*')
          .eq('organization_id', auth.organizationId)
        break

      default:
        return NextResponse.json(
          { error: `Invalid data_type: ${dataType}` },
          { status: 400 }
        )
    }

    // Apply filters
    if (sensorId) {
      query = query.eq('sensor_id', sensorId)
    }

    if (storeId) {
      query = query.eq('store_id', storeId)
    }

    if (startTime) {
      const timestampField = dataType === 'daily_summary' ? 'date' : 
                           dataType === 'hourly_analytics' ? 'hour_start' : 'timestamp'
      query = query.gte(timestampField, startTime)
    }

    if (endTime) {
      const timestampField = dataType === 'daily_summary' ? 'date' : 
                           dataType === 'hourly_analytics' ? 'hour_start' : 'timestamp'
      query = query.lte(timestampField, endTime)
    }

    // Apply pagination and ordering
    const orderField = dataType === 'daily_summary' ? 'date' : 
                      dataType === 'hourly_analytics' ? 'hour_start' : 'timestamp'
    
    query = query
      .order(orderField, { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data,
      pagination: {
        limit,
        offset,
        total: count
      }
    })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error querying sensor data:', error)
    return NextResponse.json({ error: 'Failed to query sensor data' }, { status: 500 })
  }
}