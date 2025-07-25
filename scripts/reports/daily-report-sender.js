#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { format, subDays, startOfDay, endOfDay } = require('date-fns');
const { zonedTimeToUtc, utcToZonedTime } = require('date-fns-tz');
const { enUS, es, pt } = require('date-fns/locale');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
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

// Test mode and specific store from environment
const TEST_MODE = process.env.TEST_MODE === 'true';
const SPECIFIC_STORE = process.env.SPECIFIC_STORE;

// Get stores that need reports at 8 AM their local time
async function getStoresForReports() {
  const now = new Date();
  console.log(`🕐 Current UTC time: ${now.toISOString()}`);
  
  if (SPECIFIC_STORE) {
    // If specific store requested, just get that one
    const { data, error } = await supabase
      .from('stores')
      .select('*, organizations(name)')
      .eq('id', SPECIFIC_STORE)
      .single();
      
    if (error) {
      console.error('Error fetching specific store:', error);
      return [];
    }
    
    return data ? [data] : [];
  }
  
  // Get all active stores
  const { data: stores, error } = await supabase
    .from('stores')
    .select('*, organizations(name)')
    .eq('is_active', true);
    
  if (error) {
    console.error('Error fetching stores:', error);
    return [];
  }
  
  // Filter stores where it's currently 8 AM (±30 minutes to handle cron timing)
  const eligibleStores = stores.filter(store => {
    if (!store.timezone) return false;
    
    const storeTime = utcToZonedTime(now, store.timezone);
    const hour = storeTime.getHours();
    const minute = storeTime.getMinutes();
    
    // Check if it's between 7:30 and 8:30 AM
    return (hour === 7 && minute >= 30) || (hour === 8 && minute <= 30);
  });
  
  return eligibleStores;
}

