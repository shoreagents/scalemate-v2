const { execSync } = require('child_process');
const { Pool } = require('pg');
const { setupTypeScriptPaths, setupESModules, setupDrizzleEnvironment } = require('./ts-node-setup.js');

async function setupDatabaseWithDrizzle() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not found');
  }

  try {
    // Set up TypeScript environment for Drizzle
    console.log('🔧 Configuring TypeScript environment...');
    setupTypeScriptPaths();
    setupESModules();
    setupDrizzleEnvironment();
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
    
    // Try Drizzle push with optimized settings
    console.log('🔧 Running Drizzle schema sync...');
    console.log('📝 This will read your actual schema.ts file and sync all tables');
    
    try {
      // Use clean TypeScript compilation for schema
      execSync('npx drizzle-kit push:pg', { 
        stdio: 'inherit',
        timeout: 30000,
        env: { 
          ...process.env,
          DATABASE_URL: process.env.DATABASE_URL,
          TS_NODE_PROJECT: './drizzle.tsconfig.json',
          TS_NODE_COMPILER_OPTIONS: '{"strict": false, "skipLibCheck": true}'
        }
      });
      console.log('✅ Drizzle push completed successfully');
      
      // Verify schema was applied
      await verifyTables();
      
    } catch (error) {
      console.log('⚠️  Drizzle push failed:', error.message);
      console.log('🔄 Trying alternative approach...');
      
      // Alternative: Use generate + migrate approach
      try {
        console.log('📝 Generating migration files...');
        execSync('npx drizzle-kit generate:pg', { 
          stdio: 'inherit',
          timeout: 30000,
          env: { 
            ...process.env,
            NODE_OPTIONS: '--max-old-space-size=4096'
          }
        });
        
        console.log('📦 Applying migrations...');
        execSync('npx drizzle-kit migrate:pg', { 
          stdio: 'inherit',
          timeout: 30000
        });
        
        console.log('✅ Migration approach successful');
        await verifyTables();
        
      } catch (migrateError) {
        console.log('❌ Both Drizzle approaches failed:', migrateError.message);
        console.log('🔄 Falling back to manual schema creation...');
        
        // Import and use the original setup as final fallback
        const { setupDatabase } = require('./setup-database.js');
        await setupDatabase();
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
    
    // Expected tables from schema.ts (without safeDeletionTest)
    const expectedTables = [
      'users', 'sessions', 'page_views', 'analytics_events',
      'quote_calculator_sessions', 'quote_messages',
      'readiness_test_sessions', 'test_responses',
      'authors', 'categories', 'tags', 'blog_posts', 'post_categories', 'post_tags',
      'email_captures', 'email_campaigns',
      'conversation_sessions', 'conversation_messages'
    ];
    
    const missingTables = expectedTables.filter(table => !tables.includes(table));
    const extraTables = tables.filter(table => !expectedTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables.join(', '));
    }
    
    if (extraTables.length > 0) {
      console.log('🗑️  Extra tables (will be cleaned up):', extraTables.join(', '));
    }
    
    if (missingTables.length === 0 && extraTables.length === 0) {
      console.log('✅ Perfect schema sync - all tables match schema.ts');
    }
    
    return { tables, missingTables, extraTables };
    
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = { setupDatabaseWithDrizzle }; 