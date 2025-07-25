#!/usr/bin/env node
/**
 * Test the exact workflow logic to debug why 11:00 data wasn't collected
 */

const http = require('http');

async function testWorkflowLogic() {
    console.log('🔍 Testing Exact Workflow Logic');
    console.log('='.repeat(80));
    
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    console.log(`Current time: ${now.toISOString()}`);
    console.log(`Three hours ago: ${threeHoursAgo.toISOString()}`);
    
    // Format date for sensors
    const formatDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    // Test sensor
    const sensor = {
        sensor_name: 'OML01-PC',
        sensor_ip: '93.108.96.96',
        sensor_port: 21001,
        id: 'test-id'
    };
    
    console.log(`\n📡 Testing ${sensor.sensor_name}...`);
    console.log(`Query range: ${formatDate(threeHoursAgo)} to ${formatDate(now)}`);
    
    // Fetch data
    const data = await new Promise((resolve, reject) => {
        const path = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(threeHoursAgo)}&time_end=${formatDate(now)}`;
        
        console.log(`\nAPI Path: ${path}`);
        
        const options = {
            hostname: sensor.sensor_ip,
            port: sensor.sensor_port,
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
                if (res.statusCode === 200) {
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
    
    // Parse CSV
    const lines = data.trim().split('\n');
    console.log(`\n✅ Retrieved ${lines.length - 1} records`);
    
    const records = [];
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        
        if (parts.length >= 17) {
            const timestamp = new Date(parts[0].replace(/\//g, '-'));
            const record = {
                timestamp: timestamp,
                endTime: new Date(parts[1].replace(/\//g, '-')),
                line1_in: parseInt(parts[5]) || 0,
                line1_out: parseInt(parts[6]) || 0,
                line2_in: parseInt(parts[8]) || 0,
                line2_out: parseInt(parts[9]) || 0,
                line3_in: parseInt(parts[11]) || 0,
                line3_out: parseInt(parts[12]) || 0,
                line4_in: parseInt(parts[14]) || 0,
                line4_out: parseInt(parts[15]) || 0
            };
            
            const totalIn = record.line1_in + record.line2_in + record.line3_in + record.line4_in;
            const totalOut = record.line1_out + record.line2_out + record.line3_out + record.line4_out;
            
            records.push(record);
            
            console.log(`\nRecord ${i}: ${parts[0]}`);
            console.log(`  Parsed timestamp: ${timestamp.toISOString()}`);
            console.log(`  Total: ${totalIn} IN, ${totalOut} OUT`);
            
            // Apply workflow filters
            const isFuture = timestamp > now;
            const hoursAgo = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
            const tooOld = hoursAgo > 3;
            
            console.log(`  Future check: ${isFuture ? 'YES (skip)' : 'NO'}`);
            console.log(`  Hours ago: ${hoursAgo.toFixed(2)}`);
            console.log(`  Too old (>3h): ${tooOld ? 'YES (skip)' : 'NO'}`);
            console.log(`  Would process: ${!isFuture && !tooOld ? '✅ YES' : '❌ NO'}`);
        }
    }
    
    console.log('\n\n📊 Summary:');
    const wouldProcess = records.filter(r => {
        const isFuture = r.timestamp > now;
        const hoursAgo = (now.getTime() - r.timestamp.getTime()) / (1000 * 60 * 60);
        return !isFuture && hoursAgo <= 3;
    });
    
    console.log(`Total records: ${records.length}`);
    console.log(`Would process: ${wouldProcess.length}`);
    
    wouldProcess.forEach(r => {
        const totalIn = r.line1_in + r.line2_in + r.line3_in + r.line4_in;
        const totalOut = r.line1_out + r.line2_out + r.line3_out + r.line4_out;
        console.log(`  - ${r.timestamp.toISOString()}: ${totalIn} IN, ${totalOut} OUT`);
    });
}

testWorkflowLogic().catch(console.error);