#!/usr/bin/env node

// Test business hours logic
function isWithinBusinessHours(hour) {
  // Current logic: 9:00 AM to 1:00 AM next day
  // Excluded: 1:00 AM to 9:00 AM
  return !(hour >= 1 && hour < 9);
}

console.log('Business Hours Test:');
console.log('====================');

for (let hour = 0; hour < 24; hour++) {
  const within = isWithinBusinessHours(hour);
  const status = within ? '✅ OPEN' : '❌ CLOSED';
  console.log(`${hour.toString().padStart(2, '0')}:00 - ${status}`);
}

console.log('\nCurrent time analysis:');
const now = new Date();
const lisbon = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Lisbon"}));
const hour = lisbon.getHours();
console.log(`Lisbon time: ${lisbon.toLocaleString()}`);
console.log(`Hour: ${hour}:00`);
console.log(`Status: ${isWithinBusinessHours(hour) ? '✅ Should collect data' : '❌ Should skip'}`);

// Check specific times mentioned
console.log('\nSpecific times check:');
console.log('23:59 (11:59 PM):', isWithinBusinessHours(23) ? '✅ Should collect' : '❌ Should skip');
console.log('00:00 (12:00 AM):', isWithinBusinessHours(0) ? '✅ Should collect' : '❌ Should skip');
console.log('01:00 (1:00 AM):', isWithinBusinessHours(1) ? '✅ Should collect' : '❌ Should skip');
console.log('05:40 (5:40 AM):', isWithinBusinessHours(5) ? '✅ Should collect' : '❌ Should skip');
console.log('09:00 (9:00 AM):', isWithinBusinessHours(9) ? '✅ Should collect' : '❌ Should skip');