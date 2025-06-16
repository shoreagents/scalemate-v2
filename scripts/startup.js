#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting ScaleMate application...');

// Function to run a command and return a promise
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true,
      ...options
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    process.on('error', (error) => {
      reject(error);
    });
  });
}

async function startup() {
  try {
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.log('⚠️  DATABASE_URL not found - skipping database setup');
      console.log('🔧 Database tables will need to be created manually');
    } else {
      console.log('🗄️  DATABASE_URL found - running database migrations...');
      
      try {
        // Run database migrations
        await runCommand('npm', ['run', 'db:deploy']);
        console.log('✅ Database migrations completed successfully');
      } catch (error) {
        console.log('⚠️  Database migration failed - continuing with app startup');
        console.error('Migration error:', error.message);
      }
    }

    // Start the Next.js application
    console.log('🌐 Starting Next.js server...');
    await runCommand('npm', ['start']);
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT - shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM - shutting down gracefully...');
  process.exit(0);
});

// Start the application
startup(); 