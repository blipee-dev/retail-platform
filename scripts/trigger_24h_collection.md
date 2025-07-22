# How to Collect 24 Hours of Data

## Option 1: Manual GitHub Actions Trigger (Recommended)

1. **Go to GitHub Actions**
   - Visit: https://github.com/blipee-dev/retail-platform/actions
   - Click on "Direct Sensor Data Collection" workflow

2. **Run the Workflow Multiple Times**
   - Click "Run workflow" button
   - The workflow collects data in chunks
   - Run it 3-4 times with a few minutes between runs
   - Each run will collect different time periods

3. **Monitor Progress**
   - Run: `python scripts/monitor_data_collection.py`
   - Watch as records increase

## Option 2: Wait for Automatic Collection

- The workflow runs every 30 minutes automatically
- It will gradually fill in the last 24 hours
- Full 24-hour coverage within 2-3 hours

## Option 3: Modify GitHub Actions Workflow (Best for 24h)

Edit `.github/workflows/collect-sensor-data.yml` to collect more history:

```javascript
// Change this line (around line 90):
const timeStart = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours

// To this:
const timeStart = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
```

Then push the change and run the workflow.

## Current Status

Run this command to check progress:
```bash
python scripts/check_db_data.py
```