import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Trigger the cron job endpoint locally
    const baseUrl = request.url.split('/api/test')[0]
    const response = await fetch(`${baseUrl}/api/cron/collect-sensor-data`, {
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET || 'test-secret'}`
      }
    })

    const result = await response.json()
    
    return NextResponse.json({
      message: 'Cron job triggered',
      status: response.status,
      result
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to trigger cron job',
      details: error.message 
    }, { status: 500 })
  }
}