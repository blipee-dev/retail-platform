import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/app/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Setup Jack & Jones tenant
    const jjOrgId = '12345678-1234-1234-1234-123456789012'
    
    // Insert organization
    const { data: jjOrg, error: jjOrgError } = await supabase
      .from('organizations')
      .upsert({
        id: jjOrgId,
        name: 'Jack & Jones',
        slug: 'jack-jones',
        type: 'retail',
        subscription_tier: 'professional',
        subscription_status: 'active',
        is_active: true
      })
      .select()
      .single()

    if (jjOrgError) {
      console.error('Error creating J&J org:', jjOrgError)
    }

    // Insert J&J store
    const { data: jjStore, error: jjStoreError } = await supabase
      .from('stores')
      .upsert({
        organization_id: jjOrgId,
        name: 'J&J - 01 - ArrábidaShopping',
        code: 'JJ-ARR-01',
        address: 'ArrábidaShopping, Porto',
        city: 'Porto',
        country: 'Portugal',
        timezone: 'Europe/Lisbon',
        opening_hours: JSON.stringify({
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '22:00' }
        }),
        metadata: JSON.stringify({
          floor_area_sqm: 150,
          store_type: 'mall',
          mall_name: 'ArrábidaShopping'
        }),
        is_active: true
      })
      .select()

    if (jjStoreError) {
      console.error('Error creating J&J store:', jjStoreError)
    }

    // Setup Omnia tenant
    const omniaOrgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    
    // Insert Omnia organization
    const { data: omniaOrg, error: omniaOrgError } = await supabase
      .from('organizations')
      .upsert({
        id: omniaOrgId,
        name: 'Omnia',
        slug: 'omnia',
        type: 'retail',
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        is_active: true
      })
      .select()
      .single()

    if (omniaOrgError) {
      console.error('Error creating Omnia org:', omniaOrgError)
    }

    // Insert Omnia stores
    const omniaStores = [
      {
        organization_id: omniaOrgId,
        name: 'OML01 - Omnia Guimarães Shopping',
        code: 'OML01',
        address: 'Guimarães Shopping',
        city: 'Guimarães',
        country: 'Portugal',
        timezone: 'Europe/Lisbon',
        opening_hours: JSON.stringify({
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '22:00' }
        }),
        metadata: JSON.stringify({
          floor_area_sqm: 200,
          store_type: 'mall',
          mall_name: 'Guimarães Shopping'
        }),
        is_active: true
      },
      {
        organization_id: omniaOrgId,
        name: 'OML02 - Omnia Fórum Almada',
        code: 'OML02',
        address: 'Fórum Almada',
        city: 'Almada',
        country: 'Portugal',
        timezone: 'Europe/Lisbon',
        opening_hours: JSON.stringify({
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '22:00' }
        }),
        metadata: JSON.stringify({
          floor_area_sqm: 180,
          store_type: 'mall',
          mall_name: 'Fórum Almada'
        }),
        is_active: true
      },
      {
        organization_id: omniaOrgId,
        name: 'OML03 - Omnia NorteShopping',
        code: 'OML03',
        address: 'NorteShopping',
        city: 'Porto',
        country: 'Portugal',
        timezone: 'Europe/Lisbon',
        opening_hours: JSON.stringify({
          monday: { open: '10:00', close: '22:00' },
          tuesday: { open: '10:00', close: '22:00' },
          wednesday: { open: '10:00', close: '22:00' },
          thursday: { open: '10:00', close: '22:00' },
          friday: { open: '10:00', close: '23:00' },
          saturday: { open: '10:00', close: '23:00' },
          sunday: { open: '10:00', close: '22:00' }
        }),
        metadata: JSON.stringify({
          floor_area_sqm: 220,
          store_type: 'mall',
          mall_name: 'NorteShopping'
        }),
        is_active: true
      }
    ]

    const { data: omniaStoresData, error: omniaStoresError } = await supabase
      .from('stores')
      .upsert(omniaStores)
      .select()

    if (omniaStoresError) {
      console.error('Error creating Omnia stores:', omniaStoresError)
    }

    // Get all stores to register sensors
    const { data: allStores, error: storesError } = await supabase
      .from('stores')
      .select('*')

    if (storesError) {
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
    }

    // Register sensors
    const sensorRegistrations = []
    
    // J&J sensor
    const jjStoreRecord = allStores?.find(s => s.name === 'J&J - 01 - ArrábidaShopping')
    if (jjStoreRecord) {
      sensorRegistrations.push({
        sensor_id: '188.82.28.148:2102',
        store_id: jjStoreRecord.id,
        sensor_name: 'J&J-ARR-01-PC',
        sensor_type: 'milesight_people_counter',
        manufacturer: 'Milesight',
        model: 'VS121',
        ip_address: '188.82.28.148',
        port: 2102,
        api_endpoint: '/dataloader.cgi',
        location_in_store: 'Main Entrance',
        installation_date: new Date().toISOString(),
        configuration: JSON.stringify({
          lines: [
            { id: 1, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 2, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 3, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 4, purpose: 'passing_traffic', direction: 'bidirectional' }
          ],
          regions: []
        }),
        is_active: true,
        last_seen: new Date().toISOString()
      })
    }

    // Omnia sensors
    const omniaStoreMap = {
      'OML01 - Omnia Guimarães Shopping': { ip: '93.108.96.96', port: 21001 },
      'OML02 - Omnia Fórum Almada': { ip: '188.37.175.41', port: 2201 },
      'OML03 - Omnia NorteShopping': { ip: '188.37.124.33', port: 21002 }
    }

    for (const [storeName, sensorInfo] of Object.entries(omniaStoreMap)) {
      const store = allStores?.find(s => s.name === storeName)
      if (store) {
        sensorRegistrations.push({
          sensor_id: `${sensorInfo.ip}:${sensorInfo.port}`,
          store_id: store.id,
          sensor_name: `${store.code}-PC`,
          sensor_type: 'milesight_people_counter',
          manufacturer: 'Milesight',
          model: 'VS121',
          ip_address: sensorInfo.ip,
          port: sensorInfo.port,
          api_endpoint: '/dataloader.cgi',
          location_in_store: 'Main Entrance',
          installation_date: new Date().toISOString(),
          configuration: JSON.stringify({
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
          }),
          is_active: true,
          last_seen: new Date().toISOString()
        })
      }
    }

    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .upsert(sensorRegistrations)
      .select()

    if (sensorsError) {
      console.error('Error registering sensors:', sensorsError)
    }

    return NextResponse.json({
      message: 'Tenants setup completed',
      organizations: 2,
      stores: allStores?.length || 0,
      sensors: sensors?.length || 0,
      details: {
        stores: allStores?.map(s => ({ id: s.id, name: s.name })),
        sensors: sensors?.map(s => ({ id: s.sensor_id, store_id: s.store_id }))
      }
    })
  } catch (error) {
    console.error('Error in tenant setup:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}