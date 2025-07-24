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

      return response.json();
    });
  }

  /**
   * Collect people counting data from Milesight sensor
   */
  async collectMilesightData(sensor) {
    // Use the API endpoint from sensor config or default
    const endpoint = sensor.config?.api_endpoint || '/dataloader.cgi';
    const data = await this.fetchData(sensor, endpoint);
    
    // Parse Milesight response - it returns array of line data
    let totalIn = 0;
    let totalOut = 0;
    
    if (Array.isArray(data)) {
      data.forEach(line => {
        totalIn += line.in || 0;
        totalOut += line.out || 0;
      });
    } else if (data.in !== undefined || data.out !== undefined) {
      totalIn = data.in || 0;
      totalOut = data.out || 0;
    }
    
    return {
      sensor_id: sensor.id,
      store_id: sensor.store_id,
      timestamp: new Date().toISOString(),
      total_in: totalIn,
      total_out: totalOut,
      metadata: {
        sensor_type: 'milesight',
        sensor_name: sensor.sensor_name,
        ip: sensor.sensor_ip
      }
    };
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