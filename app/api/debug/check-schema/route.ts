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

    // Try to get a sample from people_counting_data
    const { data: sampleData, error: sampleError } = await supabase
      .from('people_counting_data')
      .select('*')
      .limit(1)

    // Get column info by trying to insert empty data
    const { data: testInsert, error: insertError } = await supabase
      .from('people_counting_data')
      .insert({})
      .select()

    return NextResponse.json({
      message: 'Schema check',
      people_counting_data: {
        sampleRow: sampleData?.[0] || 'No data',
        columns: sampleData?.[0] ? Object.keys(sampleData[0]) : [],
        insertError: insertError?.message || null
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}