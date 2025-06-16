#!/usr/bin/env node

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🔍 Database setup check...');
console.log('🔧 Current working directory:', process.cwd());
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);

// Check if DATABASE_URL is available
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not found - skipping database setup');
  console.log('Available environment variables:');
  console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Present' : 'Missing');
  console.log('- NODE_ENV:', process.env.NODE_ENV || 'Missing');
  console.log('- OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  process.exit(0);
}

console.log('🗄️  DATABASE_URL found - attempting database setup...');
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
  console.log('⚠️  No drizzle config file found - skipping database setup');
  process.exit(0);
}

console.log('📋 Found drizzle config:', configFile);

// Try different ways to run drizzle-kit
const possiblePaths = [
  './node_modules/.bin/drizzle-kit',
  'node_modules/.bin/drizzle-kit',
  '/app/node_modules/.bin/drizzle-kit',
  'node_modules/drizzle-kit/bin.cjs',
  'npx drizzle-kit'
];

let drizzleCommand = null;
for (const testPath of possiblePaths) {
  if (testPath === 'npx drizzle-kit') {
    drizzleCommand = testPath;
    break;
  }
  if (existsSync(testPath)) {
    drizzleCommand = testPath;
    break;
  }
}

if (!drizzleCommand) {
  console.log('⚠️  drizzle-kit not found in any expected location');
  console.log('Checked paths:');
  possiblePaths.forEach(p => console.log(`  - ${p}: ${existsSync(p) ? 'Found' : 'Not found'}`));
  console.log('🔧 Database will need to be set up manually');
  process.exit(0);
}

console.log(`📋 Using drizzle command: ${drizzleCommand}`);

try {
  console.log('📋 Pushing database schema...');
  
  // For drizzle-kit v0.20.18, the correct command is "push:pg"
  const pushCommand = `${drizzleCommand} push:pg`;
  console.log('🔧 Executing command:', pushCommand);
  
  const result = execSync(pushCommand, {
    stdio: 'pipe',
    cwd: process.cwd(),
    env: { ...process.env },
    encoding: 'utf8'
  });
  
  console.log('📋 Schema push output:', result);
  console.log('✅ Schema push completed successfully');
  
  // Check if seed script exists
  if (existsSync('scripts/seed.js')) {
    console.log('📋 Seeding database...');
    
    const seedResult = execSync('node scripts/seed.js', {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env },
      encoding: 'utf8'
    });
    
    console.log('📋 Seed output:', seedResult);
    console.log('✅ Database seeding completed successfully');
  } else {
    console.log('⚠️  No seed script found - skipping seeding');
  }
  
  console.log('✅ Database setup completed successfully');
} catch (error) {
  console.log('⚠️  Database setup failed - app will continue without database features');
  console.error('Setup error:', error.message);
  console.error('Error code:', error.status);
  if (error.stdout) {
    console.error('stdout:', error.stdout.toString());
  }
  if (error.stderr) {
    console.error('stderr:', error.stderr.toString());
  }
  
  // Try alternative approach with direct node execution
  console.log('🔧 Trying alternative drizzle-kit execution...');
  try {
    const altResult = execSync('node node_modules/drizzle-kit/bin.cjs push:pg', {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env },
      encoding: 'utf8'
    });
    console.log('✅ Alternative execution successful:', altResult);
  } catch (altError) {
    console.error('❌ Alternative execution also failed:', altError.message);
  }
} 