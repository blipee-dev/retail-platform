import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, getOrganizationScopedClient, AuthError } from '@/app/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    console.log('🔗 Profile API called')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))
    
    // Authenticate the request and get user context
    const authContext = await authenticateRequest(request)
    
    console.log('🔍 Server-side profile fetch for:', authContext.userId)
    
    // Get organization-scoped Supabase client
    const supabase = getOrganizationScopedClient(authContext.organizationId)

    // Return the user profile (already fetched during authentication)
    const profileData = authContext.userProfile

    // Fetch organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', authContext.organizationId)
      .single()

    if (orgError) {
      console.error('❌ Organization fetch error:', orgError)
    }

    // Fetch stores based on role with proper authorization
    let storesData = []
    let regionsData = []

    if (profileData.role === 'tenant_admin' || profileData.role === 'analyst') {
      // Can see all stores in organization
      const { data: stores } = await supabase
        .from('stores')
        .select('*')
        .eq('organization_id', authContext.organizationId)
        .order('name')
      
      storesData = stores || []

    } else if (profileData.role === 'regional_manager') {
      // Fetch assigned regions and their stores
      const { data: userRegions } = await supabase
        .from('user_regions')
        .select(`
          region:regions(
            *,
            stores(*)
          )
        `)
        .eq('user_id', authContext.userId)

      regionsData = userRegions?.map(ur => ur.region) || []
      storesData = regionsData.flatMap(region => region.stores || [])

    } else {
      // Fetch only assigned stores
      const { data: userStores } = await supabase
        .from('user_stores')
        .select(`
          store:stores(*)
        `)
        .eq('user_id', authContext.userId)

      storesData = userStores?.map(us => us.store) || []
    }

    console.log('✅ Server-side profile fetch successful')

    return NextResponse.json({
      profile: profileData,
      organization: orgData,
      stores: storesData,
      regions: regionsData
    })

  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }
    
    console.error('❌ Server-side profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}