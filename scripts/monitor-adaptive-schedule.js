#!/usr/bin/env node

/**
 * Monitor and analyze the adaptive schedule pattern
 * Shows when the pipeline will run based on current time
 */

function getScheduleForHour(hour) {
  // Late night hours (2-6 AM UTC) - Every 2 hours
  if (hour === 2 || hour === 4) {
    return { frequency: 120, period: 'Late Night', runs: [0] };
  }
  if (hour === 3 || hour === 5) {
    return { frequency: 0, period: 'Late Night', runs: [] }; // No runs
  }
  
  // Off-peak hours (6-9 AM, 9 PM-2 AM UTC) - Every hour
  if ((hour >= 6 && hour <= 8) || (hour >= 21 && hour <= 23) || hour <= 1) {
    return { frequency: 60, period: 'Off-Peak', runs: [0] };
  }
  
  // Business hours (9 AM-9 PM UTC) - Every 30 minutes
  if (hour >= 9 && hour <= 20) {
    return { frequency: 30, period: 'Business Hours', runs: [0, 30] };
  }
  
  return { frequency: 60, period: 'Unknown', runs: [] };
}

function analyzeSchedule() {
  console.log('🕐 Adaptive Schedule Analysis\n');
  console.log('Schedule Pattern:');
  console.log('- Late Night (2-6 AM UTC): Every 2 hours (only at 2 AM & 4 AM)');
  console.log('- Off-Peak (6-9 AM, 9 PM-2 AM UTC): Every hour');
  console.log('- Business Hours (9 AM-9 PM UTC): Every 30 minutes\n');
  
  // Calculate runs per day
  let totalRuns = 0;
  const schedule = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const hourSchedule = getScheduleForHour(hour);
    totalRuns += hourSchedule.runs.length;
    schedule.push({
      hour,
      ...hourSchedule
    });
  }
  
  console.log(`📊 Daily Statistics:`);
  console.log(`- Total runs per day: ${totalRuns}`);
  console.log(`- Old schedule (every 30 min): 48 runs/day`);
  
  if (totalRuns < 48) {
    console.log(`- Reduction: ${((48 - totalRuns) / 48 * 100).toFixed(1)}% fewer runs\n`);
  } else {
    console.log(`- Note: More frequent during peak hours for better data accuracy\n`);
  }
  
  // Show current status
  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentMinute = now.getUTCMinutes();
  const currentSchedule = getScheduleForHour(currentHour);
  
  console.log(`⏰ Current Time: ${now.toUTCString()}`);
  console.log(`📍 Period: ${currentSchedule.period}`);
  console.log(`🔄 Frequency: Every ${currentSchedule.frequency} minutes`);
  
  // Find next run
  let nextRun = null;
  for (const minute of currentSchedule.runs) {
    if (minute > currentMinute) {
      nextRun = new Date(now);
      nextRun.setUTCMinutes(minute);
      nextRun.setUTCSeconds(0);
      break;
    }
  }
  
  if (!nextRun) {
    // Next run is in the next hour
    const nextHour = (currentHour + 1) % 24;
    const nextSchedule = getScheduleForHour(nextHour);
    nextRun = new Date(now);
    nextRun.setUTCHours(nextHour);
    nextRun.setUTCMinutes(nextSchedule.runs[0] || 0);
    nextRun.setUTCSeconds(0);
    if (nextHour < currentHour) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
  }
  
  const timeToNext = Math.round((nextRun - now) / 1000 / 60);
  console.log(`⏭️  Next run: ${nextRun.toUTCString()} (in ${timeToNext} minutes)\n`);
  
  // Show hourly breakdown
  console.log('📅 Hourly Schedule (UTC):');
  console.log('Hour | Period         | Runs');
  console.log('-----|----------------|---------------------');
  
  for (const h of schedule) {
    const hourStr = h.hour.toString().padStart(2, '0');
    const periodStr = h.period.padEnd(14, ' ');
    const runsStr = h.runs.map(m => `${hourStr}:${m.toString().padStart(2, '0')}`).join(', ');
    console.log(`${hourStr}:00 | ${periodStr} | ${runsStr}`);
  }
}

// Run analysis
analyzeSchedule();