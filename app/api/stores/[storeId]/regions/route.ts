import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { cookies } from 'next/headers'

interface RegionConfig {
  id?: string
  name: string
  type: 'entrance' | 'browsing' | 'queue' | 'high-value' | 'transition' | 'custom'
  polygon?: number[][] // Coordinate points defining the region
  capacity?: number
  alerts?: {
    maxOccupancy?: number
    maxQueueLength?: number
    maxWaitTime?: number // seconds
    unattendedTime?: number // seconds
  }
  businessRules?: {
    conversionTracking?: boolean
    dwellTimeTracking?: boolean
    pathAnalysis?: boolean
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get regions for the store
    const { data: regions, error } = await supabase
      .from('regions')
      .select('*')
      .eq('store_id', params.storeId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching regions:', error)
      return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 })
    }

    return NextResponse.json({ regions: regions || [] })
  } catch (error) {
    console.error('Error in GET /api/stores/[storeId]/regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const regions = body.regions as RegionConfig[]

    if (!Array.isArray(regions)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate store exists and user has access
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id, organization_id')
      .eq('id', params.storeId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Begin transaction-like operation
    const results = []

    for (const region of regions) {
      const { data, error } = await supabase
        .from('regions')
        .insert({
          store_id: params.storeId,
          organization_id: store.organization_id,
          name: region.name,
          type: region.type,
          polygon: region.polygon,
          capacity: region.capacity,
          max_occupancy_threshold: region.alerts?.maxOccupancy,
          max_queue_length: region.alerts?.maxQueueLength,
          max_wait_time_seconds: region.alerts?.maxWaitTime,
          unattended_threshold_seconds: region.alerts?.unattendedTime,
          business_rules: region.businessRules || {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating region:', error)
        return NextResponse.json({ 
          error: 'Failed to create region', 
          details: error.message 
        }, { status: 500 })
      }

      results.push(data)
    }

    return NextResponse.json({ 
      message: 'Regions configured successfully',
      regions: results 
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/stores/[storeId]/regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { regionId, ...updates } = body

    if (!regionId) {
      return NextResponse.json({ error: 'Region ID required' }, { status: 400 })
    }

    // Update region
    const { data, error } = await supabase
      .from('regions')
      .update({
        name: updates.name,
        type: updates.type,
        polygon: updates.polygon,
        capacity: updates.capacity,
        max_occupancy_threshold: updates.alerts?.maxOccupancy,
        max_queue_length: updates.alerts?.maxQueueLength,
        max_wait_time_seconds: updates.alerts?.maxWaitTime,
        unattended_threshold_seconds: updates.alerts?.unattendedTime,
        business_rules: updates.businessRules,
        updated_at: new Date().toISOString()
      })
      .eq('id', regionId)
      .eq('store_id', params.storeId)
      .select()
      .single()

    if (error) {
      console.error('Error updating region:', error)
      return NextResponse.json({ error: 'Failed to update region' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Region not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Region updated successfully',
      region: data 
    })
  } catch (error) {
    console.error('Error in PUT /api/stores/[storeId]/regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { storeId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get region ID from query params
    const { searchParams } = new URL(request.url)
    const regionId = searchParams.get('regionId')

    if (!regionId) {
      return NextResponse.json({ error: 'Region ID required' }, { status: 400 })
    }

    // Delete region
    const { error } = await supabase
      .from('regions')
      .delete()
      .eq('id', regionId)
      .eq('store_id', params.storeId)

    if (error) {
      console.error('Error deleting region:', error)
      return NextResponse.json({ error: 'Failed to delete region' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Region deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/stores/[storeId]/regions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}