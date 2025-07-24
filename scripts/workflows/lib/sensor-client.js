const fetch = require('node-fetch');
const { RetryHandler } = require('./retry-handler');
const config = require('./config');

class SensorClient {
  constructor(type) {
    // Normalize sensor types to match config
    const normalizedType = type.includes('milesight') ? 'milesight' : 
                          type.includes('omnia') ? 'omnia' : type;
    
    this.type = normalizedType;
    this.config = config.sensors[normalizedType];
    if (!this.config) {
      throw new Error(`Unknown sensor type: ${type}`);
    }
    this.retryHandler = new RetryHandler({
      maxRetries: this.config.retries,
      backoff: 'exponential'
    });
  }

  /**
   * Fetch data from sensor with retry logic
   */
  async fetchData(sensor, endpoint) {
    const port = sensor.sensor_port || 80;
    const url = `http://${sensor.sensor_ip}:${port}${endpoint}`;
    
    return this.retryHandler.execute(async () => {
      const response = await fetch(url, {
        headers: {
          'Authorization': this.config.auth,
          'Accept': 'application/json'
        },
        timeout: this.config.timeout
      });

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      const text = await response.text();
      
      // Try to parse as JSON, otherwise return text
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    });
  }

  /**
   * Collect people counting data from Milesight sensor
   */
  async collectMilesightData(sensor) {
    // Get current time for query
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    // Format date for Milesight API
    const formatDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    // Build endpoint with query parameters like the working version
    const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(threeHoursAgo)}&time_end=${formatDate(now)}`;
    
    const data = await this.fetchData(sensor, endpoint);
    
    // Parse CSV response
    if (typeof data === 'string') {
      const lines = data.trim().split('\n');
      if (lines.length < 2) {
        return [];
      }
      
      const records = [];
      
      // Skip header, process data lines
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        
        if (parts.length >= 17) {
          try {
            // Parse timestamp
            const timestamp = new Date(parts[0].replace(/\//g, '-'));
            const endTime = new Date(parts[1].replace(/\//g, '-'));
            
            const line1In = parseInt(parts[5]) || 0;
            const line1Out = parseInt(parts[6]) || 0;
            const line2In = parseInt(parts[8]) || 0;
            const line2Out = parseInt(parts[9]) || 0;
            const line3In = parseInt(parts[11]) || 0;
            const line3Out = parseInt(parts[12]) || 0;
            const line4In = parseInt(parts[14]) || 0;
            const line4Out = parseInt(parts[15]) || 0;
            
            records.push({
              sensor_id: sensor.id,  // Use UUID id, not string sensor_id
              store_id: sensor.store_id,
              organization_id: sensor.stores?.organizations?.id || sensor.organization_id,  // Get org from nested structure
              timestamp: timestamp.toISOString(),
              end_time: endTime.toISOString(),
              line1_in: line1In,
              line1_out: line1Out,
              line2_in: line2In,
              line2_out: line2Out,
              line3_in: line3In,
              line3_out: line3Out,
              line4_in: line4In,
              line4_out: line4Out
              // Don't include total_in/total_out - they are computed columns
            });
          } catch (e) {
            console.error(`    Error parsing line ${i}: ${e.message}`);
          }
        }
      }
      
      return records;
    }
    
    // Fallback for unexpected format
    return [];
  }

  /**
   * Collect regional data from Omnia sensor
   */
  async collectOmniaData(sensor) {
    const data = await this.fetchData(sensor, '/cgi-bin/sp_iptool.cgi?action=get&object=iva.info');
    
    const regions = [];
    if (data.iva && data.iva.info) {
      for (const [regionId, regionData] of Object.entries(data.iva.info)) {
        if (regionData.type === 'region' && regionData.occupancy !== undefined) {
          regions.push({
            sensor_id: sensor.id,
            store_id: sensor.store_id,
            region_id: regionId,
            region_name: regionData.name || regionId,
            timestamp: new Date().toISOString(),
            current_occupancy: parseInt(regionData.occupancy) || 0,
            metadata: {
              sensor_type: 'omnia',
              region_config: regionData.config
            }
          });
        }
      }
    }
    
    return regions;
  }

  /**
   * Main collection method
   */
  async collect(sensor) {
    const startTime = Date.now();
    
    try {
      let data;
      
      switch (this.type) {
        case 'milesight':
          data = await this.collectMilesightData(sensor);
          break;
        case 'omnia':
          data = await this.collectOmniaData(sensor);
          break;
        default:
          throw new Error(`Unsupported sensor type: ${this.type}`);
      }
      
      return {
        success: true,
        data: data,
        responseTime: Date.now() - startTime
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
}

module.exports = { SensorClient };