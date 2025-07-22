#!/usr/bin/env node
/**
 * Test regional data collection - designed to run in GitHub Actions
 */

const http = require('http');

async function testRegionalData() {
    console.log('🗺️  Testing Regional Data Collection from GitHub Actions');
    console.log('='.repeat(80));
    
    const sensors = [
        {
            name: 'OML01-PC',
            host: '192.168.1.164',
            port: 80,
            auth: 'admin:OmniaOml01'
        },
        {
            name: 'OML02-PC',
            host: '192.168.1.165',
            port: 80,
            auth: 'admin:OmniaOml02'
        },
        {
            name: 'OML03-PC',
            host: '192.168.1.74',
            port: 80,
            auth: 'admin:OmniaOml03'
        }
    ];
    
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    // Format date for Milesight
    const formatDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    for (const sensor of sensors) {
        console.log(`\n📡 Testing ${sensor.name}...`);
        
        // Test 1: Try regional counting endpoint
        await testEndpoint(sensor, 'regionalcountlogcsv', formatDate(twoHoursAgo), formatDate(now));
        
        // Test 2: Try different report types
        await testEndpoint(sensor, 'vcalogcsv', formatDate(twoHoursAgo), formatDate(now), '&linetype=0'); // Region type
    }
}

async function testEndpoint(sensor, endpoint, startTime, endTime, extraParams = '') {
    return new Promise((resolve) => {
        const path = `/dataloader.cgi?dw=${endpoint}&report_type=0&statistics_type=3&time_start=${startTime}&time_end=${endTime}${extraParams}`;
        
        const options = {
            hostname: sensor.host,
            port: sensor.port,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(sensor.auth).toString('base64')
            },
            timeout: 30000
        };
        
        console.log(`\n  Testing endpoint: ${endpoint}`);
        console.log(`  URL: ${path}`);
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`  ✅ Got response (${data.length} bytes)`);
                    
                    const lines = data.trim().split('\n');
                    if (lines.length > 0) {
                        console.log(`  Headers: ${lines[0]}`);
                        
                        // Check for regional data
                        const header = lines[0].toLowerCase();
                        if (header.includes('region')) {
                            console.log('  ✅ FOUND REGIONAL DATA!');
                            
                            // Show sample data
                            if (lines.length > 1) {
                                console.log(`  Sample row: ${lines[1]}`);
                            }
                        } else if (header.includes('zone')) {
                            console.log('  ✅ FOUND ZONE DATA!');
                            
                            if (lines.length > 1) {
                                console.log(`  Sample row: ${lines[1]}`);
                            }
                        } else {
                            console.log('  ❌ No regional/zone columns found');
                        }
                    }
                } else {
                    console.log(`  ❌ HTTP ${res.statusCode}`);
                }
                resolve();
            });
        });
        
        req.on('error', (err) => {
            console.log(`  ❌ Error: ${err.message}`);
            resolve();
        });
        
        req.on('timeout', () => {
            console.log('  ❌ Request timeout');
            req.destroy();
            resolve();
        });
        
        req.end();
    });
}

// Run the test
testRegionalData()
    .then(() => {
        console.log('\n\n📋 Summary:');
        console.log('If no regional data found, we should:');
        console.log('1. Implement virtual regions using line crossing data');
        console.log('2. Configure regions in sensor web interface');
        console.log('3. Contact sensor support for regional counting setup');
    })
    .catch(err => {
        console.error('Test failed:', err);
    });