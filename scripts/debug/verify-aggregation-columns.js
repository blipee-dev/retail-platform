#!/usr/bin/env node

const fetch = require('node-fetch');

async function verifyAggregationColumns() {
  console.log('🔍 Verifying Aggregation Column Names');
  console.log('=' .repeat(60));
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };
  
  // Columns we're trying to use in hourly aggregation
  const hourlyScriptColumns = [
    'store_id', 'organization_id', 'date', 'hour', 
    'start_time', 'end_time',
    'store_entries', 'store_exits', 
    'passerby_count', 'passerby_in', 'passerby_out',
    'capture_rate', 
    'entry_line1_pct', 'entry_line2_pct', 'entry_line3_pct',
    'exit_line1_pct', 'exit_line2_pct', 'exit_line3_pct',
    'sample_count', 'total_entries', 'total_exits',
    'line1_in', 'line1_out', 'line2_in', 'line2_out',
    'line3_in', 'line3_out', 'line4_in', 'line4_out',
    'total_zone_occupancy', 
    'zone1_share_pct', 'zone2_share_pct', 'zone3_share_pct', 'zone4_share_pct',
    'zone1_peak_occupancy', 'zone2_peak_occupancy', 'zone3_peak_occupancy', 'zone4_peak_occupancy',
    'zone1_dwell_contribution', 'zone2_dwell_contribution', 'zone3_dwell_contribution', 'zone4_dwell_contribution',
    'avg_store_dwell_time'
  ];
  
  // Columns we're trying to use in daily aggregation
  const dailyScriptColumns = [
    'store_id', 'date', 'start_time', 'end_time',
    'store_entries', 'store_exits',
    'passerby_count', 'passerby_in', 'passerby_out',
    'capture_rate',
    'entry_line1_pct', 'entry_line2_pct', 'entry_line3_pct',
    'exit_line1_pct', 'exit_line2_pct', 'exit_line3_pct',
    'peak_entry_hour', 'peak_exit_hour', 'peak_passerby_hour',
    'business_hours_entries', 'after_hours_entries',
    'business_hours_capture_rate',
    'avg_store_dwell_time', 'total_zone_occupancy',
    'zone1_share_pct', 'zone2_share_pct', 'zone3_share_pct', 'zone4_share_pct',
    'zone1_peak_occupancy', 'zone2_peak_occupancy', 'zone3_peak_occupancy', 'zone4_peak_occupancy',
    'zone1_peak_hour',
    'occupancy_accuracy_score', 'conversion_rate',
    'data_quality', 'weather_condition', 'is_holiday'
  ];
  
  try {
    // Get actual columns from hourly_analytics
    console.log('\n📊 Checking hourly_analytics columns...');
    const hourlyColumnsResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?limit=0`,
      { 
        method: 'GET',
        headers 
      }
    );
    
    // Get the columns from the response headers or make a query
    const hourlyTestResponse = await fetch(
      `${supabaseUrl}/rest/v1/hourly_analytics?limit=1`,
      { headers }
    );
    
    let actualHourlyColumns = [];
    if (hourlyTestResponse.ok) {
      const data = await hourlyTestResponse.json();
      if (data.length > 0) {
        actualHourlyColumns = Object.keys(data[0]);
      }
    }
    
    console.log(`\nHourly Analytics - Found ${actualHourlyColumns.length} columns`);
    
    // Check which columns are missing
    const missingHourly = hourlyScriptColumns.filter(col => !actualHourlyColumns.includes(col));
    const extraHourly = actualHourlyColumns.filter(col => !hourlyScriptColumns.includes(col) && col !== 'id' && col !== 'created_at' && col !== 'updated_at' && col !== 'net_flow');
    
    if (missingHourly.length > 0) {
      console.log('\n❌ Missing columns in hourly_analytics:');
      missingHourly.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('✅ All expected columns exist in hourly_analytics');
    }
    
    if (extraHourly.length > 0) {
      console.log('\n📝 Additional columns in hourly_analytics (not used by script):');
      extraHourly.forEach(col => console.log(`   - ${col}`));
    }
    
    // Get actual columns from daily_analytics
    console.log('\n\n📊 Checking daily_analytics columns...');
    const dailyTestResponse = await fetch(
      `${supabaseUrl}/rest/v1/daily_analytics?limit=1`,
      { headers }
    );
    
    let actualDailyColumns = [];
    if (dailyTestResponse.ok) {
      const data = await dailyTestResponse.json();
      if (data.length > 0) {
        actualDailyColumns = Object.keys(data[0]);
      }
    }
    
    console.log(`\nDaily Analytics - Found ${actualDailyColumns.length} columns`);
    
    // Check which columns are missing
    const missingDaily = dailyScriptColumns.filter(col => !actualDailyColumns.includes(col));
    const extraDaily = actualDailyColumns.filter(col => !dailyScriptColumns.includes(col) && col !== 'id' && col !== 'created_at' && col !== 'updated_at' && col !== 'organization_id');
    
    if (missingDaily.length > 0) {
      console.log('\n❌ Missing columns in daily_analytics:');
      missingDaily.forEach(col => console.log(`   - ${col}`));
    } else {
      console.log('✅ All expected columns exist in daily_analytics');
    }
    
    if (extraDaily.length > 0) {
      console.log('\n📝 Additional columns in daily_analytics (not used by script):');
      extraDaily.forEach(col => console.log(`   - ${col}`));
    }
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📋 Summary:');
    console.log(`   Hourly Analytics: ${missingHourly.length} missing, ${extraHourly.length} extra`);
    console.log(`   Daily Analytics: ${missingDaily.length} missing, ${extraDaily.length} extra`);
    
    if (missingHourly.length > 0 || missingDaily.length > 0) {
      console.log('\n⚠️  Action Required: Update aggregation scripts to match actual table structure');
    } else {
      console.log('\n✅ All columns match! Aggregation scripts should work correctly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run verification
verifyAggregationColumns()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });