const { Pool } = require('pg');
const { execSync } = require('child_process');

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  try {
    console.log('🔌 Testing database connection...');
    
    // Test connection first
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Quick test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    // Check current users table structure
    console.log('🔍 Checking current users table structure...');
    try {
      const tableInfo = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      console.log('📋 Current users table columns:', tableInfo.rows.map(r => r.column_name));
    } catch (e) {
      console.log('⚠️  Users table might not exist yet');
    }
    
    client.release();
    await pool.end();
    
    // Try Drizzle push with better error handling
    console.log('🔧 Attempting Drizzle schema sync...');
    console.log('📝 This will read your actual schema.ts file and update tables');
    
    try {
      // Run drizzle push with verbose output
      execSync('npm run db:push', { 
        stdio: 'inherit',
        timeout: 45000,
        env: { ...process.env, DRIZZLE_KIT_VERBOSE: 'true' }
      });
      console.log('✅ Drizzle push completed successfully');
      
      // Verify the changes were applied
      await verifySchemaChanges();
      
    } catch (error) {
      console.log('⚠️  Drizzle push had issues:', error.message);
      console.log('🔄 Applying schema changes manually...');
      
      // Manual schema update to ensure changes are applied
      await applySchemaChangesManually();
    }
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.log('🔄 Attempting fallback table creation...');
    
    // Fallback to basic tables if everything fails
    await createBasicTables();
  }
}

async function verifySchemaChanges() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying schema changes were applied...');
    
    // Check if new columns exist in users table
    const result = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name IN ('test_new_column', 'last_login_at')
    `);
    
    const foundColumns = result.rows.map(r => r.column_name);
    console.log('🔎 Found new columns:', foundColumns);
    
    if (foundColumns.includes('test_new_column') && foundColumns.includes('last_login_at')) {
      console.log('✅ Schema changes verified - new columns exist!');
    } else {
      console.log('⚠️  Schema changes not detected, applying manually...');
      throw new Error('Schema verification failed');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

async function applySchemaChangesManually() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    console.log('🔧 Manually applying schema changes...');
    
    // Add the test columns to users table if they don't exist
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS test_new_column VARCHAR(100) DEFAULT 'test_value'
      `);
      console.log('✅ Added test_new_column to users table');
    } catch (e) {
      console.log('⚠️  test_new_column might already exist or table not found');
    }
    
    try {
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP
      `);
      console.log('✅ Added last_login_at to users table');
    } catch (e) {
      console.log('⚠️  last_login_at might already exist or table not found');
    }
    
    // Verify the manual changes
    const result = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Final users table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.column_default ? `default: ${row.column_default}` : ''}`);
    });
    
  } finally {
    client.release();
    await pool.end();
  }
}

async function createBasicTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Create users table with the new columns included
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255),
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        preferences JSONB,
        test_new_column VARCHAR(100) DEFAULT 'test_value',
        last_login_at TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        session_id VARCHAR(255) NOT NULL UNIQUE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        country VARCHAR(100),
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_activity TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log('✅ Fallback tables created with new schema');
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { setupDatabase }; 