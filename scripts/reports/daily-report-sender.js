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

// Get report data for a store
async function getReportData(store, reportDate) {
  const startOfDayUTC = zonedTimeToUtc(startOfDay(reportDate), store.timezone);
  const endOfDayUTC = zonedTimeToUtc(endOfDay(reportDate), store.timezone);
  
  // Get people counting data
  const { data: trafficData, error: trafficError } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', startOfDayUTC.toISOString())
    .lt('timestamp', endOfDayUTC.toISOString())
    .order('timestamp');
    
  if (trafficError) {
    console.error('Error fetching traffic data:', trafficError);
    return null;
  }
  
  // Get previous day data for comparison
  const prevDate = subDays(reportDate, 1);
  const prevStartUTC = zonedTimeToUtc(startOfDay(prevDate), store.timezone);
  const prevEndUTC = zonedTimeToUtc(endOfDay(prevDate), store.timezone);
  
  const { data: prevData } = await supabase
    .from('people_counting_raw')
    .select('*')
    .eq('store_id', store.id)
    .gte('timestamp', prevStartUTC.toISOString())
    .lt('timestamp', prevEndUTC.toISOString());
    
  // Calculate metrics
  const totalVisitors = trafficData.reduce((sum, d) => sum + (d.people_in || 0), 0);
  const totalPassersby = trafficData.reduce((sum, d) => sum + (d.passerby || 0), 0);
  const captureRate = totalPassersby > 0 ? ((totalVisitors / totalPassersby) * 100).toFixed(1) : '0';
  
  const prevVisitors = prevData ? prevData.reduce((sum, d) => sum + (d.people_in || 0), 0) : 0;
  const changePercent = prevVisitors > 0 ? (((totalVisitors - prevVisitors) / prevVisitors) * 100).toFixed(1) : 0;
  
  // Find peak hour
  const hourlyData = Array(24).fill(0);
  trafficData.forEach(record => {
    const hour = new Date(record.timestamp).getHours();
    hourlyData[hour] += record.people_in || 0;
  });
  
  const peakHour = hourlyData.indexOf(Math.max(...hourlyData));
  const peakVisitors = Math.max(...hourlyData);
  
  // Calculate period averages
  const morningTraffic = hourlyData.slice(6, 12).reduce((a, b) => a + b, 0);
  const afternoonTraffic = hourlyData.slice(12, 18).reduce((a, b) => a + b, 0);
  const eveningTraffic = hourlyData.slice(18, 22).reduce((a, b) => a + b, 0);
  
  const avgHourly = Math.round(totalVisitors / 12); // Assuming 12 hour business day
  
  return {
    totalVisitors,
    totalPassersby,
    captureRate,
    changePercent,
    peakHour,
    peakVisitors,
    hourlyData,
    morningTraffic,
    afternoonTraffic,
    eveningTraffic,
    avgHourly
  };
}

// Generate HTML report
function generateReport(store, data, reportDate, language) {
  // Read the appropriate language template
  const templatePath = path.join(__dirname, `daily-report-template-${language}.html`);
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Format data based on locale
  const locale = language === 'pt' ? 'pt-PT' : language === 'es' ? 'es-ES' : 'en-US';
  const dateFormatStr = language === 'en' ? 'EEEE, MMMM d, yyyy' : 
                       language === 'es' ? "EEEE, d 'de' MMMM 'de' yyyy" :
                       "EEEE, d 'de' MMMM 'de' yyyy";
  
  // Generate hourly bars
  const maxValue = Math.max(...data.hourlyData);
  let hourlyBars = '';
  data.hourlyData.forEach((value) => {
    const height = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
    const color = height > 80 ? '#e74c3c' : height > 50 ? '#f39c12' : '#3498db';
    hourlyBars += `<td width="4.16%" style="vertical-align: bottom; padding: 0 1px;">
      <div style="background-color: ${color}; height: ${height}px; width: 100%; border-radius: 2px 2px 0 0;"></div>
    </td>`;
  });
  
  // Generate hour labels
  let hourLabels = '';
  for (let i = 0; i < 24; i++) {
    if (i % 3 === 0) {
      hourLabels += `<td width="12.5%" style="text-align: center;">${i}h</td>`;
    }
  }
  
  // Comparison text
  const getComparison = (value, type) => {
    const avgValue = data.avgHourly * 6; // 6 hours per period
    const diff = ((value - avgValue) / avgValue * 100).toFixed(0);
    
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
    recipient_name: store.contact_name || 'Store Manager',
    store_name: store.name,
    report_date: format(reportDate, dateFormatStr, { locale: dateLocale }),
    total_visitors: new Intl.NumberFormat(locale).format(data.totalVisitors),
    change_percentage: data.changePercent > 0 ? 
      `▲ ${Math.abs(data.changePercent)}% vs ${language === 'en' ? 'yesterday' : language === 'es' ? 'ayer' : 'ontem'}` :
      `▼ ${Math.abs(data.changePercent)}% vs ${language === 'en' ? 'yesterday' : language === 'es' ? 'ayer' : 'ontem'}`,
    change_color: data.changePercent >= 0 ? '#27ae60' : '#e74c3c',
    capture_rate: data.captureRate.replace('.', language === 'en' ? '.' : ','),
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
  // You could store language preference in the store or user profile
  // For now, use store location or default
  if (store.country === 'ES') return 'es';
  if (store.country === 'PT') return 'pt';
  return 'en';
}

// Send email report
async function sendReport(store, html, reportDate) {
  const recipients = TEST_MODE ? 
    'test@blipee.com' : 
    store.report_emails || store.contact_email;
    
  if (!recipients) {
    console.log(`⚠️ No email recipients configured for store ${store.name}`);
    return false;
  }
  
  const subject = `Daily Traffic Report - ${store.name} - ${format(reportDate, 'MMM d, yyyy')}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'analytics@blipee.com',
      to: recipients,
      subject: subject,
      html: html
    });
    
    console.log(`✅ Report sent to ${recipients} for ${store.name}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email for ${store.name}:`, error);
    return false;
  }
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
      
      // Generate HTML report
      const language = getLanguageForStore(store);
      const html = generateReport(store, data, reportDate, language);
      
      // Send email
      const sent = await sendReport(store, html, reportDate);
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