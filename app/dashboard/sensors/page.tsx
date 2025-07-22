'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'

export default function SensorsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [sensors, setSensors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [registering, setRegistering] = useState(false)

  // J&J Sensor configuration
  const jjSensorConfig = {
    sensor_name: "J&J - 01 - ArrábidaShopping",
    sensor_ip: "176.79.62.167",
    sensor_port: 2102,
    sensor_type: "milesight_people_counter",
    location: "J&J Store - ArrábidaShopping",
    timezone: "Europe/Lisbon",
    config: {
      auth: {
        type: "basic",
        username: "admin",
        password: "grnl.2024"
      },
      supports_regional_counting: true,
      line_count: 4,
      region_count: 4
    },
    store_id: "6c4283e0-c8fc-45f3-808e-5e1a69ae3987" // Default store ID for testing
  }

  useEffect(() => {
    if (!user) {
      router.push('/signin')
      return
    }
    fetchSensors()
  }, [user])

  const fetchSensors = async () => {
    try {
      const response = await fetch('/api/sensors')

      if (!response.ok) {
        throw new Error('Failed to fetch sensors')
      }

      const data = await response.json()
      setSensors(data.sensors || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sensors')
    } finally {
      setLoading(false)
    }
  }

  const registerJJSensor = async () => {
    setRegistering(true)
    setError('')

    try {
      const response = await fetch('/api/sensors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(jjSensorConfig)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to register sensor')
      }

      // Refresh sensor list
      await fetchSensors()
      alert('Sensor registered successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register sensor')
    } finally {
      setRegistering(false)
    }
  }

  const viewSensorData = (sensorId: string) => {
    router.push(`/dashboard/sensors/${sensorId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sensors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Sensor Management</h1>
              {sensors.length === 0 && (
                <button
                  onClick={registerJJSensor}
                  disabled={registering}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? 'Registering...' : 'Register J&J Sensor'}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {sensors.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sensors registered</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by registering your first sensor.</p>
              </div>
            ) : (
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sensor Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IP Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Seen
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sensors.map((sensor) => (
                      <tr key={sensor.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {sensor.sensor_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sensor.location}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sensor.sensor_ip}:{sensor.sensor_port}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            sensor.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {sensor.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {sensor.last_seen_at 
                            ? new Date(sensor.last_seen_at).toLocaleString()
                            : 'Never'
                          }
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => viewSensorData(sensor.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Data
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}