#!/usr/bin/env node
/**
 * Debug timezone offset calculation
 */

function debugTimezoneOffset() {
    // Current time
    const nowUTC = new Date();
    console.log(`Current UTC time: ${nowUTC.toISOString()}`);
    console.log(`Current UTC hour: ${nowUTC.getUTCHours()}`);
    
    // Brazil timezone info
    console.log('\n=== BRAZIL TIMEZONE INFO ===');
    console.log('Brazil Standard Time: UTC-3');
    console.log('Brazil Summer Time (when active): UTC-2');
    console.log('Note: Brazil abolished DST in 2019, so it\'s always UTC-3');
    
    // If sensor shows 12:00 when UTC is 15:00
    console.log('\n=== SENSOR TIME ANALYSIS ===');
    const utcHour = 15;
    const sensorHour = 12;
    const actualOffset = sensorHour - utcHour; // 12 - 15 = -3
    console.log(`If UTC is ${utcHour}:00 and sensor shows ${sensorHour}:00`);
    console.log(`Actual offset: ${actualOffset} hours`);
    
    // The probe logic issue
    console.log('\n=== PROBE LOGIC ISSUE ===');
    console.log('Current probe logic:');
    console.log('  const hourDiff = Math.round((activeTime.getHours() - nowUTC.getHours()));');
    console.log('  return { offsetHours: -hourDiff };');
    
    console.log('\nProblem: getHours() returns LOCAL hour, not considering date differences');
    console.log('If sensor date is different from UTC date, calculation is wrong');
    
    // Correct calculation
    console.log('\n=== CORRECT OFFSET CALCULATION ===');
    const sensorTime = new Date('2025-07-22T12:00:00'); // What sensor reports
    const utcTime = new Date('2025-07-22T15:00:00Z'); // Actual UTC time
    
    const offsetMs = sensorTime.getTime() - utcTime.getTime();
    const offsetHours = offsetMs / (60 * 60 * 1000);
    
    console.log(`Sensor time: ${sensorTime.toISOString()}`);
    console.log(`UTC time: ${utcTime.toISOString()}`);
    console.log(`Offset in ms: ${offsetMs}`);
    console.log(`Offset in hours: ${offsetHours}`);
    
    // Test conversion
    console.log('\n=== TEST CONVERSION ===');
    const testSensorTime = new Date('2025-07-22T12:30:00'); // Sensor reports 12:30
    const testUtcTime = new Date(testSensorTime.getTime() - (-3 * 60 * 60 * 1000)); // Convert to UTC
    
    console.log(`Sensor reports: ${testSensorTime.toISOString().slice(0, 19)}`);
    console.log(`Should be UTC: ${testUtcTime.toISOString()}`);
    console.log(`Expected UTC: 2025-07-22T15:30:00.000Z`);
}

debugTimezoneOffset();