'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/app/lib/supabase'
import type { User } from '@supabase/supabase-js'

// Simplified auth context for debugging
interface SimpleAuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined)

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext)
  if (!context) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider')
  }
  return context
}

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserData = async (userId: string) => {
    try {
      console.log('🔍 Fetching user profile for:', userId)
      
      // Simple profile fetch without joins
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.error('❌ Profile fetch error:', profileError)
        return
      }

      console.log('✅ Profile fetched:', profileData)
      setProfile(profileData)
      
    } catch (error) {
      console.error('❌ Error fetching user data:', error)
    }
  }

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('🚀 Initializing auth...')
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          console.log('👤 Found existing user:', user.email)
          setUser(user)
          await fetchUserData(user.id)
        } else {
          console.log('👤 No existing user found')
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('✅ User signed in:', session.user.email)
          setUser(session.user)
          await fetchUserData(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out')
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Attempting sign in for:', email)
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        return { error }
      }

      console.log('✅ Sign in successful')
      return { error: null }
    } catch (error) {
      console.error('❌ Sign in exception:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    console.log('🚪 Signing out...')
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <SimpleAuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signOut
    }}>
      {children}
    </SimpleAuthContext.Provider>
  )
}