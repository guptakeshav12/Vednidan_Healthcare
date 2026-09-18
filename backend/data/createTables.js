const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.neoyskpcgyqymcgtqkma',
  password: 'Keshav$%14#@',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sqlPath = path.join(__dirname, 'db_schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf-8');

async function run() {
  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL!');
    
    await client.query(sql);
    console.log('All tables created successfully!');

    const res = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
    );
    console.log('\nTables in your Supabase database:');
    res.rows.forEach((r, i) => console.log('  ' + (i+1) + '. ' + r.table_name));

    await client.end();
    console.log('\nDone! Database setup complete.');
  } catch(e) {
    console.error('Error:', e.message);
    try { await client.end(); } catch(_) {}
    process.exit(1);
  }
}

run();
