# Regional Data Collection Status

## Current Status (2025-07-22)

### ✅ Completed
1. **Region Configurations Set Up**
   - All 4 sensors have 4 regions each configured (16 total)
   - Omnia sensors (OML01, OML02, OML03) support direct regional counting
   - J&J sensor uses virtual regions calculated from line crossings

2. **Regional Analytics Tables Created**
   - `region_configurations` - Store region definitions ✅
   - `regional_analytics` - Aggregated regional data ✅
   - `regional_occupancy_snapshots` - Real-time occupancy ✅
   - `region_entrance_exit_events` - Entry/exit tracking ✅
   - `customer_journeys` - Complete customer paths ✅

3. **Region Types Configured**
   - **Entrance zones** - Monitor store entry/exit, capture rates
   - **Shopping zones** - Track browsing behavior, dwell times
   - **Queue zones** - Monitor checkout efficiency, wait times
   - **Window/Premium zones** - Track high-value engagement

### 🚧 Next Steps

1. **Enable Regional Data Collection**
   - Add regional data collection to main GitHub Actions workflow
   - Test if Omnia sensors return actual regional data
   - Implement virtual region calculation for sensors without native support

2. **Process Regional Data**
   - Calculate occupancy from entrance/exit events
   - Track dwell times per region
   - Build customer journey paths
   - Generate queue analytics

3. **Create Dashboards**
   - Regional heat maps showing occupancy
   - Flow visualization between regions
   - Queue length monitoring
   - Dwell time analytics

## Technical Details

### Omnia Sensors Regional Support
The Omnia sensors are configured for regional counting:
- **OML01**: Entrance Area, Central Plaza, Food Court Queue, Premium Stores
- **OML02**: Entrance Zone, Main Shopping Area, Checkout Queue, Storefront Display  
- **OML03**: Mall Entrance, Central Corridor, Food Court, Premium Wing

### API Endpoints for Regional Data
```bash
# Omnia sensors use the same endpoint with linetype=0 for regions
/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=0

# Alternative: might use regional counting CSV
/dataloader.cgi?dw=regionalcountlogcsv&report_type=0&statistics_type=3
```

### Virtual Region Calculation
For sensors without native regional support:
- **Region 1 (Entrance)**: Line1_in - Line1_out
- **Region 2 (Shopping)**: (Line2_in + Line3_in) - (Line2_out + Line3_out)
- **Region 3 (Checkout)**: Line2_in - Line2_out
- **Region 4 (Window)**: Line4 traffic

## Business Value
Regional analytics enable:
- **Staff Optimization**: Deploy staff where needed based on regional occupancy
- **Queue Management**: Alert when checkout queues exceed thresholds
- **Conversion Tracking**: Follow customer journeys from entrance to purchase
- **Layout Optimization**: Identify under-utilized areas
- **Real-time Alerts**: Crowding, long queues, security concerns

## Implementation Priority
1. Test Omnia regional data collection in GitHub Actions
2. Implement virtual regions for J&J sensor
3. Create real-time occupancy tracking
4. Build customer journey analytics
5. Design regional dashboards