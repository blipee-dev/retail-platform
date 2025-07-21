'use client'

import { CookiesProvider } from 'react-cookie'
import { AuthProvider } from './auth-provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CookiesProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </CookiesProvider>
  )
}