# Regional Data Collection Policy

## Core Principle
**We only collect regional data from sensors that explicitly support and provide it. No fallbacks or virtual calculations.**

## Why This Approach?

1. **Data Integrity**: Virtual calculations from line crossings are assumptions, not real measurements
2. **Accuracy**: Regional occupancy requires actual zone detection, not estimates
3. **Consistency**: Mixing real and calculated data leads to unreliable analytics
4. **Simplicity**: Clear separation between what we have and what we don't

## Current Status

### Sensors with Regional Support (Configured)
- **OML01-PC**: Omnia Guimarães - 4 regions configured
- **OML02-PC**: Omnia Almada - 4 regions configured  
- **OML03-PC**: Omnia NorteShopping - 4 regions configured

### Sensors without Regional Support
- **J&J-ARR-01-PC**: Jack & Jones - Line counting only

## Data Collection Rules

1. **Only collect regional data if:**
   - Sensor has region configurations in database
   - Sensor API returns actual regional counts
   - Data includes region identifiers (region1, region2, etc.)

2. **Never:**
   - Calculate "virtual" regions from line data
   - Estimate regional occupancy from entrances/exits
   - Mix real and calculated data

3. **If regional data not available:**
   - Log that it's not supported
   - Continue with line counting data only
   - Do not attempt workarounds

## Implementation

### GitHub Actions Workflow
- Runs hourly to check for regional data
- Only processes sensors with configurations
- Logs clearly when regional data not available
- No fallback calculations

### API Endpoints to Try
For Omnia sensors that support regions:
```
/dataloader.cgi?dw=regionalcountlogcsv   # Regional counting specific
/dataloader.cgi?dw=vcalogcsv&linetype=0   # VCA with region type
```

### Next Steps
1. Contact Omnia support to enable regional counting if not working
2. Check sensor web interfaces for regional configuration options
3. Consider upgrading sensors that need regional analytics

## Benefits of This Approach
- **Clear expectations**: Know exactly what data we have
- **Reliable analytics**: No mixed quality data
- **Future proof**: When sensors support regions, just works
- **Maintainable**: Simple, clear logic