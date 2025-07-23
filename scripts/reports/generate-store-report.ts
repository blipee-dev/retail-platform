#!/usr/bin/env node

/**
 * Generate Daily Store Report with Real Data
 * This script fetches yesterday's data and generates an HTML report
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { InsightGenerator } from './insight-generator';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ReportData {
  // Store info
  storeId: string;
  storeName: string;
  storeCode: string;
  timezone: string;
  
  // Yesterday's metrics
  date: Date;
  totalVisitors: number;
  entries: number;
  exits: number;
  captureRate: number;
  passingTraffic: number;
  peakHour: number;
  peakHourVisitors: number;
  hourlyData: Array<{
    hour: number;
    visitors: number;
  }>;
  
  // Comparisons
  vsLastMonth: number;
  captureRateChange: number;
  vsLastWeek: number;
  aboveAverage: number;
  
  // Monthly data
  mtdVisitors: number;
  mtdCaptureRate: number;
  projectedMonthly: number;
  mtdVsLastMonth: number;
  
  // Insight
  insightTitle: string;
  insightContent: string;
}

/**
 * Fetch store data for report generation
 */
async function fetchStoreData(storeId: string): Promise<ReportData | null> {
  try {
    // Get store info
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, name, code, timezone')
      .eq('id', storeId)
      .single();
    
    if (storeError || !store) {
      console.error('Error fetching store:', storeError);
      return null;
    }
    
    // Calculate yesterday in store timezone
    const now = new Date();
    const storeTime = utcToZonedTime(now, store.timezone);
    const yesterday = subDays(storeTime, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    
    // Fetch yesterday's daily analytics
    const { data: dailyData } = await supabase
      .from('daily_analytics')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', yesterdayStart.toISOString())
      .lte('date', yesterdayEnd.toISOString())
      .single();
    
    if (!dailyData) {
      console.error('No daily data found for yesterday');
      return null;
    }
    
    // Fetch hourly data for yesterday
    const { data: hourlyData } = await supabase
      .from('hourly_analytics')
      .select('hour, total_in, total_out, capture_rate')
      .eq('store_id', storeId)
      .gte('timestamp', yesterdayStart.toISOString())
      .lte('timestamp', yesterdayEnd.toISOString())
      .order('hour');
    
    // Process hourly data
    let peakHour = 0;
    let peakHourVisitors = 0;
    const hourlyVisitors = new Array(24).fill(0);
    
    hourlyData?.forEach(hour => {
      const visitors = hour.total_in + hour.total_out;
      hourlyVisitors[hour.hour] = visitors;
      if (visitors > peakHourVisitors) {
        peakHourVisitors = visitors;
        peakHour = hour.hour;
      }
    });
    
    // Fetch comparison data (last month same day)
    const lastMonthDate = subDays(yesterday, 30);
    const { data: lastMonthData } = await supabase
      .from('daily_analytics')
      .select('total_traffic, capture_rate')
      .eq('store_id', storeId)
      .gte('date', startOfDay(lastMonthDate).toISOString())
      .lte('date', endOfDay(lastMonthDate).toISOString())
      .single();
    
    // Fetch last week same day
    const lastWeekDate = subDays(yesterday, 7);
    const { data: lastWeekData } = await supabase
      .from('daily_analytics')
      .select('total_traffic')
      .eq('store_id', storeId)
      .gte('date', startOfDay(lastWeekDate).toISOString())
      .lte('date', endOfDay(lastWeekDate).toISOString())
      .single();
    
    // Calculate MTD (Month to Date) metrics
    const monthStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), 1);
    const { data: mtdData } = await supabase
      .from('daily_analytics')
      .select('total_traffic, capture_rate')
      .eq('store_id', storeId)
      .gte('date', monthStart.toISOString())
      .lte('date', yesterdayEnd.toISOString());
    
    const mtdVisitors = mtdData?.reduce((sum, day) => sum + day.total_traffic, 0) || 0;
    const mtdDays = mtdData?.length || 1;
    const avgDailyVisitors = mtdVisitors / mtdDays;
    const projectedMonthly = Math.round(avgDailyVisitors * 30);
    const mtdAvgCaptureRate = mtdData?.reduce((sum, day) => sum + day.capture_rate, 0) / mtdDays || 0;
    
    // Calculate comparisons
    const vsLastMonth = lastMonthData 
      ? ((dailyData.total_traffic - lastMonthData.total_traffic) / lastMonthData.total_traffic) * 100
      : 0;
    
    const vsLastWeek = lastWeekData
      ? ((dailyData.total_traffic - lastWeekData.total_traffic) / lastWeekData.total_traffic) * 100
      : 0;
    
    const captureRateChange = lastMonthData
      ? dailyData.capture_rate - lastMonthData.capture_rate
      : 0;
    
    // Generate dynamic insight
    const insight = generateInsight({
      date: yesterday,
      totalVisitors: dailyData.total_traffic,
      captureRate: dailyData.capture_rate,
      passingTraffic: dailyData.passing_traffic || 0,
      peakHour,
      peakHourVisitors,
      hourlyVisitors,
      morningVisitors: hourlyVisitors.slice(9, 12).reduce((a, b) => a + b, 0),
      afternoonVisitors: hourlyVisitors.slice(12, 18).reduce((a, b) => a + b, 0),
      eveningVisitors: hourlyVisitors.slice(18, 21).reduce((a, b) => a + b, 0)
    }, {
      vsLastMonth,
      vsLastWeek,
      captureRateChange,
      monthlyAverage: avgDailyVisitors
    });
    
    return {
      // Store info
      storeId: store.id,
      storeName: store.name,
      storeCode: store.code || '',
      timezone: store.timezone,
      
      // Yesterday's metrics
      date: yesterday,
      totalVisitors: dailyData.total_traffic,
      entries: dailyData.total_in || 0,
      exits: dailyData.total_out || 0,
      captureRate: dailyData.capture_rate,
      passingTraffic: dailyData.passing_traffic || 0,
      peakHour,
      peakHourVisitors,
      hourlyData: hourlyVisitors.map((visitors, hour) => ({ hour, visitors })),
      
      // Comparisons
      vsLastMonth,
      captureRateChange,
      vsLastWeek,
      aboveAverage: dailyData.total_traffic - avgDailyVisitors,
      
      // Monthly data
      mtdVisitors,
      mtdCaptureRate: mtdAvgCaptureRate,
      projectedMonthly,
      mtdVsLastMonth: 10.8, // TODO: Calculate from last month MTD
      
      // Insight
      insightTitle: insight.title,
      insightContent: insight.content
    };
  } catch (error) {
    console.error('Error fetching store data:', error);
    return null;
  }
}

