#!/usr/bin/env node
/**
 * Check latest sensor data using the API endpoints
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const SENSOR_DATA_API = process.env.SENSOR_DATA_INGESTION_API || 'http://localhost:3000/api/sensors/data';

async function checkLatestData() {
    console.log('Checking latest sensor data via API...');
    console.log('Using API endpoint:', SENSOR_DATA_API);
    console.log('Current UTC time:', new Date().toISOString());
    console.log('Current UTC hour:', new Date().getUTCHours());
    console.log('-'.repeat(80));
    
    try {
        // Get latest sensor data
        const response = await fetch(`${SENSOR_DATA_API}?limit=10&order=desc`);
        
        if (!response.ok) {
            console.error('Failed to fetch data:', response.status, response.statusText);
            return;
        }
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            console.log('\n=== LATEST SENSOR DATA ===');
            console.log('Latest timestamp:', data.data[0].timestamp);
            console.log('\nLast 10 records:');
            data.data.forEach(row => {
                console.log(`  ${row.timestamp} | Sensor: ${row.sensor_id} | In: ${row.people_in} | Out: ${row.people_out}`);
            });
        } else {
            console.log('No data found');
        }
        
        // Check data by hour for today
        console.log('\n=== TODAY\'S DATA BY HOUR (UTC) ===');
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        
        for (let hour = 0; hour <= new Date().getUTCHours(); hour++) {
            const hourStart = new Date(today);
            hourStart.setUTCHours(hour);
            const hourEnd = new Date(hourStart);
            hourEnd.setUTCHours(hour + 1);
            
            const hourResponse = await fetch(
                `${SENSOR_DATA_API}?start_time=${hourStart.toISOString()}&end_time=${hourEnd.toISOString()}&count=true`
            );
            
            if (hourResponse.ok) {
                const hourData = await hourResponse.json();
                if (hourData.count > 0) {
                    console.log(`  ${hour.toString().padStart(2, '0')}:00 UTC: ${hourData.count} records`);
                }
            }
        }
        
        // Check for gaps
        console.log('\n=== CHECKING FOR GAPS IN RECENT DATA ===');
        console.log('Missing hours in the last 24 hours:');
        
        const now = new Date();
        for (let i = 24; i >= 0; i--) {
            const checkTime = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourStart = new Date(checkTime);
            hourStart.setUTCMinutes(0, 0, 0);
            const hourEnd = new Date(hourStart);
            hourEnd.setUTCHours(hourStart.getUTCHours() + 1);
            
            const gapResponse = await fetch(
                `${SENSOR_DATA_API}?start_time=${hourStart.toISOString()}&end_time=${hourEnd.toISOString()}&count=true`
            );
            
            if (gapResponse.ok) {
                const gapData = await gapResponse.json();
                if (gapData.count === 0) {
                    console.log(`  Missing: ${hourStart.toISOString().replace('T', ' ').slice(0, 13)}:00 UTC`);
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking data:', error);
    }
}

// Run the check
checkLatestData().catch(console.error);