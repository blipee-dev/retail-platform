import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'
import { cookies } from 'next/headers'
import { AnalyticsService } from '@/app/lib/services/analytics.service'

// GET /api/analytics/unified/realtime - Real-time metrics
// GET /api/analytics/unified/occupancy - Current occupancy 
// GET /api/analytics/unified/journeys - Customer journeys
// GET /api/analytics/unified/predictions - ML predictions

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')
    const endpoint = searchParams.get('endpoint') || 'realtime'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Initialize analytics service
    const analytics = new AnalyticsService()

    // Handle different endpoints
    switch (endpoint) {
      case 'realtime': {
        // Get all real-time metrics
        const now = new Date()
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        const [occupancy, captureRate, journeys, predictions] = await Promise.all([
          analytics.getCurrentOccupancy(storeId),
          analytics.getCaptureRate(storeId, { start: todayStart, end: now }),
          analytics.getJourneyAnalytics(storeId),
          analytics.getPredictions(storeId, 4)
        ])

        // Get recent people counting data
        const { data: recentData } = await supabase
          .from('people_counting_data')
          .select('*')
          .eq('sensor_id', storeId)
          .gte('timestamp', new Date(now.getTime() - 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false })
          .limit(12)

        return NextResponse.json({
          timestamp: now.toISOString(),
          occupancy,
          captureRate,
          journeys,
          predictions,
          recentData: recentData || [],
          alerts: [...(occupancy.alerts || [])]
        })
      }

      case 'occupancy': {
        const occupancy = await analytics.getCurrentOccupancy(storeId)
        
        // Get historical occupancy for trends
        const { data: historicalData } = await supabase
          .from('hourly_analytics')
          .select('hour_start, peak_occupancy, total_entries, total_exits')
          .eq('sensor_id', storeId)
          .gte('hour_start', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .order('hour_start', { ascending: true })

        return NextResponse.json({
          current: occupancy,
          historical: historicalData || [],
          timestamp: new Date().toISOString()
        })
      }

      case 'journeys': {
        const journeys = await analytics.getJourneyAnalytics(storeId)
        
        // Get detailed journey data if date range provided
        if (startDate && endDate) {
          const { data: detailedJourneys } = await supabase
            .from('customer_journeys')
            .select('*')
            .eq('store_id', storeId)
            .gte('start_time', startDate)
            .lte('end_time', endDate)
            .order('start_time', { ascending: false })
            .limit(100)

          return NextResponse.json({
            summary: journeys,
            detailed: detailedJourneys || [],
            dateRange: { start: startDate, end: endDate }
          })
        }

        return NextResponse.json(journeys)
      }

      case 'predictions': {
        const horizon = parseInt(searchParams.get('horizon') || '4')
        const predictions = await analytics.getPredictions(storeId, horizon)
        
        return NextResponse.json(predictions)
      }

      case 'capture-rate': {
        const timeRange = {
          start: startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0)),
          end: endDate ? new Date(endDate) : new Date()
        }
        
        const captureRate = await analytics.getCaptureRate(storeId, timeRange)
        
        // Get hourly breakdown
        const { data: hourlyData } = await supabase
          .from('people_counting_data')
          .select('timestamp, capture_rate, passing_traffic, total_in')
          .eq('sensor_id', storeId)
          .gte('timestamp', timeRange.start.toISOString())
          .lte('timestamp', timeRange.end.toISOString())
          .order('timestamp', { ascending: true })

        return NextResponse.json({
          summary: captureRate,
          hourly: hourlyData || [],
          timeRange
        })
      }

      case 'queue-analytics': {
        // Get queue-specific analytics
        const { data: queueData } = await supabase
          .from('queue_analytics')
          .select('*')
          .eq('store_id', storeId)
          .gte('timestamp', new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString())
          .order('timestamp', { ascending: false })

        const { data: currentQueues } = await supabase
          .from('v_regional_status')
          .select('region_id, region_name, current_occupancy')
          .eq('store_id', storeId)
          .eq('region_type', 'queue')

        return NextResponse.json({
          current: currentQueues || [],
          historical: queueData || [],
          alerts: queueData?.filter(q => q.queue_length > 5) || []
        })
      }

      case 'heat-map': {
        // Get heat map data
        const { data: heatMapData } = await supabase
          .from('regional_counts')
          .select('region_id, timestamp, count')
          .eq('store_id', storeId)
          .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())

        // Aggregate by region
        const heatMap = new Map()
        heatMapData?.forEach(item => {
          if (!heatMap.has(item.region_id)) {
            heatMap.set(item.region_id, 0)
          }
          heatMap.set(item.region_id, heatMap.get(item.region_id) + item.count)
        })

        return NextResponse.json({
          heatMap: Object.fromEntries(heatMap),
          period: '1 hour',
          timestamp: new Date().toISOString()
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in GET /api/analytics/unified:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint for triggering analytics calculations
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { storeId, action } = body

    if (!storeId || !action) {
      return NextResponse.json({ error: 'Store ID and action required' }, { status: 400 })
    }

    switch (action) {
      case 'calculate-hourly': {
        // Trigger hourly analytics calculation
        const { error } = await supabase.rpc('calculate_hourly_analytics', {
          p_store_id: storeId,
          p_hour: new Date().toISOString()
        })

        if (error) {
          console.error('Error calculating hourly analytics:', error)
          return NextResponse.json({ error: 'Calculation failed' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Hourly analytics calculated' })
      }

      case 'reset-occupancy': {
        // Reset occupancy counter (useful at store opening)
        const { error } = await supabase.rpc('reset_store_occupancy', {
          p_store_id: storeId
        })

        if (error) {
          console.error('Error resetting occupancy:', error)
          return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Occupancy reset successfully' })
      }

      case 'generate-report': {
        // Generate analytics report
        const { startDate, endDate, reportType } = body
        
        // This would typically trigger a background job
        // For now, we'll return a placeholder
        return NextResponse.json({
          message: 'Report generation started',
          reportId: `report-${Date.now()}`,
          estimatedTime: '5 minutes'
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in POST /api/analytics/unified:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}