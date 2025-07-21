'use client'

import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/components/DashboardLayout'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function AdminDashboardPage() {
  const { profile, organization, stores } = useAuth()
  const { t } = useTranslation('dashboard')

  const stats = {
    totalStores: stores.length,
    activeStores: stores.filter(s => s.is_active).length,
    totalUsers: 0, // Will be fetched
    recentActivity: 0, // Will be fetched
  }

  return (
    <ProtectedRoute requiredRole="tenant_admin">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Stores</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalStores}</p>
                </div>
                <div className="text-blue-500 text-2xl">🏪</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Stores</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.activeStores}</p>
                </div>
                <div className="text-green-500 text-2xl">✅</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Users</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers}</p>
                </div>
                <div className="text-purple-500 text-2xl">👥</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Recent Activity</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.recentActivity}</p>
                </div>
                <div className="text-orange-500 text-2xl">📊</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/admin/users"
                className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">👤</div>
                <span className="text-sm text-gray-300">Manage Users</span>
              </Link>

              <Link
                href="/dashboard/admin/stores"
                className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">🏪</div>
                <span className="text-sm text-gray-300">Manage Stores</span>
              </Link>

              <Link
                href="/dashboard/sensors"
                className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">📡</div>
                <span className="text-sm text-gray-300">Manage Sensors</span>
              </Link>

              <Link
                href="/dashboard/admin/analytics"
                className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">📈</div>
                <span className="text-sm text-gray-300">View Analytics</span>
              </Link>

              <Link
                href="/dashboard/admin/settings"
                className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-2xl mb-2">⚙️</div>
                <span className="text-sm text-gray-300">Settings</span>
              </Link>
            </div>
          </div>

          {/* Stores List */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Your Stores</h2>
              <Link
                href="/dashboard/admin/stores/new"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
              >
                Add Store
              </Link>
            </div>

            {stores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-3 text-sm font-medium text-gray-400">Name</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Code</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store.id} className="border-b border-gray-800/50">
                        <td className="py-3 text-white">{store.name}</td>
                        <td className="py-3 text-gray-400">{store.code || '-'}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs rounded-full ${
                              store.is_active
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {store.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/dashboard/admin/stores/${store.id}`}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No stores yet</p>
                <Link
                  href="/dashboard/admin/stores/new"
                  className="inline-flex px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
                >
                  Create Your First Store
                </Link>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}