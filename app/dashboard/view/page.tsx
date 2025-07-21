'use client'

import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/components/DashboardLayout'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function ViewerDashboardPage() {
  const { profile, organization, stores } = useAuth()
  const { t } = useTranslation('dashboard')

  return (
    <ProtectedRoute requiredRole="viewer">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 mb-8 text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to {organization?.name}
            </h1>
            <p className="text-gray-400 text-lg">
              View-only access to retail analytics and reports
            </p>
          </div>

          {/* Organization Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Stores</p>
                  <p className="text-3xl font-bold text-white mt-1">{stores.length}</p>
                </div>
                <div className="text-blue-500 text-2xl">🏪</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Stores</p>
                  <p className="text-3xl font-bold text-white mt-1">
                    {stores.filter(s => s.is_active).length}
                  </p>
                </div>
                <div className="text-green-500 text-2xl">✅</div>
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Last Updated</p>
                  <p className="text-xl font-bold text-white mt-1">Just now</p>
                </div>
                <div className="text-orange-500 text-2xl">🔄</div>
              </div>
            </div>
          </div>

          {/* Available Reports */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Available Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/dashboard/view/reports/monthly"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📊</div>
                  <div>
                    <h3 className="font-medium text-white">Monthly Overview</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Aggregated metrics across all stores
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/view/reports/performance"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">📈</div>
                  <div>
                    <h3 className="font-medium text-white">Performance Trends</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Historical performance analysis
                    </p>
                  </div>
                </div>
              </Link>

              <Link
                href="/dashboard/view/reports/comparison"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">🔍</div>
                  <div>
                    <h3 className="font-medium text-white">Store Comparison</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      Compare metrics between stores
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white">New monthly report available</p>
                  <p className="text-gray-400 text-sm">Generated 2 hours ago</p>
                </div>
                <Link
                  href="/dashboard/view/reports/monthly"
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View →
                </Link>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white">Q4 performance analysis ready</p>
                  <p className="text-gray-400 text-sm">Generated yesterday</p>
                </div>
                <Link
                  href="/dashboard/view/reports/performance"
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View →
                </Link>
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-800/30 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-white">Weekly summary updated</p>
                  <p className="text-gray-400 text-sm">3 days ago</p>
                </div>
                <Link
                  href="/dashboard/view/reports/weekly"
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  View →
                </Link>
              </div>
            </div>
          </div>

          {/* Limited Access Notice */}
          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="text-blue-500">ℹ️</div>
              <div>
                <p className="text-white font-medium">View-Only Access</p>
                <p className="text-gray-400 text-sm mt-1">
                  You have read-only access to reports and analytics. Contact your administrator 
                  if you need additional permissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}