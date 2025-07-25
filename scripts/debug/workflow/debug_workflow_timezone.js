#!/usr/bin/env node
/**
 * Debug script to understand the timezone issues in the workflow
 */

// Simulate the workflow logic
async function debugTimezoneLogic() {
    const nowUTC = new Date();
    console.log(`Current UTC time: ${nowUTC.toISOString()}`);
    console.log(`Current UTC hour: ${nowUTC.getUTCHours()}`);
    console.log('-'.repeat(80));
    
    // Simulate different timezone offsets
    const testOffsets = [-3, -2, -1, 0, 1, 2, 3];
    
    for (const offsetHours of testOffsets) {
        console.log(`\n=== Testing with offset: ${offsetHours} hours from UTC ===`);
        
        // Calculate sensor time
        const sensorNow = new Date(nowUTC.getTime() - (offsetHours * 60 * 60 * 1000));
        const sensorThreeHoursAgo = new Date(sensorNow.getTime() - 3 * 60 * 60 * 1000);
        
        console.log(`Sensor now: ${sensorNow.toISOString()}`);
        console.log(`Sensor 3 hours ago: ${sensorThreeHoursAgo.toISOString()}`);
        
        // Simulate some records at different times
        const testRecords = [];
        for (let i = 0; i < 24; i++) {
            const recordTime = new Date(sensorNow.getTime() - i * 10 * 60 * 1000); // Every 10 minutes
            const utcTime = new Date(recordTime.getTime() + (offsetHours * 60 * 60 * 1000));
            testRecords.push({
                sensorTime: recordTime,
                utcTime: utcTime,
                minutesAgo: i * 10
            });
        }
        
        // Apply the filtering logic from the workflow
        let skippedFuture = 0;
        let skippedOld = 0;
        let wouldInsert = 0;
        
        for (const record of testRecords) {
            // Skip future data (in UTC)
            if (record.utcTime > nowUTC) {
                skippedFuture++;
                continue;
            }
            
            // Only process recent data (last 3 hours in UTC)
            if (nowUTC.getTime() - record.utcTime.getTime() > 3 * 60 * 60 * 1000) {
                skippedOld++;
                continue;
            }
            
            wouldInsert++;
        }
        
        console.log(`\nResults:`);
        console.log(`  Total test records: ${testRecords.length}`);
        console.log(`  Skipped (future): ${skippedFuture}`);
        console.log(`  Skipped (too old): ${skippedOld}`);
        console.log(`  Would insert: ${wouldInsert}`);
        
        // Show the time window that would be accepted
        const oldestAcceptable = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);
        console.log(`\nAcceptable UTC time window:`);
        console.log(`  From: ${oldestAcceptable.toISOString()}`);
        console.log(`  To: ${nowUTC.toISOString()}`);
    }
}

// Also test the probe logic
function testProbeLogic() {
    console.log('\n' + '='.repeat(80));
    console.log('TESTING PROBE LOGIC');
    console.log('='.repeat(80));
    
    const nowUTC = new Date();
    console.log(`Current UTC time: ${nowUTC.toISOString()}`);
    console.log(`Current UTC hour: ${nowUTC.getUTCHours()}`);
    
    // Simulate sensor returning data with local time
    const sensorLocalHour = 12; // Sensor thinks it's 12:00
    const utcHour = nowUTC.getUTCHours();
    
    console.log(`\nSensor local hour: ${sensorLocalHour}`);
    console.log(`UTC hour: ${utcHour}`);
    
    const hourDiff = Math.round(sensorLocalHour - utcHour);
    console.log(`Hour difference: ${hourDiff}`);
    console.log(`Calculated offset (from probe logic): ${-hourDiff} hours`);
    
    // The probe logic uses: offsetHours: -hourDiff
    // This means if sensor is at 12:00 and UTC is at 15:00, offset = -(-3) = +3
    // So UTC = sensor time + 3 hours
}

// Run the debug
debugTimezoneLogic();
testProbeLogic();