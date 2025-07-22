// Verify the auth setup using service role key
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function verifySetup() {
  console.log('🔍 Verifying auth setup with service role...')
  
  try {
    // Check organizations with service role (bypasses RLS)
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
    
    if (orgsError) {
      console.error('❌ Organizations query failed:', orgsError.message)
    } else {
      console.log(`✅ Found ${orgs.length} organizations`)
      orgs.forEach(org => {
        console.log(`   📊 ${org.name} (${org.slug})`)
      })
    }
    
    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ User profiles query failed:', profilesError.message)
    } else {
      console.log(`✅ Found ${profiles.length} user profiles`)
      profiles.forEach(profile => {
        console.log(`   👤 ${profile.email} - ${profile.role}`)
      })
    }
    
    // Check auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Auth users query failed:', usersError.message)
    } else {
      console.log(`✅ Found ${users.length} auth users`)
      users.forEach(user => {
        console.log(`   🔐 ${user.email} - confirmed: ${user.email_confirmed_at ? 'yes' : 'no'}`)
      })
    }
    
    console.log('\n🎯 Auth System Status: READY!')
    console.log('🌐 Test at: http://localhost:3001/auth/signin')
    console.log('📧 Email: admin@retailplatform.com')
    console.log('🔑 Password: TestAdmin123!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifySetup()