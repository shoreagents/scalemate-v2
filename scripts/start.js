#!/usr/bin/env node

const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🔄 Setting up database...');
  console.log('📊 Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
  console.log('- PORT:', process.env.PORT || '3000');
  
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found, skipping database setup');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
      return;
    }

    console.log('📍 Database URL found, running database setup...');
    console.log('🔧 Running Drizzle-native schema sync...');
    
    // Try Drizzle-native approach first (reads schema.ts directly)
    try {
      const { setupDatabaseWithDrizzle } = require('./drizzle-setup.js');
      await setupDatabaseWithDrizzle();
      console.log('✅ Drizzle-native schema sync successful');
    } catch (drizzleError) {
      console.log('⚠️  Drizzle-native approach failed, using fallback...');
      console.log('🔄 Using manual schema setup...');
      
      // Fallback to manual setup
      const { setupDatabase } = require('./setup-database.js');
      await setupDatabase();
      console.log('✅ Manual schema setup completed');
    }
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('⚠️  Continuing without database setup...');
  }
}

async function startApp() {
  console.log('🚀 Starting Next.js application in standalone mode...');
  console.log('🔧 Port configuration:', process.env.PORT || '3000');
  
  // Set PORT and HOSTNAME environment variables for Next.js
  const port = process.env.PORT || '3000';
  const hostname = '0.0.0.0'; // Bind to all interfaces for Railway
  
  console.log(`🌐 Binding to ${hostname}:${port} for Railway access`);
  
  console.log('🔧 Running: node .next/standalone/server.js');
  execSync('node .next/standalone/server.js', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      PORT: port,
      HOSTNAME: hostname
    }
  });
}

async function main() {
  console.log('🎯 ScaleMate startup sequence initiated');
  console.log('🌐 Railway environment detected');
  await runMigrations();
  await startApp();
}

main().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
}); 