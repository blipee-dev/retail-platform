import { createClient } from '@/app/lib/supabase'
import { SupabaseClient } from '@supabase/supabase-js'

export interface LineCrossingData {
  sensor_id: string
  timestamp: string
  line1_in: number
  line1_out: number
  line2_in: number
  line2_out: number
  line3_in: number
  line3_out: number
  line4_in: number
  line4_out: number
  total_in?: number
  total_out?: number
  passing_traffic?: number
  capture_rate?: number
}

export interface RegionalCountData {
  sensor_id: string
  timestamp: string
  regions: Array<{
    region_id: string
    count: number
    person_ids?: string[]
  }>
}

export interface EntranceExitData {
  sensor_id: string
  timestamp: string
  events: Array<{
    person_id: string
    region_id: string
    event_type: 'entrance' | 'exit'
    confidence?: number
  }>
}

export interface ProcessingResult {
  success: boolean
  metrics?: {
    occupancy?: number
    captureRate?: number
    alerts?: any[]
  }
  error?: string
}

export class AnalyticsProcessor {
  private supabase: SupabaseClient
  private alertThresholds: Map<string, any>

  constructor() {
    this.supabase = createClient()
    this.alertThresholds = new Map()
    this.loadAlertThresholds()
  }

  private async loadAlertThresholds() {
    try {
      const { data: stores } = await this.supabase
        .from('stores')
        .select('id, capacity, alert_settings')
      
      stores?.forEach(store => {
        this.alertThresholds.set(store.id, {
          capacity: store.capacity || 200,
          ...store.alert_settings
        })
      })
    } catch (error) {
      console.error('Error loading alert thresholds:', error)
    }
  }

