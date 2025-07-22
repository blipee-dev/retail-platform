# Scripts Directory

This directory contains various scripts for the Retail Platform project.

## Directory Structure

- **archive/** - Old scripts kept for reference
- **debug/** - Debugging and testing scripts
  - **timezone/** - Timezone-related debugging
  - **data/** - Data debugging scripts
  - **workflow/** - GitHub workflow debugging
- **migrations/** - Database migration scripts
- **data-collection/** - Active data collection scripts
- **analysis/** - Data analysis scripts
- **utilities/** - General utility scripts

## Usage

Most Python scripts can be run directly:
```bash
python scripts/data-collection/collect_sensor_data.py
```

## Adding New Scripts

1. Place scripts in the appropriate subdirectory
2. Follow naming convention: `verb_noun.py`
3. Add documentation at the top of the script
4. Update this README if adding a new category
