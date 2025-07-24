#!/usr/bin/env node

// This script tests each sensor and updates its status based on actual connectivity

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const { createClient } = require('@supabase/supabase-js');
const http = require('http');

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('Missing BLIPEE_SUPABASE_SERVICE_ROLE_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSensor(sensor) {
  return new Promise((resolve) => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    const path = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(threeHoursAgo)}&time_end=${formatDate(now)}`;
    
    const options = {
      hostname: sensor.sensor_ip,
      port: sensor.sensor_port || 80,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from('admin:grnl.2024').toString('base64')
      },
      timeout: 10000
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 && data.includes('StartTime')) {
          resolve({ success: true, message: 'Sensor responding correctly' });
        } else {
          resolve({ success: false, message: `HTTP ${res.statusCode}` });
        }
      });
    });
    
    req.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, message: 'Connection timeout' });
    });
    
    req.end();
  });
}

async function main() {
  console.log('🔍 Testing and updating sensor statuses...\n');
  
  // Get all sensors
  const { data: sensors, error } = await supabase
    .from('sensor_metadata')
    .select('*')
    .order('sensor_name');
  
  if (error) {
    console.error('Error fetching sensors:', error.message);
    return;
  }
  
  console.log(`Found ${sensors.length} sensors to test\n`);
  
  for (const sensor of sensors) {
    console.log(`Testing ${sensor.sensor_name} (${sensor.sensor_ip}:${sensor.sensor_port})...`);
    
    const result = await testSensor(sensor);
    
    let newStatus;
    if (result.success) {
      console.log(`  ✅ Online - ${result.message}`);
      newStatus = 'online';
      
      // Update sensor to online
      await supabase
        .from('sensor_metadata')
        .update({
          status: 'online',
          consecutive_failures: 0,
          offline_since: null,
          last_data_received: new Date().toISOString()
        })
        .eq('sensor_id', sensor.sensor_id);
        
    } else {
      console.log(`  ❌ Offline - ${result.message}`);
      newStatus = 'offline';
      
      // Keep it offline but note the test result
      await supabase
        .from('sensor_metadata')
        .update({
          status: 'offline',
          consecutive_failures: sensor.consecutive_failures || 3,
          config: {
            ...sensor.config,
            last_test_result: result.message,
            last_tested_at: new Date().toISOString()
          }
        })
        .eq('sensor_id', sensor.sensor_id);
    }
    
    console.log(`  Updated status: ${sensor.status} → ${newStatus}\n`);
  }
  
  // Show summary
  const { data: updated, error: summaryError } = await supabase
    .from('sensor_metadata')
    .select('status')
    .order('status');
  
  if (!summaryError && updated) {
    const statusCounts = updated.reduce((acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('📊 Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} sensors`);
    });
  }
}

main().catch(console.error);