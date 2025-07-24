const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://kqfwccpnqcgxuydvmdvb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxZndjY3BucWNneHV5ZHZtZHZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI2NjI0NiwiZXhwIjoyMDQ4ODQyMjQ2fQ.IQJGfAJJKJgNy-ANaRsJvBjO6N7Dc0W7I6bG8w2NTIE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  try {
    // Count July 24 data
    const { count: july24Count, error: july24Error } = await supabase
      .from('people_counting_raw')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', '2025-07-24T00:00:00.000Z')
      .lt('timestamp', '2025-07-25T00:00:00.000Z');
      
    if (july24Error) throw july24Error;
    console.log(`July 24 records: ${july24Count || 0}`);
    
    // Count July 25 data
    const { count: july25Count, error: july25Error } = await supabase
      .from('people_counting_raw')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', '2025-07-25T00:00:00.000Z')
      .lt('timestamp', '2025-07-26T00:00:00.000Z');
      
    if (july25Error) throw july25Error;
    console.log(`July 25 records: ${july25Count || 0}`);
    
    // Delete both days if requested
    if (process.argv.includes('--delete')) {
      const { error: deleteError } = await supabase
        .from('people_counting_raw')
        .delete()
        .gte('timestamp', '2025-07-24T00:00:00.000Z')
        .lt('timestamp', '2025-07-26T00:00:00.000Z');
        
      if (deleteError) throw deleteError;
      console.log(`\nDeleted ${(july24Count || 0) + (july25Count || 0)} records total`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkData();