const { Pool } = require('pg');

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Quick test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    client.release();
    
    // Create tables with timeout
    console.log('🔧 Setting up database tables...');
    await Promise.race([
      createTables(pool),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database setup timeout')), 60000)
      )
    ]);
    
    console.log('✅ Database setup completed');
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

async function createTables(pool) {
  const client = await pool.connect();
  
  try {
    // Create extension if needed
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension ready');
    
    // Create essential tables only (faster startup)
    const tables = [
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          email VARCHAR(255),
          session_id VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
          preferences JSONB
        )`
      },
      {
        name: 'sessions',
        sql: `CREATE TABLE IF NOT EXISTS sessions (
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
        )`
      },
      {
        name: 'page_views',
        sql: `CREATE TABLE IF NOT EXISTS page_views (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id VARCHAR(255) NOT NULL,
          path VARCHAR(500) NOT NULL,
          title VARCHAR(500),
          referrer VARCHAR(500),
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
          time_on_page INTEGER
        )`
      },
      {
        name: 'analytics_events',
        sql: `CREATE TABLE IF NOT EXISTS analytics_events (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          session_id VARCHAR(255) NOT NULL,
          event_type VARCHAR(100) NOT NULL,
          event_data JSONB,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL
        )`
      }
    ];

    // Create tables sequentially with progress
    for (const table of tables) {
      await client.query(table.sql);
      console.log(`✅ Table '${table.name}' ready`);
    }

    console.log('✅ Core database tables created successfully');
  } finally {
    client.release();
  }
}

module.exports = { setupDatabase }; 