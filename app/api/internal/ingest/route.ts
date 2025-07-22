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

// POST /api/internal/ingest - Ingest sensor data
export async function POST(request: NextRequest) {
  try {
    // Check internal API key
    const apiKey = request.headers.get('x-api-key')
    const internalApiKey = process.env.INTERNAL_API_KEY || 'development-key'
    
    if (apiKey !== internalApiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 })
    }

    if (type === 'people_counting') {
      // Insert into people_counting_raw table
      const { data: inserted, error } = await supabaseAdmin
        .from('people_counting_raw')
        .insert(data)
        .select()

      if (error) {
        console.error('Error inserting people counting data:', error)
        return NextResponse.json({ error: 'Failed to insert data', details: error }, { status: 500 })
      }

      return NextResponse.json({ message: 'Data ingested successfully', count: inserted?.length || 0 })
    } else if (type === 'regional_counting') {
      // Insert into regional_counting_raw table
      const { data: inserted, error } = await supabaseAdmin
        .from('regional_counting_raw')
        .insert(data)
        .select()

      if (error) {
        console.error('Error inserting regional counting data:', error)
        return NextResponse.json({ error: 'Failed to insert data', details: error }, { status: 500 })
      }

      return NextResponse.json({ message: 'Data ingested successfully', count: inserted?.length || 0 })
    } else {
      return NextResponse.json({ error: 'Invalid data type' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in data ingestion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}