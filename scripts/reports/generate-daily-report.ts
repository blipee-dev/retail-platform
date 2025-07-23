/**
 * Daily Report Generator
 * Generates dynamic HTML reports with contextual insights
 */

import { InsightGenerator } from './insight-generator';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface StoreReportData {
  storeId: string;
  storeName: string;
  date: Date;
  totalVisitors: number;
  captureRate: number;
  passingTraffic: number;
  peakHour: number;
  peakHourVisitors: number;
  hourlyVisitors: number[];
  comparison: {
    vsLastMonth: number;
    captureRateChange: number;
    vsLastWeek: number;
  };
}

/**
 * Fetch yesterday's data for a specific store
 */
async function fetchYesterdayData(storeId: string): Promise<StoreReportData | null> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const endOfYesterday = new Date(yesterday);
  endOfYesterday.setHours(23, 59, 59, 999);

  try {
    // Fetch store info
    const { data: store } = await supabase
      .from('stores')
      .select('name, timezone')
      .eq('id', storeId)
      .single();

    // Fetch yesterday's analytics
    const { data: dailyData } = await supabase
      .from('daily_analytics')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', yesterday.toISOString())
      .lte('date', endOfYesterday.toISOString())
      .single();

    // Fetch hourly data
    const { data: hourlyData } = await supabase
      .from('hourly_analytics')
      .select('hour, total_in, total_out')
      .eq('store_id', storeId)
      .gte('timestamp', yesterday.toISOString())
      .lte('timestamp', endOfYesterday.toISOString())
      .order('hour');

    // Fetch comparison data (last month same day)
    const lastMonth = new Date(yesterday);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const { data: lastMonthData } = await supabase
      .from('daily_analytics')
      .select('total_traffic, capture_rate')
      .eq('store_id', storeId)
      .gte('date', lastMonth.toISOString())
      .lte('date', new Date(lastMonth.getTime() + 86400000).toISOString())
      .single();

    // Process hourly data
    const hourlyVisitors = new Array(24).fill(0);
    let peakHour = 0;
    let peakHourVisitors = 0;
    
    hourlyData?.forEach(hour => {
      const visitors = hour.total_in;
      hourlyVisitors[hour.hour] = visitors;
      if (visitors > peakHourVisitors) {
        peakHourVisitors = visitors;
        peakHour = hour.hour;
      }
    });

    return {
      storeId,
      storeName: store?.name || 'Store',
      date: yesterday,
      totalVisitors: dailyData?.total_traffic || 0,
      captureRate: dailyData?.capture_rate || 0,
      passingTraffic: dailyData?.passing_traffic || 0,
      peakHour,
      peakHourVisitors,
      hourlyVisitors,
      comparison: {
        vsLastMonth: ((dailyData?.total_traffic || 0) / (lastMonthData?.total_traffic || 1) - 1) * 100,
        captureRateChange: (dailyData?.capture_rate || 0) - (lastMonthData?.capture_rate || 0),
        vsLastWeek: 0 // Would need to fetch this separately
      }
    };
  } catch (error) {
    console.error('Error fetching store data:', error);
    return null;
  }
}

/**
 * Generate insight for the report
 */
function generateDynamicInsight(data: StoreReportData) {
  // Convert to format expected by InsightGenerator
  const dailyData = {
    date: data.date,
    totalVisitors: data.totalVisitors,
    captureRate: data.captureRate,
    passingTraffic: data.passingTraffic,
    peakHour: data.peakHour,
    peakHourVisitors: data.peakHourVisitors,
    hourlyVisitors: data.hourlyVisitors,
    morningVisitors: data.hourlyVisitors.slice(9, 12).reduce((a, b) => a + b, 0),
    afternoonVisitors: data.hourlyVisitors.slice(12, 18).reduce((a, b) => a + b, 0),
    eveningVisitors: data.hourlyVisitors.slice(18, 21).reduce((a, b) => a + b, 0)
  };

  // Mock comparison data (in production, fetch from database)
  const comparisonData = {
    lastMonthSameDay: {
      ...dailyData,
      totalVisitors: Math.round(data.totalVisitors / (1 + data.comparison.vsLastMonth / 100)),
      captureRate: data.captureRate - data.comparison.captureRateChange
    },
    yesterdayLastWeek: {
      ...dailyData,
      totalVisitors: Math.round(data.totalVisitors * 0.95)
    },
    monthlyAverage: {
      visitors: Math.round(data.totalVisitors * 0.92),
      captureRate: 22.5,
      peakHour: 15
    }
  };

  const insight = InsightGenerator.generatePrimaryInsight(dailyData, comparisonData);
  return insight;
}

