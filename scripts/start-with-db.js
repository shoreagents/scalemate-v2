#!/usr/bin/env node

const { execSync, spawn } = require('child_process');

console.log('🚀 Starting ScaleMate with database setup...');

async function setupDatabaseAndStart() {
  try {
    // Run database setup first
    console.log('🔍 Running database setup...');
    execSync('node scripts/db-setup.js', {
      stdio: 'inherit',
      env: process.env
    });
    console.log('✅ Database setup completed');
    
    // Start the Next.js application
    console.log('🌐 Starting Next.js application...');
    const app = spawn('npm', ['start'], {
      stdio: 'inherit',
      env: process.env
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📋 Received SIGTERM, shutting down gracefully...');
      app.kill('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      console.log('📋 Received SIGINT, shutting down gracefully...');
      app.kill('SIGINT');
    });
    
    app.on('exit', (code) => {
      console.log(`📋 Application exited with code ${code}`);
      process.exit(code);
    });
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

setupDatabaseAndStart(); 