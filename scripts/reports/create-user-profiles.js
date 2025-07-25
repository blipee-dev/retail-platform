#!/usr/bin/env node

require('dotenv').config({ path: '../../.env' });
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createUserProfiles() {
  console.log('🔍 Finding JJ organization...\n');
  
  // Find JJ organization
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .ilike('name', '%J%J%');
    
  if (orgError) {
    console.error('❌ Error finding organization:', orgError);
    return;
  }
  
  console.log('Found organizations:');
  orgs.forEach(org => console.log(`  - ${org.name} (${org.id})`));
  
  // Use the first JJ organization
  const jjOrg = orgs.find(org => org.name.includes('J&J') || org.name.includes('JJ')) || orgs[0];
  
  if (!jjOrg) {
    console.error('❌ No JJ organization found');
    return;
  }
  
  console.log(`\n✅ Using organization: ${jjOrg.name}\n`);
  
  // User profiles to create
  const users = [
    {
      email: 'jmunoz@patrimi.com',
      full_name: 'Jesús Muñoz Casas',
      first_name: 'Jesús',
      role: 'org_viewer', // or 'org_admin' if they should have admin access
      organization_id: jjOrg.id
    },
    {
      email: 'jmelo@patrimi.com',
      full_name: 'João Célio Melo Pinta Moreira',
      first_name: 'João',
      role: 'org_viewer', // or 'org_admin' if they should have admin access
      organization_id: jjOrg.id
    }
  ];
  
  console.log('📧 Creating user profiles...\n');
  
  for (const user of users) {
    // Check if user already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('id, email, full_name')
      .eq('email', user.email)
      .single();
      
    if (existing) {
      console.log(`⚠️  User already exists: ${user.email} (${existing.full_name})`);
      
      // Update the user's name if different
      if (existing.full_name !== user.full_name) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            full_name: user.full_name,
            updated_at: new Date().toISOString()
          })
          .eq('email', user.email);
          
        if (updateError) {
          console.error(`   ❌ Error updating user: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated full name to: ${user.full_name}`);
        }
      }
      continue;
    }
    
    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        organization_id: user.organization_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (createError) {
      console.error(`❌ Error creating user ${user.email}:`, createError.message);
    } else {
      console.log(`✅ Created user: ${user.email} (${user.full_name})`);
      console.log(`   - Organization: ${jjOrg.name}`);
      console.log(`   - Role: ${user.role}`);
      console.log(`   - ID: ${newUser.id}\n`);
    }
  }
  
  console.log('\n🎉 User profile creation complete!');
  console.log('\nNext steps:');
  console.log('1. The report templates will be updated to include recipient names');
  console.log('2. Reports will show "Hello Jesús" or "Hello João" in the header');
}

createUserProfiles().catch(console.error);