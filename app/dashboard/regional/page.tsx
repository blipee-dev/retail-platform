'use client'

import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/components/DashboardLayout'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function RegionalDashboardPage() {
  const { profile, organization, stores, regions } = useAuth()
  const { t } = useTranslation('dashboard')

  const stats = {
    totalRegions: regions.length,
    totalStores: stores.length,
    activeStores: stores.filter(s => s.is_active).length,
    performanceScore: 87, // Will be calculated
  }

  return (
    <ProtectedRoute requiredRole="regional_manager">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Managed Regions</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalRegions}</p>
                </div>
                <div className="text-blue-500 text-2xl">🌍</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Stores</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalStores}</p>
                </div>
                <div className="text-purple-500 text-2xl">🏪</div>
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
                  <p className="text-gray-400 text-sm">Performance Score</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.performanceScore}%</p>
                </div>
                <div className="text-orange-500 text-2xl">📈</div>
              </div>
            </div>
          </div>

          {/* Regions Overview */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Your Regions</h2>
            {regions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {regions.map((region) => (
                  <div
                    key={region.id}
                    className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-white">{region.name}</h3>
                      <span className="text-xs text-gray-400">{region.code}</span>
                    </div>
                    <div className="text-sm text-gray-400 mb-3">
                      {stores.filter(s => s.region_id === region.id).length} stores
                    </div>
                    <Link
                      href={`/dashboard/regional/regions/${region.id}`}
                      className="text-sm text-purple-400 hover:text-purple-300"
                    >
                      View Details →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No regions assigned yet</p>
            )}
          </div>

          {/* Stores List */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Stores in Your Regions</h2>
              <div className="flex items-center gap-2">
                <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="">All Regions</option>
                  {regions.map(region => (
                    <option key={region.id} value={region.id}>{region.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {stores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-3 text-sm font-medium text-gray-400">Store Name</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Region</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Manager</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Status</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Performance</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => {
                      const region = regions.find(r => r.id === store.region_id)
                      return (
                        <tr key={store.id} className="border-b border-gray-800/50">
                          <td className="py-3 text-white">{store.name}</td>
                          <td className="py-3 text-gray-400">{region?.name || '-'}</td>
                          <td className="py-3 text-gray-400">-</td>
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
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{width: '75%'}}></div>
                              </div>
                              <span className="text-sm text-gray-400">75%</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <Link
                              href={`/dashboard/stores/${store.id}`}
                              className="text-purple-400 hover:text-purple-300 text-sm"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No stores in your regions yet</p>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}