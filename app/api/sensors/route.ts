import { authenticateRequest, AuthError } from '@/app/lib/auth-middleware'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Initialize admin Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.BLIPEE_NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

export const dynamic = 'force-dynamic'

interface SensorConfig {
  sensor_name: string
  sensor_ip: string
  sensor_port: number
  sensor_type?: string
  location?: string
  timezone?: string
  config?: Record<string, any>
}

// GET /api/sensors - List all sensors for the organization
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, 'viewer')
    
    const { data: sensors, error } = await supabaseAdmin
      .from('sensor_metadata')
      .select(`
        *,
        stores (
          id,
          name,
          address
        )
      `)
      .eq('organization_id', auth.organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sensors })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error fetching sensors:', error)
    return NextResponse.json({ error: 'Failed to fetch sensors' }, { status: 500 })
  }
}

// POST /api/sensors - Create a new sensor
export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, 'store_manager')
    const body: SensorConfig & { store_id: string } = await request.json()

    // Validate required fields
    if (!body.sensor_name || !body.sensor_ip || !body.sensor_port || !body.store_id) {
      return NextResponse.json(
        { error: 'Missing required fields: sensor_name, sensor_ip, sensor_port, store_id' },
        { status: 400 }
      )
    }

    // Verify store belongs to organization
    const { data: store, error: storeError } = await supabaseAdmin
      .from('stores')
      .select('id, organization_id')
      .eq('id', body.store_id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found or access denied' }, { status: 404 })
    }

    // Create sensor
    const { data: sensor, error } = await supabaseAdmin
      .from('sensor_metadata')
      .insert({
        store_id: body.store_id,
        organization_id: auth.organizationId,
        sensor_name: body.sensor_name,
        sensor_ip: body.sensor_ip,
        sensor_port: body.sensor_port,
        sensor_type: body.sensor_type || 'milesight_people_counter',
        location: body.location,
        timezone: body.timezone || 'UTC',
        config: body.config || {},
        is_active: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json(
          { error: 'A sensor with this IP:port or name already exists' },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({ sensor }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error creating sensor:', error)
    return NextResponse.json({ error: 'Failed to create sensor' }, { status: 500 })
  }
}

// PATCH /api/sensors - Update a sensor
export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, 'store_manager')
    const body = await request.json()
    const { sensor_id, ...updates } = body

    if (!sensor_id) {
      return NextResponse.json({ error: 'sensor_id is required' }, { status: 400 })
    }

    // Verify sensor belongs to organization
    const { data: existingSensor, error: checkError } = await supabaseAdmin
      .from('sensor_metadata')
      .select('id')
      .eq('id', sensor_id)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existingSensor) {
      return NextResponse.json({ error: 'Sensor not found or access denied' }, { status: 404 })
    }

    // Update sensor
    const { data: sensor, error } = await supabaseAdmin
      .from('sensor_metadata')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sensor_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ sensor })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error updating sensor:', error)
    return NextResponse.json({ error: 'Failed to update sensor' }, { status: 500 })
  }
}

// DELETE /api/sensors - Delete a sensor
export async function DELETE(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request, 'tenant_admin')
    const { searchParams } = new URL(request.url)
    const sensorId = searchParams.get('sensor_id')

    if (!sensorId) {
      return NextResponse.json({ error: 'sensor_id is required' }, { status: 400 })
    }

    // Verify sensor belongs to organization
    const { data: existingSensor, error: checkError } = await supabaseAdmin
      .from('sensor_metadata')
      .select('id')
      .eq('id', sensorId)
      .eq('organization_id', auth.organizationId)
      .single()

    if (checkError || !existingSensor) {
      return NextResponse.json({ error: 'Sensor not found or access denied' }, { status: 404 })
    }

    // Delete sensor (cascade will delete related data)
    const { error } = await supabaseAdmin
      .from('sensor_metadata')
      .delete()
      .eq('id', sensorId)

    if (error) throw error

    return NextResponse.json({ message: 'Sensor deleted successfully' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    console.error('Error deleting sensor:', error)
    return NextResponse.json({ error: 'Failed to delete sensor' }, { status: 500 })
  }
}