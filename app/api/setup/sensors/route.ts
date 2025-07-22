import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get all stores with their organizations
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('*, organization:organizations(*)')

    if (storesError) {
      return NextResponse.json({ error: 'Failed to fetch stores', details: storesError }, { status: 500 })
    }

    const sensorRegistrations = []
    
    // J&J sensor
    const jjStore = stores?.find(s => s.code === 'JJ-ARR-01')
    if (jjStore) {
      sensorRegistrations.push({
        store_id: jjStore.id,
        organization_id: jjStore.organization_id,
        sensor_name: 'J&J-ARR-01-PC',
        sensor_ip: '176.79.62.167',
        sensor_port: 2102,
        sensor_type: 'milesight_people_counter',
        location: 'Main Entrance',
        config: {
          external_id: '176.79.62.167:2102',
          manufacturer: 'Milesight',
          model: 'VS121',
          api_endpoint: '/dataloader.cgi',
          credentials: {
            username: 'admin',
            password: 'grnl.2024'
          },
          lines: [
            { id: 1, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 2, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 3, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 4, purpose: 'passing_traffic', direction: 'bidirectional' }
          ],
          regions: []
        }
      })
    }

    // Omnia sensors
    const omniaStoreMap = {
      'OML01': { ip: '93.108.96.96', port: 21001 },
      'OML02': { ip: '188.37.175.41', port: 2201 },
      'OML03': { ip: '188.37.124.33', port: 21002 }
    }

    for (const [storeCode, sensorInfo] of Object.entries(omniaStoreMap)) {
      const store = stores?.find(s => s.code === storeCode)
      if (store) {
        sensorRegistrations.push({
          store_id: store.id,
          organization_id: store.organization_id,
          sensor_name: `${storeCode}-PC`,
          sensor_ip: sensorInfo.ip,
          sensor_port: sensorInfo.port,
          sensor_type: 'milesight_people_counter',
          location: 'Main Entrance',
          config: {
            external_id: `${sensorInfo.ip}:${sensorInfo.port}`,
            manufacturer: 'Milesight',
            model: 'VS121',
            api_endpoint: '/dataloader.cgi',
            credentials: {
              username: 'admin',
              password: 'grnl.2024'
            },
            lines: [
              { id: 1, purpose: 'store_entry', direction: 'bidirectional' },
              { id: 2, purpose: 'store_entry', direction: 'bidirectional' },
              { id: 3, purpose: 'store_entry', direction: 'bidirectional' },
              { id: 4, purpose: 'passing_traffic', direction: 'bidirectional' }
            ],
            regions: [
              { id: 1, name: 'Entrance Area', type: 'traffic' },
              { id: 2, name: 'Checkout Area', type: 'queue' },
              { id: 3, name: 'Product Display', type: 'dwell' },
              { id: 4, name: 'Fitting Rooms', type: 'service' }
            ]
          }
        })
      }
    }

    // Insert sensors
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .upsert(sensorRegistrations, { onConflict: 'sensor_ip,sensor_port' })
      .select()

    if (sensorsError) {
      return NextResponse.json({ 
        error: 'Failed to register sensors',
        details: sensorsError 
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Sensors registered successfully',
      count: sensors?.length || 0,
      sensors: sensors?.map(s => ({
        id: s.id,
        sensor_name: s.sensor_name,
        sensor_ip: s.sensor_ip,
        sensor_port: s.sensor_port,
        store_id: s.store_id,
        external_id: s.config?.external_id
      }))
    })
  } catch (error) {
    console.error('Error in sensor setup:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}