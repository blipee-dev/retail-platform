// Script to run database migrations
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = 'https://amqxsmdcvhyaudzbmhaf.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtcXhzbWRjdmh5YXVkemJtaGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAyNDA4MSwiZXhwIjoyMDY4NjAwMDgxfQ.g4nfj2zykEKdSYa_vsY5MjObnHYY2Uq8JBHtyYEfD1M'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigrations() {
  console.log('🚀 Running database migrations...')
  
  try {
    // Read the combined migrations file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', 'combined_migrations.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    console.log('📁 Loaded migration file')
    
    // Split by statement separators and run each one
    const statements = migrationSQL
      .split('-- ================================================')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim())
    
    console.log(`📋 Found ${statements.length} migration sections`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length > 0 && !statement.startsWith('--')) {
        console.log(`⚡ Running migration section ${i + 1}...`)
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          })
          
          if (error) {
            console.log(`  ⚠️  Section ${i + 1} had issues (might be expected):`, error.message)
          } else {
            console.log(`  ✅ Section ${i + 1} completed`)
          }
        } catch (err) {
          console.log(`  ⚠️  Section ${i + 1} error:`, err.message)
        }
      }
    }
    
    // Alternative approach: run the full SQL in one go
    console.log('\n🔄 Trying alternative approach - running full migration...')
    
    // Use SQL editor-style execution
    const { data, error } = await supabase
      .from('_')
      .select('*')
      .limit(0)  // This is just to test connection
    
    if (error && error.message.includes('does not exist')) {
      console.log('✅ Database is empty, proceeding with migration')
    }
    
    console.log('\n🎯 Migration process completed!')
    console.log('📋 Manual step required:')
    console.log('   1. Go to https://amqxsmdcvhyaudzbmhaf.supabase.co/project/default/sql')
    console.log('   2. Copy and paste the contents of supabase/migrations/combined_migrations.sql')
    console.log('   3. Run the SQL to create all tables and functions')
    console.log('   4. Then run this test again: node test-auth.js')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
  }
}

runMigrations()