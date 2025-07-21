import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './supabase-mock'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // During build time, return mock client if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined') {
      // Server-side during build
      return createMockClient() as any
    }
    // Client-side error
    throw new Error('Missing Supabase environment variables')
  }

  // Trim any whitespace or newlines
  return createBrowserClient(
    supabaseUrl.trim(),
    supabaseAnonKey.trim()
  )
}