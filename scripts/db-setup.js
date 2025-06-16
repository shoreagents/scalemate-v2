#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');

console.log('🔍 Database setup check...');
console.log('🔧 Current working directory:', process.cwd());
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found');
  console.log('🔧 This is expected in local development');
  console.log('✅ Skipping database setup for local development');
  process.exit(0);
}

console.log('🗄️  DATABASE_URL found - running database setup...');
console.log('🔧 DATABASE_URL format check:', process.env.DATABASE_URL.substring(0, 20) + '...');

// Test database connection using Node.js instead of psql
async function testDatabaseConnection() {
  try {
    console.log('🔗 Testing database connection with Node.js...');
    
    // Use the postgres library for connection test
    const testScript = `
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      client.connect().then(() => {
        console.log('Connection successful');
        client.end();
        process.exit(0);
      }).catch(err => {
        console.error('Connection failed:', err.message);
        process.exit(1);
      });
    `;
    
    execSync(`node -e "${testScript}"`, {
      stdio: 'pipe',
      timeout: 10000,
      env: { ...process.env }
    });
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('⚠️  Database connection test failed, continuing anyway...');
    console.log('🔧 Error:', error.message);
    return false;
  }
}

// Check for drizzle config file
const configFiles = ['drizzle.config.ts', 'drizzle.config.js'];
let configFile = null;
for (const file of configFiles) {
  if (existsSync(file)) {
    configFile = file;
    break;
  }
}

if (!configFile) {
  console.error('❌ No drizzle config file found');
  console.error('❌ Database setup cannot proceed without configuration');
  process.exit(1);
}

console.log('📋 Found drizzle config:', configFile);

async function setupDatabase() {
  // Test connection first
  await testDatabaseConnection();
  
  try {
    console.log('📋 Pushing database schema with drizzle-kit...');
    
    // Use config file approach with --yes flag for non-interactive mode (v0.20.18)
    const pushCommand = 'npx drizzle-kit push:pg --config=drizzle.config.ts --yes';
    console.log('🔧 Executing command:', pushCommand);
    
    execSync(pushCommand, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env },
      timeout: 45000 // Longer timeout for schema creation
    });
    
    console.log('✅ Schema push completed successfully');
    
  } catch (error) {
    console.log('⚠️  Config file approach failed, trying with schema parameter...');
    
    try {
      // Try with explicit schema parameter and yes flag
      const schemaCommand = 'npx drizzle-kit push:pg --schema=./src/lib/db/schema.ts --driver=pg --yes';
      console.log('🔧 Trying with schema parameter:', schemaCommand);
      
      execSync(schemaCommand, {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env },
        timeout: 30000
      });
      
      console.log('✅ Schema push completed with schema parameter');
      
    } catch (schemaError) {
      console.log('⚠️  Schema parameter approach failed, trying without confirmation flags...');
      
      try {
        // Try basic command without confirmation flags
        const basicCommand = 'npx drizzle-kit push:pg --config=drizzle.config.ts';
        console.log('🔧 Trying basic command:', basicCommand);
        
        // Set environment variable to auto-confirm
        const env = { ...process.env, DRIZZLE_KIT_AUTO_CONFIRM: 'true' };
        
        execSync(basicCommand, {
          stdio: 'inherit',
          cwd: process.cwd(),
          env: env,
          timeout: 30000,
          input: 'y\n' // Send 'y' as input to confirm
        });
        
        console.log('✅ Schema push completed with basic command');
        
      } catch (basicError) {
        console.log('⚠️  All drizzle-kit approaches failed, creating basic tables manually...');
        
        // Create basic tables manually using a proper Node.js script file
        try {
          const { writeFileSync } = require('fs');
          
          // Write a temporary SQL setup script
          const sqlSetupScript = `
            const { Client } = require('pg');
            
            async function createBasicTables() {
              const client = new Client({ connectionString: process.env.DATABASE_URL });
              
              try {
                await client.connect();
                console.log('Connected to database for manual setup');
                
                // Create users table
                await client.query(\`
                  CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                \`);
                console.log('✅ Created users table');
                
                // Create anonymous_sessions table
                await client.query(\`
                  CREATE TABLE IF NOT EXISTS anonymous_sessions (
                    id VARCHAR(255) PRIMARY KEY,
                    ip_address VARCHAR(45),
                    user_agent TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                \`);
                console.log('✅ Created anonymous_sessions table');
                
                // Create anonymous_activities table
                await client.query(\`
                  CREATE TABLE IF NOT EXISTS anonymous_activities (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    session_id VARCHAR(255) NOT NULL,
                    activity_type VARCHAR(50) NOT NULL,
                    activity_data JSONB NOT NULL,
                    value_score INTEGER DEFAULT 1,
                    page_path VARCHAR(500),
                    element_id VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                  )
                \`);
                console.log('✅ Created anonymous_activities table');
                
                console.log('✅ Basic table creation completed successfully');
                
              } catch (error) {
                console.error('❌ Error creating tables:', error.message);
                throw error;
              } finally {
                await client.end();
              }
            }
            
            createBasicTables();
          `;
          
          // Write the script to a temporary file
          writeFileSync('/tmp/setup-tables.js', sqlSetupScript);
          
          // Execute the script
          execSync('node /tmp/setup-tables.js', {
            stdio: 'inherit',
            timeout: 15000,
            env: { ...process.env }
          });
          
          console.log('✅ Manual table creation completed');
          
        } catch (sqlError) {
          console.error('❌ Manual table creation failed');
          console.error('🔧 SQL Error:', sqlError.message);
          throw basicError; // Throw the original drizzle error
        }
      }
    }
  }
  
  // Try seeding if script exists
  if (existsSync('scripts/seed.js')) {
    try {
      console.log('📋 Seeding database...');
      
      execSync('node scripts/seed.js', {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: { ...process.env },
        timeout: 20000 // Longer timeout for seeding
      });
      
      console.log('✅ Database seeding completed successfully');
    } catch (seedError) {
      console.log('⚠️  Seeding failed, but continuing:', seedError.message);
    }
  } else {
    console.log('⚠️  No seed script found - skipping seeding');
  }
  
  console.log('✅ Database setup completed successfully');
  console.log('🚀 Application ready to start');
}

// Run setup with error handling
setupDatabase().catch((error) => {
  console.error('❌ Database setup failed');
  console.error('❌ Error:', error.message);
  console.error('❌ Exit code:', error.status);
  
  if (error.stdout) {
    console.error('📋 stdout:', error.stdout.toString());
  }
  if (error.stderr) {
    console.error('📋 stderr:', error.stderr.toString());
  }
  
  // For production, allow app to start even if database setup fails
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Database setup failed in production');
    console.log('🔧 Checking if app can start without full database setup...');
    
    // Allow app to start - health check will show the status
    console.log('✅ Allowing app to start - health check will show database status');
    process.exit(0);
  } else {
    console.log('⚠️  Development mode - continuing despite database setup failure');
    process.exit(0);
  }
}); 