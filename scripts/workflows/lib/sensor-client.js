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
   * Get local time for a timezone
   */
  getLocalTime(timezone, date = new Date()) {
    try {
      // Use date-fns-tz to get the local time
      const { utcToZonedTime, format } = require('date-fns-tz');
      
      // Convert UTC to the target timezone
      const zonedTime = utcToZonedTime(date, timezone);
      
      return {
        localTime: zonedTime,
        localHour: zonedTime.getHours(),
        formatted: format(zonedTime, 'yyyy-MM-dd HH:mm:ss zzz', { timeZone: timezone })
      };
    } catch (e) {
      console.log(`    ⚠️  Could not calculate local time for ${timezone}: ${e.message}`);
      
      // Fallback: return UTC
      return {
        localTime: date,
        localHour: date.getUTCHours(),
        formatted: date.toISOString()
      };
    }
  }

  /**
   * Probe sensor to detect timezone offset
   */
  async probeSensorTime(sensor) {
    const nowUTC = new Date();
    
    // First, check if we have timezone from store configuration
    if (sensor.stores?.timezone) {
      const configuredOffset = this.getTimezoneOffset(sensor.stores.timezone);
      console.log(`    📍 Using store timezone: ${sensor.stores.timezone} (UTC${configuredOffset >= 0 ? '+' : ''}${configuredOffset})`);
      return { offsetHours: configuredOffset, sensorTime: nowUTC };
    }
    
    // Otherwise, try to detect from sensor data
    const oneHourAgo = new Date(nowUTC.getTime() - 60 * 60 * 1000);
    
    const formatDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    try {
      const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(oneHourAgo)}&time_end=${formatDate(nowUTC)}`;
      const data = await this.fetchData(sensor, endpoint);
      
      if (typeof data === 'string') {
        const lines = data.trim().split('\n');
        if (lines.length >= 2) {
          const parts = lines[1].split(',').map(p => p.trim());
          if (parts.length >= 2) {
            const sensorTime = new Date(parts[0].replace(/\//g, '-'));
            const offsetMs = sensorTime.getTime() - nowUTC.getTime();
            const offsetHours = Math.round(offsetMs / (60 * 60 * 1000));
            return { offsetHours, sensorTime };
          }
        }
      }
    } catch (e) {
      console.log(`    ⚠️  Could not probe sensor time: ${e.message}`);
    }
    
    // Default: use UTC
    console.log(`    ⚠️  Could not determine timezone, defaulting to UTC`);
    return { offsetHours: 0, sensorTime: nowUTC };
  }

  /**
   * Collect people counting data from Milesight sensor
   */
  async collectMilesightData(sensor) {
    // Get current time
    const nowUTC = new Date();
    
    // Get local time based on store timezone
    let localTimeInfo;
    if (sensor.stores?.timezone) {
      localTimeInfo = this.getLocalTime(sensor.stores.timezone, nowUTC);
      console.log(`    📍 Store timezone: ${sensor.stores.timezone}`);
      console.log(`    🕐 Local time: ${localTimeInfo.formatted}`);
    } else {
      // Fallback to probe sensor for timezone
      const probeData = await this.probeSensorTime(sensor);
      console.log(`    🕐 Sensor timezone offset: ${probeData.offsetHours} hours from UTC`);
      
      const sensorLocalNow = new Date(nowUTC.getTime() + (probeData.offsetHours * 60 * 60 * 1000));
      localTimeInfo = {
        localTime: sensorLocalNow,
        localHour: sensorLocalNow.getHours(),
        formatted: this.formatLocalTime(sensorLocalNow)
      };
    }
    
    // Check if within business hours (9:00 AM to 1:00 AM next day)
    // 1:00 AM to 9:00 AM is outside business hours
    if (localTimeInfo.localHour >= 1 && localTimeInfo.localHour < 9) {
      console.log(`    ⏰ Outside business hours (${localTimeInfo.localHour}:00 local time). Skipping.`);
      return [];
    }
    
    const sensorLocalNow = localTimeInfo.localTime;
    
    // Round to complete hour periods
    // End time: Current hour at HH:59:59
    const queryEndTime = new Date(sensorLocalNow);
    queryEndTime.setMinutes(59, 59, 999);
    
    // Start time: 3 hours ago at HH:00:00
    const queryStartTime = new Date(sensorLocalNow.getTime() - 3 * 60 * 60 * 1000);
    queryStartTime.setMinutes(0, 0, 0);
    
    console.log(`    📍 Querying from: ${this.formatLocalTime(queryStartTime)} to ${this.formatLocalTime(queryEndTime)}`);
    
    // Format date for Milesight API
    const formatDate = (date) => {
      const pad = (n) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };
    
    // Build endpoint with query parameters
    const endpoint = `/dataloader.cgi?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(queryStartTime)}&time_end=${formatDate(queryEndTime)}`;
    
    const data = await this.fetchData(sensor, endpoint);
    
    // Calculate offset hours for parsing
    const offsetHours = Math.round((sensorLocalNow.getTime() - nowUTC.getTime()) / (60 * 60 * 1000));
    
    // Parse CSV response
    if (typeof data === 'string') {
      const parseRecords = (csvData, offsetHours, localNow, localThreeHoursAgo) => {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
          return { records: [], skippedFuture: 0, skippedOld: 0 };
        }
        
        const records = [];
        let skippedFuture = 0;
        let skippedOld = 0;
        
        // Skip header, process data lines
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          
          if (parts.length >= 17) {
            try {
              // Parse timestamp as sensor local time
              const sensorTimestamp = new Date(parts[0].replace(/\//g, '-'));
              const sensorEndTime = new Date(parts[1].replace(/\//g, '-'));
              
              // Skip future data (according to sensor local time)
              if (sensorTimestamp > localNow) {
                console.log(`      ⏭️  Skipping future record: ${this.formatLocalTime(sensorTimestamp)}`);
                skippedFuture++;
                continue;
              }
              
              // Skip data older than 3 hours (in sensor local time)
              if (sensorTimestamp < localThreeHoursAgo) {
                skippedOld++;
                continue;
              }
              
              // Convert to UTC for database storage
              const utcTimestamp = new Date(sensorTimestamp.getTime() - (offsetHours * 60 * 60 * 1000));
              const utcEndTime = new Date(sensorEndTime.getTime() - (offsetHours * 60 * 60 * 1000));
              
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
                timestamp: utcTimestamp.toISOString(),
                end_time: utcEndTime.toISOString(),
                line1_in: line1In,
                line1_out: line1Out,
                line2_in: line2In,
                line2_out: line2Out,
                line3_in: line3In,
                line3_out: line3Out,
                line4_in: line4In,
                line4_out: line4Out,
                // Don't include total_in/total_out - they are computed columns
                _original_timestamp: sensorTimestamp, // Keep for duplicate checking
                _utc_timestamp: utcTimestamp
              });
            } catch (e) {
              console.error(`    Error parsing line ${i}: ${e.message}`);
            }
          }
        }
        
        return { records, skippedFuture, skippedOld };
      };
      
      const result = parseRecords(data, offsetHours, sensorLocalNow, queryStartTime);
      
      if (result.skippedFuture > 0 || result.skippedOld > 0) {
        console.log(`      📊 Filtered: ${result.skippedFuture} future, ${result.skippedOld} old records`);
      }
      
      return result.records;
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
   * Format local time for display
   */
  formatLocalTime(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
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