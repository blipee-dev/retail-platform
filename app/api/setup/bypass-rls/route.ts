import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Missing Supabase credentials',
        details: 'SUPABASE_SERVICE_ROLE_KEY is required' 
      }, { status: 500 })
    }

    // Create admin client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Setting up tenants with service role...')

    // Setup Jack & Jones tenant
    const jjOrgId = '12345678-1234-1234-1234-123456789012'
    
    // Insert organization
    const { data: jjOrg, error: jjOrgError } = await supabase
      .from('organizations')
      .insert({
        id: jjOrgId,
        name: 'Jack & Jones',
        slug: 'jack-jones',
        subscription_tier: 'professional',
        subscription_status: 'active',
        settings: {}
      })
      .select()
      .single()

    if (jjOrgError) {
      console.error('Error creating J&J org:', jjOrgError)
      return NextResponse.json({ 
        error: 'Failed to create J&J organization',
        details: jjOrgError 
      }, { status: 500 })
    }

    console.log('Created J&J organization:', jjOrg)

    // Insert J&J store
    const { data: jjStore, error: jjStoreError } = await supabase
      .from('stores')
      .insert({
        organization_id: jjOrgId,
        name: 'J&J - 01 - ArrábidaShopping',
        code: 'JJ-ARR-01',
        address: 'ArrábidaShopping, Porto',
        timezone: 'Europe/Lisbon',
        metadata: {
          city: 'Porto',
          country: 'Portugal',
          floor_area_sqm: 150,
          store_type: 'mall',
          mall_name: 'ArrábidaShopping',
          opening_hours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '22:00' }
          }
        }
      })
      .select()
      .single()

    if (jjStoreError) {
      console.error('Error creating J&J store:', jjStoreError)
      return NextResponse.json({ 
        error: 'Failed to create J&J store',
        details: jjStoreError 
      }, { status: 500 })
    }

    console.log('Created J&J store:', jjStore)

    // Setup Omnia tenant
    const omniaOrgId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    
    // Insert Omnia organization
    const { data: omniaOrg, error: omniaOrgError } = await supabase
      .from('organizations')
      .insert({
        id: omniaOrgId,
        name: 'Omnia',
        slug: 'omnia',
        subscription_tier: 'enterprise',
        subscription_status: 'active',
        settings: {}
      })
      .select()
      .single()

    if (omniaOrgError) {
      console.error('Error creating Omnia org:', omniaOrgError)
      return NextResponse.json({ 
        error: 'Failed to create Omnia organization',
        details: omniaOrgError 
      }, { status: 500 })
    }

    console.log('Created Omnia organization:', omniaOrg)

    // Insert Omnia stores
    const omniaStores = [
      {
        organization_id: omniaOrgId,
        name: 'OML01 - Omnia Guimarães Shopping',
        code: 'OML01',
        address: 'Guimarães Shopping',
        timezone: 'Europe/Lisbon',
        metadata: {
          city: 'Guimarães',
          country: 'Portugal',
          floor_area_sqm: 200,
          store_type: 'mall',
          mall_name: 'Guimarães Shopping',
          opening_hours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '22:00' }
          }
        }
      },
      {
        organization_id: omniaOrgId,
        name: 'OML02 - Omnia Fórum Almada',
        code: 'OML02',
        address: 'Fórum Almada',
        timezone: 'Europe/Lisbon',
        metadata: {
          city: 'Almada',
          country: 'Portugal',
          floor_area_sqm: 180,
          store_type: 'mall',
          mall_name: 'Fórum Almada',
          opening_hours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '22:00' }
          }
        }
      },
      {
        organization_id: omniaOrgId,
        name: 'OML03 - Omnia NorteShopping',
        code: 'OML03',
        address: 'NorteShopping',
        timezone: 'Europe/Lisbon',
        metadata: {
          city: 'Porto',
          country: 'Portugal',
          floor_area_sqm: 220,
          store_type: 'mall',
          mall_name: 'NorteShopping',
          opening_hours: {
            monday: { open: '10:00', close: '22:00' },
            tuesday: { open: '10:00', close: '22:00' },
            wednesday: { open: '10:00', close: '22:00' },
            thursday: { open: '10:00', close: '22:00' },
            friday: { open: '10:00', close: '23:00' },
            saturday: { open: '10:00', close: '23:00' },
            sunday: { open: '10:00', close: '22:00' }
          }
        }
      }
    ]

    const { data: omniaStoresData, error: omniaStoresError } = await supabase
      .from('stores')
      .insert(omniaStores)
      .select()

    if (omniaStoresError) {
      console.error('Error creating Omnia stores:', omniaStoresError)
      return NextResponse.json({ 
        error: 'Failed to create Omnia stores',
        details: omniaStoresError 
      }, { status: 500 })
    }

    console.log('Created Omnia stores:', omniaStoresData)

    // Get all stores to register sensors
    const { data: allStores, error: storesError } = await supabase
      .from('stores')
      .select('*')

    if (storesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch stores',
        details: storesError 
      }, { status: 500 })
    }

    // Register sensors
    const sensorRegistrations = []
    
    // J&J sensor
    const jjStoreRecord = allStores?.find(s => s.name === 'J&J - 01 - ArrábidaShopping')
    if (jjStoreRecord) {
      sensorRegistrations.push({
        sensor_id: '176.79.62.167:2102',
        store_id: jjStoreRecord.id,
        sensor_name: 'J&J-ARR-01-PC',
        sensor_type: 'milesight_people_counter',
        manufacturer: 'Milesight',
        model: 'VS121',
        ip_address: '176.79.62.167',
        port: 2102,
        api_endpoint: '/dataloader.cgi',
        location_in_store: 'Main Entrance',
        installation_date: new Date().toISOString(),
        configuration: {
          lines: [
            { id: 1, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 2, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 3, purpose: 'store_entry', direction: 'bidirectional' },
            { id: 4, purpose: 'passing_traffic', direction: 'bidirectional' }
          ],
          regions: []
        },
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
          configuration: {
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
          },
          is_active: true,
          last_seen: new Date().toISOString()
        })
      }
    }

    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .insert(sensorRegistrations)
      .select()

    if (sensorsError) {
      console.error('Error registering sensors:', sensorsError)
      return NextResponse.json({ 
        error: 'Failed to register sensors',
        details: sensorsError 
      }, { status: 500 })
    }

    console.log('Registered sensors:', sensors)

    return NextResponse.json({
      message: 'Tenants setup completed successfully!',
      organizations: 2,
      stores: allStores?.length || 0,
      sensors: sensors?.length || 0,
      details: {
        stores: allStores?.map(s => ({ id: s.id, name: s.name })),
        sensors: sensors?.map(s => ({ id: s.sensor_id, store_id: s.store_id, name: s.sensor_name }))
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