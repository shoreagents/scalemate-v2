#!/usr/bin/env node

const { execSync, spawn } = require('child_process');

console.log('🚀 Starting ScaleMate with database setup...');

async function setupDatabaseAndStart() {
  // Try database setup but don't fail if it doesn't work
  try {
    console.log('🔍 Attempting database setup...');
    execSync('node scripts/db-setup.js', {
      stdio: 'inherit',
      env: process.env,
      timeout: 120000 // 2 minute total timeout
    });
    console.log('✅ Database setup completed successfully');
  } catch (error) {
    console.log('⚠️  Database setup had issues, but continuing...');
    console.log('🔧 Error:', error.message);
    console.log('📋 The application will start and health check will show database status');
  }
  
  // Always start the Next.js application
  console.log('🌐 Starting Next.js application...');
  
  try {
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
    
    app.on('error', (error) => {
      console.error('❌ Application startup failed:', error.message);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start Next.js application:', error.message);
    process.exit(1);
  }
}

setupDatabaseAndStart(); 