#!/usr/bin/env node

require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

process.env.SUPABASE_URL = "https://amqxsmdcvhyaudzbmhaf.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY;

const { SupabaseClient } = require('../workflows/lib/supabase-client');

async function checkStructure() {
  const supabase = new SupabaseClient();
  
  console.log('Fetching sensor with full structure...\n');
  
  const sensors = await supabase.getActiveSensors();
  
  if (sensors.length > 0) {
    console.log('First sensor structure:');
    console.log(JSON.stringify(sensors[0], null, 2));
    
    console.log('\n\nKey paths:');
    console.log(`sensor.id: ${sensors[0].id}`);
    console.log(`sensor.sensor_id: ${sensors[0].sensor_id}`);
    console.log(`sensor.store_id: ${sensors[0].store_id}`);
    console.log(`sensor.stores: ${typeof sensors[0].stores}`);
    if (sensors[0].stores) {
      console.log(`sensor.stores.id: ${sensors[0].stores.id}`);
      console.log(`sensor.stores.organization_id: ${sensors[0].stores.organization_id}`);
      console.log(`sensor.stores.organizations: ${typeof sensors[0].stores.organizations}`);
      if (sensors[0].stores.organizations) {
        console.log(`sensor.stores.organizations.id: ${sensors[0].stores.organizations.id}`);
      }
    }
  }
}

checkStructure().catch(console.error);