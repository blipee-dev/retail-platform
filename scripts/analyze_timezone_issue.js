#!/usr/bin/env node
/**
 * Analyze the timezone issue with sensor data collection
 */

function analyzeTimezoneIssue() {
    // Current UTC time: 14:45 (approx)
    const nowUTC = new Date('2025-07-22T14:45:00Z');
    console.log(`Current UTC time: ${nowUTC.toISOString()}`);
    console.log(`Current UTC hour: ${nowUTC.getUTCHours()}`);
    
    // If sensors are in UTC-3 (Brazil time)
    const offsetHours = -3; // Brazil is UTC-3
    console.log(`\nSensor timezone offset: ${offsetHours} hours from UTC`);
    
    // When it's 14:45 UTC, it's 11:45 in Brazil
    const sensorLocalTime = new Date(nowUTC.getTime() + (offsetHours * 60 * 60 * 1000));
    console.log(`Sensor local time: ${sensorLocalTime.toISOString()} (displayed as UTC but represents local)`);
    console.log(`Sensor local hour: ${sensorLocalTime.getUTCHours()}`);
    
    // The workflow queries for the last 3 hours of sensor time
    const sensorNow = new Date(nowUTC.getTime() - (offsetHours * 60 * 60 * 1000));
    console.log(`\nWorkflow calculates sensorNow as: ${sensorNow.toISOString()}`);
    console.log(`This represents: ${sensorNow.getUTCHours()}:00 in sensor's time`);
    
    // The issue: if offset = -3, then:
    // sensorNow = nowUTC - (-3 * hours) = nowUTC + 3 hours = 17:45 UTC
    // This is WRONG! It should be nowUTC - 3 hours = 11:45
    
    console.log('\n❌ PROBLEM IDENTIFIED:');
    console.log('The workflow uses: sensorNow = new Date(nowUTC.getTime() - (offsetHours * 60 * 60 * 1000))');
    console.log('With offsetHours = -3, this becomes: nowUTC - (-3) = nowUTC + 3');
    console.log('So it thinks sensor time is 3 hours AHEAD of UTC, when it\'s actually 3 hours BEHIND');
    
    // Correct calculation
    const correctSensorNow = new Date(nowUTC.getTime() + (offsetHours * 60 * 60 * 1000));
    console.log(`\n✅ CORRECT calculation should be:`);
    console.log(`correctSensorNow = nowUTC + offsetHours`);
    console.log(`correctSensorNow = ${correctSensorNow.toISOString()} (${correctSensorNow.getUTCHours()}:00 local)`);
    
    // Show what records would be filtered
    console.log('\n=== FILTERING ANALYSIS ===');
    
    // Simulate sensor returning data for hours 10, 11, 12, 13 (local time)
    const sensorRecords = [10, 11, 12, 13, 14, 15];
    
    for (const hour of sensorRecords) {
        // Create a timestamp for this hour in sensor local time
        const sensorTimestamp = new Date(nowUTC);
        sensorTimestamp.setUTCHours(hour, 0, 0, 0);
        
        // Convert to UTC (sensor is UTC-3, so UTC = local + 3)
        const utcTimestamp = new Date(sensorTimestamp.getTime() - (offsetHours * 60 * 60 * 1000));
        
        // Check if it would be filtered
        const isFuture = utcTimestamp > nowUTC;
        const tooOld = (nowUTC.getTime() - utcTimestamp.getTime()) > 3 * 60 * 60 * 1000;
        
        console.log(`\nSensor hour ${hour}:00:`);
        console.log(`  UTC timestamp: ${utcTimestamp.toISOString()}`);
        console.log(`  Is future (UTC > now)? ${isFuture}`);
        console.log(`  Too old (> 3 hrs ago)? ${tooOld}`);
        console.log(`  Would be inserted? ${!isFuture && !tooOld}`);
    }
}

analyzeTimezoneIssue();