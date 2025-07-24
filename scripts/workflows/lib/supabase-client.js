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
   * Insert sensor data with duplicate checking
   */
  async insertSensorData(data) {
    // Check if record already exists
    const { data: existing, error: checkError } = await this.client
      .from('people_counting_raw')
      .select('id')
      .eq('sensor_id', data.sensor_id)
      .eq('timestamp', data.timestamp)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw checkError;
    }

    if (existing) {
      // Update existing record
      const { error } = await this.client
        .from('people_counting_raw')
        .update({
          line1_in: data.line1_in,
          line1_out: data.line1_out,
          line2_in: data.line2_in,
          line2_out: data.line2_out,
          line3_in: data.line3_in,
          line3_out: data.line3_out,
          line4_in: data.line4_in,
          line4_out: data.line4_out
        })
        .eq('id', existing.id);

      if (error) throw error;
      return { action: 'updated', id: existing.id };
    } else {
      // Insert new record
      const { data: inserted, error } = await this.client
        .from('people_counting_raw')
        .insert(data)
        .select('id')
        .single();

      if (error) throw error;
      return { action: 'inserted', id: inserted.id };
    }
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
    try {
      // First, let's check if the table exists by attempting a simple insert
      // If it fails, we'll handle it gracefully
      const { error } = await this.client
        .from('sensor_health_log')
        .insert({
          sensor_id: sensorId,
          status: status,
          response_time_ms: responseTime,
          checked_at: new Date().toISOString()
          // Note: records_collected column might not exist, so we're not including it
        });

      if (error) {
        // If the table doesn't exist or has different columns, log to console
        console.log(`    Health log: ${status} in ${responseTime}ms (table error: ${error.message})`);
        
        // But don't throw - we still want the collection to succeed
        // The sensor status is already updated in sensor_metadata table
        return;
      }
      
      console.log(`    Health logged: ${status} in ${responseTime}ms`);
    } catch (err) {
      // Fail silently for health logging - don't break the collection
      console.log(`    Health log: ${status} in ${responseTime}ms (skipped)`);
    }
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