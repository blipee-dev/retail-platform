import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First check if we have a simpler table structure
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'people_counting_data' })
      .single()

    // Try a different approach - check if sensor_id is actually a string
    const testData = {
      sensor_id: '176.79.62.167:2102',
      store_id: 'd719cc6b-1715-4721-8897-6f6cd0c025b0', // J&J store ID from earlier
      timestamp: new Date().toISOString(),
      line1_in: 9,
      line1_out: 10,
      total_in: 9,
      total_out: 10,
      passing_traffic: 81,
      capture_rate: 11.1
    }

    const { data, error } = await supabase
      .from('people_counting_data')
      .insert(testData)
      .select()

    if (error) {
      // If sensor_id is UUID, let's create a different approach
      if (error.message.includes('uuid')) {
        // Create a simple analytics_data table instead
        const { data: createTable, error: createError } = await supabase.rpc('create_simple_analytics_table')
        
        return NextResponse.json({
          message: 'people_counting_data expects UUID sensor_id',
          error: error.message,
          suggestion: 'Need to either register sensors first or use a different table structure'
        })
      }
      
      return NextResponse.json({ 
        error: error.message,
        details: error
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Data inserted successfully',
      data
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}