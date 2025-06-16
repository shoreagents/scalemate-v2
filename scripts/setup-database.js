const { Pool } = require('pg');

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Test query
    const result = await client.query('SELECT NOW()');
    console.log('📅 Database time:', result.rows[0].now);
    
    client.release();
    
    // Create tables using raw SQL to avoid import issues
    console.log('🔧 Setting up database tables...');
    await createTables(pool);
    
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
    
    // Create users table
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
    
    // Create sessions table
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
    
    // Create page_views table
    await client.query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id VARCHAR(255) NOT NULL,
        path VARCHAR(500) NOT NULL,
        title VARCHAR(500),
        referrer VARCHAR(500),
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        time_on_page INTEGER
      )
    `);
    
    // Create analytics_events table
    await client.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        event_data JSONB,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create quote_calculator_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote_calculator_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id VARCHAR(255) NOT NULL,
        conversation_id VARCHAR(255) NOT NULL,
        current_step VARCHAR(50) NOT NULL,
        business_info JSONB,
        requirements JSONB,
        quote JSONB,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create conversation_sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        anonymous_id VARCHAR(255) NOT NULL,
        phase VARCHAR(50) NOT NULL DEFAULT 'discovery',
        current_step INTEGER NOT NULL DEFAULT 1,
        total_steps INTEGER NOT NULL DEFAULT 4,
        conversation_state JSONB,
        user_profile JSONB,
        business_context JSONB,
        role_requirements JSONB,
        qualification_data JSONB,
        generated_quote JSONB,
        completion_rate DECIMAL(5,2) DEFAULT 0.00,
        engagement_score DECIMAL(5,2) DEFAULT 0.00,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        last_interaction TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create conversation_messages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id UUID REFERENCES conversation_sessions(id) NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
        metadata JSONB
      )
    `);

    console.log('✅ All database tables created successfully');
  } finally {
    client.release();
  }
}

module.exports = { setupDatabase }; 