'use client'

import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/components/DashboardLayout'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function StoreDashboardPage() {
  const { profile, organization, stores } = useAuth()
  const { t } = useTranslation('dashboard')

  // Store manager typically manages one store
  const myStore = stores[0]

  const stats = {
    todayVisitors: 342,
    weeklyVisitors: 2341,
    conversionRate: 4.2,
    avgDwellTime: 12.5,
  }

  return (
    <ProtectedRoute requiredRole="store_manager">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {myStore ? (
            <>
              {/* Store Header */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{myStore.name}</h1>
                    <p className="text-gray-400 mt-1">{myStore.address || 'No address set'}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex px-3 py-1 text-sm rounded-full ${
                      myStore.is_active
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {myStore.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <Link
                      href={`/dashboard/store/settings`}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Store Settings
                    </Link>
                  </div>
                </div>
              </div>

              {/* Today's Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Today's Visitors</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.todayVisitors}</p>
                      <p className="text-xs text-green-400 mt-1">+12% vs yesterday</p>
                    </div>
                    <div className="text-blue-500 text-2xl">👥</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Weekly Visitors</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.weeklyVisitors}</p>
                      <p className="text-xs text-gray-400 mt-1">This week</p>
                    </div>
                    <div className="text-purple-500 text-2xl">📊</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Conversion Rate</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.conversionRate}%</p>
                      <p className="text-xs text-green-400 mt-1">+0.3% vs last week</p>
                    </div>
                    <div className="text-green-500 text-2xl">💰</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Avg Dwell Time</p>
                      <p className="text-3xl font-bold text-white mt-1">{stats.avgDwellTime}m</p>
                      <p className="text-xs text-gray-400 mt-1">Minutes</p>
                    </div>
                    <div className="text-orange-500 text-2xl">⏱️</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Real-time View */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Real-time View</h2>
                  <div className="bg-gray-800/50 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">📹</div>
                    <p className="text-gray-400 mb-4">Live store analytics</p>
                    <Link
                      href={`/dashboard/store/live`}
                      className="inline-flex px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Open Live View
                    </Link>
                  </div>
                </div>

                {/* Heat Map */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Today's Heat Map</h2>
                  <div className="bg-gray-800/50 rounded-lg p-8 text-center">
                    <div className="text-6xl mb-4">🔥</div>
                    <p className="text-gray-400 mb-4">Customer flow patterns</p>
                    <Link
                      href={`/dashboard/store/heatmap`}
                      className="inline-flex px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      View Heat Map
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Recent Alerts</h2>
                  <Link
                    href={`/dashboard/store/alerts`}
                    className="text-sm text-purple-400 hover:text-purple-300"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-yellow-500">⚠️</div>
                    <div className="flex-1">
                      <p className="text-white text-sm">High traffic detected in entrance area</p>
                      <p className="text-gray-400 text-xs mt-1">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-green-500">✅</div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Daily visitor target achieved</p>
                      <p className="text-gray-400 text-xs mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-gray-800/30 rounded-lg">
                    <div className="text-blue-500">ℹ️</div>
                    <div className="flex-1">
                      <p className="text-white text-sm">Sensor maintenance scheduled for tomorrow</p>
                      <p className="text-gray-400 text-xs mt-1">5 hours ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-xl font-semibold text-white mb-2">No Store Assigned</h2>
              <p className="text-gray-400">Please contact your administrator to assign you to a store.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}