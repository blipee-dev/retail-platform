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

// Increase max duration for bulk operations
export const maxDuration = 60 // 60 seconds

interface BulkIngestRequest {
  sensor_id: string
  data_batches: Array<{
    data_type: 'people_counting' | 'regional_counting' | 'heatmap' | 'vca_alarm'
    records: any[]
  }>
}

// POST /api/sensors/bulk-ingest - Bulk ingest data from Python connectors
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection not configured' },
        { status: 500 }
      )
    }

    const auth = await authenticateRequest(request, 'store_staff')
    const body: BulkIngestRequest = await request.json()
    
    const { sensor_id, data_batches } = body

    if (!sensor_id || !data_batches || !Array.isArray(data_batches)) {
      return NextResponse.json(
        { error: 'Missing required fields: sensor_id, data_batches' },
        { status: 400 }
      )
    }

    // Validate sensor exists and belongs to organization
    const { data: sensor, error: sensorError } = await supabaseAdmin
      .from('sensor_metadata')
      .select('id, store_id, organization_id')
      .eq('id', sensor_id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (sensorError || !sensor) {
      return NextResponse.json({ error: 'Sensor not found or access denied' }, { status: 404 })
    }

    const results = {
      people_counting: { inserted: 0, errors: 0 },
      regional_counting: { inserted: 0, errors: 0 },
      heatmap: { inserted: 0, errors: 0 },
      vca_alarm: { inserted: 0, errors: 0 }
    }

    // Process each batch
    for (const batch of data_batches) {
      const { data_type, records } = batch

      if (!records || !Array.isArray(records) || records.length === 0) {
        continue
      }

      // Enrich records with sensor metadata
      const enrichedRecords = records.map((record: any) => ({
        ...record,
        sensor_id: sensor.id,
        organization_id: sensor.organization_id,
        store_id: sensor.store_id
      }))

      // Determine table and insert data
      let tableName: string
      switch (data_type) {
        case 'people_counting':
          tableName = 'people_counting_raw'
          break
        case 'regional_counting':
          tableName = 'regional_counting_raw'
          break
        case 'heatmap':
          tableName = 'heatmap_temporal_raw'
          break
        case 'vca_alarm':
          tableName = 'vca_alarm_status'
          break
        default:
          continue
      }

      // Insert in smaller chunks to avoid timeouts
      const chunkSize = 100
      for (let i = 0; i < enrichedRecords.length; i += chunkSize) {
        const chunk = enrichedRecords.slice(i, i + chunkSize)
        
        const { error } = await supabaseAdmin
          .from(tableName)
          .insert(chunk)

        if (error) {
          console.error(`Error inserting ${data_type} batch:`, error)
          results[data_type].errors += chunk.length
        } else {
          results[data_type].inserted += chunk.length
        }
      }
    }

    // Update sensor last_seen_at
    await supabaseAdmin
      .from('sensor_metadata')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', sensor_id)

    // Calculate hourly analytics if we have new people counting data
    if (results.people_counting.inserted > 0) {
      // Trigger async analytics calculation (non-blocking)
      calculateHourlyAnalytics(sensor_id, auth.organizationId).catch(err => 
        console.error('Error calculating analytics:', err)
      )
    }

    return NextResponse.json({ 
      message: 'Bulk data ingestion completed',
      results,
      total_inserted: Object.values(results).reduce((sum: number, r: any) => sum + r.inserted, 0),
      total_errors: Object.values(results).reduce((sum: number, r: any) => sum + r.errors, 0)
    }, { status: 201 })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error in bulk ingest:', error)
    return NextResponse.json({ error: 'Failed to bulk ingest data' }, { status: 500 })
  }
}

