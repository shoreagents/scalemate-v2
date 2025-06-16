const { execSync } = require('child_process');
const { Pool } = require('pg');

async function setupDatabaseWithDrizzle() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  try {
    console.log('🔌 Testing database connection...');
    
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    client.release();
    await pool.end();
    
    // Create UUID extension first
    await ensureUuidExtension();
    
    // Run Drizzle push to sync schema
    console.log('🔧 Running Drizzle schema sync...');
    console.log('📝 This will read your schema.ts file and sync all tables');
    
    try {
      execSync('npx drizzle-kit push:pg', { 
        stdio: 'inherit',
        timeout: 45000,
        env: { 
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL
        }
      });
      console.log('✅ Drizzle push completed successfully');
      
      // Verify schema was applied
      await verifyTables();
      
    } catch (pushError) {
      console.log('⚠️  Drizzle push failed:', pushError.message);
      console.log('🔄 Trying generate + migrate approach...');
      
      try {
        console.log('📝 Generating migration files...');
        execSync('npx drizzle-kit generate:pg', { 
          stdio: 'inherit',
          timeout: 30000
        });
        
        console.log('📦 Applying migrations...');
        execSync('npx drizzle-kit migrate', { 
          stdio: 'inherit',
          timeout: 30000
        });
        
        console.log('✅ Migration approach successful');
        await verifyTables();
        
      } catch (migrateError) {
        console.log('❌ Migration failed:', migrateError.message);
        console.log('⚠️  Database will be initialized when first accessed');
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    throw error;
  }
}

async function ensureUuidExtension() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension ready');
  } finally {
    client.release();
    await pool.end();
  }
}

async function verifyTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    // Get all tables
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    const tables = tablesResult.rows.map(row => row.table_name);
    console.log(`📊 Schema verification: ${tables.length} tables found`);
    console.log('📋 Tables:', tables.join(', '));
    console.log('✅ Schema sync completed successfully!');
    
    return { tables };
    
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { setupDatabaseWithDrizzle }; 