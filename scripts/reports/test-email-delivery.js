#!/usr/bin/env node

require('dotenv').config();
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function testEmailDelivery() {
  const testRecipients = [
    'pedro@blipee.com',
    'jmunoz@patrimi.com', 
    'jmelo@patrimi.com'
  ];
  
  console.log('🧪 Testing email delivery to daily report recipients...\n');
  
  for (const recipient of testRecipients) {
    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'analytics@blipee.com',
        to: recipient,
        subject: `Test Email - Daily Report Configuration`,
        html: `
          <h2>Daily Report Email Test</h2>
          <p>This is a test email to verify that you are correctly configured to receive daily traffic reports.</p>
          <p>If you receive this email, you will also receive the automated daily reports at 8 AM local time.</p>
          <p style="color: #666; font-size: 12px;">Sent at: ${new Date().toISOString()}</p>
        `
      });
      
      console.log(`✅ Test email sent to ${recipient}`);
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Response: ${info.response}\n`);
      
    } catch (error) {
      console.error(`❌ Failed to send to ${recipient}:`, error.message);
    }
  }
}

testEmailDelivery().catch(console.error);