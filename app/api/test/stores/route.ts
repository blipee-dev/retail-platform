import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get all stores
    const { data: stores, error } = await supabase
      .from('stores')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching stores:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      count: stores?.length || 0,
      stores: stores || []
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}