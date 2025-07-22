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

    const results = {
      organizations: [],
      stores: [],
      errors: []
    }

    // Step 1: Create organizations
    try {
      // Jack & Jones
      const { data: jjOrg, error: jjError } = await supabase
        .from('organizations')
        .insert({
          name: 'Jack & Jones',
          slug: 'jack-jones',
          subscription_tier: 'professional',
          subscription_status: 'active',
          settings: {}
        })
        .select()
        .single()

      if (jjError) {
        results.errors.push({ step: 'J&J org', error: jjError })
      } else {
        results.organizations.push(jjOrg)
      }

      // Omnia
      const { data: omniaOrg, error: omniaError } = await supabase
        .from('organizations')
        .insert({
          name: 'Omnia',
          slug: 'omnia',
          subscription_tier: 'enterprise',
          subscription_status: 'active',
          settings: {}
        })
        .select()
        .single()

      if (omniaError) {
        results.errors.push({ step: 'Omnia org', error: omniaError })
      } else {
        results.organizations.push(omniaOrg)
      }
    } catch (e) {
      results.errors.push({ step: 'Organizations', error: e.message })
    }

    // Step 2: Create stores
    try {
      const jjOrg = results.organizations.find(o => o.slug === 'jack-jones')
      const omniaOrg = results.organizations.find(o => o.slug === 'omnia')

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
          results.errors.push({ step: 'J&J store', error: jjStoreError })
        } else {
          results.stores.push(jjStore)
        }
      }

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

        const { data: omniaStoresData, error: omniaStoresError } = await supabase
          .from('stores')
          .insert(omniaStores)
          .select()

        if (omniaStoresError) {
          results.errors.push({ step: 'Omnia stores', error: omniaStoresError })
        } else {
          results.stores.push(...omniaStoresData)
        }
      }
    } catch (e) {
      results.errors.push({ step: 'Stores', error: e.message })
    }

    return NextResponse.json({
      message: 'Setup completed',
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