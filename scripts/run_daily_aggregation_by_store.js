#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const { startOfDay, endOfDay, subDays, format } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STORE_ID = process.env.STORE_ID;
const STORE_NAME = process.env.STORE_NAME || 'Unknown Store';
const STORE_TIMEZONE = process.env.STORE_TIMEZONE || 'UTC';

async function aggregateDailyAnalytics() {
  console.log('🔄 Starting timezone-aware daily aggregation...');
  console.log(`📍 Store: ${STORE_NAME} (ID: ${STORE_ID})`);
  console.log(`🌍 Timezone: ${STORE_TIMEZONE}`);
  
  try {
    // Calculate yesterday in store's timezone
    const now = new Date();
    const storeNow = utcToZonedTime(now, STORE_TIMEZONE);
    const storeYesterday = subDays(storeNow, 1);
    
    // Get start and end of yesterday in store timezone
    const dayStart = startOfDay(storeYesterday);
    const dayEnd = endOfDay(storeYesterday);
    
    // Convert to UTC for database queries
    const startTime = zonedTimeToUtc(dayStart, STORE_TIMEZONE);
    const endTime = zonedTimeToUtc(dayEnd, STORE_TIMEZONE);
    
    console.log(`📅 Aggregating for: ${format(storeYesterday, 'yyyy-MM-dd')} (${STORE_TIMEZONE})`);
    console.log(`   UTC Range: ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    // Get sensors for this store
    const { data: sensors, error: sensorError } = await supabase
      .from('sensor_metadata')
      .select('sensor_id')
      .eq('store_id', STORE_ID)
      .eq('is_active', true);
    
    if (sensorError) {
      console.error('❌ Error fetching sensors:', sensorError);
      return;
    }
    
    if (!sensors || sensors.length === 0) {
      console.log('⚠️ No active sensors found for this store');
      return;
    }
    
    console.log(`📡 Found ${sensors.length} active sensors`);
    const sensorIds = sensors.map(s => s.sensor_id);
    
    // Aggregate data for each sensor
    for (const sensorId of sensorIds) {
      console.log(`\n🔄 Processing sensor: ${sensorId}`);
      
      // Get hourly data for the day
      const { data: hourlyData, error: hourlyError } = await supabase
        .from('hourly_analytics')
        .select('*')
        .eq('sensor_id', sensorId)
        .gte('start_time', startTime.toISOString())
        .lt('start_time', endTime.toISOString())
        .order('start_time');
      
      if (hourlyError) {
        console.error(`❌ Error fetching hourly data: ${hourlyError.message}`);
        continue;
      }
      
      if (!hourlyData || hourlyData.length === 0) {
        console.log('   No hourly data found for this day');
        continue;
      }
      
      // Calculate daily totals
      const dailyTotals = hourlyData.reduce((acc, hour) => ({
        total_in: acc.total_in + (hour.total_in || 0),
        total_out: acc.total_out + (hour.total_out || 0),
        peak_occupancy: Math.max(acc.peak_occupancy, hour.peak_occupancy || 0),
        avg_occupancy: acc.avg_occupancy + (hour.avg_occupancy || 0),
        hours_with_data: acc.hours_with_data + 1
      }), {
        total_in: 0,
        total_out: 0,
        peak_occupancy: 0,
        avg_occupancy: 0,
        hours_with_data: 0
      });
      
      // Calculate average occupancy
      dailyTotals.avg_occupancy = dailyTotals.hours_with_data > 0 
        ? Math.round(dailyTotals.avg_occupancy / dailyTotals.hours_with_data)
        : 0;
      
      // Prepare daily record
      const dailyRecord = {
        sensor_id: sensorId,
        date: format(storeYesterday, 'yyyy-MM-dd'),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        store_id: STORE_ID,
        total_in: dailyTotals.total_in,
        total_out: dailyTotals.total_out,
        peak_occupancy: dailyTotals.peak_occupancy,
        avg_occupancy: dailyTotals.avg_occupancy,
        peak_hour: findPeakHour(hourlyData),
        operational_hours: dailyTotals.hours_with_data,
        data_quality_score: calculateDataQuality(hourlyData),
        anomalies_detected: 0,
        weather_impact: null,
        conversion_rate: null,
        avg_dwell_time: null,
        busiest_period: findBusiestPeriod(hourlyData)
      };
      
      // Check for existing record
      const { data: existing } = await supabase
        .from('daily_analytics')
        .select('id')
        .eq('sensor_id', sensorId)
        .eq('date', dailyRecord.date)
        .single();
      
      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('daily_analytics')
          .update(dailyRecord)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`❌ Error updating daily record: ${updateError.message}`);
        } else {
          console.log(`✅ Updated daily analytics for ${sensorId}`);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('daily_analytics')
          .insert(dailyRecord);
        
        if (insertError) {
          console.error(`❌ Error inserting daily record: ${insertError.message}`);
        } else {
          console.log(`✅ Created daily analytics for ${sensorId}`);
        }
      }
    }
    
    console.log('\n✅ Daily aggregation completed successfully!');
    
  } catch (error) {
    console.error('💥 Fatal error during aggregation:', error);
    process.exit(1);
  }
}

function findPeakHour(hourlyData) {
  let maxTraffic = 0;
  let peakHour = 0;
  
  hourlyData.forEach(hour => {
    const traffic = (hour.total_in || 0) + (hour.total_out || 0);
    if (traffic > maxTraffic) {
      maxTraffic = traffic;
      peakHour = new Date(hour.start_time).getHours();
    }
  });
  
  return peakHour;
}

function findBusiestPeriod(hourlyData) {
  const periods = {
    morning: { start: 6, end: 12, traffic: 0 },
    afternoon: { start: 12, end: 18, traffic: 0 },
    evening: { start: 18, end: 22, traffic: 0 }
  };
  
  hourlyData.forEach(hour => {
    const hourNum = new Date(hour.start_time).getHours();
    const traffic = (hour.total_in || 0) + (hour.total_out || 0);
    
    Object.entries(periods).forEach(([name, period]) => {
      if (hourNum >= period.start && hourNum < period.end) {
        period.traffic += traffic;
      }
    });
  });
  
  return Object.entries(periods)
    .sort((a, b) => b[1].traffic - a[1].traffic)[0][0];
}

function calculateDataQuality(hourlyData) {
  const expectedHours = 24;
  const actualHours = hourlyData.length;
  const completeness = actualHours / expectedHours;
  
  // Check for data gaps
  const gaps = [];
  for (let i = 1; i < hourlyData.length; i++) {
    const prevHour = new Date(hourlyData[i-1].start_time).getHours();
    const currHour = new Date(hourlyData[i].start_time).getHours();
    if ((currHour - prevHour) % 24 > 1) {
      gaps.push(i);
    }
  }
  
  const gapPenalty = gaps.length * 0.05;
  const score = Math.max(0, Math.min(100, (completeness * 100) - gapPenalty));
  
  return Math.round(score);
}

// Run aggregation
aggregateDailyAnalytics();