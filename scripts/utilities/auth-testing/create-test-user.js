// Script to create a test user after migrations are complete
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  console.log('👤 Creating test user...')
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@retailplatform.com',
      password: 'TestAdmin123!',
      email_confirm: true
    })
    
    if (authError) {
      console.error('❌ Auth user creation failed:', authError.message)
      return
    }
    
    console.log('✅ Auth user created:', authData.user.email)
    
    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: 'Test Retail Corporation',
        slug: 'test-retail-corp',
        subscription_tier: 'premium',
        subscription_status: 'active'
      })
      .select()
      .single()
    
    if (orgError) {
      console.error('❌ Organization creation failed:', orgError.message)
      return
    }
    
    console.log('✅ Organization created:', orgData.name)
    
    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: 'Admin User',
        role: 'tenant_admin',
        organization_id: orgData.id,
        is_active: true
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)
      return
    }
    
    console.log('✅ User profile created with role:', profileData.role)
    
    console.log('\n🎉 Test user setup complete!')
    console.log('📧 Email: admin@retailplatform.com')
    console.log('🔑 Password: TestAdmin123!')
    console.log('🏢 Organization: Test Retail Corporation')
    console.log('👑 Role: tenant_admin')
    console.log('\n🚀 You can now test sign in at: http://localhost:3001/auth/signin')
    
  } catch (error) {
    console.error('❌ Test user creation failed:', error.message)
  }
}

createTestUser()