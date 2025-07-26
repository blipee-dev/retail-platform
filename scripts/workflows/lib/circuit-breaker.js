/**
 * Circuit Breaker implementation for sensor health management
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failures exceeded threshold, requests are blocked
 * - HALF_OPEN: Testing if service has recovered
 */
class CircuitBreaker {
  constructor(supabaseClient, options = {}) {
    this.supabase = supabaseClient;
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 3600000; // 1 hour default
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 1;
  }

  /**
   * Check if sensor should be processed based on circuit breaker state
   * @param {Object} sensor - Sensor metadata
   * @returns {Object} { shouldProcess: boolean, state: string, reason: string }
   */
  async shouldProcessSensor(sensor) {
    const state = this.getCircuitState(sensor);
    
    switch (state) {
      case 'CLOSED':
        return { 
          shouldProcess: true, 
          state: 'CLOSED',
          reason: 'Normal operation'
        };
        
      case 'OPEN':
        // Check if recovery timeout has passed
        const openDuration = Date.now() - new Date(sensor.offline_since).getTime();
        if (openDuration >= this.recoveryTimeout) {
          // Move to HALF_OPEN state
          console.log(`    🔄 Circuit breaker moving to HALF_OPEN for ${sensor.sensor_name}`);
          return { 
            shouldProcess: true, 
            state: 'HALF_OPEN',
            reason: 'Testing recovery after timeout'
          };
        }
        
        const remainingTime = Math.round((this.recoveryTimeout - openDuration) / 60000);
        return { 
          shouldProcess: false, 
          state: 'OPEN',
          reason: `Circuit open, retry in ${remainingTime} minutes`
        };
        
      case 'HALF_OPEN':
        // In half-open state, allow limited attempts
        const recentAttempts = sensor.recovery_attempts || 0;
        if (recentAttempts < this.halfOpenMaxAttempts) {
          return { 
            shouldProcess: true, 
            state: 'HALF_OPEN',
            reason: `Recovery attempt ${recentAttempts + 1}/${this.halfOpenMaxAttempts}`
          };
        }
        
        return { 
          shouldProcess: false, 
          state: 'HALF_OPEN',
          reason: 'Max recovery attempts reached'
        };
        
      default:
        return { 
          shouldProcess: true, 
          state: 'UNKNOWN',
          reason: 'Unknown state, proceeding with caution'
        };
    }
  }

  /**
   * Determine circuit breaker state based on sensor metadata
   */
  getCircuitState(sensor) {
    const failures = sensor.consecutive_failures || 0;
    const isOffline = sensor.status === 'offline';
    const hasOfflineTime = !!sensor.offline_since;
    
    if (failures >= this.failureThreshold && isOffline) {
      // Check if we're in recovery phase
      if (sensor.recovery_attempts > 0) {
        return 'HALF_OPEN';
      }
      return 'OPEN';
    }
    
    return 'CLOSED';
  }

  /**
   * Handle successful sensor collection
   */
  async handleSuccess(sensorId) {
    try {
      // Reset circuit breaker state
      await this.supabase.updateSensorMetadata(sensorId, {
        consecutive_failures: 0,
        recovery_attempts: 0,
        offline_since: null,
        circuit_state: 'CLOSED',
        last_successful_check: new Date().toISOString()
      });
      
      console.log(`    ⚡ Circuit breaker CLOSED for sensor ${sensorId}`);
    } catch (error) {
      console.error(`    ❌ Failed to update circuit breaker state: ${error.message}`);
    }
  }

  /**
   * Handle failed sensor collection
   */
  async handleFailure(sensor, isRecoveryAttempt = false) {
    try {
      const newFailureCount = (sensor.consecutive_failures || 0) + 1;
      const updateData = {
        consecutive_failures: newFailureCount,
        last_failed_check: new Date().toISOString()
      };
      
      if (isRecoveryAttempt) {
        updateData.recovery_attempts = (sensor.recovery_attempts || 0) + 1;
      }
      
      // Open circuit if threshold reached
      if (newFailureCount >= this.failureThreshold) {
        updateData.circuit_state = 'OPEN';
        updateData.offline_since = updateData.offline_since || new Date().toISOString();
        console.log(`    ⚡ Circuit breaker OPEN for sensor ${sensor.sensor_name} after ${newFailureCount} failures`);
      }
      
      await this.supabase.updateSensorMetadata(sensor.sensor_id, updateData);
    } catch (error) {
      console.error(`    ❌ Failed to update circuit breaker state: ${error.message}`);
    }
  }

  /**
   * Get sensors currently in OPEN state
   */
  async getOpenCircuits() {
    try {
      const { data, error } = await this.supabase.client
        .from('sensor_metadata')
        .select('sensor_id, sensor_name, consecutive_failures, offline_since')
        .eq('circuit_state', 'OPEN')
        .eq('is_active', true);
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get open circuits:', error.message);
      return [];
    }
  }

  /**
   * Force close a circuit (admin override)
   */
  async forceCloseCircuit(sensorId) {
    return this.handleSuccess(sensorId);
  }
}

module.exports = { CircuitBreaker };