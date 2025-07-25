#!/usr/bin/env node
/**
 * Test timezone detection for sensors
 */

const http = require('http');

async function testSensorTimezone(sensorIp, sensorPort) {
    console.log(`\n=== Testing sensor at ${sensorIp}:${sensorPort} ===`);
    
    const nowUTC = new Date();
    console.log(`Current UTC time: ${nowUTC.toISOString()}`);
    console.log(`Current UTC hour: ${nowUTC.getUTCHours()}`);
    
    // Get one hour of data to analyze timezone
    const oneHourAgo = new Date(nowUTC.getTime() - 60 * 60 * 1000);
    
    const formatDate = (date) => {
        const pad = (n) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    try {
        const data = await new Promise((resolve, reject) => {
            const path = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(oneHourAgo)}&time_end=${formatDate(nowUTC)}`;
            
            const options = {
                hostname: sensorIp,
                port: sensorPort,
                path: path,
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + Buffer.from('admin:grnl.2024').toString('base64')
                },
                timeout: 10000
            };
            
            console.log(`Requesting: ${path}`);
            
            const req = http.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => resolve(data));
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
        
        // Parse the CSV to see what times the sensor reports
        const lines = data.trim().split('\\n');
        console.log(`\nReceived ${lines.length} lines of data`);
        
        if (lines.length > 1) {
            console.log('\nFirst few data points:');
            for (let i = 1; i < Math.min(6, lines.length); i++) {
                const parts = lines[i].split(',');
                if (parts.length >= 17) {
                    const sensorTime = parts[0].trim();
                    const totalIn = parseInt(parts[5]||0) + parseInt(parts[8]||0) + parseInt(parts[11]||0) + parseInt(parts[14]||0);
                    const totalOut = parseInt(parts[6]||0) + parseInt(parts[9]||0) + parseInt(parts[12]||0) + parseInt(parts[15]||0);
                    console.log(`  ${sensorTime} - In: ${totalIn}, Out: ${totalOut}`);
                    
                    // Try to detect timezone
                    if (i === 1) {
                        const sensorDate = new Date(sensorTime.replace(/\\//g, '-'));
                        const sensorHour = sensorDate.getHours();
                        const utcHour = nowUTC.getHours();
                        
                        console.log(`\nTimezone detection:`);
                        console.log(`  Latest sensor timestamp: ${sensorTime}`);
                        console.log(`  Sensor hour: ${sensorHour}`);
                        console.log(`  Current UTC hour: ${utcHour}`);
                        
                        // Calculate possible offsets
                        let hourDiff = sensorHour - utcHour;
                        if (hourDiff > 12) hourDiff -= 24;
                        if (hourDiff < -12) hourDiff += 24;
                        
                        console.log(`  Calculated offset: ${hourDiff} hours from UTC`);
                        console.log(`  This suggests sensor is in UTC${hourDiff >= 0 ? '+' : ''}${hourDiff}`);
                    }
                }
            }
        }
        
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Test with known sensor IPs (from previous scripts)
const sensors = [
    { ip: '192.168.7.87', port: 80, name: 'J&J-ARR-01-PC' },
    { ip: '192.168.7.80', port: 80, name: 'OML01-PC' },
    { ip: '192.168.7.81', port: 80, name: 'OML02-PC' },
    { ip: '192.168.7.82', port: 80, name: 'OML03-PC' }
];

async function testAll() {
    console.log('Testing timezone detection for all sensors...');
    console.log('=' .repeat(60));
    
    for (const sensor of sensors) {
        await testSensorTimezone(sensor.ip, sensor.port);
    }
}

testAll();