/**
 * Generate HTML report with dynamic data
 */
function generateHTMLReport(data: StoreReportData, templatePath: string): string {
  // Read template
  let template = fs.readFileSync(templatePath, 'utf-8');
  
  // Generate dynamic insight
  const insight = generateDynamicInsight(data);
  
  // Format date
  const reportDate = data.date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Replace placeholders with actual data
  const replacements = {
    '{{STORE_NAME}}': data.storeName,
    '{{REPORT_DATE}}': reportDate,
    '{{TOTAL_VISITORS}}': data.totalVisitors.toLocaleString(),
    '{{CAPTURE_RATE}}': data.captureRate.toFixed(1),
    '{{PASSING_TRAFFIC}}': data.passingTraffic.toLocaleString(),
    '{{PEAK_HOUR}}': formatHour(data.peakHour),
    '{{PEAK_VISITORS}}': data.peakHourVisitors.toString(),
    '{{VS_LAST_MONTH}}': data.comparison.vsLastMonth > 0 ? '+' + data.comparison.vsLastMonth.toFixed(1) : data.comparison.vsLastMonth.toFixed(1),
    '{{CAPTURE_CHANGE}}': data.comparison.captureRateChange > 0 ? '+' + data.comparison.captureRateChange.toFixed(1) : data.comparison.captureRateChange.toFixed(1),
    '{{INSIGHT_TITLE}}': insight.title,
    '{{INSIGHT_CONTENT}}': insight.description,
    '{{ABOVE_AVERAGE}}': '+' + Math.round(data.totalVisitors - (data.totalVisitors * 0.92))
  };
  
  // Replace all placeholders
  Object.entries(replacements).forEach(([placeholder, value]) => {
    template = template.replace(new RegExp(placeholder, 'g'), value);
  });
  
  // Generate hourly chart bars
  const maxVisitors = Math.max(...data.hourlyVisitors);
  const chartBars = data.hourlyVisitors.map((visitors, hour) => {
    const height = maxVisitors > 0 ? (visitors / maxVisitors) * 100 : 0;
    const isPeak = hour === data.peakHour;
    return `
      <div class="hour-bar${isPeak ? ' peak' : ''}" style="height: ${height}%" data-visitors="${visitors}" data-time="${formatHour(hour)}">
        <div class="tooltip">${visitors} visitors<br>${formatHour(hour)}${isPeak ? ' (Peak)' : ''}</div>
      </div>
    `;
  }).join('');
  
  template = template.replace('{{HOURLY_CHART_BARS}}', chartBars);
  
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
 * Main function to generate and save report
 */
export async function generateDailyReport(storeId: string, outputPath?: string) {
  console.log(`Generating daily report for store ${storeId}...`);
  
  // Fetch data
  const data = await fetchYesterdayData(storeId);
  if (!data) {
    console.error('Failed to fetch store data');
    return null;
  }
  
  // Generate report
  const templatePath = path.join(__dirname, 'daily-report-template.html');
  const report = generateHTMLReport(data, templatePath);
  
  // Save report
  const fileName = `daily-report-${data.storeName.replace(/\s+/g, '-').toLowerCase()}-${data.date.toISOString().split('T')[0]}.html`;
  const filePath = outputPath || path.join(__dirname, 'generated', fileName);
  
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, report);
  
  console.log(`Report generated: ${filePath}`);
  
  return {
    filePath,
    data,
    insight: generateDynamicInsight(data)
  };
}

/**
 * Generate reports for all stores in an organization
 */
export async function generateOrganizationReports(organizationId: string) {
  const { data: stores } = await supabase
    .from('stores')
    .select('id, name')
    .eq('organization_id', organizationId)
    .eq('is_active', true);
    
  if (!stores) return;
  
  const reports = await Promise.all(
    stores.map(store => generateDailyReport(store.id))
  );
  
  return reports.filter(r => r !== null);
}

// Example usage
if (require.main === module) {
  // Generate report for a specific store
  generateDailyReport('store-id-here').then(result => {
    if (result) {
      console.log('Report generated successfully');
      console.log('Primary insight:', result.insight.title);
    }
  });
}