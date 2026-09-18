const { pool } = require('../config/supabase');
const doctors = require('./doctors.json');
const therapists = require('./therapists.json');
const accounts = require('./provider_accounts.json');

async function syncToDb() {
  try {
    console.log('Syncing updated doctors, therapists, and accounts to database...');
    
    // Sync Doctors
    for (const d of doctors) {
      await pool.query(`
        INSERT INTO doctors (id, name, email, phone, qualification, specialty, rating, experience)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          qualification = EXCLUDED.qualification,
          specialty = EXCLUDED.specialty,
          rating = EXCLUDED.rating,
          experience = EXCLUDED.experience
      `, [d.id, d.name, d.email, d.phone, d.qualification, d.specialty, d.rating, d.experience]);
    }
    console.log('Synced doctors to PostgreSQL');

    // Sync Therapists
    for (const t of therapists) {
      await pool.query(`
        INSERT INTO therapists (id, name, email, phone, qualification, specialty, rating, experience, therapies)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          qualification = EXCLUDED.qualification,
          specialty = EXCLUDED.specialty,
          rating = EXCLUDED.rating,
          experience = EXCLUDED.experience,
          therapies = EXCLUDED.therapies
      `, [t.id, t.name, t.email, t.phone, t.qualification, t.specialty, t.rating, t.experience, t.therapies]);
    }
    console.log('Synced therapists to PostgreSQL');

    // Sync Provider Accounts
    for (const a of accounts) {
      await pool.query(`
        INSERT INTO provider_accounts (id, name, email, password_hash, role, specialty, qualification, experience, rating, phone, therapies, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          specialty = EXCLUDED.specialty,
          qualification = EXCLUDED.qualification,
          experience = EXCLUDED.experience,
          rating = EXCLUDED.rating,
          phone = EXCLUDED.phone,
          therapies = EXCLUDED.therapies,
          status = EXCLUDED.status
      `, [a.id, a.name, a.email, a.passwordHash, a.role, a.specialty, a.qualification || '', a.experience, a.rating, a.phone || '', a.therapies || [], a.status || 'active']);
    }
    console.log('Synced provider_accounts to PostgreSQL');

    console.log('✅ ALL DATABASE RECORDS SYNCHRONIZED!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing to DB:', err);
    process.exit(1);
  }
}
syncToDb();
