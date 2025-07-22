import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize admin Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export const dynamic = 'force-dynamic'

// GET /api/internal/sensors - Get all active sensors for data collection
export async function GET(request: NextRequest) {
  try {
    // Check internal API key
    const apiKey = request.headers.get('x-api-key')
    const internalApiKey = process.env.INTERNAL_API_KEY || 'development-key'
    
    if (apiKey !== internalApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all active sensors with their store info
    const { data: sensors, error } = await supabaseAdmin
      .from('sensor_metadata')
      .select(`
        *,
        stores (
          id,
          name,
          code,
          organization_id
        )
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sensors })
  } catch (error) {
    console.error('Error fetching sensors:', error)
    return NextResponse.json({ error: 'Failed to fetch sensors' }, { status: 500 })
  }
}