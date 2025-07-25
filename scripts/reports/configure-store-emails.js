#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Example email configuration
const storeEmails = {
  'OML01': 'manager-guimaraes@omnia.pt',
  'OML02': 'manager-almada@omnia.pt', 
  'OML03': 'manager-norte@omnia.pt',
  'J&J - 01': 'manager@jj-stores.pt'
};

async function configureEmails() {
  console.log('📧 Configuring store email recipients...\n');
  
  // Get all stores
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, name, store_id');
    
  if (error) {
    console.error('Error fetching stores:', error);
    return;
  }
  
  console.log(`Found ${stores.length} stores\n`);
  
  for (const store of stores) {
    const email = storeEmails[store.store_id];
    
    if (email) {
      console.log(`Setting email for ${store.name}: ${email}`);
      
      // Update store with email
      const { error: updateError } = await supabase
        .from('stores')
        .update({ 
          contact_email: email,
          // Optionally set report_emails for multiple recipients
          // report_emails: 'manager@store.com,district@company.com'
        })
        .eq('id', store.id);
        
      if (updateError) {
        console.error(`Error updating ${store.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${store.name}`);
      }
    } else {
      console.log(`⚠️ No email configured for ${store.name} (${store.store_id})`);
    }
  }
  
  console.log('\n✅ Email configuration complete!');
  console.log('\nTo set emails manually, update the stores table:');
  console.log('- contact_email: Single email address');
  console.log('- report_emails: Comma-separated list for multiple recipients');
}

// Run the configuration
configureEmails().catch(console.error);