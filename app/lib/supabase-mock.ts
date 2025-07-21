// Mock Supabase client for build time
export function createMockClient() {
  const mockAuth = {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: null, error: new Error('Mock client') }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  }

  const mockFrom = (table: string) => ({
    select: () => mockFrom(table),
    insert: () => mockFrom(table),
    update: () => mockFrom(table),
    delete: () => mockFrom(table),
    eq: () => mockFrom(table),
    single: () => Promise.resolve({ data: null, error: new Error('Mock client') }),
    then: (resolve: any) => resolve({ data: null, error: new Error('Mock client') })
  })

  return {
    auth: mockAuth,
    from: mockFrom
  }
}