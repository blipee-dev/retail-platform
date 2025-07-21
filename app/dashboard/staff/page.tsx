'use client'

import { useAuth } from '@/app/providers/auth-provider'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import DashboardLayout from '@/app/components/DashboardLayout'
import Link from 'next/link'
import { useTranslation } from '@/app/i18n/client'

export default function StaffDashboardPage() {
  const { profile, organization, stores } = useAuth()
  const { t } = useTranslation('dashboard')

  // Staff typically assigned to one store
  const myStore = stores[0]

  const todayStats = {
    currentVisitors: 47,
    todayTotal: 234,
    peakHour: '2:00 PM',
    alerts: 2,
  }

  return (
    <ProtectedRoute requiredRole="store_staff">
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {myStore ? (
            <>
              {/* Store Info */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 mb-8">
                <h1 className="text-2xl font-bold text-white">{myStore.name}</h1>
                <p className="text-gray-400 mt-1">Staff Dashboard</p>
              </div>

              {/* Today's Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Current Visitors</p>
                      <p className="text-3xl font-bold text-white mt-1">{todayStats.currentVisitors}</p>
                      <p className="text-xs text-gray-400 mt-1">In store now</p>
                    </div>
                    <div className="text-green-500 text-2xl">🚶</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Today's Total</p>
                      <p className="text-3xl font-bold text-white mt-1">{todayStats.todayTotal}</p>
                      <p className="text-xs text-gray-400 mt-1">Since opening</p>
                    </div>
                    <div className="text-blue-500 text-2xl">👥</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Peak Hour</p>
                      <p className="text-2xl font-bold text-white mt-1">{todayStats.peakHour}</p>
                      <p className="text-xs text-gray-400 mt-1">Busiest time</p>
                    </div>
                    <div className="text-orange-500 text-2xl">⏰</div>
                  </div>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Alerts</p>
                      <p className="text-3xl font-bold text-white mt-1">{todayStats.alerts}</p>
                      <p className="text-xs text-yellow-400 mt-1">Needs attention</p>
                    </div>
                    <div className="text-yellow-500 text-2xl">⚠️</div>
                  </div>
                </div>
              </div>

              {/* Current Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Live Occupancy */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Store Occupancy</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Entrance Area</span>
                        <span className="text-white text-sm">12 people</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{width: '40%'}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Main Floor</span>
                        <span className="text-white text-sm">28 people</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{width: '70%'}}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-sm">Checkout Area</span>
                        <span className="text-white text-sm">7 people</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div className="bg-blue-500 h-3 rounded-full" style={{width: '25%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Recent Alerts</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="text-yellow-500">⚠️</div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Queue forming at checkout</p>
                        <p className="text-gray-400 text-xs mt-1">Consider opening register 3</p>
                      </div>
                      <span className="text-xs text-gray-400">5 min ago</span>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-blue-500">ℹ️</div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">High traffic expected</p>
                        <p className="text-gray-400 text-xs mt-1">Based on historical data for this time</p>
                      </div>
                      <span className="text-xs text-gray-400">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">📱</div>
                    <span className="text-sm text-gray-300">Report Issue</span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">📋</div>
                    <span className="text-sm text-gray-300">View Schedule</span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">💬</div>
                    <span className="text-sm text-gray-300">Team Chat</span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors">
                    <div className="text-2xl mb-2">📊</div>
                    <span className="text-sm text-gray-300">Daily Report</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 text-center">
              <div className="text-6xl mb-4">🏪</div>
              <h2 className="text-xl font-semibold text-white mb-2">No Store Assigned</h2>
              <p className="text-gray-400">Please contact your manager to assign you to a store.</p>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}