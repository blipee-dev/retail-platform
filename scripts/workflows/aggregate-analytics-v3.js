#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function aggregateHourlyAnalytics() {
  console.log('🔄 Starting hourly analytics aggregation...');
  
  try {
    // Get the current hour (complete hours only)
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    const previousHour = new Date(currentHour.getTime() - 60 * 60 * 1000);
    
    console.log(`📊 Aggregating data for hour: ${previousHour.toISOString()}`);
    
    // Call the aggregation function with proper time boundaries
    const { data, error } = await supabase.rpc('aggregate_hourly_analytics_v2', {
      target_date: previousHour.toISOString().split('T')[0],
      target_hour: previousHour.getHours()
    });
    
    if (error) throw error;
    
    console.log('✅ Hourly aggregation completed successfully');
    
    // Also update the start_time and end_time for the aggregated records
    const startTime = previousHour.toISOString();
    const endTime = new Date(currentHour.getTime() - 1000).toISOString(); // 1 second before current hour
    
    const { error: updateError } = await supabase
      .from('hourly_analytics')
      .update({ 
        start_time: startTime,
        end_time: endTime 
      })
      .eq('date', previousHour.toISOString().split('T')[0])
      .eq('hour', previousHour.getHours())
      .is('start_time', null);
      
    if (updateError) {
      console.warn('⚠️  Could not update time columns:', updateError.message);
    }
    
  } catch (error) {
    console.error('❌ Hourly aggregation failed:', error);
    process.exit(1);
  }
}

async function aggregateDailyAnalytics() {
  console.log('🔄 Starting daily analytics aggregation...');
  
  try {
    // Get yesterday's date
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const targetDate = yesterday.toISOString().split('T')[0];
    
    console.log(`📊 Aggregating daily data for: ${targetDate}`);
    
    // Call the daily aggregation function
    const { data, error } = await supabase.rpc('aggregate_daily_analytics_v2', {
      target_date: targetDate
    });
    
    if (error) throw error;
    
    console.log('✅ Daily aggregation completed successfully');
    
    // Update the start_time and end_time for the aggregated records
    const startTime = yesterday.toISOString();
    const endTime = new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1000).toISOString();
    
    const { error: updateError } = await supabase
      .from('daily_analytics')
      .update({ 
        start_time: startTime,
        end_time: endTime 
      })
      .eq('date', targetDate)
      .is('start_time', null);
      
    if (updateError) {
      console.warn('⚠️  Could not update time columns:', updateError.message);
    }
    
  } catch (error) {
    console.error('❌ Daily aggregation failed:', error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const aggregationType = process.argv[2] || 'hourly';
  
  if (aggregationType === 'hourly') {
    await aggregateHourlyAnalytics();
  } else if (aggregationType === 'daily') {
    await aggregateDailyAnalytics();
  } else {
    console.error('❌ Invalid aggregation type. Use "hourly" or "daily"');
    process.exit(1);
  }
}

// Run the aggregation
main().catch(console.error);