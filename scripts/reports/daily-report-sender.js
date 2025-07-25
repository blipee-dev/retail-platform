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
  const reportDateStr = format(reportDate, 'yyyy-MM-dd');
  
  console.log(`📊 Fetching data for ${store.name} (ID: ${store.id})`);
  console.log(`   Date: ${reportDateStr}`);
  
  // Get daily analytics data
  const { data: dailyData, error: dailyError } = await supabase
    .from('daily_analytics')
    .select('*')
    .eq('store_id', store.id)
    .eq('date', reportDateStr)
    .single();
    
  if (dailyError) {
    console.error('Error fetching daily analytics:', dailyError);
  }
  
  // Get hourly analytics data
  const { data: hourlyData, error: hourlyError } = await supabase
    .from('hourly_analytics')
    .select('*')
    .eq('store_id', store.id)
    .eq('date', reportDateStr)
    .order('hour');
    
  if (hourlyError) {
    console.error('Error fetching hourly analytics:', hourlyError);
    return null;
  }
  
  console.log(`   Found daily data: ${dailyData ? 'Yes' : 'No'}`);
  console.log(`   Found ${hourlyData.length} hourly records`);
  
  // Handle case where no data is found
  if (!dailyData && hourlyData.length === 0) {
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
  
  // Get previous day data for comparison
  const prevDateStr = format(subDays(reportDate, 1), 'yyyy-MM-dd');
  const { data: prevDailyData } = await supabase
    .from('daily_analytics')
    .select('*')
    .eq('store_id', store.id)
    .eq('date', prevDateStr)
    .single();
    
  // Extract metrics from daily analytics
  const totalVisitors = dailyData?.store_entries || 0;
  const totalPassersby = dailyData?.passerby_count || 0;
  const captureRate = dailyData?.capture_rate || '0';
  
  const prevVisitors = prevDailyData?.store_entries || 0;
  const changePercent = prevVisitors > 0 ? (((totalVisitors - prevVisitors) / prevVisitors) * 100).toFixed(1) : 0;
  
  // Build hourly data array
  const hourlyDataArray = Array(24).fill(0);
  hourlyData.forEach(hour => {
    if (hour.hour >= 0 && hour.hour < 24) {
      hourlyDataArray[hour.hour] = hour.store_entries || 0;
    }
  });
  
  // Find peak hour
  const peakHour = dailyData?.peak_hour || 0;
  const peakVisitors = hourlyDataArray[peakHour];
  
  // Calculate period averages
  const morningTraffic = hourlyDataArray.slice(6, 12).reduce((a, b) => a + b, 0);
  const afternoonTraffic = hourlyDataArray.slice(12, 18).reduce((a, b) => a + b, 0);
  const eveningTraffic = hourlyDataArray.slice(18, 22).reduce((a, b) => a + b, 0);
  
  const businessHours = hourlyData.filter(h => h.hour >= 9 && h.hour <= 21).length;
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
  // Default recipient for all reports
  const DEFAULT_RECIPIENT = 'pedro@blipee.com';
  
  // Check for email recipients in various fields
  const recipients = TEST_MODE ? 
    process.env.EMAIL_TO || 'test@blipee.com' : 
    store.report_emails || store.contact_email || store.email || DEFAULT_RECIPIENT;
    
  if (!recipients) {
    console.log(`⚠️ No email recipients configured for store ${store.name}`);
    console.log(`📧 Using default recipient: ${DEFAULT_RECIPIENT}`);
    return await sendReport({ ...store, report_emails: DEFAULT_RECIPIENT }, html, reportDate);
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