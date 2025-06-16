#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🔍 Database setup check...');

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found - skipping database setup');
  process.exit(0);
}

console.log('🗄️  DATABASE_URL found - attempting database setup...');

// Try different ways to run drizzle-kit
const possiblePaths = [
  './node_modules/.bin/drizzle-kit',
  'node_modules/.bin/drizzle-kit',
  '/app/node_modules/.bin/drizzle-kit'
];

let drizzleKitPath = null;
for (const testPath of possiblePaths) {
  if (existsSync(testPath)) {
    drizzleKitPath = testPath;
    break;
  }
}

if (!drizzleKitPath) {
  console.log('⚠️  drizzle-kit not found - skipping database migrations');
  console.log('🔧 Database will need to be set up manually');
  process.exit(0);
}

try {
  console.log(`📋 Found drizzle-kit at: ${drizzleKitPath}`);
  console.log('📋 Pushing database schema...');
  
  execSync(`${drizzleKitPath} push`, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env }
  });
  
  console.log('📋 Seeding database...');
  execSync('node scripts/seed.js', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ Database setup completed successfully');
} catch (error) {
  console.log('⚠️  Database setup failed - app will continue without database features');
  console.error('Setup error:', error.message);
} 