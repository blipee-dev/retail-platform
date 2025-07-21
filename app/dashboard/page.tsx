'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'

export default function DashboardPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && profile) {
      // Redirect based on user role
      switch (profile.role) {
        case 'tenant_admin':
          router.replace('/dashboard/admin')
          break
        case 'regional_manager':
          router.replace('/dashboard/regional')
          break
        case 'store_manager':
          router.replace('/dashboard/store')
          break
        case 'analyst':
          router.replace('/dashboard/analytics')
          break
        case 'store_staff':
          router.replace('/dashboard/staff')
          break
        case 'viewer':
          router.replace('/dashboard/view')
          break
        default:
          router.replace('/dashboard/view')
      }
    }
  }, [profile, loading, router])

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="mt-4 text-gray-400">Redirecting to your dashboard...</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}