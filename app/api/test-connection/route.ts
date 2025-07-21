import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase'

export async function GET() {
  try {
    // Show which Supabase URL we're using
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL
    const usingBlipeePrefix = !process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL
    
    // Extract project ref from URL
    const projectRef = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'unknown'
    
    // Test database connection
    const supabase = createClient()
    const { data: tables, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
      .single()
    
    return NextResponse.json({
      status: 'connected',
      supabaseUrl,
      projectRef,
      usingBlipeePrefix,
      databaseTest: error ? `Error: ${error.message}` : 'Success',
      envVars: {
        hasStandardUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasBlipeeUrl: !!process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL,
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}