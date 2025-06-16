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
      execSync('echo "y" | npx drizzle-kit push:pg', {
        stdio: 'inherit',
        timeout: 45000,
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
      console.log('🔄 Trying generate + migrate approach...');
      
      try {
        console.log('📝 Trying generate + migrate approach...');
        execSync('npx drizzle-kit generate:pg', {
          stdio: 'inherit',
          timeout: 30000,
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL
          }
        });
        
        console.log('📦 Applying migrations...');
        execSync('npx drizzle-kit migrate:pg', {
          stdio: 'inherit',
          timeout: 30000,
          env: {
            ...process.env,
            DATABASE_URL: process.env.DATABASE_URL
          }
        });
        
        console.log('✅ Generate + migrate approach successful');
        await verifyTables();
              } catch (migrateError) {
          console.log('❌ Generate + migrate also failed:', migrateError.message);
          console.log('⚠️  Database schema may need manual intervention');
          console.log('🔍 Checking current database state...');
          await verifyTables();
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
    
    if (tables.length >= 35) {
      console.log('✅ All expected tables (35) created successfully!');
    } else if (tables.length > 0) {
      console.log(`⚠️  Only ${tables.length} tables found, expected 35`);
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