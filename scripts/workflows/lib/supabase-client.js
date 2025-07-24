const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

class SupabaseClient {
  constructor() {
    if (!config.supabase.url || !config.supabase.serviceKey) {
      throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.client = createClient(config.supabase.url, config.supabase.serviceKey);
  }

  /**
   * Get active sensors with health status
   */
  async getActiveSensors() {
    const { data, error } = await this.client
      .from('sensor_metadata')
      .select(`
        *,
        stores!inner(
          id,
          name,
          timezone,
          organizations!inner(
            id,
            name
          )
        )
      `)
      .in('status', ['online', 'warning'])
      .order('sensor_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get sensor by ID
   */
  async getSensor(sensorId) {
    const { data, error } = await this.client
      .from('sensor_metadata')
      .select(`
        *,
        stores!inner(
          id,
          name,
          timezone
        )
      `)
      .eq('sensor_id', sensorId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update sensor health status
   */
  async updateSensorHealth(sensorId, health) {
    const { error } = await this.client
      .from('sensor_metadata')
      .update({
        status: health.status,
        last_data_received: health.lastDataReceived,
        consecutive_failures: health.consecutiveFailures,
        offline_since: health.offlineSince
      })
      .eq('sensor_id', sensorId);

    if (error) throw error;
  }

  /**
   * Insert sensor data
   */
  async insertSensorData(data) {
    const { error } = await this.client
      .from('people_counting_raw')
      .insert(data);

    if (error) throw error;
  }

  /**
   * Insert regional data
   */
  async insertRegionalData(data) {
    const { error } = await this.client
      .from('regional_counting_raw')
      .insert(data);

    if (error) throw error;
  }

  /**
   * Create alert
   */
  async createAlert(alert) {
    const { error } = await this.client
      .from('alerts')
      .insert({
        organization_id: alert.organizationId,
        store_id: alert.storeId,
        sensor_id: alert.sensorId,
        alert_type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metadata: alert.metadata
      });

    if (error) throw error;
  }

  /**
   * Log to sensor health history
   */
  async logSensorHealth(sensorId, status, responseTime, recordsCollected) {
    const { error } = await this.client
      .from('sensor_health_log')
      .insert({
        sensor_id: sensorId,
        status: status,
        response_time_ms: responseTime,
        records_collected: recordsCollected
      });

    if (error) throw error;
  }

  /**
   * Check if data exists for time range
   */
  async hasDataForTimeRange(table, startTime, endTime) {
    const { count, error } = await this.client
      .from(table)
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startTime)
      .lte('timestamp', endTime);

    if (error) throw error;
    return count > 0;
  }
}

module.exports = { SupabaseClient };