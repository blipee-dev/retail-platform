const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

const supabaseUrl = process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get table columns
async function getTableColumns(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
  
  if (error || !data || data.length === 0) return [];
  return Object.keys(data[0]);
}

// Helper to analyze table size
async function getTableSize(tableName) {
  const { count } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true });
  return count || 0;
}

// 1. DUPLICATE/REDUNDANT TABLES ANALYSIS
async function analyzeDuplicateTables() {
  console.log('\n🔍 DUPLICATE/REDUNDANT TABLES ANALYSIS\n');
  console.log('=' .repeat(60));

  // Groups of potentially redundant tables
  const tableGroups = {
    'People Counting': [
      'people_counting_raw',
      'people_counting_data'
    ],
    'Analytics': [
      'hourly_analytics',
      'daily_analytics',
      'regional_analytics'
    ],
    'Alerts': [
      'analytics_alerts',
      'regional_alerts',
      'alert_rules'
    ],
    'Regional': [
      'regions',
      'region_configurations',
      'regional_counting_raw',
      'regional_analytics',
      'regional_flow_matrix'
    ]
  };

  for (const [group, tables] of Object.entries(tableGroups)) {
    console.log(`\n📁 ${group} Tables:`);
    
    for (const table of tables) {
      const size = await getTableSize(table);
      const columns = await getTableColumns(table);
      console.log(`  - ${table}: ${size} rows, ${columns.length} columns`);
      
      // Check for common columns
      if (tables.indexOf(table) > 0) {
        const prevTable = tables[tables.indexOf(table) - 1];
        const prevColumns = await getTableColumns(prevTable);
        const commonColumns = columns.filter(col => prevColumns.includes(col));
        if (commonColumns.length > 10) {
          console.log(`    ⚠️  High overlap with ${prevTable}: ${commonColumns.length} common columns`);
        }
      }
    }
  }

  // Check for truly duplicate data
  console.log('\n📊 Data Redundancy Check:');
  
  // Compare raw vs processed people counting
  const rawCols = await getTableColumns('people_counting_raw');
  const processedCols = await getTableColumns('people_counting_data');
  const commonCols = rawCols.filter(col => processedCols.includes(col));
  
  console.log(`\n  people_counting_raw vs people_counting_data:`);
  console.log(`  - Common columns: ${commonCols.length}/${rawCols.length}`);
  console.log(`  - Unique to raw: ${rawCols.filter(col => !processedCols.includes(col)).join(', ')}`);
  console.log(`  - Unique to processed: ${processedCols.filter(col => !rawCols.includes(col)).join(', ')}`);
}

// 2. ANALYZE RELATIONSHIPS AND FOREIGN KEYS
async function analyzeRelationships() {
  console.log('\n\n🔗 RELATIONSHIP & FOREIGN KEY ANALYSIS\n');
  console.log('=' .repeat(60));

  // Check for missing foreign key relationships
  const relationships = [
    { table: 'stores', column: 'organization_id', references: 'organizations' },
    { table: 'profiles', column: 'organization_id', references: 'organizations' },
    { table: 'sensor_metadata', column: 'store_id', references: 'stores' },
    { table: 'sensor_metadata', column: 'organization_id', references: 'organizations' },
    { table: 'people_counting_raw', column: 'sensor_id', references: 'sensor_metadata' },
    { table: 'people_counting_raw', column: 'store_id', references: 'stores' },
    { table: 'people_counting_data', column: 'sensor_id', references: 'sensor_metadata' },
    { table: 'hourly_analytics', column: 'store_id', references: 'stores' },
    { table: 'daily_analytics', column: 'store_id', references: 'stores' },
    { table: 'regions', column: 'store_id', references: 'stores' },
    { table: 'region_configurations', column: 'store_id', references: 'stores' }
  ];

  for (const rel of relationships) {
    // Check if relationship is valid
    const { data: sample } = await supabase
      .from(rel.table)
      .select(rel.column)
      .not(rel.column, 'is', null)
      .limit(1);

    if (sample && sample.length > 0) {
      const refId = sample[0][rel.column];
      const { data: referenced } = await supabase
        .from(rel.references)
        .select('id')
        .eq('id', refId)
        .single();

      const status = referenced ? '✅' : '❌';
      console.log(`${status} ${rel.table}.${rel.column} → ${rel.references}.id`);
    } else {
      console.log(`⚪ ${rel.table}.${rel.column} → ${rel.references}.id (no data)`);
    }
  }

  // Check for orphaned records
  console.log('\n🚨 Orphaned Records Check:');
  
  // Check sensor data without valid sensor_metadata
  const { data: orphanedSensorData } = await supabase.rpc('find_orphaned_sensor_data', {});
  if (orphanedSensorData) {
    console.log(`  - Orphaned sensor data records: ${orphanedSensorData.length || 0}`);
  }
}

