import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials'
      }, { status: 500 })
    }

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Query to get table columns
    const { data: orgColumns, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .limit(0)

    const { data: storeColumns, error: storeError } = await supabase
      .from('stores') 
      .select('*')
      .limit(0)

    // Get actual data to see structure
    const { data: orgs, error: orgsDataError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1)

    const { data: stores, error: storesDataError } = await supabase
      .from('stores')
      .select('*')
      .limit(1)

    return NextResponse.json({
      message: 'Schema information',
      tables: {
        organizations: {
          error: orgError?.message || null,
          sample: orgs?.[0] || 'No data',
          columns: orgs?.[0] ? Object.keys(orgs[0]) : []
        },
        stores: {
          error: storeError?.message || null,
          sample: stores?.[0] || 'No data',
          columns: stores?.[0] ? Object.keys(stores[0]) : []
        }
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}