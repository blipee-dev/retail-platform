#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform-develop/.env' });

const fetch = require('node-fetch');

async function testFetch() {
  // Test a simple sensor URL construction
  const testSensor = {
    sensor_id: 'test-sensor',
    sensor_name: 'Test Sensor',
    sensor_ip: '192.168.1.100',
    sensor_port: 80,
    sensor_type: 'milesight'
  };
  
  const endpoint = '/dataloader.cgi';
  const port = testSensor.sensor_port || 80;
  const url = `http://${testSensor.sensor_ip}:${port}${endpoint}`;
  
  console.log('Test URL construction:');
  console.log(`  IP: ${testSensor.sensor_ip}`);
  console.log(`  Port: ${port}`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Full URL: ${url}`);
  console.log();
  
  // Test if fetch works
  try {
    console.log('Testing fetch library...');
    const response = await fetch('https://api.github.com');
    console.log(`  ✓ Fetch works! Status: ${response.status}`);
  } catch (error) {
    console.log(`  ✗ Fetch failed: ${error.message}`);
  }
}

testFetch().catch(console.error);