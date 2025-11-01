import pkg from 'pg';
const { Client } = pkg;
import { log } from './utils.js';

export async function ensureTablesExist(connectionString: string) {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    log('Checking if database tables exist...');

    // Create workers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        joining_date DATE NOT NULL,
        department TEXT NOT NULL,
        weeks_entitled INTEGER NOT NULL DEFAULT 6
      );
    `);

    // Create vacation_requests table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vacation_requests (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        worker_id VARCHAR NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
        year INTEGER NOT NULL DEFAULT 2026,
        first_choice_weeks TEXT[] NOT NULL,
        second_choice_weeks TEXT[] NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        allocated_choice TEXT,
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vacation_requests_worker_id ON vacation_requests(worker_id);
      CREATE INDEX IF NOT EXISTS idx_vacation_requests_year ON vacation_requests(year);
      CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON vacation_requests(status);
    `);

    log('✅ Database tables verified/created successfully');
  } catch (error: any) {
    log(`Error setting up database tables: ${error.message}`);
    throw error;
  } finally {
    await client.end();
  }
}
