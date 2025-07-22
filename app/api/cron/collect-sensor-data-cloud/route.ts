import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Sensor URL mapping for Cloudflare Tunnel
const SENSOR_URLS = {
  '176.79.62.167:2102': process.env.JJ_SENSOR_URL || 'https://jj-sensor.yourdomain.com',
  '93.108.96.96:21001': process.env.OMNIA1_SENSOR_URL || 'https://omnia1.yourdomain.com',
  '188.37.175.41:2201': process.env.OMNIA2_SENSOR_URL || 'https://omnia2.yourdomain.com',
  '188.37.124.33:21002': process.env.OMNIA3_SENSOR_URL || 'https://omnia3.yourdomain.com'
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function GET(request: NextRequest) {
  try {
    // Verify this is called by Vercel Cron (in production)
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting cloud-based sensor data collection...')

    // Get all active sensors
    const { data: sensors, error: sensorsError } = await supabaseAdmin
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
      console.error('Error fetching sensors:', sensorsError)
      return NextResponse.json({ error: 'Failed to fetch sensors' }, { status: 500 })
    }

    const results = []
    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Process each sensor
    for (const sensor of sensors || []) {
      try {
        console.log(`Processing sensor: ${sensor.sensor_name}`)

        // Get the public URL for this sensor
        const sensorKey = `${sensor.sensor_ip}:${sensor.sensor_port}`
        const publicUrl = SENSOR_URLS[sensorKey]
        
        if (!publicUrl || publicUrl.includes('yourdomain.com')) {
          console.error(`No public URL configured for ${sensor.sensor_name}`)
          results.push({ 
            sensor: sensor.sensor_name, 
            status: 'skipped', 
            error: 'No public URL configured' 
          })
          continue
        }

        // Build request URL
        const params = new URLSearchParams({
          dw: 'vcalogcsv',
          report_type: '0',
          statistics_type: '3',
          linetype: '31',
          time_start: formatDateTime(twoHoursAgo),
          time_end: formatDateTime(now)
        })

        const url = `${publicUrl}/dataloader.cgi?${params}`
        console.log(`Fetching from: ${url}`)

        // Fetch data from sensor via Cloudflare Tunnel
        const response = await fetch(url, {
          headers: {
            'Authorization': 'Basic ' + Buffer.from(`${sensor.config?.credentials?.username || 'admin'}:${sensor.config?.credentials?.password || 'grnl.2024'}`).toString('base64'),
            'User-Agent': 'Retail-Platform/1.0'
          },
          signal: AbortSignal.timeout(30000) // 30 second timeout
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
        const { data: lastRecord } = await supabaseAdmin
          .from('people_counting_raw')
          .select('timestamp')
          .eq('sensor_id', sensor.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .single()

        const lastTimestamp = lastRecord?.timestamp ? new Date(lastRecord.timestamp) : null

        // Filter and insert new records
        let inserted = 0
        let skipped = 0
        
        for (const record of records) {
          // Skip future data
          if (record.timestamp > now) {
            skipped++
            continue
          }

          // Skip old data (more than 2 hours)
          if (now.getTime() - record.timestamp.getTime() > 2 * 60 * 60 * 1000) {
            skipped++
            continue
          }

          // Skip if already collected
          if (lastTimestamp && record.timestamp <= lastTimestamp) {
            skipped++
            continue
          }

          // Skip if all zeros
          const hasData = record.line1_in + record.line1_out + record.line2_in + record.line2_out +
                         record.line3_in + record.line3_out + record.line4_in + record.line4_out > 0
          if (!hasData) {
            skipped++
            continue
          }

          // Insert record
          const { error: insertError } = await supabaseAdmin
            .from('people_counting_raw')
            .insert({
              sensor_id: sensor.id,
              organization_id: sensor.organization_id,
              store_id: sensor.store_id,
              timestamp: record.timestamp,
              end_time: record.endTime,
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
            console.log(`Inserted record for ${record.timestamp}`)
          } else {
            console.error(`Insert error for ${sensor.sensor_name}:`, insertError)
          }
        }

        results.push({
          sensor: sensor.sensor_name,
          status: 'success',
          records_processed: records.length,
          records_inserted: inserted,
          records_skipped: skipped
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

    // Log summary
    const summary = {
      total_sensors: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      errors: results.filter(r => r.status === 'error').length,
      total_records_inserted: results.reduce((sum, r) => sum + (r.records_inserted || 0), 0)
    }

    console.log('Data collection completed:', summary)

    return NextResponse.json({
      message: 'Data collection completed',
      timestamp: now.toISOString(),
      summary,
      results
    })

  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}

function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day}-${hours}:${minutes}:${seconds}`
}

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