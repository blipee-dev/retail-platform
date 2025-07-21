// Test script to verify Supabase auth is working
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMjQwODEsImV4cCI6MjA2ODYwMDA4MX0.5BlK9k_tdS1_C8xOnCO4glmFt4DQdPrki9JywocwXpU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
  console.log('🧪 Testing Supabase Auth Connection...')
  
  try {
    // Test connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
    
    if (healthError) {
      console.log('❌ Database connection failed:', healthError.message)
      return
    }
    
    console.log('✅ Database connection successful!')
    
    // Check if we have any existing users
    console.log('\n📊 Checking existing data...')
    
    // Check organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .limit(5)
    
    if (!orgsError) {
      console.log(`📈 Found ${orgs.length} organizations`)
      if (orgs.length > 0) {
        console.log('   Example organization:', orgs[0].name)
      }
    }
    
    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(5)
    
    if (!profilesError) {
      console.log(`👤 Found ${profiles.length} user profiles`)
      if (profiles.length > 0) {
        console.log('   Example user roles:', profiles.map(p => p.role).join(', '))
      }
    }
    
    console.log('\n🎯 Ready for testing!')
    console.log('📍 You can now:')
    console.log('   1. Visit http://localhost:3001/auth/signin')
    console.log('   2. Try signing up at http://localhost:3001/auth/signup')
    console.log('   3. Test the dashboard flow')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuth()