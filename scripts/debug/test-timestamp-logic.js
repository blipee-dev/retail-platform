#!/usr/bin/env node

// Test the new timestamp logic
function testTimestampLogic() {
  // Simulate different scenarios
  const scenarios = [
    { currentTime: '2025-07-25 14:35:00', dataTimestamp: '2025-07-25 13:00:00', expected: 'keep' },
    { currentTime: '2025-07-25 14:35:00', dataTimestamp: '2025-07-25 14:00:00', expected: 'keep' },
    { currentTime: '2025-07-25 14:35:00', dataTimestamp: '2025-07-25 15:00:00', expected: 'skip' },
    { currentTime: '2025-07-25 14:35:00', dataTimestamp: '2025-07-25 16:00:00', expected: 'skip' },
    { currentTime: '2025-07-25 00:35:00', dataTimestamp: '2025-07-25 00:00:00', expected: 'keep' },
    { currentTime: '2025-07-25 00:35:00', dataTimestamp: '2025-07-25 01:00:00', expected: 'skip' },
    { currentTime: '2025-07-25 23:35:00', dataTimestamp: '2025-07-25 23:00:00', expected: 'keep' },
    { currentTime: '2025-07-26 00:35:00', dataTimestamp: '2025-07-26 00:00:00', expected: 'keep' },
  ];

  console.log('Testing timestamp logic:\n');
  console.log('Current Time         | Data Timestamp      | Expected | Result   | ✓/✗');
  console.log('-------------------- | ------------------- | -------- | -------- | ---');

  scenarios.forEach(scenario => {
    const localNow = new Date(scenario.currentTime);
    const sensorTimestamp = new Date(scenario.dataTimestamp);
    
    // Apply the new logic
    const currentHour = new Date(localNow);
    currentHour.setMinutes(0, 0, 0);
    currentHour.setHours(currentHour.getHours() + 1); // Next hour start
    
    const shouldSkip = sensorTimestamp >= currentHour;
    const result = shouldSkip ? 'skip' : 'keep';
    const correct = result === scenario.expected;
    
    console.log(
      `${scenario.currentTime} | ${scenario.dataTimestamp} | ${scenario.expected.padEnd(8)} | ${result.padEnd(8)} | ${correct ? '✓' : '✗'}`
    );
  });
}

testTimestampLogic();