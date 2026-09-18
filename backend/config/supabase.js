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

// PostgreSQL pool
const pool = new Pool({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 5432,
  user: 'postgres.neoyskpcgyqymcgtqkma',
  password: 'Keshav$%14#@',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 8000
});

pool.on('error', (err) => {
  console.error('[PostgreSQL Pool Error]', err.message);
});

// Test connection on startup quietly
pool.query('SELECT 1').then(() => {
  console.log('[Database] Connected to Supabase PostgreSQL successfully!');
}).catch(err => {
  console.log('[Database Notice] DB connection pool idle/fallback active:', err.message);
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
  supabaseUrl,
  isConfigured
};
