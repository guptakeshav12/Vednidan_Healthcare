const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || 'https://neoyskpcgyqymcgtqkma.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// Valid key check: key exists, is non-empty, and is not placeholder
const hasValidKey = Boolean(
  supabaseKey && 
  supabaseKey.trim() !== '' && 
  !supabaseKey.includes('your-supabase-anon-key') && 
  !supabaseKey.includes('placeholder-anon-key')
);

let isPoolReady = false;

// PostgreSQL pool with short 1.5s connection timeout to prevent blocking
const pool = new Pool({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 5432,
  user: 'postgres.neoyskpcgyqymcgtqkma',
  password: 'Keshav$%14#@',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1500
});

pool.on('error', (err) => {
  isPoolReady = false;
});

// Test connection on startup quietly without hanging
pool.query('SELECT 1').then(() => {
  isPoolReady = true;
  console.log('[Database] Connected to Supabase PostgreSQL successfully!');
}).catch(err => {
  isPoolReady = false;
  console.log('[Database Notice] DB connection pool idle/fallback active: Local JSON database operational');
});

// Supabase JS Client (used when valid API key is present)
const supabase = createClient(
  supabaseUrl,
  hasValidKey ? supabaseKey : 'placeholder-anon-key'
);

// isConfigured is true ONLY if a real Supabase API key is provided
const isConfigured = hasValidKey;

module.exports = {
  supabase,
  pool,
  isPoolReady: () => isPoolReady,
  supabaseUrl,
  isConfigured
};