/**
 * Generate insight using the InsightGenerator
 */
function generateInsight(dailyData: any, comparison: any) {
  // For now, return a simple insight
  // In production, use the full InsightGenerator
  const morningCaptureRate = (dailyData.morningVisitors / (dailyData.passingTraffic * 0.3)) * 100;
  const afternoonCaptureRate = (dailyData.afternoonVisitors / (dailyData.passingTraffic * 0.5)) * 100;
  
  if (morningCaptureRate < afternoonCaptureRate * 0.6) {
    return {
      title: 'Morning opportunity',
      content: `Capture rate drops to ${morningCaptureRate.toFixed(1)}% before noon. Focus on morning window displays and entrance visibility to capture more of the ${Math.round(dailyData.passingTraffic * 0.3)} morning passers-by.`
    };
  }
  
  if (comparison.vsLastMonth > 15) {
    return {
      title: 'Outstanding performance',
      content: `Yesterday's traffic exceeded last month by ${comparison.vsLastMonth.toFixed(0)}%. Analyze what drove this ${Math.round(dailyData.totalVisitors * (comparison.vsLastMonth / 100))} visitor increase to replicate success.`
    };
  }
  
  return {
    title: 'Consistent performance',
    content: `Maintained steady traffic with ${dailyData.totalVisitors.toLocaleString()} visitors. Focus on improving ${dailyData.captureRate.toFixed(1)}% capture rate to grow without relying on increased foot traffic.`
  };
}

/**
 * Generate HTML report from template and data
 */