  async processLineCrossing(data: LineCrossingData): Promise<ProcessingResult> {
    try {
      // Calculate derived metrics if not provided
      if (!data.total_in) {
        data.total_in = data.line1_in + data.line2_in + data.line3_in
      }
      if (!data.total_out) {
        data.total_out = data.line1_out + data.line2_out + data.line3_out
      }
      if (!data.passing_traffic) {
        data.passing_traffic = data.line4_in + data.line4_out
      }
      if (!data.capture_rate && data.passing_traffic > 0) {
        data.capture_rate = (data.total_in / data.passing_traffic) * 100
      }

      // Insert raw data
      const { error: insertError } = await this.supabase
        .from('people_counting_data')
        .insert({
          sensor_id: data.sensor_id,
          timestamp: data.timestamp,
          ...data
        })

      if (insertError) {
        console.error('Error inserting line crossing data:', insertError)
        return { success: false, error: insertError.message }
      }

      // Calculate current metrics
      const metrics = await this.calculateMetrics(data.sensor_id)
      
      // Check for alerts
      const alerts = await this.checkAlerts(data.sensor_id, metrics)
      
      // Update dashboard in real-time
      await this.updateDashboard(data.sensor_id, metrics, alerts)

      return {
        success: true,
        metrics: {
          ...metrics,
          alerts
        }
      }
    } catch (error) {
      console.error('Error processing line crossing:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async processRegionalCount(data: RegionalCountData): Promise<ProcessingResult> {
    try {
      // Insert regional counts
      const inserts = data.regions.map(region => ({
        sensor_id: data.sensor_id,
        timestamp: data.timestamp,
        region_id: region.region_id,
        count: region.count,
        person_ids: region.person_ids || []
      }))

      const { error: insertError } = await this.supabase
        .from('regional_counts')
        .insert(inserts)

      if (insertError) {
        console.error('Error inserting regional counts:', insertError)
        return { success: false, error: insertError.message }
      }

      // Check for queue alerts
      const queueAlerts = await this.checkQueueAlerts(data)
      
      // Update zone occupancy
      await this.updateZoneOccupancy(data)

      return {
        success: true,
        metrics: {
          alerts: queueAlerts
        }
      }
    } catch (error) {
      console.error('Error processing regional count:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  async processEntranceExit(data: EntranceExitData): Promise<ProcessingResult> {
    try {
      // Process each event
      for (const event of data.events) {
        // Insert entrance/exit event
        const { error: eventError } = await this.supabase
          .from('entrance_exit_events')
          .insert({
            sensor_id: data.sensor_id,
            timestamp: data.timestamp,
            ...event
          })

        if (eventError) {
          console.error('Error inserting entrance/exit event:', eventError)
          continue
        }

        // Update or create journey
        if (event.event_type === 'entrance') {
          await this.startJourney(data.sensor_id, event)
        } else {
          await this.endJourney(data.sensor_id, event)
        }
      }

      // Recalculate occupancy
      const metrics = await this.calculateMetrics(data.sensor_id)

      return {
        success: true,
        metrics
      }
    } catch (error) {
      console.error('Error processing entrance/exit:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async calculateMetrics(sensorId: string): Promise<any> {
    try {
      // Get store info
      const { data: sensor } = await this.supabase
        .from('sensor_metadata')
        .select('store_id')
        .eq('id', sensorId)
        .single()

      if (!sensor) return {}

      // Calculate occupancy using database function
      const { data: occupancyData } = await this.supabase
        .rpc('calculate_current_occupancy', { p_store_id: sensor.store_id })

      // Get recent capture rate
      const { data: recentData } = await this.supabase
        .from('people_counting_data')
        .select('capture_rate, passing_traffic, total_in')
        .eq('sensor_id', sensorId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      return {
        occupancy: occupancyData?.total_occupancy || 0,
        captureRate: recentData?.capture_rate || 0,
        passingTraffic: recentData?.passing_traffic || 0,
        storeEntries: recentData?.total_in || 0
      }
    } catch (error) {
      console.error('Error calculating metrics:', error)
      return {}
    }
  }

  private async checkAlerts(sensorId: string, metrics: any): Promise<any[]> {
    const alerts = []
    
    try {
      // Get store thresholds
      const { data: sensor } = await this.supabase
        .from('sensor_metadata')
        .select('store_id')
        .eq('id', sensorId)
        .single()

      if (!sensor) return alerts

      const thresholds = this.alertThresholds.get(sensor.store_id) || {}

      // Occupancy alerts
      if (metrics.occupancy > thresholds.capacity * 0.9) {
        alerts.push({
          type: 'capacity',
          severity: metrics.occupancy >= thresholds.capacity ? 'critical' : 'warning',
          message: `Store at ${Math.round((metrics.occupancy / thresholds.capacity) * 100)}% capacity`,
          timestamp: new Date(),
          actions: ['Implement crowd control', 'Monitor entrances']
        })
      }

      // Capture rate alerts
      if (metrics.captureRate < (thresholds.minCaptureRate || 15)) {
        alerts.push({
          type: 'capture',
          severity: 'warning',
          message: `Low capture rate: ${metrics.captureRate.toFixed(1)}%`,
          timestamp: new Date(),
          actions: ['Check window displays', 'Review entrance visibility']
        })
      }

      // Save alerts to database
      for (const alert of alerts) {
        await this.supabase
          .from('analytics_alerts')
          .insert({
            sensor_id: sensorId,
            alert_type: alert.type,
            severity: alert.severity,
            message: alert.message,
            triggered_at: alert.timestamp
          })
      }
    } catch (error) {
      console.error('Error checking alerts:', error)
    }

    return alerts
  }

  private async checkQueueAlerts(data: RegionalCountData): Promise<any[]> {
    const alerts = []
    
    try {
      // Get queue regions
      const { data: queueRegions } = await this.supabase
        .from('regions')
        .select('*')
        .eq('store_id', data.sensor_id)
        .eq('type', 'queue')

      for (const region of queueRegions || []) {
        const regionData = data.regions.find(r => r.region_id === region.id)
        if (!regionData) continue

        // Check queue length
        if (regionData.count > (region.max_queue_length || 10)) {
          alerts.push({
            type: 'queue',
            severity: 'warning',
            message: `Long queue in ${region.name}: ${regionData.count} people`,
            timestamp: new Date(),
            region_id: region.id,
            actions: ['Open additional checkouts', 'Deploy queue management']
          })

          // Save queue analytics
          await this.supabase
            .from('queue_analytics')
            .insert({
              store_id: data.sensor_id,
              region_id: region.id,
              timestamp: data.timestamp,
              queue_length: regionData.count,
              estimated_wait_time: regionData.count * 60 // 1 minute per person estimate
            })
        }
      }
    } catch (error) {
      console.error('Error checking queue alerts:', error)
    }

    return alerts
  }

  private async updateZoneOccupancy(data: RegionalCountData) {
    try {
      // Update occupancy for each region
      for (const region of data.regions) {
        await this.supabase
          .from('regional_counts')
          .insert({
            sensor_id: data.sensor_id,
            region_id: region.region_id,
            timestamp: data.timestamp,
            count: region.count
          })
      }
    } catch (error) {
      console.error('Error updating zone occupancy:', error)
    }
  }

  private async startJourney(sensorId: string, event: any) {
    try {
      const { data: sensor } = await this.supabase
        .from('sensor_metadata')
        .select('store_id, organization_id')
        .eq('id', sensorId)
        .single()

      if (!sensor) return

      await this.supabase
        .from('customer_journeys')
        .insert({
          store_id: sensor.store_id,
          organization_id: sensor.organization_id,
          person_id: event.person_id,
          start_time: event.timestamp,
          entry_region_id: event.region_id,
          is_active: true,
          path: [{
            region_id: event.region_id,
            timestamp: event.timestamp,
            event_type: 'entrance'
          }]
        })
    } catch (error) {
      console.error('Error starting journey:', error)
    }
  }

  private async endJourney(sensorId: string, event: any) {
    try {
      const { data: journey, error } = await this.supabase
        .from('customer_journeys')
        .select('*')
        .eq('person_id', event.person_id)
        .eq('is_active', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      if (error || !journey) return

      const duration = Math.floor(
        (new Date(event.timestamp).getTime() - new Date(journey.start_time).getTime()) / 1000
      )

      await this.supabase
        .from('customer_journeys')
        .update({
          end_time: event.timestamp,
          exit_region_id: event.region_id,
          total_duration_seconds: duration,
          is_active: false,
          path: [...(journey.path || []), {
            region_id: event.region_id,
            timestamp: event.timestamp,
            event_type: 'exit'
          }]
        })
        .eq('id', journey.id)
    } catch (error) {
      console.error('Error ending journey:', error)
    }
  }

  private async updateDashboard(sensorId: string, metrics: any, alerts: any[]) {
    // This would typically emit events or update a real-time database
    // For now, we'll just log the update
    console.log('Dashboard update:', {
      sensorId,
      timestamp: new Date(),
      metrics,
      alerts: alerts.length
    })
  }
}