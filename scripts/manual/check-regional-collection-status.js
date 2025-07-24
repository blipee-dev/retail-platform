#!/usr/bin/env node

// Set environment variables
process.env.SUPABASE_URL = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkStatus() {
  console.log('=== Regional Data Collection Status ===\n');
  
  // Check date range
  const { data: dateRange } = await supabase
    .from('regional_counting_raw')
    .select('timestamp')
    .order('timestamp', { ascending: true })
    .limit(1);
    
  const { data: latestDate } = await supabase
    .from('regional_counting_raw')
    .select('timestamp')
    .order('timestamp', { ascending: false })
    .limit(1);
    
  if (dateRange && latestDate) {
    console.log(`Date range: ${dateRange[0].timestamp} to ${latestDate[0].timestamp}`);
  }
  
  // Count by date
  const { data: dailyCounts, error } = await supabase
    .from('regional_counting_raw')
    .select(`
      timestamp,
      store_id
    `)
    .gte('timestamp', '2025-07-12');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  // Group by date
  const countsByDate = {};
  const storesByDate = {};
  
  dailyCounts.forEach(row => {
    const date = row.timestamp.split('T')[0];
    countsByDate[date] = (countsByDate[date] || 0) + 1;
    
    if (!storesByDate[date]) {
      storesByDate[date] = new Set();
    }
    storesByDate[date].add(row.store_id);
  });
  
  console.log('\nRecords by date:');
  console.log('Date       | Records | Stores');
  console.log('-----------|---------|-------');
  
  Object.keys(countsByDate).sort().forEach(date => {
    console.log(`${date} | ${countsByDate[date].toString().padStart(7)} | ${storesByDate[date].size}`);
  });
  
  // Total summary
  const totalRecords = Object.values(countsByDate).reduce((a, b) => a + b, 0);
  console.log(`\nTotal records since July 12: ${totalRecords}`);
  
  // Check missing dates
  const startDate = new Date('2025-07-12');
  const endDate = new Date();
  const missingDates = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    if (!countsByDate[dateStr]) {
      missingDates.push(dateStr);
    }
  }
  
  if (missingDates.length > 0) {
    console.log('\nMissing dates:');
    missingDates.forEach(date => console.log(`  - ${date}`));
  }
}

checkStatus().catch(console.error);