import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createMockClient } from './supabase-mock'

export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  // During build time, return mock client if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    return createMockClient() as any
  }

  const cookieStore = cookies()

  return createServerClient(
    supabaseUrl.trim(),
    supabaseAnonKey.trim(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}