// Get report data for a store using raw data
async function getReportData(store, reportDate) {
  const reportDateStr = format(reportDate, 'yyyy-MM-dd');
  
  console.log(`📊 Fetching data for ${store.name} (ID: ${store.id})`);
  console.log(`   Date: ${reportDateStr}`);
  
  // Get raw data for the report date in store's local timezone
  const storeTimezone = store.timezone || 'Europe/Lisbon';
  const reportDateInTz = utcToZonedTime(new Date(reportDateStr), storeTimezone);
  
  // Set start and end times in local timezone (full day)
  const startLocal = new Date(reportDateInTz);
  startLocal.setHours(0, 0, 0, 0);
  const endLocal = new Date(reportDateInTz);
  endLocal.setHours(23, 59, 59, 999);
  
  // Convert to UTC for database query
  const startUTC = zonedTimeToUtc(startLocal, storeTimezone);
  const endUTC = zonedTimeToUtc(endLocal, storeTimezone);
  
  const { data: rawData, error: rawError } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', startUTC.toISOString())
    .lte('timestamp', endUTC.toISOString())
    .order('timestamp');
    
  if (rawError) {
    console.error('Error fetching raw data:', rawError);
    return null;
  }
  
  console.log(`   Found ${rawData.length} raw records`);
  
  // Handle case where no data is found
  if (!rawData || rawData.length === 0) {
    console.log(`   ⚠️ No data found for ${store.name} on ${reportDateStr}`);
    
    // Return empty data structure
    return {
      totalVisitors: 0,
      totalPassersby: 0,
      captureRate: '0',
      changePercent: 0,
      peakHour: 0,
      peakVisitors: 0,
      hourlyData: Array(24).fill(0),
      morningTraffic: 0,
      afternoonTraffic: 0,
      eveningTraffic: 0,
      avgHourly: 0,
      hasData: false
    };
  }
  
  // Calculate hourly totals from raw data
  const hourlyTotals = {};
  let totalVisitors = 0;
  let totalPassersby = 0;
  
  rawData.forEach(record => {
    // Convert timestamp to store's local time
    const localTime = utcToZonedTime(new Date(record.timestamp), storeTimezone);
    const hour = localTime.getHours();
    
    // Total visitors = sum of line1, line2, and line3 ins
    const visitors = (record.line1_in || 0) + (record.line2_in || 0) + (record.line3_in || 0);
    
    // Passersby = line4 in + line4 out
    const passersby = (record.line4_in || 0) + (record.line4_out || 0);
    
    if (!hourlyTotals[hour]) {
      hourlyTotals[hour] = { visitors: 0, passersby: 0 };
    }
    
    hourlyTotals[hour].visitors += visitors;
    hourlyTotals[hour].passersby += passersby;
    
    totalVisitors += visitors;
    totalPassersby += passersby;
  });
  
  // Calculate capture rate
  const captureRate = totalPassersby > 0 ? 
    ((totalVisitors / totalPassersby) * 100).toFixed(2) : '0';
  
  // Get previous day data for comparison
  const prevDateStr = format(subDays(reportDate, 1), 'yyyy-MM-dd');
  const prevStartDate = new Date(prevDateStr + 'T00:00:00');
  const prevEndDate = new Date(prevDateStr + 'T23:59:59');
  
  const { data: prevRawData } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', prevStartDate.toISOString())
    .lte('timestamp', prevEndDate.toISOString());
    
  let prevVisitors = 0;
  if (prevRawData) {
    prevRawData.forEach(record => {
      prevVisitors += (record.line1_in || 0) + (record.line2_in || 0) + (record.line3_in || 0);
    });
  }
  
  const changePercent = prevVisitors > 0 ? 
    (((totalVisitors - prevVisitors) / prevVisitors) * 100).toFixed(1) : 0;
  
  // Build hourly data array (24 hours)
  const hourlyDataArray = Array(24).fill(0);
  let peakHour = 0;
  let peakVisitors = 0;
  
  Object.keys(hourlyTotals).forEach(hour => {
    const hourNum = parseInt(hour);
    hourlyDataArray[hourNum] = hourlyTotals[hour].visitors;
    
    // Track peak hour (only during business hours 10-23)
    if (hourNum >= 10 && hourNum <= 23 && hourlyTotals[hour].visitors > peakVisitors) {
      peakVisitors = hourlyTotals[hour].visitors;
      peakHour = hourNum;
    }
  });
  
  // Calculate period averages (only business hours 10-23)
  const morningTraffic = hourlyDataArray.slice(10, 14).reduce((a, b) => a + b, 0);
  const afternoonTraffic = hourlyDataArray.slice(14, 19).reduce((a, b) => a + b, 0);
  const eveningTraffic = hourlyDataArray.slice(19, 24).reduce((a, b) => a + b, 0);
  
  // Count business hours with data (10 AM to 11:59 PM)
  const businessHours = hourlyDataArray.slice(10, 24).filter(v => v > 0).length;
  const avgHourly = businessHours > 0 ? Math.round(totalVisitors / businessHours) : 0;
  
  return {
    totalVisitors,
    totalPassersby,
    captureRate,
    changePercent,
    peakHour,
    peakVisitors,
    hourlyData: hourlyDataArray,
    morningTraffic,
    afternoonTraffic,
    eveningTraffic,
    avgHourly,
    hasData: true
  };
}

