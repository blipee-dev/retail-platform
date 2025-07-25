#!/usr/bin/env node

// Load environment from parent directory
require('dotenv').config({ path: '/workspaces/retail-platform/.env' });

// Set Supabase env vars to match what the script expects
process.env.SUPABASE_URL = process.env.BLIPEE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_KEY = process.env.BLIPEE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// Set email env vars
process.env.EMAIL_HOST = process.env.SMTP_SERVER || process.env.EMAIL_HOST;
process.env.EMAIL_PORT = process.env.SMTP_PORT || process.env.EMAIL_PORT || '587';
process.env.EMAIL_USER = process.env.EMAIL_USER;
process.env.EMAIL_PASS = process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS;
process.env.EMAIL_FROM = process.env.EMAIL_FROM || 'analytics@blipee.com';

// Set specific store if provided as argument
process.env.SPECIFIC_STORE = process.argv[2] || 'd719cc6b-1715-4721-8897-6f6cd0c025b0'; // JJ store as default
process.env.TEST_MODE = 'false';

console.log('📧 Manual Report Sender');
console.log('======================');
console.log('Store ID:', process.env.SPECIFIC_STORE);
console.log('Supabase URL:', process.env.SUPABASE_URL ? '✓ Configured' : '✗ Missing');
console.log('Email Host:', process.env.EMAIL_HOST || '✗ Missing');
console.log('');

// Now run the daily report sender
require('./daily-report-sender.js');