#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function testSensor() {
  const now = new Date();
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  
  // Format dates exactly like curl
  const formatDate = (date) => {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };
  
  const timeStart = formatDate(twoHoursAgo);
  const timeEnd = formatDate(now);
  
  // Build URL exactly like curl - no encoding!
  const path = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${timeStart}&time_end=${timeEnd}`;
  
  const options = {
    hostname: '188.82.28.148',
    port: 2102,
    path: path,
    method: 'GET',
    headers: {
      'Authorization': 'Basic ' + Buffer.from('admin:grnl.2024').toString('base64')
    }
  };
  
  console.log('Testing sensor with Node.js...');
  console.log('URL:', `http://${options.hostname}:${options.port}${options.path}`);
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Success!');
          console.log('First line:', data.split('\n')[0]);
          console.log('Data length:', data.length, 'bytes');
        } else {
          console.log('❌ Failed:', data);
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      reject(e);
    });
    
    req.end();
  });
}

testSensor().catch(console.error);