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
    if (!fs.existsSync(configPath)) {
      console.log('⚠️  No drizzle.config.ts found, skipping schema setup');
      return;
    }

    console.log('📋 Found drizzle config:', 'drizzle.config.ts');

    // Test database connection with Node.js
    console.log('🔗 Testing database connection with Node.js...');
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: process.env.DATABASE_URL });
      await client.connect();
      console.log('✅ Database connection successful');
      await client.end();
    } catch (connError) {
      console.log('❌ Database connection failed:', connError.message);
      return;
    }

    // Push database schema with drizzle-kit using proper approach for v0.20.18
    console.log('📋 Pushing database schema with drizzle-kit...');
    
    // Try with the --force flag (documented for v0.20.18)
    console.log('🔧 Executing command: npx drizzle-kit push:pg --config=drizzle.config.ts --force');
    
    let result = spawnSync('npx', ['drizzle-kit', 'push:pg', '--config=drizzle.config.ts', '--force'], {
      stdio: 'inherit',
      timeout: 30000
    });

    if (result.status === 0) {
      console.log('✅ Database schema setup completed successfully with --force flag');
      return;
    }

    console.log('⚠️  Force flag approach failed, trying with new syntax...');
    
    // Try with new syntax and --force flag
    console.log('🔧 Trying new syntax: npx drizzle-kit push --config=drizzle.config.ts --force');
    
    result = spawnSync('npx', ['drizzle-kit', 'push', '--config=drizzle.config.ts', '--force'], {
      stdio: 'inherit',
      timeout: 30000
    });

    if (result.status === 0) {
      console.log('✅ Database schema setup completed successfully with new syntax');
      return;
    }

    console.log('⚠️  New syntax with force failed, trying with stdin input...');
    
    // Try with stdin input (pipe 'y' for confirmation)
    console.log('🔧 Trying with stdin confirmation: npx drizzle-kit push:pg --config=drizzle.config.ts');
    
    const child = spawn('npx', ['drizzle-kit', 'push:pg', '--config=drizzle.config.ts'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      timeout: 30000
    });

    // Auto-confirm by sending 'y' to stdin
    setTimeout(() => {
      child.stdin.write('y\n');
      child.stdin.end();
    }, 2000);

    const exitCode = await new Promise((resolve) => {
      child.on('close', resolve);
    });

    if (exitCode === 0) {
      console.log('✅ Database schema setup completed successfully with stdin input');
      return;
    }

    console.log('⚠️  Stdin approach failed, trying manual SQL execution...');

    // Fallback: Manual SQL table creation
    await manualTableCreation();

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('⚠️  Database setup failed, but continuing with app startup...');
  }
}

async function manualTableCreation() {
  try {
    console.log('📋 Attempting manual table creation...');
    
    const { Client } = require('pg');
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    // Create essential tables manually
    const createTablesSQL = `
      CREATE TABLE IF NOT EXISTS "analytics_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "event_type" varchar(100) NOT NULL,
        "event_data" jsonb,
        "timestamp" timestamp DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "anonymous_activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "session_id" varchar(255) NOT NULL,
        "activity_type" varchar(50) NOT NULL,
        "activity_data" jsonb NOT NULL,
        "value_score" integer DEFAULT 1,
        "page_path" varchar(500),
        "element_id" varchar(100),
        "timestamp" timestamp DEFAULT now() NOT NULL,
        "duration" integer
      );

      CREATE TABLE IF NOT EXISTS "anonymous_sessions" (
        "session_id" varchar(255) PRIMARY KEY NOT NULL,
        "ip_address" varchar(45),
        "location" varchar(100),
        "device_info" jsonb,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "last_activity" timestamp DEFAULT now() NOT NULL,
        "total_page_views" integer DEFAULT 0,
        "conversation_id" varchar(255) NOT NULL,
        "current_step" varchar(50) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS "blog_posts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "title" varchar(255) NOT NULL,
        "slug" varchar(255) NOT NULL,
        "content" text NOT NULL,
        "excerpt" varchar(500),
        "featured_image" varchar(500),
        "published" boolean DEFAULT false,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
      );

      CREATE TABLE IF NOT EXISTS "leads" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "email" varchar(255) NOT NULL,
        "name" varchar(255),
        "company" varchar(255),
        "phone" varchar(50),
        "requirements" text,
        "budget_range" varchar(100),
        "timeline" varchar(100),
        "source" varchar(100),
        "status" varchar(50) DEFAULT 'new',
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `;

    await client.query(createTablesSQL);
    console.log('✅ Manual table creation completed successfully');
    
    await client.end();

  } catch (error) {
    console.error('❌ Manual table creation failed:', error.message);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

module.exports = { setupDatabase }; 