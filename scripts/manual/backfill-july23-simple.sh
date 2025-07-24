#!/bin/bash

# Manual backfill for July 23, 2025 17:00-23:59 (Lisbon time)
# Only for the 3 online sensors

echo "📅 Manual Backfill Commands for July 23, 2025"
echo "⏰ Period: 17:00:00 to 23:59:59 (Lisbon time)"
echo ""
echo "Run these commands to collect data from each online sensor:"
echo ""

# J&J-ARR-01-PC
echo "1. J&J-ARR-01-PC (JJ01-SENSOR-001):"
echo "curl -u admin:grnl.2024 'http://195.138.127.67:21001/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-23-17:00:00&time_end=2025-07-23-23:59:59' > jj01_july23.csv"
echo ""

# OML01-PC
echo "2. OML01-PC (OML01-SENSOR-001):"
echo "curl -u admin:grnl.2024 'http://84.18.244.201:21001/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-23-17:00:00&time_end=2025-07-23-23:59:59' > oml01_july23.csv"
echo ""

# OML02-PC
echo "3. OML02-PC (OML02-SENSOR-001):"
echo "curl -u admin:grnl.2024 'http://84.18.244.201:21002/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=2025-07-23-17:00:00&time_end=2025-07-23-23:59:59' > oml02_july23.csv"
echo ""

echo "After downloading, use the import script to process the CSV files."