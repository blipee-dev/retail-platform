#!/usr/bin/env node

/**
 * Test script to see raw sensor data format
 */

const http = require('http');

async function testSensorData() {
  const sensor = {
    sensor_ip: '77.54.194.154',
    sensor_port: 8888,
    sensor_name: 'J&J-ARR-01-PC'
  };

  // Get current time
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  console.log('Fetching data from sensor...');
  console.log(`Time range: ${formatDate(oneHourAgo)} to ${formatDate(now)}`);

  const path = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(oneHourAgo)}&time_end=${formatDate(now)}`;
  
  const options = {
    hostname: sensor.sensor_ip,
    port: sensor.sensor_port,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from('admin:grnl.2024').toString('base64')
    },
    timeout: 30000
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('\nRaw CSV data:');
          console.log('=============');
          const lines = data.trim().split('\n');
          // Show first 10 lines
          lines.slice(0, 10).forEach((line, i) => {
            console.log(`Line ${i}: ${line}`);
          });
          
          console.log('\nParsing timestamps from data rows:');
          console.log('==================================');
          // Parse a few data rows to see the timestamp format
          for (let i = 1; i < Math.min(6, lines.length); i++) {
            const parts = lines[i].split(',').map(p => p.trim());
            if (parts.length >= 2) {
              console.log(`\nRow ${i}:`);
              console.log(`  Start time: "${parts[0]}"`);
              console.log(`  End time: "${parts[1]}"`);
              
              // Try to parse
              try {
                const start = new Date(parts[0].replace(/\//g, '-'));
                const end = new Date(parts[1].replace(/\//g, '-'));
                console.log(`  Parsed start: ${start.toISOString()}`);
                console.log(`  Parsed end: ${end.toISOString()}`);
                console.log(`  Start minute:second = ${start.getMinutes()}:${start.getSeconds()}`);
                console.log(`  End minute:second = ${end.getMinutes()}:${end.getSeconds()}`);
              } catch (e) {
                console.log(`  Parse error: ${e.message}`);
              }
            }
          }
          
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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
}

testSensorData()
  .then(() => console.log('\nDone!'))
  .catch(err => console.error('Error:', err.message));