function generateHTMLReport(data: ReportData, language: string = 'en'): string {
  // Read the template
  const templatePath = path.join(__dirname, 'jj-store-daily-report-i18n.html');
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Format date based on language
  const dateFormats: { [key: string]: string } = {
    en: 'MMMM d, yyyy',
    es: "d 'de' MMMM 'de' yyyy",
    pt: "d 'de' MMMM 'de' yyyy"
  };
  
  const formattedDate = format(data.date, dateFormats[language] || dateFormats.en);
  
  // Replace store information
  template = template.replace(/JJ Store - João de Barros/g, `${data.storeName}`);
  template = template.replace(/January 22, 2025/g, formattedDate);
  
  // Replace metrics
  template = template.replace(/>2,847</g, `>${data.totalVisitors.toLocaleString()}<`);
  template = template.replace(/>24\.6%</g, `>${data.captureRate.toFixed(1)}%<`);
  template = template.replace(/>5,845</g, `>${data.passingTraffic.toLocaleString()}<`);
  template = template.replace(/>3:00 PM</g, `>${formatHour(data.peakHour)}<`);
  template = template.replace(/>387</g, `>${data.peakHourVisitors}<`);
  template = template.replace(/>\\+327</g, `>${data.aboveAverage > 0 ? '+' : ''}${Math.round(data.aboveAverage)}<`);
  
  // Replace comparison values
  template = template.replace(/↑ 12\.3%/g, `${data.vsLastMonth > 0 ? '↑' : '↓'} ${Math.abs(data.vsLastMonth).toFixed(1)}%`);
  template = template.replace(/↑ 2\.8pp/g, `${data.captureRateChange > 0 ? '↑' : '↓'} ${Math.abs(data.captureRateChange).toFixed(1)}pp`);
  
  // Replace monthly data
  template = template.replace(/>55,429</g, `>${data.mtdVisitors.toLocaleString()}<`);
  template = template.replace(/>22\.4%</g, `>${data.mtdCaptureRate.toFixed(1)}%<`);
  template = template.replace(/>78,154</g, `>${data.projectedMonthly.toLocaleString()}<`);
  template = template.replace(/↑ 10\.8%/g, `${data.mtdVsLastMonth > 0 ? '↑' : '↓'} ${Math.abs(data.mtdVsLastMonth).toFixed(1)}%`);
  
  // Replace insight
  template = template.replace(/Morning opportunity:/g, `${data.insightTitle}:`);
  template = template.replace(/Capture rate drops to 12\.8% before noon\. Focus on morning window displays and entrance visibility to capture more of the 1,242 morning passers-by\./g, 
    data.insightContent);
  
  // Generate hourly chart bars
  const maxVisitors = Math.max(...data.hourlyData.map(h => h.visitors));
  let chartBarsHTML = '';
  
  // Only show hours 9 AM to 9 PM (12 hours)
  for (let hour = 9; hour <= 20; hour++) {
    const hourData = data.hourlyData.find(h => h.hour === hour) || { visitors: 0 };
    const height = maxVisitors > 0 ? (hourData.visitors / maxVisitors) * 100 : 0;
    const isPeak = hour === data.peakHour;
    
    chartBarsHTML += `
      <div class="hour-bar${isPeak ? ' peak' : ''}" style="height: ${height}%" data-visitors="${hourData.visitors}" data-time="${formatHour(hour)}">
        <div class="tooltip"><span data-i18n-visitors="${hourData.visitors}">${hourData.visitors} visitors</span><br>${formatHour(hour)}${isPeak ? ' <span data-i18n="peak">(Peak)</span>' : ''}</div>
      </div>
    `;
  }
  
  // Replace the existing hour bars
  const hourBarsRegex = /<div class="hour-bars">[\s\S]*?<\/div>\s*<div class="hour-labels">/;
  template = template.replace(hourBarsRegex, `<div class="hour-bars">${chartBarsHTML}</div>\n                    <div class="hour-labels">`);
  
  return template;
}

/**
 * Format hour for display
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  return hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
}

/**
 * Main function
 */
async function main() {
  const storeId = process.env.STORE_ID || process.argv[2];
  const language = process.env.REPORT_LANGUAGE || 'en';
  
  if (!storeId) {
    console.error('Please provide STORE_ID as environment variable or argument');
    process.exit(1);
  }
  
  console.log(`Generating report for store ${storeId}...`);
  
  // Fetch data
  const data = await fetchStoreData(storeId);
  if (!data) {
    console.error('Failed to fetch store data');
    process.exit(1);
  }
  
  // Generate report
  const report = generateHTMLReport(data, language);
  
  // Save report
  const outputDir = path.join(__dirname, 'generated');
  fs.mkdirSync(outputDir, { recursive: true });
  
  const fileName = `daily-report-${data.storeCode || data.storeId}-${format(data.date, 'yyyy-MM-dd')}.html`;
  const outputPath = path.join(outputDir, fileName);
  
  fs.writeFileSync(outputPath, report);
  console.log(`Report generated: ${outputPath}`);
  
  // Output path for GitHub Actions
  console.log(`::set-output name=report_path::${outputPath}`);
  console.log(`::set-output name=report_date::${format(data.date, 'yyyy-MM-dd')}`);
  console.log(`::set-output name=store_name::${data.storeName}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { fetchStoreData, generateHTMLReport };