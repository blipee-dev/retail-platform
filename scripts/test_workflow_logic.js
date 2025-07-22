#!/usr/bin/env node
/**
 * Test the workflow timestamp comparison logic
 */

function testWorkflowLogic() {
    console.log('Testing Workflow Timestamp Logic');
    console.log('='.repeat(50));
    
    // Simulate workflow scenario
    const lastTimestamp = new Date('2025-07-22T10:00:00.000Z');
    const newRecords = [
        { timestamp: new Date('2025-07-22T10:00:00.000Z'), desc: '10:00 (same as last)' },
        { timestamp: new Date('2025-07-22T11:00:00.000Z'), desc: '11:00 (new hour)' },
        { timestamp: new Date('2025-07-22T09:00:00.000Z'), desc: '09:00 (older)' }
    ];
    
    console.log(`\nLast timestamp in DB: ${lastTimestamp.toISOString()}`);
    console.log('\nChecking each record:');
    
    newRecords.forEach(record => {
        const wouldSkip = lastTimestamp && record.timestamp <= lastTimestamp;
        console.log(`\n${record.desc}:`);
        console.log(`  Timestamp: ${record.timestamp.toISOString()}`);
        console.log(`  record.timestamp <= lastTimestamp: ${record.timestamp <= lastTimestamp}`);
        console.log(`  Would skip: ${wouldSkip ? 'YES ❌' : 'NO ✅'}`);
    });
    
    console.log('\n\n💡 The logic SHOULD work!');
    console.log('11:00 > 10:00, so it should NOT be skipped.');
    console.log('\nPossible issues:');
    console.log('1. The parseCSV function might be returning wrong timestamps');
    console.log('2. The sensor might not be returning 11:00 data yet');
    console.log('3. There might be an error during insertion');
}

testWorkflowLogic();