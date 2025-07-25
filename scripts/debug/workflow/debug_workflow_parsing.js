#!/usr/bin/env node
/**
 * Debug the workflow's CSV parsing logic
 */

function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];
    
    const records = [];
    
    // Skip header, process data lines
    for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        
        if (parts.length >= 17) {
            try {
                const timestamp = new Date(parts[0].replace(/\//g, '-'));
                console.log(`Line ${i}: "${parts[0]}" -> ${timestamp.toISOString()}`);
                
                records.push({
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
                });
            } catch (e) {
                console.error('Error parsing line:', lines[i]);
                console.error('Error:', e.message);
            }
        }
    }
    
    return records;
}

// Test with sample data
const sampleCSV = `StartTime, EndTime, Tolal - In, Tolal - Out, Tolal - Sum, Line1 - In, Line1 - Out, Line1 - Sum, Line2 - In, Line2 - Out, Line2 - Sum, Line3 - In, Line3 - Out, Line3 - Sum, Line4 - In, Line4 - Out, Line4 - Sum
2025/07/22 10:00:00,2025/07/22 10:59:59,282,79,361,0,0,0,0,0,0,0,0,0,282,79,361
2025/07/22 11:00:00,2025/07/22 11:59:59,306,96,402,3,3,6,0,0,0,0,0,0,303,93,396
2025/07/22 12:00:00,2025/07/22 12:59:59,140,23,163,0,0,0,0,0,0,0,0,0,140,23,163`;

console.log('Testing CSV parsing logic:');
console.log('=' + '='.repeat(50));

const records = parseCSV(sampleCSV);

console.log(`\nParsed ${records.length} records:`);
records.forEach((r, i) => {
    console.log(`\nRecord ${i + 1}:`);
    console.log(`  Timestamp: ${r.timestamp.toISOString()}`);
    console.log(`  Total IN: ${r.line1_in + r.line2_in + r.line3_in + r.line4_in}`);
    console.log(`  Total OUT: ${r.line1_out + r.line2_out + r.line3_out + r.line4_out}`);
});

// Test the 3-hour filter
console.log('\n\nTesting 3-hour filter:');
const now = new Date('2025-07-22T11:30:00Z');
console.log(`Current time: ${now.toISOString()}`);

records.forEach(r => {
    const hoursAgo = (now.getTime() - r.timestamp.getTime()) / (1000 * 60 * 60);
    const withinThreeHours = hoursAgo <= 3;
    console.log(`\n${r.timestamp.toISOString()}:`);
    console.log(`  ${hoursAgo.toFixed(1)} hours ago`);
    console.log(`  Within 3 hours: ${withinThreeHours ? 'YES ✅' : 'NO ❌'}`);
});