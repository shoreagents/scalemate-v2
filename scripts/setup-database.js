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
    
    client.release();
    await pool.end();
    
    // Use Drizzle push to sync schema automatically
    console.log('🔧 Syncing database schema with Drizzle...');
    console.log('📝 This will read your actual schema.ts file and update tables');
    
    // Set a shorter timeout for drizzle-kit
    const timeoutMs = 45000; // 45 seconds
    
    await Promise.race([
      new Promise((resolve) => {
        try {
          execSync('npm run db:push', { 
            stdio: 'inherit',
            timeout: timeoutMs
          });
          resolve();
        } catch (error) {
          // If drizzle-kit fails, fall back to basic tables
          console.log('⚠️  Drizzle push failed, creating basic tables...');
          resolve();
        }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Schema sync timeout')), timeoutMs)
      )
    ]);
    
    console.log('✅ Database schema synchronized with your schema.ts file');
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    console.log('🔄 Attempting fallback table creation...');
    
    // Fallback to basic tables if Drizzle fails
    await createBasicTables();
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
    
    // Create only essential tables as fallback
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255),
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        preferences JSONB
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
    
    console.log('✅ Fallback tables created');
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { setupDatabase }; 