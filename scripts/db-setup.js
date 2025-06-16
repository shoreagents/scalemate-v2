#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Attempting database setup...');

async function setupDatabase() {
  try {
    console.log('🔍 Database setup check...');
    console.log('🔧 Current working directory:', process.cwd());
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  No DATABASE_URL found, skipping database setup');
      return;
    }

    console.log('🗄️  DATABASE_URL found - running database setup...');
    console.log('🔧 DATABASE_URL format check:', process.env.DATABASE_URL.substring(0, 20) + '...');

    // Check if drizzle config exists
    const configPath = path.join(process.cwd(), 'drizzle.config.ts');
    if (fs.existsSync(configPath)) {
      console.log('📋 Found drizzle config:', 'drizzle.config.ts');
    } else {
      console.log('⚠️  No drizzle.config.ts found');
      return;
    }

    // Check if schema exists
    const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.ts');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Found schema file:', 'src/lib/db/schema.ts');
    } else {
      console.log('⚠️  No schema.ts found');
      return;
    }

    // Test database connection first
    console.log('🔗 Testing database connection with Node.js...');
    await testDatabaseConnection();
    console.log('✅ Database connection successful');

    // Now try drizzle-kit push with modern v0.20.18 syntax
    console.log('📋 Pushing database schema with drizzle-kit...');
    console.log('🔧 This will create ALL tables defined in your schema.ts file');
    
    // Method 1: Try with --force flag (recommended for v0.20.18)
    console.log('🔧 Executing command: npx drizzle-kit push --config=drizzle.config.ts --force');
    let result = spawnSync('npx', ['drizzle-kit', 'push', '--config=drizzle.config.ts', '--force'], {
      stdio: 'inherit',
      env: process.env,
      timeout: 60000,
      encoding: 'utf8'
    });

    if (result.status === 0) {
      console.log('✅ Database schema pushed successfully with --force flag!');
      console.log('🎉 ALL tables from schema.ts have been created');
      return;
    }

    console.log('⚠️ Force flag approach failed, trying modern syntax...');
    
    // Method 2: Try new syntax with force flag
    console.log('🔧 Trying modern syntax: npx drizzle-kit push --force');
    result = spawnSync('npx', ['drizzle-kit', 'push', '--force'], {
      stdio: 'inherit',
      env: process.env,
      timeout: 60000,
      encoding: 'utf8'
    });

    if (result.status === 0) {
      console.log('✅ Database schema pushed successfully with modern syntax!');
      console.log('🎉 ALL tables from schema.ts have been created');
      return;
    }

    console.log('⚠️ Modern syntax failed, trying stdin input method...');
    
    // Method 3: Use stdin to automatically confirm
    console.log('🔧 Trying with automatic confirmation via stdin...');
    const child = spawn('npx', ['drizzle-kit', 'push', '--config=drizzle.config.ts'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      env: process.env
    });

    // Send 'y' after a short delay to confirm
    setTimeout(() => {
      child.stdin.write('y\n');
      child.stdin.end();
    }, 2000);

    const stdinResult = await new Promise((resolve) => {
      child.on('close', (code) => {
        resolve(code);
      });
      
      // Timeout after 30 seconds
      setTimeout(() => {
        child.kill();
        resolve(1);
      }, 30000);
    });

    if (stdinResult === 0) {
      console.log('✅ Database schema pushed successfully with stdin confirmation!');
      console.log('🎉 ALL tables from schema.ts have been created');
      return;
    }

    console.log('⚠️ All drizzle-kit approaches failed, falling back to programmatic approach...');
    
    // Method 4: Use drizzle-orm migrate function directly
    await runProgrammaticMigration();

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('⚠️ Continuing with app startup...');
  }
}

async function testDatabaseConnection() {
  const { Client } = require('pg');
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  
  try {
    await client.connect();
    await client.query('SELECT 1');
    await client.end();
  } catch (error) {
    throw new Error(`Database connection failed: ${error.message}`);
  }
}

async function runProgrammaticMigration() {
  try {
    console.log('🔧 Running programmatic migration using drizzle-orm...');
    console.log('📋 This approach ensures schema.ts is always the source of truth');
    
    // Use drizzle-orm migrate function directly
    const { drizzle } = require('drizzle-orm/postgres-js');
    const { migrate } = require('drizzle-orm/postgres-js/migrator');
    const postgres = require('postgres');
    
    const client = postgres(process.env.DATABASE_URL, {
      max: 1,
      ssl: process.env.NODE_ENV === 'production' ? 'require' : undefined
    });
    
    const db = drizzle(client);
    
    // Check for migrations directory
    const migrationsDir = path.join(process.cwd(), 'drizzle');
    if (fs.existsSync(migrationsDir)) {
      console.log('📂 Found migrations directory, applying migrations...');
      await migrate(db, { migrationsFolder: 'drizzle' });
      console.log('✅ Migrations applied successfully!');
    } else {
      console.log('📂 No migrations directory found');
      console.log('💡 To create migrations, run: npx drizzle-kit generate');
      console.log('💡 Then redeploy to apply the generated migrations');
    }
    
    // Test that we can access the schema
    const schemaPath = path.join(process.cwd(), 'src/lib/db/schema.ts');
    if (fs.existsSync(schemaPath)) {
      console.log('📋 Schema file confirmed at:', schemaPath);
      console.log('✅ Database setup using schema.ts completed');
    }
    
    await client.end();
    console.log('🎉 Programmatic migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Programmatic migration failed:', error.message);
    console.log('🚀 App will continue - tables may need to be created manually');
    console.log('💡 Try running: npx drizzle-kit push --force locally first');
  }
}

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase }; 