#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting ScaleMate application...');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    console.log(`📋 Running: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function start() {
  try {
    // Check and run database migrations if needed
    console.log('🔍 Checking database setup...');
    await runCommand('node', ['scripts/migrate-if-needed.js']);
    
    // Start Next.js server
    console.log('🌐 Starting Next.js server...');
    await runCommand('npx', ['next', 'start']);
    
  } catch (error) {
    console.error('❌ Startup failed:', error.message);
    process.exit(1);
  }
}

start(); 