// Generate HTML report
function generateReport(store, data, reportDate, language, recipientName = '') {
  // Read the appropriate language template
  const templatePath = path.join(__dirname, `daily-report-template-${language}.html`);
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Format data based on locale
  const locale = language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-US';
  const dateFormatStr = language === 'en' ? 'EEEE, MMMM d, yyyy' : 
                       language === 'es' ? "EEEE, d 'de' MMMM 'de' yyyy" :
                       "EEEE, d 'de' MMMM 'de' yyyy";
  
  // Generate hourly bars (only show business hours 10-23)
  const businessHoursData = data.hourlyData.slice(10, 24); // 10 AM to 11 PM
  const maxValue = Math.max(...businessHoursData);
  let hourlyBars = '';
  businessHoursData.forEach((value) => {
    const height = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
    const color = height > 80 ? '#e74c3c' : height > 50 ? '#f39c12' : '#3498db';
    hourlyBars += `<td width="7.14%" style="vertical-align: bottom; padding: 0 1px;">
      <div style="background-color: ${color}; height: ${height}px; width: 100%; border-radius: 2px 2px 0 0;"></div>
    </td>`;
  });
  
  // Generate hour labels (10-23)
  let hourLabels = '';
  for (let i = 10; i <= 23; i += 2) {
    hourLabels += `<td width="14.28%" style="text-align: center;">${i}h</td>`;
  }
  
  // Comparison text
  const getComparison = (value, type) => {
    // Adjust hours per period: morning 4h (10-14), afternoon 5h (14-19), evening 5h (19-24)
    const hoursInPeriod = type === 'morning' ? 4 : 5;
    const avgValue = data.avgHourly * hoursInPeriod;
    const diff = avgValue > 0 ? ((value - avgValue) / avgValue * 100).toFixed(0) : 0;
    
    if (language === 'en') {
      return diff > 0 ? `${diff}% above average` : `${Math.abs(diff)}% below average`;
    } else if (language === 'es') {
      return diff > 0 ? `${diff}% por encima del promedio` : `${Math.abs(diff)}% por debajo del promedio`;
    } else {
      return diff > 0 ? `${diff}% acima da média` : `${Math.abs(diff)}% abaixo da média`;
    }
  };
  
  // Get the correct locale object
  const localeMap = {
    'en': enUS,
    'es': es,
    'pt': pt
  };
  const dateLocale = localeMap[language] || enUS;
  
  // Replace placeholders
  const replacements = {
    recipient_name: recipientName || store.contact_name || 'Store Manager',
    store_name: store.name,
    report_date: format(reportDate, dateFormatStr, { locale: dateLocale }),
    total_visitors: new Intl.NumberFormat(locale).format(data.totalVisitors),
    change_percentage: data.changePercent > 0 ? 
      `▲ ${Math.abs(data.changePercent)}% vs ${language === 'en' ? 'yesterday' : language === 'es' ? 'ayer' : 'ontem'}` :
      `▼ ${Math.abs(data.changePercent)}% vs ${language === 'en' ? 'yesterday' : language === 'es' ? 'ayer' : 'ontem'}`,
    change_color: data.changePercent >= 0 ? '#27ae60' : '#e74c3c',
    capture_rate: String(data.captureRate || '0').replace('.', language === 'en' ? '.' : ','),
    passerby_count: new Intl.NumberFormat(locale).format(data.totalPassersby),
    passerby_total: new Intl.NumberFormat(locale).format(data.totalPassersby),
    peak_hour: `${data.peakHour}:00`,
    peak_visitors: data.peakVisitors,
    avg_hourly: data.avgHourly,
    busiest_period: `${data.peakHour - 1}-${data.peakHour + 2}h`,
    morning_traffic: data.morningTraffic,
    morning_comparison: getComparison(data.morningTraffic, 'morning'),
    afternoon_traffic: data.afternoonTraffic,
    afternoon_comparison: getComparison(data.afternoonTraffic, 'afternoon'),
    evening_traffic: data.eveningTraffic,
    evening_comparison: getComparison(data.eveningTraffic, 'evening'),
    hourly_bars: hourlyBars,
    hour_labels: hourLabels
  };
  
  Object.keys(replacements).forEach(key => {
    template = template.replace(new RegExp(`{{${key}}}`, 'g'), replacements[key]);
  });
  
  return template;
}

// Get language preference for store/recipient
function getLanguageForStore(store) {
  // Check store name or organization for hints
  const storeName = (store.name || '').toLowerCase();
  const orgName = (store.organizations?.name || '').toLowerCase();
  
  // Portuguese indicators
  if (storeName.includes('portugal') || storeName.includes('lisboa') || 
      storeName.includes('porto') || orgName.includes('portugal')) {
    return 'pt';
  }
  
  // Spanish indicators
  if (storeName.includes('spain') || storeName.includes('españa') || 
      storeName.includes('madrid') || storeName.includes('barcelona')) {
    return 'es';
  }
  
  // Timezone-based detection
  if (store.timezone) {
    if (store.timezone === 'Europe/Lisbon') return 'pt';
    if (store.timezone === 'Europe/Madrid') return 'es';
  }
  
  // Default to Portuguese for Portugal-based company
  return 'pt';
}