// 3. ANALYZE PERFORMANCE AND INDEXES
async function analyzePerformance() {
  console.log('\n\n⚡ PERFORMANCE & INDEX ANALYSIS\n');
  console.log('=' .repeat(60));

  // Tables that need time-based queries
  const timeBasedTables = [
    'people_counting_raw',
    'people_counting_data',
    'hourly_analytics',
    'daily_analytics',
    'regional_counting_raw',
    'customer_journeys'
  ];

  console.log('📈 Large Tables (need optimization):');
  for (const table of timeBasedTables) {
    const size = await getTableSize(table);
    if (size > 1000) {
      console.log(`  - ${table}: ${size.toLocaleString()} rows`);
      
      // Check data distribution
      if (table === 'people_counting_raw') {
        const { data: dateRange } = await supabase
          .from(table)
          .select('timestamp')
          .order('timestamp', { ascending: true })
          .limit(1);
        
        const { data: latestDate } = await supabase
          .from(table)
          .select('timestamp')
          .order('timestamp', { ascending: false })
          .limit(1);

        if (dateRange && latestDate) {
          const start = new Date(dateRange[0].timestamp);
          const end = new Date(latestDate[0].timestamp);
          const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
          console.log(`    Date range: ${days} days (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`);
          console.log(`    Avg rows/day: ${Math.round(size / days)}`);
        }
      }
    }
  }

  console.log('\n🔍 Missing Index Recommendations:');
  console.log('  - people_counting_raw: (sensor_id, timestamp) - composite for sensor queries');
  console.log('  - people_counting_raw: (store_id, timestamp) - composite for store analytics');
  console.log('  - hourly_analytics: (store_id, date, hour) - composite for time range queries');
  console.log('  - daily_analytics: (store_id, date) - composite for date range queries');
  console.log('  - sensor_metadata: (sensor_id) - unique index needed');
}

// 4. ANALYZE DATA REDUNDANCY
async function analyzeRedundancy() {
  console.log('\n\n🔄 DATA REDUNDANCY ANALYSIS\n');
  console.log('=' .repeat(60));

  // Check if aggregated data matches source
  console.log('📊 Aggregation Consistency Check:');
  
  // Pick a random date to verify
  const { data: sampleDaily } = await supabase
    .from('daily_analytics')
    .select('store_id, date, total_in, total_out')
    .order('date', { ascending: false })
    .limit(1);

  if (sampleDaily && sampleDaily.length > 0) {
    const { store_id, date, total_in, total_out } = sampleDaily[0];
    
    // Calculate from hourly
    const { data: hourlySum } = await supabase
      .from('hourly_analytics')
      .select('total_in, total_out')
      .eq('store_id', store_id)
      .eq('date', date);

    if (hourlySum) {
      const hourlyTotalIn = hourlySum.reduce((sum, h) => sum + (h.total_in || 0), 0);
      const hourlyTotalOut = hourlySum.reduce((sum, h) => sum + (h.total_out || 0), 0);
      
      console.log(`\n  Daily vs Hourly totals for ${date}:`);
      console.log(`  - Daily: In=${total_in}, Out=${total_out}`);
      console.log(`  - Hourly sum: In=${hourlyTotalIn}, Out=${hourlyTotalOut}`);
      
      if (total_in !== hourlyTotalIn || total_out !== hourlyTotalOut) {
        console.log('  ⚠️  Mismatch detected!');
      } else {
        console.log('  ✅ Aggregations match');
      }
    }
  }

  // Check for redundant columns
  console.log('\n📋 Redundant Column Analysis:');
  
  const tables = ['people_counting_raw', 'people_counting_data'];
  for (const table of tables) {
    const columns = await getTableColumns(table);
    
    // Check for calculated columns
    const calculatedCols = columns.filter(col => 
      col.includes('total') || col.includes('net') || col.includes('avg')
    );
    
    if (calculatedCols.length > 0) {
      console.log(`\n  ${table}:`);
      console.log(`  - Calculated columns: ${calculatedCols.join(', ')}`);
      console.log('  - Consider using generated columns or views instead');
    }
  }
}

// 5. OPTIMIZATION RECOMMENDATIONS
async function generateRecommendations() {
  console.log('\n\n💡 OPTIMIZATION RECOMMENDATIONS\n');
  console.log('=' .repeat(60));

  console.log('\n1. TABLE CONSOLIDATION:');
  console.log('   - Merge people_counting_raw and people_counting_data');
  console.log('     • Keep raw data with quality flags');
  console.log('     • Use views for processed data');
  console.log('   - Combine analytics_alerts and regional_alerts');
  console.log('     • Single alerts table with type field');

  console.log('\n2. SCHEMA IMPROVEMENTS:');
  console.log('   - Add sensor_id as PRIMARY KEY in sensor_metadata');
  console.log('   - Create proper foreign key constraints');
  console.log('   - Use GENERATED columns for calculations');
  console.log('   - Implement table partitioning by month');

  console.log('\n3. PERFORMANCE OPTIMIZATIONS:');
  console.log('   - Add composite indexes for common queries');
  console.log('   - Create materialized views for analytics');
  console.log('   - Archive data older than 6 months');
  console.log('   - Use TimescaleDB for time-series data');

  console.log('\n4. DATA QUALITY:');
  console.log('   - Add NOT NULL constraint on sensor_id');
  console.log('   - Implement CHECK constraints for data ranges');
  console.log('   - Add triggers for data validation');
  console.log('   - Create audit log table');

  console.log('\n5. UNUSED TABLES TO REMOVE:');
  const unusedTables = [
    'vca_alarm_status',
    'heatmap_temporal_raw',
    'customer_journeys',
    'queue_analytics',
    'regional_flow_matrix'
  ];
  
  for (const table of unusedTables) {
    const size = await getTableSize(table);
    if (size === 0) {
      console.log(`   - ${table} (0 rows)`);
    }
  }
}

// Main execution
async function main() {
  console.log('🔬 DEEP DATABASE ANALYSIS - RETAIL PLATFORM');
  console.log('=' .repeat(60));
  
  await analyzeDuplicateTables();
  await analyzeRelationships();
  await analyzePerformance();
  await analyzeRedundancy();
  await generateRecommendations();
  
  console.log('\n\n✅ Deep analysis complete!');
}

main().catch(console.error);