import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('Usage: node setup-azure-db.js "postgresql://username:password@host:port/database?sslmode=require"');
  process.exit(1);
}

async function setupDatabase() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to Azure PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    console.log('Creating workers table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS workers (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        joining_date DATE NOT NULL,
        department TEXT NOT NULL,
        weeks_entitled INTEGER NOT NULL DEFAULT 6
      );
    `);
    console.log('✅ Workers table created\n');

    console.log('Creating vacation_requests table...');
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
    console.log('✅ Vacation requests table created\n');

    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vacation_requests_worker_id ON vacation_requests(worker_id);
      CREATE INDEX IF NOT EXISTS idx_vacation_requests_year ON vacation_requests(year);
      CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON vacation_requests(status);
    `);
    console.log('✅ Indexes created\n');

    console.log('✅ All tables created successfully!');
    console.log('\nYour Azure PostgreSQL database is now ready for the application.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupDatabase();
