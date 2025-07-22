'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'
import { Line } from 'react-chartjs-2'
import { formatSensorTime, formatTableDate, getStoreTimezone } from '@/app/lib/utils/date-formatter'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export default function SensorDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth()
  const router = useRouter()
  const [sensor, setSensor] = useState<any>(null)
  const [sensorData, setSensorData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [timeRange, setTimeRange] = useState('1h') // 1h, 24h, 7d
  const [dataType, setDataType] = useState('people_counting')

  useEffect(() => {
    if (!user) {
      router.push('/signin')
      return
    }
    fetchSensorDetails()
    fetchSensorData()
  }, [user, params.id, timeRange, dataType])

  const fetchSensorDetails = async () => {
    try {
      const response = await fetch('/api/sensors')

      if (!response.ok) {
        throw new Error('Failed to fetch sensor details')
      }

      const data = await response.json()
      const foundSensor = data.sensors?.find((s: any) => s.id === params.id)
      if (foundSensor) {
        setSensor(foundSensor)
      } else {
        setError('Sensor not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sensor details')
    }
  }

  const fetchSensorData = async () => {
    try {
      // Calculate time range
      const endTime = new Date()
      const startTime = new Date()
      switch (timeRange) {
        case '1h':
          startTime.setHours(startTime.getHours() - 1)
          break
        case '24h':
          startTime.setHours(startTime.getHours() - 24)
          break
        case '7d':
          startTime.setDate(startTime.getDate() - 7)
          break
      }

      const response = await fetch(`/api/sensors/data?` + new URLSearchParams({
        data_type: dataType,
        sensor_id: params.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        limit: '100'
      }))

      if (!response.ok) {
        throw new Error('Failed to fetch sensor data')
      }

      const result = await response.json()
      setSensorData(result.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sensor data')
    } finally {
      setLoading(false)
    }
  }

  const getChartData = () => {
    if (!sensorData.length) return null

    const sensorTimezone = sensor?.timezone || getStoreTimezone(null)
    const labels = sensorData.map(d => 
      formatSensorTime(d.timestamp, sensorTimezone)
    )

    if (dataType === 'people_counting') {
      return {
        labels,
        datasets: [
          {
            label: 'People In',
            data: sensorData.map(d => d.total_in || 0),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'People Out',
            data: sensorData.map(d => d.total_out || 0),
            borderColor: 'rgb(255, 99, 132)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            tension: 0.1
          }
        ]
      }
    } else if (dataType === 'regional_counting') {
      return {
        labels,
        datasets: [
          {
            label: 'Region 1',
            data: sensorData.map(d => d.region1_count || 0),
            borderColor: 'rgb(255, 206, 86)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
            tension: 0.1
          },
          {
            label: 'Region 2',
            data: sensorData.map(d => d.region2_count || 0),
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            tension: 0.1
          },
          {
            label: 'Region 3',
            data: sensorData.map(d => d.region3_count || 0),
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            tension: 0.1
          },
          {
            label: 'Region 4',
            data: sensorData.map(d => d.region4_count || 0),
            borderColor: 'rgb(255, 159, 64)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
            tension: 0.1
          }
        ]
      }
    }

    return null
  }

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: dataType === 'people_counting' ? 'People Flow' : 'Regional Occupancy'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    )
  }

  const chartData = getChartData()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {sensor?.sensor_name || 'Sensor Details'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {sensor?.location} • {sensor?.sensor_ip}:{sensor?.sensor_port} • Timezone: {sensor?.timezone || 'UTC'}
                </p>
              </div>
              <button
                onClick={() => router.push('/dashboard/sensors')}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back to sensors
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Controls */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Type
                </label>
                <select
                  value={dataType}
                  onChange={(e) => setDataType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="people_counting">People Counting</option>
                  <option value="regional_counting">Regional Counting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Range
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1h">Last Hour</option>
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        {chartData && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:p-6">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Summary Stats */}
        {sensorData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dataType === 'people_counting' ? (
              <>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total In</h3>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {sensorData.reduce((sum, d) => sum + (d.total_in || 0), 0)}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Out</h3>
                  <p className="mt-2 text-3xl font-bold text-red-600">
                    {sensorData.reduce((sum, d) => sum + (d.total_out || 0), 0)}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Net Flow</h3>
                  <p className="mt-2 text-3xl font-bold text-blue-600">
                    {sensorData.reduce((sum, d) => sum + (d.net_flow || 0), 0)}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Avg Region 1</h3>
                  <p className="mt-2 text-3xl font-bold text-yellow-600">
                    {Math.round(sensorData.reduce((sum, d) => sum + (d.region1_count || 0), 0) / sensorData.length)}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Avg Region 2</h3>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {Math.round(sensorData.reduce((sum, d) => sum + (d.region2_count || 0), 0) / sensorData.length)}
                  </p>
                </div>
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900">Total Regional</h3>
                  <p className="mt-2 text-3xl font-bold text-purple-600">
                    {sensorData.reduce((sum, d) => sum + (d.total_regional_count || 0), 0)}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {sensorData.length === 0 && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-12 text-center">
              <p className="text-gray-500">No data available for the selected time range.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}