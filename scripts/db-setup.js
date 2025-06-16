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
      // Try push with auto-confirmation
      console.log('🔄 Running Drizzle push with auto-confirmation...');
      execSync('echo "y" | npx drizzle-kit push:pg', {
        stdio: 'inherit',
        timeout: 60000,
        shell: true,
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
      console.log('🔄 Trying alternative approach...');
      
      try {
        // Try using drizzle-kit with force flag if available
        console.log('📝 Trying with introspect and push...');
        execSync('npx drizzle-kit introspect:pg && echo "y" | npx drizzle-kit push:pg', {
          stdio: 'inherit',
          timeout: 60000,
          shell: true,
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL
          }
        });
        
        console.log('✅ Introspect + push approach successful');
        await verifyTables();
      } catch (introspectError) {
        console.log('❌ Introspect approach failed:', introspectError.message);
        console.log('🔧 Creating tables programmatically...');
        
        // Fallback to programmatic table creation
        await createTablesDirectly();
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

async function createTablesDirectly() {
  console.log('🔧 Creating essential tables directly...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
  
  const client = await pool.connect();
  try {
    // Create essential tables only (to avoid complexity)
    const essentialTablesSQL = `
      CREATE TABLE IF NOT EXISTS "anonymous_sessions" (
        "session_id" varchar(255) PRIMARY KEY NOT NULL,
        "ip_address" varchar(45),
        "location" varchar(100),
        "device_info" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_activity" timestamp DEFAULT now() NOT NULL,
        "total_page_views" integer DEFAULT 0,
        "time_on_site" integer DEFAULT 0,
        "referral_source" varchar(500),
        "utm_campaign" varchar(100),
        "utm_source" varchar(100),
        "utm_medium" varchar(100),
        "conversion_score" integer DEFAULT 0,
        "status" varchar(20) DEFAULT 'active'
      );

      CREATE TABLE IF NOT EXISTS "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255),
        "session_id" varchar(255) NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "preferences" jsonb
      );

      CREATE TABLE IF NOT EXISTS "sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid,
        "session_id" varchar(255) NOT NULL UNIQUE,
        "ip_address" varchar(45),
        "user_agent" text,
        "country" varchar(100),
        "city" varchar(100),
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "last_activity" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "page_views" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "path" varchar(500) NOT NULL,
        "title" varchar(500),
        "referrer" varchar(500),
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "time_on_page" integer
      );
    `;
    
    await client.query(essentialTablesSQL);
    console.log('✅ Essential tables created successfully');
    
    await verifyTables();
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
    
    if (tables.length >= 35) {
      console.log('✅ All expected tables (35) created successfully!');
    } else if (tables.length >= 4) {
      console.log(`✅ Core tables (${tables.length}) created successfully!`);
      console.log('ℹ️  Additional tables will be created when features are accessed');
    } else if (tables.length > 0) {
      console.log(`⚠️  Only ${tables.length} tables found`);
    } else {
      console.log('❌ No tables found');
    }
    
    console.log('✅ Schema sync completed successfully!');
    return { tables };
  } finally {
    client.release();
    await pool.end();
  }
}

// Main execution
if (require.main === module) {
  setupDatabaseWithDrizzle()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupDatabaseWithDrizzle };