import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Get existing organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
      .in('slug', ['jack-jones', 'omnia'])

    if (orgsError) {
      return NextResponse.json({ error: 'Failed to fetch organizations', details: orgsError }, { status: 500 })
    }

    const jjOrg = orgs?.find(o => o.slug === 'jack-jones')
    const omniaOrg = orgs?.find(o => o.slug === 'omnia')

    const results = {
      stores: [],
      errors: []
    }

    // Create J&J store
    if (jjOrg) {
      const { data: jjStore, error: jjStoreError } = await supabase
        .from('stores')
        .insert({
          organization_id: jjOrg.id,
          name: 'J&J - 01 - ArrábidaShopping',
          code: 'JJ-ARR-01',
          address: 'ArrábidaShopping, Porto',
          timezone: 'Europe/Lisbon',
          metadata: {
            city: 'Porto',
            country: 'Portugal',
            floor_area_sqm: 150,
            store_type: 'mall',
            mall_name: 'ArrábidaShopping'
          }
        })
        .select()
        .single()

      if (jjStoreError) {
        // Check if it already exists
        const { data: existing } = await supabase
          .from('stores')
          .select('*')
          .eq('code', 'JJ-ARR-01')
          .single()
        
        if (existing) {
          results.stores.push(existing)
        } else {
          results.errors.push({ step: 'J&J store', error: jjStoreError })
        }
      } else {
        results.stores.push(jjStore)
      }
    }

    // Create Omnia stores
    if (omniaOrg) {
      const omniaStores = [
        {
          organization_id: omniaOrg.id,
          name: 'OML01 - Omnia Guimarães Shopping',
          code: 'OML01',
          address: 'Guimarães Shopping',
          timezone: 'Europe/Lisbon',
          metadata: {
            city: 'Guimarães',
            country: 'Portugal',
            floor_area_sqm: 200,
            store_type: 'mall',
            mall_name: 'Guimarães Shopping'
          }
        },
        {
          organization_id: omniaOrg.id,
          name: 'OML02 - Omnia Fórum Almada',
          code: 'OML02',
          address: 'Fórum Almada',
          timezone: 'Europe/Lisbon',
          metadata: {
            city: 'Almada',
            country: 'Portugal',
            floor_area_sqm: 180,
            store_type: 'mall',
            mall_name: 'Fórum Almada'
          }
        },
        {
          organization_id: omniaOrg.id,
          name: 'OML03 - Omnia NorteShopping',
          code: 'OML03',
          address: 'NorteShopping',
          timezone: 'Europe/Lisbon',
          metadata: {
            city: 'Porto',
            country: 'Portugal',
            floor_area_sqm: 220,
            store_type: 'mall',
            mall_name: 'NorteShopping'
          }
        }
      ]

      for (const store of omniaStores) {
        const { data: omniaStore, error: omniaStoreError } = await supabase
          .from('stores')
          .insert(store)
          .select()
          .single()

        if (omniaStoreError) {
          // Check if it already exists
          const { data: existing } = await supabase
            .from('stores')
            .select('*')
            .eq('code', store.code)
            .single()
          
          if (existing) {
            results.stores.push(existing)
          } else {
            results.errors.push({ step: `Omnia store ${store.code}`, error: omniaStoreError })
          }
        } else {
          results.stores.push(omniaStore)
        }
      }
    }

    // Get all stores count
    const { count } = await supabase
      .from('stores')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      message: 'Store setup completed',
      totalStoresInDB: count,
      results
    })
  } catch (error) {
    console.error('Error in setup:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 })
  }
}