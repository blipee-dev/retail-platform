#!/usr/bin/env node

// This script adds email tracking to the daily report sender
// It logs successful sends to a tracking table in Supabase

const fs = require('fs');
const path = require('path');

// Read the current daily-report-sender.js
const senderPath = path.join(__dirname, 'daily-report-sender.js');
let senderContent = fs.readFileSync(senderPath, 'utf8');

// Add email tracking after successful send
const trackingCode = `
    // Log email delivery
    const { error: trackingError } = await supabase
      .from('email_tracking')
      .insert({
        store_id: store.id,
        store_name: store.name,
        recipients: recipients,
        report_date: reportDate.toISOString(),
        sent_at: new Date().toISOString(),
        status: 'sent',
        subject: subject
      });
      
    if (trackingError) {
      console.log('Warning: Could not log email tracking:', trackingError);
    }
`;

// Find the success log line and add tracking after it
const successLogPattern = /console\.log\(`✅ Report sent to \${recipients} for \${store\.name}`\);/;

if (senderContent.match(successLogPattern)) {
  senderContent = senderContent.replace(
    successLogPattern,
    `console.log(\`✅ Report sent to \${recipients} for \${store.name}\`);${trackingCode}`
  );
  
  // Write the updated file
  fs.writeFileSync(senderPath, senderContent);
  console.log('✅ Email tracking code added to daily-report-sender.js');
  console.log('📝 You need to create the email_tracking table in Supabase:');
  console.log(`
CREATE TABLE email_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id),
  store_name TEXT,
  recipients TEXT,
  report_date TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT,
  subject TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for queries
CREATE INDEX idx_email_tracking_sent_at ON email_tracking(sent_at DESC);
CREATE INDEX idx_email_tracking_store_id ON email_tracking(store_id);
  `);
} else {
  console.log('❌ Could not find the success log pattern in the file');
}