# Manual Trigger Data Collection

The sensors DO have the 10:00-11:00 UTC data available!

## To collect it immediately:

1. **Go to GitHub Actions**
   - https://github.com/blipee-dev/retail-platform/actions

2. **Click "Direct Sensor Data Collection" workflow**

3. **Click "Run workflow" button**

4. **Click green "Run workflow" in the popup**

This will immediately collect:
- 10:00-11:00 UTC data (which is available now)
- Any other missing data

## Why it's not collected yet:

The workflow runs at :00 and :30 past each hour.
- Last run: 10:30 UTC (didn't find new data)
- Next scheduled: 11:00 UTC (6 minutes from now)

But since the data IS available now, running it manually will collect it immediately!