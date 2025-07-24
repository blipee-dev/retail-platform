#!/usr/bin/env node

const fetch = require('node-fetch');

async function testSensorAccess() {
  console.log('Testing direct sensor access...\n');
  
  // Test sensor
  const sensor = {
    name: 'OML01 - GuimarãesShopping',
    ip: '93.108.96.96',
    port: 21001,
    endpoint: '/dataloader.cgi'
  };
  
  const url = `http://${sensor.ip}:${sensor.port}${sensor.endpoint}`;
  
  console.log(`Testing: ${sensor.name}`);
  console.log(`URL: ${url}`);
  
  try {
    // Test without auth first
    console.log('\n1. Testing without authentication...');
    const response1 = await fetch(url, {
      timeout: 10000
    });
    console.log(`   Status: ${response1.status} ${response1.statusText}`);
    
    // Test with basic auth
    console.log('\n2. Testing with Basic auth...');
    const response2 = await fetch(url, {
      headers: {
        'Authorization': 'Basic YWRtaW46YWRtaW4=', // admin:admin
        'Accept': 'application/json'
      },
      timeout: 10000
    });
    console.log(`   Status: ${response2.status} ${response2.statusText}`);
    
    if (response2.ok) {
      const data = await response2.json();
      console.log('\n   ✓ Successfully retrieved data!');
      console.log('   Data preview:', JSON.stringify(data).substring(0, 200) + '...');
    }
    
  } catch (error) {
    console.error(`\n   ✗ Error: ${error.message}`);
  }
}

testSensorAccess().catch(console.error);