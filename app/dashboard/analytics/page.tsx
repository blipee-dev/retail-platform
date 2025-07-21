'use client'

import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/components/DashboardLayout'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function AnalyticsDashboardPage() {
  const { profile, organization, stores } = useAuth()
  const { t } = useTranslation('dashboard')

  const stats = {
    totalDataPoints: '1.2M',
    reportsGenerated: 47,
    avgAccuracy: 99.2,
    lastUpdate: '5 min ago',
  }

  return (
    <ProtectedRoute requiredRole="analyst">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Data Points</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.totalDataPoints}</p>
                  <p className="text-xs text-gray-400 mt-1">This month</p>
                </div>
                <div className="text-blue-500 text-2xl">📊</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Reports Generated</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.reportsGenerated}</p>
                  <p className="text-xs text-gray-400 mt-1">Last 30 days</p>
                </div>
                <div className="text-purple-500 text-2xl">📑</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Data Accuracy</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.avgAccuracy}%</p>
                  <p className="text-xs text-green-400 mt-1">Excellent</p>
                </div>
                <div className="text-green-500 text-2xl">✅</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Last Update</p>
                  <p className="text-3xl font-bold text-white mt-1">{stats.lastUpdate}</p>
                  <p className="text-xs text-gray-400 mt-1">Real-time sync</p>
                </div>
                <div className="text-orange-500 text-2xl">🔄</div>
              </div>
            </div>
          </div>

          {/* Quick Analysis Tools */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Analysis Tools</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/dashboard/analytics/reports/new"
                className="flex flex-col items-center justify-center p-6 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">📈</div>
                <span className="text-sm text-gray-300">Create Report</span>
              </Link>

              <Link
                href="/dashboard/analytics/compare"
                className="flex flex-col items-center justify-center p-6 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">🔍</div>
                <span className="text-sm text-gray-300">Compare Stores</span>
              </Link>

              <Link
                href="/dashboard/analytics/trends"
                className="flex flex-col items-center justify-center p-6 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">📊</div>
                <span className="text-sm text-gray-300">Trend Analysis</span>
              </Link>

              <Link
                href="/dashboard/analytics/export"
                className="flex flex-col items-center justify-center p-6 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <div className="text-3xl mb-2">💾</div>
                <span className="text-sm text-gray-300">Export Data</span>
              </Link>
            </div>
          </div>

          {/* Store Performance Overview */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Store Performance Overview</h2>
              <select className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>

            {stores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-800">
                      <th className="pb-3 text-sm font-medium text-gray-400">Store</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Visitors</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Conversion</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Avg Dwell Time</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Trend</th>
                      <th className="pb-3 text-sm font-medium text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stores.map((store) => (
                      <tr key={store.id} className="border-b border-gray-800/50">
                        <td className="py-3 text-white">{store.name}</td>
                        <td className="py-3 text-gray-400">2,341</td>
                        <td className="py-3">
                          <span className="text-green-400">4.2%</span>
                        </td>
                        <td className="py-3 text-gray-400">12.5 min</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <span className="text-green-400">↑</span>
                            <span className="text-sm text-gray-400">+12%</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/dashboard/analytics/stores/${store.id}`}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Analyze
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">No stores available for analysis</p>
            )}
          </div>

          {/* Recent Reports */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Reports</h2>
              <Link
                href="/dashboard/analytics/reports"
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <p className="text-white font-medium">Monthly Performance Report</p>
                    <p className="text-gray-400 text-sm">All stores • Generated 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">View</Link>
                  <span className="text-gray-600">|</span>
                  <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">Download</Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔥</div>
                  <div>
                    <p className="text-white font-medium">Heat Map Analysis - Q4</p>
                    <p className="text-gray-400 text-sm">Downtown stores • Generated 5 days ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">View</Link>
                  <span className="text-gray-600">|</span>
                  <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">Download</Link>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📈</div>
                  <div>
                    <p className="text-white font-medium">Customer Journey Analysis</p>
                    <p className="text-gray-400 text-sm">Store #042 • Generated 1 week ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">View</Link>
                  <span className="text-gray-600">|</span>
                  <Link href="#" className="text-purple-400 hover:text-purple-300 text-sm">Download</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}