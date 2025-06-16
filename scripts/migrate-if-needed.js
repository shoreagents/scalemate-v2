#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Checking for database setup requirements...');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found - skipping database setup');
  console.log('🔧 Add DATABASE_URL to Railway variables to enable database features');
  process.exit(0);
}

console.log('🗄️  DATABASE_URL found - running database setup...');

try {
  // Run database migrations using npm scripts
  console.log('📋 Pushing database schema...');
  execSync('npm run db:migrate', {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env }
  });
  
  console.log('📋 Seeding database...');
  execSync('npm run db:seed', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Database setup completed successfully');
} catch (error) {
  console.log('⚠️  Database setup failed - app will continue without database features');
  console.error('Setup error:', error.message);
  // Don't exit with error - let the app start anyway
} 