// Helper function to calculate hourly analytics
async function calculateHourlyAnalytics(sensorId: string, organizationId: string) {
  try {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    // Get the last hour's data
    const { data: peopleData } = await supabaseAdmin
      .from('people_counting_raw')
      .select('*')
      .eq('sensor_id', sensorId)
      .gte('timestamp', oneHourAgo.toISOString())
      .lte('timestamp', now.toISOString())

    const { data: regionalData } = await supabaseAdmin
      .from('regional_counting_raw')
      .select('*')
      .eq('sensor_id', sensorId)
      .gte('timestamp', oneHourAgo.toISOString())
      .lte('timestamp', now.toISOString())

    if (!peopleData || peopleData.length === 0) {
      return
    }

    // Calculate metrics
    const totalEntries = peopleData.reduce((sum: number, d: any) => sum + (d.total_in || 0), 0)
    const totalExits = peopleData.reduce((sum: number, d: any) => sum + (d.total_out || 0), 0)
    const netFlow = totalEntries - totalExits
    
    // Capture rate metrics
    const totalPassingTraffic = peopleData.reduce((sum: number, d: any) => sum + (d.passing_traffic || 0), 0)
    const avgCaptureRate = totalPassingTraffic > 0 
      ? (totalEntries / totalPassingTraffic) * 100 
      : 0
    const dominantDirections = peopleData
      .filter((d: any) => d.dominant_direction)
      .map((d: any) => d.dominant_direction)
    const dominantTrafficDirection = dominantDirections.length > 0
      ? dominantDirections.sort((a: any, b: any) => 
          dominantDirections.filter((v: any) => v === a).length - 
          dominantDirections.filter((v: any) => v === b).length
        ).pop()
      : null

    // Line distribution
    const lineStats = {
      line1: peopleData.reduce((sum: number, d: any) => sum + (d.line1_in || 0) + (d.line1_out || 0), 0),
      line2: peopleData.reduce((sum: number, d: any) => sum + (d.line2_in || 0) + (d.line2_out || 0), 0),
      line3: peopleData.reduce((sum: number, d: any) => sum + (d.line3_in || 0) + (d.line3_out || 0), 0),
      line4: peopleData.reduce((sum: number, d: any) => sum + (d.line4_in || 0) + (d.line4_out || 0), 0)
    }
    const totalLineTraffic = Object.values(lineStats).reduce((sum: number, val: number) => sum + val, 0)
    const lineDistribution = totalLineTraffic > 0 ? {
      line1: lineStats.line1 / totalLineTraffic,
      line2: lineStats.line2 / totalLineTraffic,
      line3: lineStats.line3 / totalLineTraffic,
      line4: lineStats.line4 / totalLineTraffic
    } : { line1: 0, line2: 0, line3: 0, line4: 0 }

    // Regional metrics
    let regionAvgOccupancy = {}
    let regionMaxOccupancy = {}
    if (regionalData && regionalData.length > 0) {
      regionAvgOccupancy = {
        region1: regionalData.reduce((sum: number, d: any) => sum + (d.region1_count || 0), 0) / regionalData.length,
        region2: regionalData.reduce((sum: number, d: any) => sum + (d.region2_count || 0), 0) / regionalData.length,
        region3: regionalData.reduce((sum: number, d: any) => sum + (d.region3_count || 0), 0) / regionalData.length,
        region4: regionalData.reduce((sum: number, d: any) => sum + (d.region4_count || 0), 0) / regionalData.length
      }
      regionMaxOccupancy = {
        region1: Math.max(...regionalData.map((d: any) => d.region1_count || 0)),
        region2: Math.max(...regionalData.map((d: any) => d.region2_count || 0)),
        region3: Math.max(...regionalData.map((d: any) => d.region3_count || 0)),
        region4: Math.max(...regionalData.map((d: any) => d.region4_count || 0))
      }
    }

    // Get store ID for the sensor
    const { data: sensor } = await supabaseAdmin
      .from('sensor_metadata')
      .select('store_id')
      .eq('id', sensorId)
      .single()

    if (!sensor) return

    // Upsert hourly analytics
    const hourStart = new Date(now)
    hourStart.setMinutes(0, 0, 0)

    await supabaseAdmin
      .from('hourly_analytics')
      .upsert({
        sensor_id: sensorId,
        organization_id: organizationId,
        store_id: sensor.store_id,
        hour_start: hourStart.toISOString(),
        total_entries: totalEntries,
        total_exits: totalExits,
        net_flow: netFlow,
        avg_capture_rate: avgCaptureRate,
        total_passing_traffic: totalPassingTraffic,
        dominant_traffic_direction: dominantTrafficDirection,
        line_distribution: lineDistribution,
        region_avg_occupancy: regionAvgOccupancy,
        region_max_occupancy: regionMaxOccupancy,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'sensor_id,hour_start'
      })

  } catch (error) {
    console.error('Error calculating hourly analytics:', error)
  }
}