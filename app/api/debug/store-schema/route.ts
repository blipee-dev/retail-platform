import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Try to create a minimal store to see what columns are required
    const testStoreId = 'test-' + Date.now()
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .insert({
        organization_id: '6c4283e0-c8fc-45f3-808e-5e1a69ae3987', // existing org
        name: 'Test Store',
        code: testStoreId
      })
      .select()
      .single()

    // If successful, delete it
    if (store) {
      await supabase
        .from('stores')
        .delete()
        .eq('id', store.id)
    }

    return NextResponse.json({
      message: 'Store schema test',
      result: {
        error: storeError,
        created: store || null,
        columns: store ? Object.keys(store) : []
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