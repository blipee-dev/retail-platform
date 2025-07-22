# 🚀 Fresh 24-Hour Data Collection Instructions

## Current Status
✅ Database has been completely cleaned
✅ All sensor data tables are empty
✅ GitHub Actions workflow is configured to collect 24 hours of data

## Steps to Collect Fresh Data

### 1. Trigger GitHub Actions Workflow
1. Go to: https://github.com/blipee-dev/retail-platform/actions
2. Click on "Direct Sensor Data Collection" workflow
3. Click the "Run workflow" button (green button on the right)
4. Select "Run workflow" in the popup

### 2. Monitor Progress (Optional)
Open a new terminal and run:
```bash
python scripts/monitor_collection_live.py
```

This will show:
- Real-time record counts
- Per-sensor progress
- Collection rate
- ETA for completion

### 3. Expected Results
- **J&J Sensor**: May timeout (known issue with their API)
- **OML01-PC**: Should collect ~576 records (24 hours × 24 records/hour)
- **OML02-PC**: Should collect ~576 records
- **OML03-PC**: Should collect ~576 records

Total expected: ~1,728 records

### 4. Verify Collection
After the workflow completes, run:
```bash
python scripts/check_24h_coverage.py
```

This will show:
- Hourly coverage grid
- Hours with customer movement
- Any gaps in data

## Why It Will Work Now
- Database is completely empty
- No "last timestamp" to block insertions
- Workflow will insert all 24 hours of data
- Each sensor reports hourly data

## Troubleshooting
If you still see "0 records inserted":
1. Check GitHub Actions logs for errors
2. Verify sensors are accessible from GitHub
3. Check if it's outside store hours (no new data)

## Next Steps
Once data is collected:
1. The hourly_analytics will auto-populate (via triggers)
2. The daily_analytics will auto-populate (via triggers)
3. You can build dashboards and visualizations