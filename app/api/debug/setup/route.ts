import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Check if tables exist
    const tableChecks = {}
    
    // Check organizations table
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    tableChecks.organizations = orgsError ? `Error: ${orgsError.message}` : 'OK'
    
    // Check stores table
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('count')
      .limit(1)
    
    tableChecks.stores = storesError ? `Error: ${storesError.message}` : 'OK'
    
    // Check sensor_metadata table
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .select('count')
      .limit(1)
    
    tableChecks.sensor_metadata = sensorsError ? `Error: ${sensorsError.message}` : 'OK'
    
    // Check people_counting_data table
    const { data: pcData, error: pcError } = await supabase
      .from('people_counting_data')
      .select('count')
      .limit(1)
    
    tableChecks.people_counting_data = pcError ? `Error: ${pcError.message}` : 'OK'
    
    return NextResponse.json({
      message: 'Database schema check',
      tables: tableChecks
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}