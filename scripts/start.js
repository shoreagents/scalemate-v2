#!/usr/bin/env node

const { execSync } = require('child_process');

async function runMigrations() {
  console.log('🔄 Running database migrations...');
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found, skipping migrations');
      return;
    }

    console.log('📍 Database URL found, running migrations...');
    execSync('npm run db:migrate', { stdio: 'inherit' });
    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('⚠️  Continuing without migrations...');
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