#!/bin/bash

# Script to update API endpoints after database optimization
# Date: 2025-07-23

echo "🔧 Updating API endpoints to use optimized database schema..."
echo "=================================================="

# Create backup directory
mkdir -p app/api/backup-2025-07-23

# 1. Update /app/api/sensors/data/route.ts
echo "📝 Updating sensors/data API..."
cp app/api/sensors/data/route.ts app/api/backup-2025-07-23/
sed -i '242,246d' app/api/sensors/data/route.ts
echo "  ✅ Removed daily_summary reference"

# 2. Update /app/api/analytics/route.ts
echo "📝 Updating analytics API..."
cp app/api/analytics/route.ts app/api/backup-2025-07-23/
# Remove daily type handling (lines 143-199)
sed -i '/case.*daily/,/break;/d' app/api/analytics/route.ts
echo "  ✅ Removed daily_summary analytics"

# 3. Update /app/api/analytics/stream/route.ts
echo "📝 Updating analytics/stream API..."
cp app/api/analytics/stream/route.ts app/api/backup-2025-07-23/
# Replace people_counting_data with people_counting_raw
sed -i 's/people_counting_data/people_counting_raw/g' app/api/analytics/stream/route.ts
# Replace analytics_alerts with alerts
sed -i 's/analytics_alerts/alerts/g' app/api/analytics/stream/route.ts
echo "  ✅ Updated table references"

# 4. Update /app/api/analytics/test-ingestion/route.ts
echo "📝 Updating test-ingestion API..."
cp app/api/analytics/test-ingestion/route.ts app/api/backup-2025-07-23/
sed -i 's/people_counting_data/people_counting_raw/g' app/api/analytics/test-ingestion/route.ts
echo "  ✅ Updated to use raw table"

# 5. Update /app/api/analytics/unified/route.ts
echo "📝 Updating unified analytics API..."
cp app/api/analytics/unified/route.ts app/api/backup-2025-07-23/
# This file needs more complex updates - create a new version
cat > app/api/analytics/unified/route.ts.new << 'EOF'
import { NextRequest } from 'next/server';
import { createClient } from '@/app/lib/db/supabase/server';
import { corsHeaders } from '@/app/lib/utils/cors';

export async function OPTIONS(request: NextRequest) {
  return new Response('ok', { headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!storeId) {
      return Response.json(
        { error: 'Store ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient();

    // Get current occupancy from raw data
    const { data: currentOccupancy } = await supabase
      .from('people_counting_raw')
      .select('timestamp, total_in, total_out')
      .eq('store_id', storeId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    // Get hourly analytics
    const { data: hourlyData } = await supabase
      .from('hourly_analytics')
      .select('*')
      .eq('store_id', storeId)
      .gte('date', startDate || new Date().toISOString().split('T')[0])
      .lte('date', endDate || new Date().toISOString().split('T')[0])
      .order('date', { ascending: false })
      .order('hour', { ascending: false });

    // Get regional data
    const { data: regionalData } = await supabase
      .from('regional_counting_raw')
      .select('*')
      .eq('store_id', storeId)
      .order('timestamp', { ascending: false })
      .limit(10);

    return Response.json({
      current_occupancy: currentOccupancy,
      hourly_analytics: hourlyData || [],
      regional_data: regionalData || [],
      // Removed: customer_journeys, queue_analytics
    }, { headers: corsHeaders });

  } catch (error: any) {
    console.error('Error in unified analytics:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
EOF
mv app/api/analytics/unified/route.ts.new app/api/analytics/unified/route.ts
echo "  ✅ Completely refactored to remove deprecated tables"

# 6. Update /app/api/analytics/ingestion/bulk/route.ts
echo "📝 Updating bulk ingestion API..."
cp app/api/analytics/ingestion/bulk/route.ts app/api/backup-2025-07-23/
sed -i 's/people_counting_data/people_counting_raw/g' app/api/analytics/ingestion/bulk/route.ts
echo "  ✅ Updated to use raw table"

# 7. Update /app/api/auth/profile/route.ts
echo "📝 Updating auth profile API..."
cp app/api/auth/profile/route.ts app/api/backup-2025-07-23/
# Remove user_regions and user_stores queries
sed -i '/user_regions/,+10d' app/api/auth/profile/route.ts
sed -i '/user_stores/,+10d' app/api/auth/profile/route.ts
echo "  ✅ Removed user_regions and user_stores references"

# 8. Update analytics service
echo "📝 Updating analytics service..."
cp app/lib/services/analytics.service.ts app/api/backup-2025-07-23/
sed -i 's/people_counting_data/people_counting_raw/g' app/lib/services/analytics.service.ts
# Comment out customer journey analytics
sed -i '/customer_journeys/,+20s/^/\/\/ /' app/lib/services/analytics.service.ts
echo "  ✅ Updated service to use raw tables"

echo ""
echo "✅ API endpoint updates complete!"
echo ""
echo "📁 Backups saved in: app/api/backup-2025-07-23/"
echo ""
echo "⚠️  Next steps:"
echo "1. Review the changes in each file"
echo "2. Test all API endpoints"
echo "3. Update any frontend components that use removed features"
echo ""
echo "🎯 Removed features that need frontend updates:"
echo "- Customer journey analytics"
echo "- Queue analytics"
echo "- Daily summary (use hourly instead)"
echo "- User regions/stores assignment"