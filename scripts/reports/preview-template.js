#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Sample data for preview
const sampleData = {
  // Email personalization
  recipient_name: 'Ana',
  sender_name: 'Analytics Team',
  sender_title: 'blipee',
  // logo_url removed - using text-based gradient logo instead
  
  report_date: 'Thursday, July 25, 2024',
  store_name: 'OML01 - Omnia Guimarães Shopping',
  
  // Executive Summary
  total_visitors: '1,245',
  change_percentage: '▲ 12.3% vs yesterday',
  change_color: '#27ae60',
  peak_hour: '3:00 PM',
  peak_visitors: '156',
  capture_rate: '68.5',
  passerby_count: '1,818',  // Total visitors / capture rate
  passerby_total: '1,818',  // For the chart legend
  avg_hourly: '78',
  busiest_period: '2-5 PM',
  
  // Traffic Analysis
  morning_traffic: '312',
  morning_comparison: '15% above average',
  afternoon_traffic: '623',
  afternoon_comparison: '8% above average',
  evening_traffic: '310',
  evening_comparison: '5% below average',
  
  // Dashboard link
  dashboard_link: 'https://retail-platform.vercel.app/dashboard'
};

// Generate hourly bars (simplified bar chart)
function generateHourlyBars() {
  const hourlyData = [
    20, 25, 35, 45, 65, 78, 95, 110, 125, 140, 155, 145,
    135, 125, 156, 145, 130, 115, 95, 75, 55, 35, 25, 15
  ];
  
  const maxValue = Math.max(...hourlyData);
  let bars = '';
  
  hourlyData.forEach((value, hour) => {
    const height = Math.round((value / maxValue) * 100);
    const color = height > 80 ? '#e74c3c' : height > 50 ? '#f39c12' : '#3498db';
    
    bars += `<td width="4.16%" style="vertical-align: bottom; padding: 0 1px;">
      <div style="background-color: ${color}; height: ${height}px; width: 100%; border-radius: 2px 2px 0 0;"></div>
    </td>`;
  });
  
  return bars;
}

// Generate hour labels
function generateHourLabels() {
  let labels = '';
  for (let i = 0; i < 24; i++) {
    if (i % 3 === 0) {
      labels += `<td width="12.5%" style="text-align: center;">${i}h</td>`;
    }
  }
  return labels;
}

// Generate capture rate line overlay - REMOVED per user request
function generateCaptureRateLine() {
  // Removed - keeping bars only for focus on people counting
  return '';
}

// Add dynamic content
sampleData.hourly_bars = generateHourlyBars();
sampleData.hour_labels = generateHourLabels();
sampleData.capture_rate_line = generateCaptureRateLine();

// Read template
const templatePath = path.join(__dirname, 'daily-report-template.html');
let html = fs.readFileSync(templatePath, 'utf8');

// Replace placeholders
Object.keys(sampleData).forEach(key => {
  html = html.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key]);
});

// Save preview
const previewPath = path.join(__dirname, 'daily-report-preview.html');
fs.writeFileSync(previewPath, html);

console.log('✅ Template preview generated!');
console.log(`📄 Open in browser: file://${previewPath}`);
console.log('\n📧 Email Template Features:');
console.log('- Clean, professional design');
console.log('- Mobile-responsive layout');
console.log('- Key metrics highlighted');
console.log('- Simple bar chart for hourly traffic');
console.log('- Easy-to-read insights section');
console.log('- Works in all email clients');