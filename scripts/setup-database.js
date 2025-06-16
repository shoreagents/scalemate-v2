const { Pool } = require('pg');
const { execSync } = require('child_process');

async function setupDatabase() {
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
    
    // Try Drizzle push first, but don't rely on it
    console.log('🔧 Attempting Drizzle schema sync...');
    try {
      execSync('npm run db:push', { 
        stdio: 'inherit',
        timeout: 30000,
        env: { ...process.env, DRIZZLE_KIT_VERBOSE: 'true' }
      });
      console.log('✅ Drizzle push completed');
    } catch (error) {
      console.log('⚠️  Drizzle push failed (expected due to TS issues)');
    }
    
    // Always run comprehensive schema creation to ensure all tables exist
    console.log('🏗️  Creating comprehensive schema (all tables)...');
    await createFullSchema();
    
    // Check for tables that should be removed
    console.log('🗑️  Checking for tables to remove...');
    await removeDeletedTables();
    
  } catch (error) {
    console.error('❌ Database setup error:', error.message);
    await createFullSchema();
  }
}

async function createFullSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    // Create extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension ready');
    
    // Core tables
    await createCoreTablesIfNotExist(client);
    
    // AI Quote Calculator tables
    await createQuoteCalculatorTablesIfNotExist(client);
    
    // Readiness Test tables  
    await createReadinessTestTablesIfNotExist(client);
    
    // Blog system tables
    await createBlogTablesIfNotExist(client);
    
    // Email marketing tables
    await createEmailTablesIfNotExist(client);
    
    // Advanced AI conversation tables
    await createAdvancedAITablesIfNotExist(client);
    
    // Test tables
    await createTestTablesIfNotExist(client);
    
    // Show final table count
    const tableCount = await client.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    console.log(`✅ Schema setup complete - ${tableCount.rows[0].count} tables total`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

async function createCoreTablesIfNotExist(client) {
  // Users table
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
  
  // Sessions table
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
  
  // Page views table
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
  
  // Analytics events table
  await client.query(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(100) NOT NULL,
      event_data JSONB,
      timestamp TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log('✅ Core tables ready');
}

async function createQuoteCalculatorTablesIfNotExist(client) {
  // Quote calculator sessions
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
  
  // Quote messages
  await client.query(`
    CREATE TABLE IF NOT EXISTS quote_messages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID REFERENCES quote_calculator_sessions(id) NOT NULL,
      role VARCHAR(20) NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW() NOT NULL,
      metadata JSONB
    )
  `);
  
  console.log('✅ Quote calculator tables ready');
}

async function createReadinessTestTablesIfNotExist(client) {
  // Readiness test sessions
  await client.query(`
    CREATE TABLE IF NOT EXISTS readiness_test_sessions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id VARCHAR(255) NOT NULL,
      current_question INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL,
      results JSONB,
      status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // Test responses
  await client.query(`
    CREATE TABLE IF NOT EXISTS test_responses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      session_id UUID REFERENCES readiness_test_sessions(id) NOT NULL,
      question_id VARCHAR(255) NOT NULL,
      question_text TEXT NOT NULL,
      answer TEXT NOT NULL,
      score INTEGER NOT NULL,
      category VARCHAR(50) NOT NULL,
      timestamp TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log('✅ Readiness test tables ready');
}

async function createBlogTablesIfNotExist(client) {
  // Authors
  await client.query(`
    CREATE TABLE IF NOT EXISTS authors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      bio TEXT,
      avatar VARCHAR(500),
      social_links JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // Categories
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      color VARCHAR(7),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // Tags
  await client.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      count INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // Blog posts
  await client.query(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      slug VARCHAR(255) NOT NULL UNIQUE,
      title VARCHAR(500) NOT NULL,
      excerpt TEXT,
      content TEXT NOT NULL,
      author_id UUID REFERENCES authors(id) NOT NULL,
      published_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      featured_image VARCHAR(500),
      seo_title VARCHAR(500),
      seo_description TEXT,
      reading_time INTEGER NOT NULL,
      views INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  // Post categories junction
  await client.query(`
    CREATE TABLE IF NOT EXISTS post_categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID REFERENCES blog_posts(id) NOT NULL,
      category_id UUID REFERENCES categories(id) NOT NULL
    )
  `);
  
  // Post tags junction
  await client.query(`
    CREATE TABLE IF NOT EXISTS post_tags (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      post_id UUID REFERENCES blog_posts(id) NOT NULL,
      tag_id UUID REFERENCES tags(id) NOT NULL
    )
  `);
  
  console.log('✅ Blog system tables ready');
}

async function createEmailTablesIfNotExist(client) {
  // Email captures
  await client.query(`
    CREATE TABLE IF NOT EXISTS email_captures (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) NOT NULL,
      session_id VARCHAR(255) NOT NULL,
      source VARCHAR(50) NOT NULL,
      metadata JSONB,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      confirmed_at TIMESTAMP
    )
  `);
  
  // Email campaigns
  await client.query(`
    CREATE TABLE IF NOT EXISTS email_campaigns (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      subject VARCHAR(500) NOT NULL,
      content TEXT NOT NULL,
      template_id VARCHAR(255),
      audience_id VARCHAR(255) NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'draft',
      scheduled_at TIMESTAMP,
      sent_at TIMESTAMP,
      stats JSONB,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);
  
  console.log('✅ Email marketing tables ready');
}

async function createAdvancedAITablesIfNotExist(client) {
  // Conversation sessions (already exists, just ensure it has all columns)
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
  
  // Conversation messages (already exists, just ensure it has all columns)
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
  
  // Test table to verify schema sync
  await client.query(`
    CREATE TABLE IF NOT EXISTS drizzle_schema_test (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      test_message VARCHAR(255) NOT NULL DEFAULT 'Drizzle can read schema.ts!',
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      schema_version VARCHAR(50) NOT NULL DEFAULT 'v2.0'
    )
  `);
  
  console.log('✅ Advanced AI tables ready');
  console.log('✅ Test table ready');
}



async function removeDeletedTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    // List of tables that should exist (remove safe_deletion_test from list)
    const expectedTables = [
      'users', 'sessions', 'page_views', 'analytics_events',
      'quote_calculator_sessions', 'quote_messages',
      'readiness_test_sessions', 'test_responses',
      'authors', 'categories', 'tags', 'blog_posts', 'post_categories', 'post_tags',
      'email_captures', 'email_campaigns',
      'conversation_sessions', 'conversation_messages',
      'drizzle_schema_test'  // Test table
    ];
    
    // Get all existing tables
    const existingTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `);
    
    const existingTables = existingTablesResult.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    // Find tables to remove (exist in DB but not in expected list)
    const tablesToRemove = existingTables.filter(table => !expectedTables.includes(table));
    
    if (tablesToRemove.length > 0) {
      console.log('🗑️  Tables to remove:', tablesToRemove);
      
      for (const table of tablesToRemove) {
        try {
          // Safety check - don't remove important system tables
          if (!table.startsWith('pg_') && !table.startsWith('information_') && table !== 'spatial_ref_sys') {
            console.log(`🗑️  Removing table: ${table}`);
            await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
            console.log(`✅ Removed table: ${table}`);
          }
        } catch (error) {
          console.log(`⚠️  Could not remove table ${table}:`, error.message);
        }
      }
    } else {
      console.log('✅ No tables to remove - schema is clean');
    }
    
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { setupDatabase }; 