'use client'

import { useEffect, useState } from 'react'
import { AnalyticsService, OccupancyData, CaptureRateData, JourneyData, Alert } from '@/app/lib/services/analytics.service'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { AlertCircle, TrendingUp, TrendingDown, Users, ShoppingCart, Activity } from 'lucide-react'
import { formatSensorTime, getStoreTimezone } from '@/app/lib/utils/date-formatter'

interface RealTimeDashboardProps {
  storeId: string
}

interface Metrics {
  occupancy?: OccupancyData
  captureRate?: CaptureRateData
  journeys?: JourneyData
  predictions?: any
}

export function RealTimeDashboard({ storeId }: RealTimeDashboardProps) {
  const [metrics, setMetrics] = useState<Metrics>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [storeData, setStoreData] = useState<any>(null)
  const analytics = new AnalyticsService()

  useEffect(() => {
    // Initial load
    loadMetrics()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(loadMetrics, 30000)

    // WebSocket for immediate updates (when implemented)
    // const ws = new WebSocket(`/api/analytics/stream?storeId=${storeId}`)
    // ws.onmessage = (event) => {
    //   const update = JSON.parse(event.data)
    //   setMetrics(prev => ({ ...prev, ...update }))
    // }

    return () => {
      clearInterval(interval)
      // ws.close()
    }
  }, [storeId])

  const loadMetrics = async () => {
    try {
      setError(null)
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      const [occupancy, captureRate, journeys, predictions] = await Promise.all([
        analytics.getCurrentOccupancy(storeId),
        analytics.getCaptureRate(storeId, { start: todayStart, end: now }),
        analytics.getJourneyAnalytics(storeId),
        analytics.getPredictions(storeId, 4)
      ])

      setMetrics({ occupancy, captureRate, journeys, predictions })
      setLoading(false)
    } catch (err) {
      console.error('Error loading metrics:', err)
      setError('Failed to load analytics data')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {metrics.occupancy?.alerts && metrics.occupancy.alerts.length > 0 && (
        <AlertsSection alerts={metrics.occupancy.alerts} />
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Occupancy"
          value={metrics.occupancy?.total || 0}
          subtext={`${Math.round((metrics.occupancy?.utilizationRate || 0) * 100)}% capacity`}
          trend={metrics.occupancy?.trend}
          icon={<Users className="h-4 w-4" />}
          color="blue"
        />

        <MetricCard
          title="Capture Rate"
          value={`${metrics.captureRate?.current.toFixed(1) || 0}%`}
          subtext={`Avg: ${metrics.captureRate?.average.toFixed(1) || 0}%`}
          trend={metrics.captureRate?.trend}
          icon={<Activity className="h-4 w-4" />}
          color="green"
        />

        <MetricCard
          title="Conversion Rate"
          value={`${((metrics.journeys?.conversionRate || 0) * 100).toFixed(1)}%`}
          subtext={`${metrics.journeys?.totalJourneys || 0} visitors today`}
          icon={<ShoppingCart className="h-4 w-4" />}
          color="purple"
        />

        <MetricCard
          title="Avg Visit Duration"
          value={`${metrics.journeys?.avgDurationMinutes || 0}m`}
          subtext="Customer dwell time"
          icon={<Activity className="h-4 w-4" />}
          color="orange"
        />
      </div>

      {/* Detailed Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Occupancy by Zone */}
        <Card>
          <CardHeader>
            <CardTitle>Zone Occupancy</CardTitle>
          </CardHeader>
          <CardContent>
            <ZoneOccupancy zones={metrics.occupancy?.byZone || {}} />
          </CardContent>
        </Card>

        {/* Traffic Flow */}
        <Card>
          <CardHeader>
            <CardTitle>Traffic Flow Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <TrafficFlow 
              entries={metrics.captureRate?.storeEntries || 0}
              passing={metrics.captureRate?.passingTraffic || 0}
            />
          </CardContent>
        </Card>

        {/* Customer Journeys */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Customer Paths</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerPaths paths={metrics.journeys?.commonPaths || []} />
          </CardContent>
        </Card>

        {/* Predictions */}
        <Card>
          <CardHeader>
            <CardTitle>Next 4 Hours Forecast</CardTitle>
          </CardHeader>
          <CardContent>
            <Predictions data={metrics.predictions} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Sub-components
function AlertsSection({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${
            alert.severity === 'critical' 
              ? 'bg-red-50 border-red-200' 
              : alert.severity === 'warning'
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <div className="flex items-start">
            <AlertCircle className={`h-5 w-5 mt-0.5 mr-3 ${
              alert.severity === 'critical' 
                ? 'text-red-600' 
                : alert.severity === 'warning'
                ? 'text-yellow-600'
                : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <p className={`font-medium ${
                alert.severity === 'critical' 
                  ? 'text-red-800' 
                  : alert.severity === 'warning'
                  ? 'text-yellow-800'
                  : 'text-blue-800'
              }`}>
                {alert.message}
              </p>
              {alert.actions && alert.actions.length > 0 && (
                <ul className="mt-1 text-sm text-gray-600">
                  {alert.actions.map((action, idx) => (
                    <li key={idx}>• {action}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MetricCard({ 
  title, 
  value, 
  subtext, 
  trend, 
  icon, 
  color = 'gray' 
}: {
  title: string
  value: string | number
  subtext?: string
  trend?: string
  icon?: React.ReactNode
  color?: string
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100',
    gray: 'text-gray-600 bg-gray-100'
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'increasing' || trend === 'improving' ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : trend === 'decreasing' || trend === 'declining' ? (
                  <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                ) : null}
                <span className="text-sm text-gray-600">{trend}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ZoneOccupancy({ zones }: { zones: Record<string, number> }) {
  const maxOccupancy = Math.max(...Object.values(zones), 1)

  return (
    <div className="space-y-3">
      {Object.entries(zones).map(([name, count]) => (
        <div key={name}>
          <div className="flex justify-between text-sm mb-1">
            <span>{name}</span>
            <span className="font-medium">{count} people</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(count / maxOccupancy) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function TrafficFlow({ entries, passing }: { entries: number; passing: number }) {
  const captureRate = passing > 0 ? (entries / passing) * 100 : 0

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-600">Passing Traffic</p>
          <p className="text-xl font-semibold">{passing}</p>
        </div>
        <div className="text-center">
          <div className="text-2xl">→</div>
          <p className="text-sm text-green-600 font-medium">{captureRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Store Entries</p>
          <p className="text-xl font-semibold">{entries}</p>
        </div>
      </div>
    </div>
  )
}

function CustomerPaths({ paths }: { paths: any[] }) {
  if (paths.length === 0) {
    return <p className="text-gray-500 text-sm">No journey data available yet</p>
  }

  return (
    <div className="space-y-2">
      {paths.map((path, idx) => (
        <div key={idx} className="flex items-center justify-between">
          <div className="flex items-center flex-1">
            <span className="text-sm text-gray-600 mr-2">#{idx + 1}</span>
            <div className="flex items-center space-x-1 text-sm">
              {path.sequence.map((zone: string, i: number) => (
                <React.Fragment key={i}>
                  <span className="px-2 py-1 bg-gray-100 rounded">{zone}</span>
                  {i < path.sequence.length - 1 && <span>→</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="text-right ml-4">
            <p className="text-sm font-medium">{path.frequency} visits</p>
            <p className="text-xs text-gray-500">{(path.conversionRate * 100).toFixed(0)}% convert</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function Predictions({ data }: { data: any }) {
  if (!data || !data.traffic) {
    return <p className="text-gray-500 text-sm">Loading predictions...</p>
  }

  // Get store timezone from context or default to browser timezone
  const storeTimezone = getStoreTimezone(null)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {data.traffic.map((pred: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {formatSensorTime(pred.timestamp, storeTimezone)}
            </span>
            <div className="flex items-center space-x-4">
              <span className="text-sm">
                <span className="font-medium">{pred.predictedTraffic}</span> visitors
              </span>
              <span className="text-sm">
                <span className="font-medium">{pred.predictedOccupancy}</span> occupancy
              </span>
              <span className="text-xs text-gray-500">
                {(pred.confidence * 100).toFixed(0)}% conf
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="pt-3 border-t">
          <p className="text-sm font-medium mb-2">Recommendations</p>
          <ul className="space-y-1">
            {data.recommendations.map((rec: string, idx: number) => (
              <li key={idx} className="text-sm text-gray-600">• {rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Re-export the component as default
export default RealTimeDashboard