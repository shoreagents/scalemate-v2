#!/usr/bin/env node

const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🔄 Setting up database...');
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found, skipping database setup');
      return;
    }

    console.log('📍 Database URL found, pushing schema to database...');
    // Use push command which works better in production
    execSync('npm run db:push', { stdio: 'inherit' });
    console.log('✅ Database schema synchronized');
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('⚠️  Continuing without database setup...');
  }
}

async function startApp() {
  console.log('🚀 Starting application...');
  execSync('npm run start:next', { stdio: 'inherit' });
}

async function main() {
  await runMigrations();
  await startApp();
}

main().catch((error) => {
  console.error('❌ Startup failed:', error);
  process.exit(1);
}); 