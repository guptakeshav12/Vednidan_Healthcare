const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Ensure dotenv parses root variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const isConfigured = 
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('your-supabase-url') && 
  !supabaseKey.includes('your-supabase-anon-key');

if (!isConfigured) {
  console.warn('==================================================================');
  console.warn('⚠️  WARNING: Supabase database connection is not yet configured!');
  console.warn('Please fill your credentials inside: backend/.env');
  console.warn('Once configured, run the seeding script:');
  console.warn('  node backend/data/seedSupabase.js');
  console.warn('==================================================================\n');
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder-key'
);

module.exports = {
  supabase,
  isConfigured
};
