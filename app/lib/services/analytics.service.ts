import { createClient } from '@/app/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

export interface TimeRange {
  start: Date
  end: Date
}

export interface OccupancyData {
  total: number
  byZone: Record<string, number>
  trend: 'increasing' | 'stable' | 'decreasing'
  utilizationRate: number
  alerts: Alert[]
}

export interface CaptureRateData {
  current: number
  average: number
  trend: 'improving' | 'stable' | 'declining'
  passingTraffic: number
  storeEntries: number
}

export interface JourneyData {
  totalJourneys: number
  avgDurationMinutes: number
  conversionRate: number
  commonPaths: Path[]
  abandonmentPoints: Zone[]
}

export interface Alert {
  id: string
  type: 'capacity' | 'queue' | 'capture' | 'staff' | 'anomaly'
  severity: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
  actions?: string[]
}

export interface Path {
  sequence: string[]
  frequency: number
  conversionRate: number
}

export interface Zone {
  id: string
  name: string
  currentOccupancy: number
  activity: number
}

export class AnalyticsService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient()
  }

  async getCurrentOccupancy(storeId: string): Promise<OccupancyData> {
    try {
      // Get current occupancy from line crossing data
      const { data: recentData } = await this.supabase
        .from('people_counting_raw')
        .select('timestamp, total_in, total_out')
        .eq('sensor_id', storeId)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true })

      if (!recentData || recentData.length === 0) {
        return {
          total: 0,
          byZone: {},
          trend: 'stable',
          utilizationRate: 0,
          alerts: []
        }
      }

      // Calculate current occupancy
      const totalIn = recentData.reduce((sum, d) => sum + (d.total_in || 0), 0)
      const totalOut = recentData.reduce((sum, d) => sum + (d.total_out || 0), 0)
      const currentOccupancy = Math.max(0, totalIn - totalOut)

      // Get zone data if available
      const { data: zoneData } = await this.supabase
        .from('v_regional_status')
        .select('region_name, current_occupancy')
        .eq('store_id', storeId)

      const byZone = zoneData?.reduce((acc, zone) => {
        acc[zone.region_name] = zone.current_occupancy || 0
        return acc
      }, {} as Record<string, number>) || {}

      // Calculate trend
      const recentOccupancy = this.calculateRecentOccupancy(recentData.slice(-10))
      const previousOccupancy = this.calculateRecentOccupancy(recentData.slice(-20, -10))
      const trend = this.determineTrend(previousOccupancy, recentOccupancy)

      // Check for alerts
      const alerts = await this.checkOccupancyAlerts(storeId, currentOccupancy)

      // Get store capacity
      const { data: storeInfo } = await this.supabase
        .from('stores')
        .select('capacity')
        .eq('id', storeId)
        .single()

      const capacity = storeInfo?.capacity || 200 // Default capacity
      const utilizationRate = currentOccupancy / capacity

      return {
        total: currentOccupancy,
        byZone,
        trend,
        utilizationRate,
        alerts
      }
    } catch (error) {
      console.error('Error getting occupancy:', error)
      throw error
    }
  }

  async getCaptureRate(storeId: string, timeRange: TimeRange): Promise<CaptureRateData> {
    try {
      const { data } = await this.supabase
        .from('people_counting_raw')
        .select('timestamp, capture_rate, passing_traffic, total_in')
        .eq('sensor_id', storeId)
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString())
        .order('timestamp', { ascending: false })

      if (!data || data.length === 0) {
        return {
          current: 0,
          average: 0,
          trend: 'stable',
          passingTraffic: 0,
          storeEntries: 0
        }
      }

      const current = data[0]?.capture_rate || 0
      const average = data.reduce((sum, d) => sum + (d.capture_rate || 0), 0) / data.length
      const totalPassing = data.reduce((sum, d) => sum + (d.passing_traffic || 0), 0)
      const totalEntries = data.reduce((sum, d) => sum + (d.total_in || 0), 0)

      // Calculate trend
      const recentAvg = this.calculateAverage(data.slice(0, Math.floor(data.length / 2)), 'capture_rate')
      const olderAvg = this.calculateAverage(data.slice(Math.floor(data.length / 2)), 'capture_rate')
      const trend = this.determineCaptureRateTrend(olderAvg, recentAvg)

      return {
        current,
        average,
        trend,
        passingTraffic: totalPassing,
        storeEntries: totalEntries
      }
    } catch (error) {
      console.error('Error getting capture rate:', error)
      throw error
    }
  }

  async getJourneyAnalytics(storeId: string): Promise<JourneyData> {
    try {
      const { data: journeys } = await this.supabase
//         .from('customer_journeys')
//         .select('*')
//         .eq('store_id', storeId)
//         .gte('start_time', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
// 
//       if (!journeys || journeys.length === 0) {
//         return {
//           totalJourneys: 0,
//           avgDurationMinutes: 0,
//           conversionRate: 0,
//           commonPaths: [],
//           abandonmentPoints: []
//         }
//       }
// 
//       const totalJourneys = journeys.length
//       const conversions = journeys.filter(j => j.conversion).length
//       const conversionRate = conversions / totalJourneys
// 
//       const avgDurationSeconds = journeys.reduce((sum, j) => sum + (j.total_duration_seconds || 0), 0) / totalJourneys
//       const avgDurationMinutes = Math.round(avgDurationSeconds / 60)

      // Extract common paths
      const pathMap = new Map<string, { count: number; conversions: number }>()
      journeys.forEach(journey => {
        if (journey.path && Array.isArray(journey.path)) {
          const pathKey = journey.path.map((p: any) => p.region_id).join(' → ')
          const existing = pathMap.get(pathKey) || { count: 0, conversions: 0 }
          existing.count++
          if (journey.conversion) existing.conversions++
          pathMap.set(pathKey, existing)
        }
      })

      const commonPaths = Array.from(pathMap.entries())
        .map(([sequence, stats]) => ({
          sequence: sequence.split(' → '),
          frequency: stats.count,
          conversionRate: stats.conversions / stats.count
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5)

      // Find abandonment points
      const abandonmentPoints = await this.findAbandonmentPoints(storeId)

      return {
        totalJourneys,
        avgDurationMinutes,
        conversionRate,
        commonPaths,
        abandonmentPoints
      }
    } catch (error) {
      console.error('Error getting journey analytics:', error)
      throw error
    }
  }

  async getPredictions(storeId: string, horizon: number = 4): Promise<any> {
    // This would integrate with your ML models
    // For now, return mock predictions
    const predictions = []
    for (let i = 1; i <= horizon; i++) {
      predictions.push({
        timestamp: new Date(Date.now() + i * 60 * 60 * 1000),
        predictedTraffic: Math.floor(Math.random() * 100) + 50,
        predictedOccupancy: Math.floor(Math.random() * 150) + 30,
        confidence: 0.85 - (i * 0.1)
      })
    }

    return {
      traffic: predictions,
      peakTime: predictions.reduce((max, p) => p.predictedTraffic > max.predictedTraffic ? p : max).timestamp,
      recommendations: this.generatePredictiveRecommendations(predictions)
    }
  }

  private calculateRecentOccupancy(data: any[]): number {
    if (!data.length) return 0
    const totalIn = data.reduce((sum, d) => sum + (d.total_in || 0), 0)
    const totalOut = data.reduce((sum, d) => sum + (d.total_out || 0), 0)
    return Math.max(0, totalIn - totalOut)
  }

  private determineTrend(previous: number, current: number): 'increasing' | 'stable' | 'decreasing' {
    const changePercent = ((current - previous) / previous) * 100
    if (changePercent > 10) return 'increasing'
    if (changePercent < -10) return 'decreasing'
    return 'stable'
  }

  private determineCaptureRateTrend(previous: number, current: number): 'improving' | 'stable' | 'declining' {
    const changePercent = ((current - previous) / previous) * 100
    if (changePercent > 5) return 'improving'
    if (changePercent < -5) return 'declining'
    return 'stable'
  }

  private calculateAverage(data: any[], field: string): number {
    if (!data.length) return 0
    return data.reduce((sum, d) => sum + (d[field] || 0), 0) / data.length
  }

  private async checkOccupancyAlerts(storeId: string, currentOccupancy: number): Promise<Alert[]> {
    const alerts: Alert[] = []

    // Get store capacity
    const { data: storeInfo } = await this.supabase
      .from('stores')
      .select('capacity')
      .eq('id', storeId)
      .single()

    const capacity = storeInfo?.capacity || 200

    // Check capacity alert
    if (currentOccupancy > capacity * 0.9) {
      alerts.push({
        id: `capacity-${Date.now()}`,
        type: 'capacity',
        severity: currentOccupancy >= capacity ? 'critical' : 'warning',
        message: `Store at ${Math.round((currentOccupancy / capacity) * 100)}% capacity`,
        timestamp: new Date(),
        actions: ['Implement crowd control', 'Monitor entrances', 'Prepare queue management']
      })
    }

    return alerts
  }

  private async findAbandonmentPoints(storeId: string): Promise<Zone[]> {
    // This would analyze journey data to find where people commonly leave
    // For now, return mock data
    return [
      { id: 'zone-2', name: 'Main Shopping Floor', currentOccupancy: 45, activity: 0.3 },
      { id: 'zone-4', name: 'Premium Section', currentOccupancy: 12, activity: 0.1 }
    ]
  }

  private generatePredictiveRecommendations(predictions: any[]): string[] {
    const recommendations: string[] = []
    
    const peakTraffic = Math.max(...predictions.map(p => p.predictedTraffic))
    if (peakTraffic > 150) {
      recommendations.push('Schedule additional staff for predicted peak hours')
      recommendations.push('Prepare queue management strategies')
    }

    const avgOccupancy = predictions.reduce((sum, p) => sum + p.predictedOccupancy, 0) / predictions.length
    if (avgOccupancy < 50) {
      recommendations.push('Consider promotional activities to drive traffic')
      recommendations.push('Optimize staff scheduling for lower traffic periods')
    }

    return recommendations
  }
}