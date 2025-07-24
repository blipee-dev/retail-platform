#!/usr/bin/env node

/**
 * Fix hourly boundaries in people_counting_raw table
 */

const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment
const supabaseUrl = process.env.SUPABASE_URL || process.env.BLIPEE_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBoundaries() {
  console.log('🔧 Fixing hourly boundaries...\n');

  try {
    // Get all records with non-hourly boundaries
    const { data: badRecords, error: fetchError } = await supabase
      .from('people_counting_raw')
      .select('*')
      .limit(1000);

    if (fetchError) throw fetchError;

    const needsFixing = badRecords.filter(record => {
      const start = new Date(record.timestamp);
      const end = new Date(record.end_time);
      
      return start.getMinutes() !== 0 || start.getSeconds() !== 0 ||
             end.getMinutes() !== 59 || end.getSeconds() !== 59;
    });

    console.log(`Found ${needsFixing.length} records to fix`);

    if (needsFixing.length === 0) {
      console.log('✅ All records have proper hourly boundaries!');
      return;
    }

    // Fix each record
    let fixed = 0;
    for (const record of needsFixing) {
      const start = new Date(record.timestamp);
      const end = new Date(record.end_time);
      
      // Round to hour boundaries
      start.setMinutes(0, 0, 0);
      end.setMinutes(59, 59, 999);
      
      const { error: updateError } = await supabase
        .from('people_counting_raw')
        .update({
          timestamp: start.toISOString(),
          end_time: end.toISOString()
        })
        .eq('id', record.id);
        
      if (updateError) {
        console.error(`Failed to update record ${record.id}:`, updateError.message);
      } else {
        fixed++;
        if (fixed % 10 === 0) {
          console.log(`   Fixed ${fixed}/${needsFixing.length} records...`);
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} records with proper hourly boundaries`);

    // Verify the fix
    const { data: checkRecords, error: checkError } = await supabase
      .from('people_counting_raw')
      .select('timestamp, end_time')
      .limit(1000);

    if (checkError) throw checkError;

    const stillBad = checkRecords.filter(record => {
      const start = new Date(record.timestamp);
      const end = new Date(record.end_time);
      
      return start.getMinutes() !== 0 || start.getSeconds() !== 0 ||
             end.getMinutes() !== 59 || end.getSeconds() !== 59;
    });

    if (stillBad.length === 0) {
      console.log('✅ Verification passed: All records now have proper hourly boundaries!');
    } else {
      console.log(`⚠️  Still found ${stillBad.length} records with improper boundaries`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the fix
fixBoundaries();