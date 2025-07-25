#!/usr/bin/env node
/**
 * Test regional data collection logic
 * This simulates what GitHub Actions would do
 */

const http = require('http');

async function testRegionalCollection() {
    console.log('🗺️  Testing Regional Data Collection Logic');
    console.log('=' + '='.repeat(60));
    
    // Omnia sensors that should have regional support
    const omniaSensors = [
        {
            name: 'OML01-PC',
            ip: '93.108.96.96',
            port: 21001,
            auth: 'admin:OmniaOml01'
        },
        {
            name: 'OML02-PC',
            ip: '188.37.175.41',
            port: 2201,
            auth: 'admin:OmniaOml02'
        },
        {
            name: 'OML03-PC',
            ip: '188.37.124.33',
            port: 21002,
            auth: 'admin:OmniaOml03'
        }
    ];
    
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const formatDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    console.log(`\nTime range: ${formatDate(oneHourAgo)} to ${formatDate(now)}`);
    console.log('\nTesting endpoints for regional data...\n');
    
    for (const sensor of omniaSensors) {
        console.log(`📡 ${sensor.name}`);
        console.log('-'.repeat(40));
        
        // Test different endpoints
        const endpoints = [
            { 
                name: 'Regional Counting CSV',
                path: `/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3&time_start=${formatDate(oneHourAgo)}&time_end=${formatDate(now)}`
            },
            { 
                name: 'VCA Log with Region Type (linetype=0)',
                path: `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=0&time_start=${formatDate(oneHourAgo)}&time_end=${formatDate(now)}`
            },
            {
                name: 'Zone Counting (if supported)',
                path: `/dataloader.cgi?dw=zonecountlogcsv&report_type=0&statistics_type=3&time_start=${formatDate(oneHourAgo)}&time_end=${formatDate(now)}`
            }
        ];
        
        let foundRegional = false;
        
        for (const endpoint of endpoints) {
            process.stdout.write(`  Testing ${endpoint.name}... `);
            
            try {
                const result = await testEndpoint(sensor, endpoint.path);
                
                if (result.success) {
                    if (result.hasRegionalData) {
                        console.log(`✅ FOUND REGIONAL DATA!`);
                        console.log(`    Headers: ${result.headers}`);
                        console.log(`    Records: ${result.recordCount}`);
                        if (result.sampleData) {
                            console.log(`    Sample: ${result.sampleData}`);
                        }
                        foundRegional = true;
                    } else {
                        console.log(`❌ No regional columns`);
                        console.log(`    Headers: ${result.headers}`);
                    }
                } else {
                    console.log(`❌ ${result.error}`);
                }
            } catch (err) {
                console.log(`❌ ${err.message}`);
            }
        }
        
        if (!foundRegional) {
            console.log(`\n  ⚠️  No regional data found for ${sensor.name}`);
            console.log(`  ℹ️  This sensor may need regional counting enabled in its web interface`);
        }
        
        console.log('');
    }
    
    console.log('\n📋 Summary:');
    console.log('If no regional data was found, possible actions:');
    console.log('1. Enable regional/zone counting in sensor web interface');
    console.log('2. Check with Omnia support for API documentation');
    console.log('3. Verify sensor firmware supports regional analytics');
}

async function testEndpoint(sensor, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: sensor.ip,
            port: sensor.port,
            path: path,
            method: 'GET',
            headers: {
                'Authorization': 'Basic ' + Buffer.from(sensor.auth).toString('base64')
            },
            timeout: 10000
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const lines = data.trim().split('\n');
                    if (lines.length > 0) {
                        const headers = lines[0].toLowerCase();
                        const hasRegionalData = headers.includes('region') || 
                                              headers.includes('zone') || 
                                              headers.includes('area');
                        
                        resolve({
                            success: true,
                            hasRegionalData: hasRegionalData,
                            headers: lines[0],
                            recordCount: lines.length - 1,
                            sampleData: lines.length > 1 ? lines[1] : null
                        });
                    } else {
                        resolve({
                            success: true,
                            hasRegionalData: false,
                            headers: 'No data returned'
                        });
                    }
                } else {
                    resolve({
                        success: false,
                        error: `HTTP ${res.statusCode}`
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            resolve({
                success: false,
                error: err.message
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve({
                success: false,
                error: 'Timeout (not accessible from Codespaces)'
            });
        });
        
        req.end();
    });
}

// Run the test
console.log('Note: This test will timeout from Codespaces.');
console.log('The actual test needs to run from GitHub Actions.\n');

testRegionalCollection()
    .then(() => {
        console.log('\nTest completed.');
        console.log('\nTo run the actual test:');
        console.log('1. Push this test script to the repository');
        console.log('2. Create a GitHub Actions workflow to run it');
        console.log('3. Or manually trigger the regional data collection workflow');
    })
    .catch(err => {
        console.error('Test failed:', err);
    });