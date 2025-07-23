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
