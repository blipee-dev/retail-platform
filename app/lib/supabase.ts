import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // During build time, environment variables might not be available
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
    
    return createBrowserClient(
      supabaseUrl.trim(),
      supabaseAnonKey.trim()
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  // Trim any whitespace or newlines
  return createBrowserClient(
    supabaseUrl.trim(),
    supabaseAnonKey.trim()
  )
}