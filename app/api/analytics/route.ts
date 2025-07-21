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

// GET /api/analytics - Get analytics data
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
    
    const type = searchParams.get('type') || 'hourly'
    const storeId = searchParams.get('store_id')
    const sensorId = searchParams.get('sensor_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const metric = searchParams.get('metric') // specific metric to return

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      )
    }

    if (type === 'hourly') {
      let query = supabaseAdmin
        .from('hourly_analytics')
        .select('*')
        .eq('organization_id', auth.organizationId)
        .gte('hour_start', startDate)
        .lte('hour_start', endDate)
        .order('hour_start', { ascending: true })

      if (storeId) query = query.eq('store_id', storeId)
      if (sensorId) query = query.eq('sensor_id', sensorId)

      const { data, error } = await query
      if (error) throw error

      // Format data for charts
      const chartData = {
        labels: data.map(d => new Date(d.hour_start).toISOString()),
        datasets: []
      }

      if (!metric || metric === 'traffic') {
        chartData.datasets.push(
          {
            label: 'Entries',
            data: data.map(d => d.total_entries || 0),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
          },
          {
            label: 'Exits',
            data: data.map(d => d.total_exits || 0),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)'
          }
        )
      }

      if (!metric || metric === 'occupancy') {
        chartData.datasets.push({
          label: 'Average Occupancy',
          data: data.map(d => d.avg_occupancy || 0),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)'
        })
      }

      if (metric === 'regional') {
        const regionData = data.filter(d => d.region_avg_occupancy)
        if (regionData.length > 0) {
          chartData.datasets.push(
            {
              label: 'Region 1',
              data: regionData.map(d => d.region_avg_occupancy?.region1 || 0),
              borderColor: 'rgb(255, 206, 86)',
              backgroundColor: 'rgba(255, 206, 86, 0.2)'
            },
            {
              label: 'Region 2',
              data: regionData.map(d => d.region_avg_occupancy?.region2 || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)'
            },
            {
              label: 'Region 3',
              data: regionData.map(d => d.region_avg_occupancy?.region3 || 0),
              borderColor: 'rgb(153, 102, 255)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)'
            },
            {
              label: 'Region 4',
              data: regionData.map(d => d.region_avg_occupancy?.region4 || 0),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.2)'
            }
          )
        }
      }

      return NextResponse.json({
        data,
        chartData,
        summary: {
          total_entries: data.reduce((sum, d) => sum + (d.total_entries || 0), 0),
          total_exits: data.reduce((sum, d) => sum + (d.total_exits || 0), 0),
          avg_occupancy: data.length > 0 ? 
            data.reduce((sum, d) => sum + (d.avg_occupancy || 0), 0) / data.length : 0,
          peak_occupancy: Math.max(...data.map(d => d.peak_occupancy || 0))
        }
      })

    } else if (type === 'daily') {
      let query = supabaseAdmin
        .from('daily_summary')
        .select('*')
        .eq('organization_id', auth.organizationId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (storeId) query = query.eq('store_id', storeId)

      const { data, error } = await query
      if (error) throw error

      // Format data for charts
      const chartData = {
        labels: data.map(d => d.date),
        datasets: [
          {
            label: 'Total Visitors',
            data: data.map(d => d.total_entries || 0),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
          },
          {
            label: 'Peak Occupancy',
            data: data.map(d => d.peak_occupancy || 0),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            yAxisID: 'y1'
          }
        ]
      }

      // Add conversion rate if requested
      if (metric === 'conversion') {
        chartData.datasets.push({
          label: 'Conversion Rate (%)',
          data: data.map(d => (d.store_conversion_rate || 0) * 100),
          borderColor: 'rgb(54, 162, 235)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y2'
        })
      }

      return NextResponse.json({
        data,
        chartData,
        summary: {
          total_visitors: data.reduce((sum, d) => sum + (d.total_entries || 0), 0),
          avg_daily_visitors: data.length > 0 ?
            data.reduce((sum, d) => sum + (d.total_entries || 0), 0) / data.length : 0,
          peak_day: data.reduce((max, d) => 
            d.total_entries > (max?.total_entries || 0) ? d : max, data[0]),
          avg_conversion_rate: data.length > 0 ?
            data.reduce((sum, d) => sum + (d.store_conversion_rate || 0), 0) / data.length : 0
        }
      })

    } else if (type === 'comparison') {
      // Compare multiple stores or time periods
      const stores = searchParams.get('stores')?.split(',') || []
      
      if (stores.length === 0) {
        return NextResponse.json(
          { error: 'stores parameter required for comparison' },
          { status: 400 }
        )
      }

      const { data, error } = await supabaseAdmin
        .from('daily_summary')
        .select(`
          *,
          stores (
            id,
            name
          )
        `)
        .in('store_id', stores)
        .eq('organization_id', auth.organizationId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error

      // Group by store
      const storeData = stores.map(storeId => {
        const storeRecords = data.filter(d => d.store_id === storeId)
        const storeName = storeRecords[0]?.stores?.name || storeId
        
        return {
          store_id: storeId,
          store_name: storeName,
          data: storeRecords,
          summary: {
            total_visitors: storeRecords.reduce((sum, d) => sum + (d.total_entries || 0), 0),
            avg_daily_visitors: storeRecords.length > 0 ?
              storeRecords.reduce((sum, d) => sum + (d.total_entries || 0), 0) / storeRecords.length : 0,
            avg_conversion_rate: storeRecords.length > 0 ?
              storeRecords.reduce((sum, d) => sum + (d.store_conversion_rate || 0), 0) / storeRecords.length : 0
          }
        }
      })

      return NextResponse.json({
        stores: storeData,
        comparison: {
          best_performing_store: storeData.reduce((best, store) => 
            store.summary.total_visitors > (best?.summary.total_visitors || 0) ? store : best
          ),
          highest_conversion_store: storeData.reduce((best, store) => 
            store.summary.avg_conversion_rate > (best?.summary.avg_conversion_rate || 0) ? store : best
          )
        }
      })
    }

    return NextResponse.json(
      { error: `Invalid analytics type: ${type}` },
      { status: 400 }
    )

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}