#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

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

// Try different ways to run drizzle-kit
const possiblePaths = [
  './node_modules/.bin/drizzle-kit',
  'node_modules/.bin/drizzle-kit',
  '/app/node_modules/.bin/drizzle-kit',
  'node_modules/drizzle-kit/bin.cjs'
];

let drizzleCommand = null;
for (const testPath of possiblePaths) {
  if (existsSync(testPath)) {
    drizzleCommand = testPath;
    break;
  }
}

// If no local path found, try npx
if (!drizzleCommand) {
  console.log('📋 No local drizzle-kit found, using npx...');
  drizzleCommand = 'npx drizzle-kit';
}

console.log(`📋 Using drizzle command: ${drizzleCommand}`);

try {
  console.log('📋 Pushing database schema...');
  
  // For drizzle-kit v0.20.18, the correct command is "push:pg"
  const pushCommand = `${drizzleCommand} push:pg`;
  console.log('🔧 Executing command:', pushCommand);
  
  const result = execSync(pushCommand, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env },
    timeout: 60000 // 60 second timeout
  });
  
  console.log('✅ Schema push completed successfully');
  
  // Check if seed script exists
  if (existsSync('scripts/seed.js')) {
    console.log('📋 Seeding database...');
    
    execSync('node scripts/seed.js', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { ...process.env },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ Database seeding completed successfully');
  } else {
    console.log('⚠️  No seed script found - skipping seeding');
  }
  
  console.log('✅ Database setup completed successfully');
  console.log('🚀 Application ready to start');
  
} catch (error) {
  console.error('❌ Database setup failed');
  console.error('❌ Error:', error.message);
  console.error('❌ Exit code:', error.status);
  
  if (error.stdout) {
    console.error('📋 stdout:', error.stdout.toString());
  }
  if (error.stderr) {
    console.error('📋 stderr:', error.stderr.toString());
  }
  
  // For production deployments, we want to fail the build if DB setup fails
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Production deployment failed - database setup required');
    console.error('❌ Deployment will not continue');
    process.exit(1);
  } else {
    console.log('⚠️  Development mode - continuing despite database setup failure');
    process.exit(0);
  }
} 