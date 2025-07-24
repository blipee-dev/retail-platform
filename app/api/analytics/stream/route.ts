import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient as createClient } from '@/app/lib/supabase-server'

// Note: Next.js App Router doesn't natively support WebSockets
// This is a Server-Sent Events (SSE) implementation for real-time updates
// For true WebSocket support, you'd need a separate WebSocket server

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const storeId = searchParams.get('storeId')

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 })
    }

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`)
        )

        // Set up interval for periodic updates
        const interval = setInterval(async () => {
          try {
            // Get latest people counting data
            const { data: latestData } = await supabase
              .from('people_counting_raw')
              .select('*')
              .eq('sensor_id', storeId)
              .order('timestamp', { ascending: false })
              .limit(1)
              .single()

            if (latestData) {
              // Calculate current occupancy
              const { data: occupancyData } = await supabase
                .rpc('calculate_current_occupancy', { p_store_id: storeId })

              // Check for alerts
              const { data: alerts } = await supabase
                .from('alerts')
                .select('*')
                .eq('sensor_id', storeId)
                .eq('resolved', false)
                .order('triggered_at', { ascending: false })
                .limit(5)

              // Send update
              const update = {
                type: 'update',
                timestamp: new Date().toISOString(),
                data: {
                  latest: latestData,
                  occupancy: occupancyData,
                  alerts: alerts || []
                }
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
              )
            }
          } catch (error) {
            console.error('Error in SSE update:', error)
          }
        }, 5000) // Update every 5 seconds

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval)
          controller.close()
        })
      }
    })

    // Return response with SSE headers
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/analytics/stream:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}