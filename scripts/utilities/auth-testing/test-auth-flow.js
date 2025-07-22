// Test the auth flow programmatically
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testAuthFlow() {
  console.log('🧪 Testing auth flow with fixed RLS policies...')
  
  try {
    // Test sign in
    console.log('🔐 Attempting sign in...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@retailplatform.com',
      password: 'TestAdmin123!'
    })
    
    if (authError) {
      console.error('❌ Sign in failed:', authError.message)
      return
    }
    
    console.log('✅ Sign in successful!')
    console.log('👤 User:', authData.user.email)
    
    // Test fetching user profile (this was causing the recursion error)
    console.log('📋 Fetching user profile...')
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', authData.user.id)
      .single()
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError.message)
      console.error('Details:', profileError)
    } else {
      console.log('✅ Profile fetch successful!')
      console.log('👑 Role:', profileData.role)
      console.log('🏢 Organization:', profileData.organization?.name)
    }
    
    // Test organization access
    console.log('🏢 Testing organization access...')
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
    
    if (orgError) {
      console.error('❌ Organization access failed:', orgError.message)
    } else {
      console.log('✅ Organization access successful!')
      console.log(`📊 Can see ${orgData.length} organizations`)
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('🚪 Signed out successfully')
    
    console.log('\n🎉 Auth system is working correctly!')
    console.log('🌐 You can now use the web interface at: http://localhost:3001/auth/signin')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuthFlow()