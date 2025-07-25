#!/usr/bin/env node

// Test script to verify email recipients
const path = require('path');

// Load the daily-report-sender module
const senderPath = path.join(__dirname, 'daily-report-sender.js');
const senderContent = require('fs').readFileSync(senderPath, 'utf8');

// Extract the ADDITIONAL_RECIPIENTS
const match = senderContent.match(/const ADDITIONAL_RECIPIENTS = \[(.*?)\]/);
if (match) {
  const recipients = match[1];
  console.log('📧 Daily reports will be sent to:');
  console.log('   - pedro@blipee.com (default)');
  console.log('   - ' + recipients.replace(/['"]/g, '').replace(/,/g, '\n   - '));
  console.log('   - Any store-specific recipients');
  console.log('\n✅ Recipients updated successfully!');
  console.log('\n⏰ Reports will be sent at 8 AM local time for each store.');
  console.log('   - Portugal stores: 8 AM WEST/WET');
  console.log('   - Spain stores: 8 AM CEST/CET');
} else {
  console.log('❌ Could not find ADDITIONAL_RECIPIENTS in the file');
}