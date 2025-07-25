#!/usr/bin/env node

const { SupabaseClient } = require('./lib/supabase-client');

async function checkAnalyticsTables() {
  console.log('🔍 Analyzing People Counting Analytics Tables\n');
  
  const supabase = new SupabaseClient();

  try {
    // 1. Check people_counting_raw
    console.log('📊 1. PEOPLE_COUNTING_RAW TABLE:');
    console.log('================================\n');
    
    const rawData = await supabase.query(
      'people_counting_raw',
      '*',
      {
        order: { column: 'timestamp', ascending: false },
        limit: 10
      }
    );
    
    console.log(`Found ${rawData.length} recent records\n`);
    
    if (rawData.length > 0) {
      // Show structure
      console.log('Table structure:');
      Object.keys(rawData[0]).forEach(key => {
        const sampleValue = rawData[0][key];
        console.log(`  - ${key}: ${typeof sampleValue} (${sampleValue || 'null'})`);
      });
      
      // Show sample data
      console.log('\nSample data (last 5 records):');
      rawData.slice(0, 5).forEach(record => {
        console.log(`  ${record.timestamp} | ${record.sensor_id} | In: ${record.in_count}, Out: ${record.out_count}`);
      });
      
      // Get unique sensors
      const sensors = [...new Set(rawData.map(r => r.sensor_id))];
      console.log(`\nActive sensors: ${sensors.join(', ')}`);
    }

    // 2. Check hourly_analytics
    console.log('\n\n📊 2. HOURLY_ANALYTICS TABLE:');
    console.log('==============================\n');
    
    try {
      const hourlyData = await supabase.query(
        'hourly_analytics',
        '*',
        {
          order: { column: 'hour_start', ascending: false },
          limit: 10
        }
      );
      
      if (hourlyData.length > 0) {
        console.log('Table structure:');
        Object.keys(hourlyData[0]).forEach(key => {
          const sampleValue = hourlyData[0][key];
          console.log(`  - ${key}: ${typeof sampleValue}`);
        });
        
        console.log('\nSample data (last 5 hours):');
        hourlyData.slice(0, 5).forEach(record => {
          console.log(`  ${record.hour_start} | Store ${record.store_id} | Traffic: ${record.total_traffic || 0} | Entries: ${record.total_entries || 0}`);
        });
      } else {
        console.log('No data found in hourly_analytics table');
      }
    } catch (error) {
      console.log('❌ hourly_analytics table may not exist:', error.message);
    }

    // 3. Check daily_analytics
    console.log('\n\n📊 3. DAILY_ANALYTICS TABLE:');
    console.log('=============================\n');
    
    try {
      const dailyData = await supabase.query(
        'daily_analytics',
        '*',
        {
          order: { column: 'date', ascending: false },
          limit: 10
        }
      );
      
      if (dailyData.length > 0) {
        console.log('Table structure:');
        Object.keys(dailyData[0]).forEach(key => {
          const sampleValue = dailyData[0][key];
          console.log(`  - ${key}: ${typeof sampleValue}`);
        });
        
        console.log('\nSample data (last 5 days):');
        dailyData.slice(0, 5).forEach(record => {
          console.log(`  ${record.date} | Store ${record.store_id} | Traffic: ${record.total_traffic || 0} | Peak: ${record.peak_hour || 'N/A'}`);
        });
      } else {
        console.log('No data found in daily_analytics table');
      }
    } catch (error) {
      console.log('❌ daily_analytics table may not exist:', error.message);
    }

    // 4. Check data completeness
    console.log('\n\n📈 DATA ANALYSIS:');
    console.log('==================\n');
    
    // Check data for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayData = await supabase.query(
      'people_counting_raw',
      'sensor_id, COUNT(*) as count',
      {
        gte: { timestamp: today.toISOString() },
        groupBy: 'sensor_id'
      }
    );
    
    console.log('Today\'s data collection:');
    if (todayData.length > 0) {
      todayData.forEach(sensor => {
        console.log(`  ${sensor.sensor_id}: ${sensor.count} records`);
      });
    } else {
      console.log('  No data collected today yet');
    }

    // 5. Available KPIs
    console.log('\n\n🎯 AVAILABLE KPIs FROM RAW DATA:');
    console.log('==================================\n');
    
    console.log('Direct metrics:');
    console.log('  ✓ Total entries (in_count)');
    console.log('  ✓ Total exits (out_count)');
    console.log('  ✓ Net occupancy (in - out)');
    console.log('  ✓ Hourly traffic patterns');
    console.log('  ✓ Peak hours identification');
    console.log('  ✓ Multi-sensor/zone tracking');
    
    console.log('\nCalculated metrics possible:');
    console.log('  ✓ Average dwell time (with assumptions)');
    console.log('  ✓ Traffic flow patterns');
    console.log('  ✓ Hour-over-hour changes');
    console.log('  ✓ Daily/weekly/monthly comparisons');
    console.log('  ✓ Conversion rates (with POS integration)');
    
    console.log('\nLine-specific data available:');
    if (rawData.length > 0 && rawData[0].line1_in !== undefined) {
      console.log('  ✓ Multiple counting lines (line1, line2, line3, line4)');
      console.log('  ✓ Directional flow analysis');
      console.log('  ✓ Entry/exit point analysis');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkAnalyticsTables();