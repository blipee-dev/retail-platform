import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting sensor data collection...')

    // Get all active sensors
    const { data: sensors, error: sensorsError } = await supabase
      .from('sensor_metadata')
      .select(`
        *,
        stores (
          id,
          name,
          organization_id
        )
      `)
      .eq('is_active', true)

    if (sensorsError) {
      throw new Error(`Failed to fetch sensors: ${sensorsError.message}`)
    }

    const results = []
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Process each sensor
    for (const sensor of sensors || []) {
      try {
        console.log(`Processing sensor: ${sensor.sensor_name}`)

        // Build sensor URL - using exact format that works with curl
        const baseUrl = `http://${sensor.sensor_ip}:${sensor.sensor_port}/dataloader.cgi`
        
        // Format dates exactly like the working curl command
        const formatDate = (date: Date) => {
          const pad = (n: number) => n.toString().padStart(2, '0')
          return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
        }
        
        // Build query string exactly like curl
        const queryString = `?dw=vcalogcsv&report_type=0&statistics_type=3&linetype=31&time_start=${formatDate(twoHoursAgo)}&time_end=${formatDate(now)}`
        const fullUrl = `${baseUrl}${queryString}`

        // Create basic auth header
        const username = sensor.config?.credentials?.username || 'admin'
        const password = sensor.config?.credentials?.password || 'grnl.2024'
        const auth = btoa(`${username}:${password}`)

        console.log(`Fetching from: ${fullUrl}`)

        // Fetch data from sensor - minimal headers like curl
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`
          },
          signal: AbortSignal.timeout(45000) // 45 second timeout
        })

        if (!response.ok) {
          console.error(`Failed to fetch from ${sensor.sensor_name}: ${response.status}`)
          results.push({ 
            sensor: sensor.sensor_name, 
            status: 'failed', 
            error: `HTTP ${response.status}` 
          })
          continue
        }

        const csvData = await response.text()
        const records = parseCSVData(csvData)

        // Get last collected timestamp for this sensor
        const { data: lastRecord } = await supabase
          .from('people_counting_raw')
          .select('timestamp')
          .eq('sensor_id', sensor.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        const lastTimestamp = lastRecord?.timestamp ? new Date(lastRecord.timestamp) : null

        // Filter and insert new records
        let inserted = 0
        for (const record of records) {
          // Skip future data
          if (record.timestamp > now) continue

          // Skip old data (more than 2 hours)
          if (now.getTime() - record.timestamp.getTime() > 2 * 60 * 60 * 1000) continue

          // Skip if already collected
          if (lastTimestamp && record.timestamp <= lastTimestamp) continue

          // Skip if all zeros
          const hasData = record.line1_in + record.line1_out + record.line2_in + record.line2_out +
                         record.line3_in + record.line3_out + record.line4_in + record.line4_out > 0
          if (!hasData) continue

          // Insert record
          const { error: insertError } = await supabase
            .from('people_counting_raw')
            .insert({
              sensor_id: sensor.id,
              organization_id: sensor.organization_id,
              store_id: sensor.store_id,
              timestamp: record.timestamp.toISOString(),
              end_time: record.endTime.toISOString(),
              line1_in: record.line1_in,
              line1_out: record.line1_out,
              line2_in: record.line2_in,
              line2_out: record.line2_out,
              line3_in: record.line3_in,
              line3_out: record.line3_out,
              line4_in: record.line4_in,
              line4_out: record.line4_out
            })

          if (!insertError) {
            inserted++
          } else {
            console.error(`Insert error for ${sensor.sensor_name}:`, insertError)
          }
        }

        results.push({
          sensor: sensor.sensor_name,
          status: 'success',
          records_processed: records.length,
          records_inserted: inserted
        })

      } catch (error) {
        console.error(`Error processing ${sensor.sensor_name}:`, error)
        results.push({
          sensor: sensor.sensor_name,
          status: 'error',
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Data collection completed',
        timestamp: now.toISOString(),
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})


function parseCSVData(csv: string): any[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const records = []
  
  // Skip header, process data lines
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map(p => p.trim())
    
    if (parts.length >= 17) {
      try {
        records.push({
          timestamp: new Date(parts[0].replace(/\//g, '-')),
          endTime: new Date(parts[1].replace(/\//g, '-')),
          line1_in: parseInt(parts[5]) || 0,
          line1_out: parseInt(parts[6]) || 0,
          line2_in: parseInt(parts[8]) || 0,
          line2_out: parseInt(parts[9]) || 0,
          line3_in: parseInt(parts[11]) || 0,
          line3_out: parseInt(parts[12]) || 0,
          line4_in: parseInt(parts[14]) || 0,
          line4_out: parseInt(parts[15]) || 0
        })
      } catch (e) {
        console.error('Error parsing line:', lines[i])
      }
    }
  }
  
  return records
}