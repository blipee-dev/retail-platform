#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to format numbers for different locales
function formatNumber(num, locale) {
  return new Intl.NumberFormat(locale).format(num);
}

// Function to get comparison text in the right language
function getComparison(value, lang) {
  const translations = {
    en: {
      above: `${value}% above average`,
      below: `${value}% below average`,
      average: 'at average'
    },
    es: {
      above: `${value}% por encima del promedio`,
      below: `${value}% por debajo del promedio`,
      average: 'en el promedio'
    },
    pt: {
      above: `${value}% acima da média`,
      below: `${value}% abaixo da média`,
      average: 'na média'
    }
  };
  
  if (value > 0) return translations[lang].above;
  if (value < 0) return translations[lang].below.replace('-', '');
  return translations[lang].average;
}

// Sample data with language variations
function getSampleData(lang) {
  const locale = lang === 'pt' ? 'pt-PT' : lang === 'es' ? 'es-ES' : 'en-US';
  
  const dateFormats = {
    en: 'Thursday, July 25, 2024',
    es: 'Jueves, 25 de julio de 2024',
    pt: 'Quinta-feira, 25 de julho de 2024'
  };
  
  const changeTexts = {
    en: '▲ 12.3% vs yesterday',
    es: '▲ 12,3% vs ayer',
    pt: '▲ 12,3% vs ontem'
  };
  
  return {
    // Email personalization
    recipient_name: 'Ana',
    sender_name: 'Analytics Team',
    sender_title: 'blipee',
    
    report_date: dateFormats[lang],
    store_name: 'OML01 - Omnia Guimarães Shopping',
    
    // Executive Summary
    total_visitors: formatNumber(1245, locale),
    change_percentage: changeTexts[lang],
    change_color: '#27ae60',
    peak_hour: '15:00',
    peak_visitors: '156',
    capture_rate: lang === 'en' ? '68.5' : '68,5',
    passerby_count: formatNumber(1818, locale),
    passerby_total: formatNumber(1818, locale),
    avg_hourly: '78',
    busiest_period: '14-17h',
    
    // Traffic Analysis
    morning_traffic: '312',
    morning_comparison: getComparison(15, lang),
    afternoon_traffic: '623',
    afternoon_comparison: getComparison(8, lang),
    evening_traffic: '310',
    evening_comparison: getComparison(-5, lang),
    
    // Dashboard link (removed in template)
    dashboard_link: '#'
  };
}

// Generate hourly bars (same for all languages)
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

// Generate previews for each language
const languages = ['en', 'es', 'pt'];

languages.forEach(lang => {
  // Get sample data for language
  const sampleData = getSampleData(lang);
  
  // Add dynamic content
  sampleData.hourly_bars = generateHourlyBars();
  sampleData.hour_labels = generateHourLabels();
  
  // Read localized template
  const templatePath = path.join(__dirname, `daily-report-template-${lang}.html`);
  let html = fs.readFileSync(templatePath, 'utf8');
  
  // Replace placeholders
  Object.keys(sampleData).forEach(key => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), sampleData[key]);
  });
  
  // Save preview
  const previewPath = path.join(__dirname, `daily-report-preview-${lang}.html`);
  fs.writeFileSync(previewPath, html);
  
  console.log(`✅ ${lang.toUpperCase()} preview generated: ${previewPath}`);
});

console.log('\n🌍 View previews:');
console.log('  - English: http://localhost:8080/daily-report-preview-en.html');
console.log('  - Spanish: http://localhost:8080/daily-report-preview-es.html');
console.log('  - Portuguese: http://localhost:8080/daily-report-preview-pt.html');