#!/usr/bin/env node

const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🔄 Setting up database...');
  console.log('📊 Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- DATABASE_URL present:', !!process.env.DATABASE_URL);
  
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found, skipping database setup');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
      return;
    }

    console.log('📍 Database URL found, running database setup...');
    console.log('🔧 Creating database connection and pushing schema...');
    
    // Use direct connection instead of drizzle-kit to avoid TypeScript compilation issues
    const { setupDatabase } = require('./setup-database.js');
    await setupDatabase();
    console.log('✅ Database schema synchronized successfully');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('⚠️  Continuing without database setup...');
  }
}

async function startApp() {
  console.log('🚀 Starting Next.js application in standalone mode...');
  console.log('🔧 Running: node .next/standalone/server.js');
  execSync('node .next/standalone/server.js', { stdio: 'inherit' });
}

async function main() {
  console.log('🎯 ScaleMate startup sequence initiated');
  await runMigrations();
  await startApp();
}

main().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
}); 