// Get report recipients based on roles and permissions
async function getReportRecipients(store) {
  const recipients = [];
  
  try {
    // 1. Get all platform admins (they receive ALL reports)
    const { data: platformAdmins, error: platformError } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('role', 'platform_admin')
      .eq('is_active', true);
    
    if (platformError) {
      console.error('Error fetching platform admins:', platformError);
    } else if (platformAdmins && platformAdmins.length > 0) {
      console.log(`   Found ${platformAdmins.length} platform admin(s)`);
      recipients.push(...platformAdmins);
    }
    
    // 2. Get organization admins for this store's organization
    const { data: orgAdmins, error: orgError } = await supabase
      .from('user_profiles')
      .select('email, full_name')
      .eq('role', 'tenant_admin')
      .eq('organization_id', store.organization_id)
      .eq('is_active', true);
    
    if (orgError) {
      console.error('Error fetching org admins:', orgError);
    } else if (orgAdmins && orgAdmins.length > 0) {
      console.log(`   Found ${orgAdmins.length} org admin(s) for ${store.organizations?.name || 'organization'}`);
      recipients.push(...orgAdmins);
    }
    
    // 3. Add store-specific recipients if configured
    if (store.report_emails) {
      const emails = store.report_emails.split(',').map(email => email.trim()).filter(Boolean);
      for (const email of emails) {
        if (!recipients.find(r => r.email === email)) {
          recipients.push({
            email: email,
            full_name: email.split('@')[0] // Fallback name
          });
        }
      }
      console.log(`   Found ${emails.length} store-specific recipient(s)`);
    }
    
    // Remove duplicates by email
    const uniqueRecipients = recipients.reduce((acc, recipient) => {
      if (!acc.find(r => r.email === recipient.email)) {
        acc.push(recipient);
      }
      return acc;
    }, []);
    
    console.log(`   Total unique recipients: ${uniqueRecipients.length}`);
    return uniqueRecipients;
    
  } catch (error) {
    console.error('Error getting report recipients:', error);
    // Fallback to store emails or default
    if (store.report_emails) {
      return store.report_emails.split(',').map(email => ({
        email: email.trim(),
        full_name: email.split('@')[0]
      }));
    }
    return [];
  }
}

// Send email report to multiple recipients with personalized greetings
async function sendReport(store, data, reportDate) {
  // Get recipients dynamically from database
  const recipients = await getReportRecipients(store);
  
  if (recipients.length === 0) {
    console.warn(`⚠️  No recipients found for ${store.name}`);
    return false;
  }
  
  const subject = `Daily Traffic Report - ${store.name} - ${format(reportDate, 'MMM d, yyyy')}`;
  const language = getLanguageForStore(store);
  
  let successCount = 0;
  let failureCount = 0;
  
  // Send personalized email to each recipient
  for (const recipient of recipients) {
    try {
      // Extract first name from full_name
      const firstName = recipient.full_name ? 
        recipient.full_name.split(' ')[0] : 
        recipient.email.split('@')[0];
      
      // Generate personalized HTML
      const html = generateReport(store, data, reportDate, language, firstName);
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'analytics@blipee.com',
        to: recipient.email,
        subject: subject,
        html: html
      });
      
      console.log(`✅ Report sent to ${recipient.email} (${recipient.full_name || firstName}) for ${store.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed to send email to ${recipient.email} for ${store.name}:`, error);
      failureCount++;
    }
  }
  
  return successCount > 0;
}

// Main execution
async function main() {
  console.log('🚀 Starting daily report generation...');
  console.log(`📧 Test mode: ${TEST_MODE}`);
  
  // Get stores that need reports
  const stores = await getStoresForReports();
  console.log(`📍 Found ${stores.length} stores for reports`);
  
  let successCount = 0;
  let failureCount = 0;
  
  for (const store of stores) {
    console.log(`\n📊 Processing ${store.name}...`);
    
    try {
      // Get yesterday's date in store timezone
      const storeNow = utcToZonedTime(new Date(), store.timezone);
      const reportDate = subDays(storeNow, 1);
      
      // Get report data
      const data = await getReportData(store, reportDate);
      if (!data) {
        console.error(`❌ No data available for ${store.name}`);
        failureCount++;
        continue;
      }
      
      // Send email with personalized reports
      const sent = await sendReport(store, data, reportDate);
      if (sent) {
        successCount++;
      } else {
        failureCount++;
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${store.name}:`, error);
      failureCount++;
    }
  }
  
  console.log(`\n✅ Completed: ${successCount} successful, ${failureCount} failed`);
  
  if (failureCount > 0) {
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);