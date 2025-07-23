#!/usr/bin/env node

/**
 * Fix zero data issue by running aggregation functions
 * This populates the daily_analytics and hourly_analytics tables from raw data
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function runAggregation() {
  console.log('🚀 Running data aggregation to fix zero data issue...\n');
  
  try {
    // Run hourly aggregation first
    console.log('📊 Running hourly analytics aggregation...');
    const { data: hourlyResult, error: hourlyError } = await supabase
      .rpc('aggregate_hourly_analytics');
    
    if (hourlyError) {
      console.error('❌ Error running hourly aggregation:', hourlyError);
      return;
    }
    console.log('✅ Hourly aggregation complete');
    
    // Run daily aggregation
    console.log('\n📊 Running daily analytics aggregation...');
    const { data: dailyResult, error: dailyError } = await supabase
      .rpc('aggregate_daily_analytics');
    
    if (dailyError) {
      console.error('❌ Error running daily aggregation:', dailyError);
      return;
    }
    console.log('✅ Daily aggregation complete');
    
    // Check results
    console.log('\n📈 Checking aggregated data...');
    
    // Check hourly data
    const { data: hourlyData, error: hourlyCheckError } = await supabase
      .from('hourly_analytics')
      .select('*')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(5)
      .order('date', { ascending: false });
    
    if (hourlyData && hourlyData.length > 0) {
      console.log(`\n✅ Found ${hourlyData.length} recent hourly records`);
    } else {
      console.log('\n⚠️  No recent hourly data found');
    }
    
    // Check daily data
    const { data: dailyData, error: dailyCheckError } = await supabase
      .from('daily_analytics')
      .select('*')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(5)
      .order('date', { ascending: false });
    
    if (dailyData && dailyData.length > 0) {
      console.log(`✅ Found ${dailyData.length} recent daily records`);
      console.log('\nSample daily data:');
      dailyData.forEach(d => {
        console.log(`  ${d.date}: ${d.total_in || 0} IN, ${d.total_out || 0} OUT, Traffic: ${d.total_traffic || (d.total_in + d.total_out) || 0}`);
      });
    } else {
      console.log('⚠️  No recent daily data found');
    }
    
    console.log('\n✅ Aggregation complete! Re-run the report generation to see the data.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  runAggregation();
}

export { runAggregation };