#!/usr/bin/env node

// Manual test script to send a daily report immediately
// This bypasses the 8 AM check for testing purposes

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const { format, startOfDay, endOfDay } = require('date-fns');
const { utcToZonedTime } = require('date-fns-tz');
const fs = require('fs');
const path = require('path');

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function getTestStore() {
  const { data, error } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();
    
  if (error) {
    console.error('❌ Error fetching store:', error);
    return null;
  }
  
  return data;
}

async function getReportData(storeId, reportDate, timezone) {
  const startUTC = utcToZonedTime(startOfDay(reportDate), timezone);
  const endUTC = utcToZonedTime(endOfDay(reportDate), timezone);
  
  console.log(`📊 Fetching data for ${format(reportDate, 'yyyy-MM-dd')}...`);
  
  // Fetch raw sensor data
  const { data: rawData, error } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', storeId)
    .gte('timestamp', startUTC.toISOString())
    .lt('timestamp', endUTC.toISOString())
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('❌ Error fetching data:', error);
    return null;
  }

  console.log(`   Found ${rawData?.length || 0} raw records`);

  // Process the data
  const hourlyData = {};
  let totalVisitors = 0;
  let totalPassersby = 0;
  let peakHour = null;
  let peakVisitors = 0;

  rawData?.forEach(record => {
    const localTime = utcToZonedTime(new Date(record.timestamp), timezone);
    const hour = format(localTime, 'HH:00');
    const hourNum = parseInt(format(localTime, 'HH'));
    
    if (!hourlyData[hour]) {
      hourlyData[hour] = { visitors: 0, passersby: 0 };
    }
    
    // Calculate visitors and passersby based on the correct formula
    const visitors = (record.line1_in || 0) + (record.line2_in || 0) + (record.line3_in || 0);
    const passersby = (record.line4_in || 0) + (record.line4_out || 0);
    
    hourlyData[hour].visitors += visitors;
    hourlyData[hour].passersby += passersby;
    
    // Only count business hours (10 AM to 11:59 PM)
    if (hourNum >= 10 && hourNum <= 23) {
      totalVisitors += visitors;
      totalPassersby += passersby;
      
      if (hourlyData[hour].visitors > peakVisitors) {
        peakVisitors = hourlyData[hour].visitors;
        peakHour = hour;
      }
    }
  });

  const captureRate = totalPassersby > 0 ? ((totalVisitors / totalPassersby) * 100).toFixed(1) : '0';

  return {
    date: reportDate,
    totalVisitors,
    totalPassersby,
    captureRate,
    peakHour: peakHour || '14:00',
    hourlyData
  };
}

// Detect language based on timezone
function detectLanguage(timezone, storeName) {
  if (timezone?.includes('Madrid') || storeName?.toLowerCase().includes('spain')) {
    return 'es';
  }
  if (timezone?.includes('Lisbon') || storeName?.toLowerCase().includes('portugal')) {
    return 'pt';
  }
  return 'pt'; // Default to Portuguese
}

async function sendTestReport() {
  console.log('🧪 Starting manual test send...\n');
  
  // Get a test store
  const store = await getTestStore();
  if (!store) {
    console.error('❌ No active store found');
    return;
  }
  
  console.log(`📍 Using store: ${store.name}`);
  console.log(`🌍 Timezone: ${store.timezone || 'Europe/Lisbon'}\n`);
  
  // Get yesterday's data
  const timezone = store.timezone || 'Europe/Lisbon';
  const now = utcToZonedTime(new Date(), timezone);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // Get report data
  const data = await getReportData(store.id, yesterday, timezone);
  if (!data) {
    console.error('❌ Failed to get report data');
    return;
  }
  
  console.log(`\n📊 Report Summary:`);
  console.log(`   Date: ${format(data.date, 'yyyy-MM-dd')}`);
  console.log(`   Total Visitors: ${data.totalVisitors}`);
  console.log(`   Total Passersby: ${data.totalPassersby}`);
  console.log(`   Capture Rate: ${data.captureRate}%`);
  console.log(`   Peak Hour: ${data.peakHour}\n`);
  
  // Load the appropriate template
  const language = detectLanguage(timezone, store.name);
  const templateFile = language === 'es' ? 'daily-report-template-es.html' : 
                      language === 'pt' ? 'daily-report-template-pt.html' : 
                      'daily-report-template.html';
  
  console.log(`🌐 Using ${language.toUpperCase()} template: ${templateFile}`);
  
  const templatePath = path.join(__dirname, templateFile);
  let html = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  const locale = language === 'es' ? 'es-ES' : language === 'pt' ? 'pt-PT' : 'en-US';
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  
  html = html.replace(/{{store_name}}/g, store.name);
  html = html.replace(/{{report_date}}/g, data.date.toLocaleDateString(locale, dateOptions));
  html = html.replace(/{{total_visitors}}/g, data.totalVisitors.toLocaleString());
  html = html.replace(/{{total_passersby}}/g, data.totalPassersby.toLocaleString());
  html = html.replace(/{{capture_rate}}/g, String(data.captureRate || '0').replace('.', language === 'en' ? '.' : ','));
  html = html.replace(/{{peak_hour}}/g, data.peakHour);
  
  // Generate hourly chart
  const chartBars = [];
  const maxValue = Math.max(...Object.values(data.hourlyData).map(h => h.visitors));
  
  for (let hour = 10; hour <= 23; hour++) {
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    const value = data.hourlyData[hourStr]?.visitors || 0;
    const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
    
    chartBars.push(`
      <div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%;">
        <div style="font-size: 10px; color: #666; margin-bottom: 4px;">${value}</div>
        <div style="width: 100%; background-color: ${hourStr === data.peakHour ? '#8B5CF6' : '#E5E7EB'}; height: ${height}%; min-height: 2px; border-radius: 2px 2px 0 0;"></div>
        <div style="font-size: 10px; color: #666; margin-top: 4px;">${hour}h</div>
      </div>
    `);
  }
  
  html = html.replace('{{hourly_chart}}', chartBars.join(''));
  
  // Send email
  console.log('\n📧 Sending test email...');
  
  // Email recipients
  const DEFAULT_RECIPIENT = 'pedro@blipee.com';
  const ADDITIONAL_RECIPIENTS = ['pedro.t.bartolomeu@gmail.com'];
  const storeRecipients = store.report_emails || store.contact_email || store.email || DEFAULT_RECIPIENT;
  
  const recipientList = Array.isArray(storeRecipients) ? storeRecipients : [storeRecipients];
  const allRecipients = [...new Set([...recipientList, ...ADDITIONAL_RECIPIENTS])];
  const recipients = allRecipients.join(', ');
  
  console.log(`📬 Recipients: ${recipients}`);
  
  const subject = `[TEST] Daily Traffic Report - ${store.name} - ${format(data.date, 'MMM d, yyyy')}`;
  
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'analytics@blipee.com',
      to: recipients,
      subject: subject,
      html: html
    });
    
    console.log(`\n✅ Test email sent successfully!`);
    console.log(`   Message ID: ${info.messageId}`);
    console.log(`   Recipients will receive the report shortly.`);
  } catch (error) {
    console.error('\n❌ Failed to send test email:', error.message);
  }
}

sendTestReport().catch(console.error);