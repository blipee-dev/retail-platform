#!/usr/bin/env node

const http = require('http');
const fetch = require('node-fetch');

async function uploadLast24Hours() {
  console.log('📥 Uploading Last 24 Hours of Regional Data');
  console.log('=' .repeat(60));
  
  const supabaseUrl = process.env.SUPABASE_URL || 'https://amqxsmdcvhyaudzbmhaf.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M';
  
  // Omnia sensors
  const sensors = [
    {
      id: 'f63ef2e9-344e-4373-aedf-04dd05cf8f8b',
      name: 'OML01-PC',
      ip: '93.108.96.96',
      port: 21001,
      auth: 'admin:grnl.2024'
    },
    {
      id: '7976051c-980b-45e1-b099-45d032f3c7aa',
      name: 'OML02-PC',
      ip: '188.37.175.41',
      port: 2201,
      auth: 'admin:grnl.2024'
    },
    {
      id: '29e75799-328f-4143-9a2f-2bcc1269f77e',
      name: 'OML03-PC',
      ip: '188.37.124.33',
      port: 21002,
      auth: 'admin:grnl.2024'
    }
  ];
  
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  console.log(`\n📅 Time Range: ${formatDate(twentyFourHoursAgo)} to ${formatDate(now)}`);
  
  let totalRecordsInserted = 0;
  let totalRecordsUpdated = 0;
  
  for (const sensor of sensors) {
    console.log(`\n📡 Processing ${sensor.name}...`);
    
    try {
      // Get sensor metadata
      const sensorResponse = await fetch(`${supabaseUrl}/rest/v1/sensor_metadata?id=eq.${sensor.id}`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      const sensorData = await sensorResponse.json();
      if (!sensorResponse.ok || !sensorData.length) {
        console.log(`  ⚠️  Sensor not found in database`);
        continue;
      }
      
      const sensorInfo = sensorData[0];
      console.log(`  ✅ Store: ${sensorInfo.store_name || sensorInfo.store_id}`);
      
      // Fetch regional data
      console.log('  📊 Fetching regional data...');
      const data = await new Promise((resolve, reject) => {
        const path = `/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&region1=1&region2=1&region3=1&region4=1&time_start=${formatDate(twentyFourHoursAgo)}&time_end=${formatDate(now)}`;
        
        const options = {
          hostname: sensor.ip,
          port: sensor.port,
          path: path,
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + Buffer.from(sensor.auth).toString('base64')
          },
          timeout: 30000
        };
        
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve(data);
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        
        req.end();
      });
      
      // Parse CSV data
      const lines = data.trim().split('\n');
      console.log(`  ✅ Retrieved ${lines.length - 1} records`);
      
      if (lines.length < 2) {
        console.log('  ⚠️  No data available');
        continue;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Find region columns
      const regionColumns = {};
      headers.forEach((header, index) => {
        const match = header.match(/^region(\d+)$/i);
        if (match) {
          const regionNum = parseInt(match[1]);
          if (regionNum >= 1 && regionNum <= 4) {
            regionColumns[`region${regionNum}`] = index;
          }
        }
      });
      
      // Process data in batches
      const batchSize = 100;
      let sensorInserted = 0;
      let sensorUpdated = 0;
      let recordsToProcess = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < headers.length) continue;
        
        const regionCounts = {};
        let hasData = false;
        
        for (const [regionKey, columnIndex] of Object.entries(regionColumns)) {
          const regionNum = parseInt(regionKey.replace('region', ''));
          const count = parseInt(values[columnIndex]) || 0;
          regionCounts[`region${regionNum}_count`] = count;
          if (count > 0) hasData = true;
        }
        
        if (hasData) {
          recordsToProcess.push({
            sensor_id: sensor.id,
            organization_id: sensorInfo.organization_id,
            store_id: sensorInfo.store_id,
            timestamp: new Date(values[0].replace(/\//g, '-')).toISOString(),
            end_time: new Date(values[1].replace(/\//g, '-')).toISOString(),
            ...regionCounts
          });
        }
        
        // Process batch when full or at end
        if (recordsToProcess.length >= batchSize || i === lines.length - 1) {
          if (recordsToProcess.length > 0) {
            // Check for existing records
            const timestamps = recordsToProcess.map(r => r.timestamp);
            const checkResponse = await fetch(
              `${supabaseUrl}/rest/v1/regional_counting_raw?sensor_id=eq.${sensor.id}&timestamp=in.(${timestamps.join(',')})&select=timestamp`,
              {
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`
                }
              }
            );
            
            const existingRecords = await checkResponse.json();
            const existingTimestamps = new Set(existingRecords.map(r => r.timestamp));
            
            // Separate new and existing records
            const newRecords = recordsToProcess.filter(r => !existingTimestamps.has(r.timestamp));
            const updateRecords = recordsToProcess.filter(r => existingTimestamps.has(r.timestamp));
            
            // Insert new records
            if (newRecords.length > 0) {
              const insertResponse = await fetch(`${supabaseUrl}/rest/v1/regional_counting_raw`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'return=minimal'
                },
                body: JSON.stringify(newRecords)
              });
              
              if (insertResponse.ok) {
                sensorInserted += newRecords.length;
              } else {
                console.error(`  ❌ Failed to insert batch: ${await insertResponse.text()}`);
              }
            }
            
            // Update existing records
            for (const record of updateRecords) {
              const updateResponse = await fetch(
                `${supabaseUrl}/rest/v1/regional_counting_raw?sensor_id=eq.${sensor.id}&timestamp=eq.${record.timestamp}`,
                {
                  method: 'PATCH',
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                  },
                  body: JSON.stringify({
                    region1_count: record.region1_count,
                    region2_count: record.region2_count,
                    region3_count: record.region3_count,
                    region4_count: record.region4_count
                  })
                }
              );
              
              if (updateResponse.ok) {
                sensorUpdated++;
              }
            }
            
            recordsToProcess = [];
          }
        }
      }
      
      console.log(`  📊 Results: ${sensorInserted} inserted, ${sensorUpdated} updated`);
      totalRecordsInserted += sensorInserted;
      totalRecordsUpdated += sensorUpdated;
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log(`✅ Upload Complete!`);
  console.log(`   Total records inserted: ${totalRecordsInserted}`);
  console.log(`   Total records updated: ${totalRecordsUpdated}`);
  
  // Show sample of uploaded data
  console.log('\n📊 Verifying uploaded data...');
  const verifyResponse = await fetch(
    `${supabaseUrl}/rest/v1/regional_counting_raw?select=*&order=timestamp.desc&limit=10`,
    {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    }
  );
  
  const sampleData = await verifyResponse.json();
  if (sampleData.length > 0) {
    console.log('\nRecent regional data:');
    sampleData.slice(0, 5).forEach(record => {
      const total = record.region1_count + record.region2_count + record.region3_count + record.region4_count;
      console.log(`  ${record.timestamp}: R1=${record.region1_count}, R2=${record.region2_count}, R3=${record.region3_count}, R4=${record.region4_count} (Total: ${total})`);
    });
  }
}

// Run the upload
uploadLast24Hours()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  });