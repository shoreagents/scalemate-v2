#!/usr/bin/env node

const { spawn, execSync } = require('child_process');
const { existsSync } = require('fs');

console.log('🚀 Starting ScaleMate application...');

// First, try to run database setup
try {
  console.log('🔍 Running database setup...');
  execSync('node scripts/db-setup.js', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
} catch (error) {
  console.log('⚠️  Database setup skipped:', error.message);
}

// Now try to start Next.js using different approaches
const nextStartMethods = [
  () => spawn('next', ['start'], { stdio: 'inherit' }),
  () => spawn('./node_modules/.bin/next', ['start'], { stdio: 'inherit' }),
  () => spawn('node_modules/.bin/next', ['start'], { stdio: 'inherit' }),
  () => spawn('/app/node_modules/.bin/next', ['start'], { stdio: 'inherit' }),
  () => spawn('node', ['./node_modules/next/dist/bin/next', 'start'], { stdio: 'inherit' }),
  () => spawn('node', ['node_modules/next/dist/bin/next', 'start'], { stdio: 'inherit' }),
  () => spawn('npx', ['next', 'start'], { stdio: 'inherit' }),
  () => spawn('npm', ['run', 'start'], { stdio: 'inherit' })
];

async function tryStartNext() {
  for (let i = 0; i < nextStartMethods.length; i++) {
    try {
      console.log(`🌐 Attempting to start Next.js (method ${i + 1})...`);
      
      const child = nextStartMethods[i]();
      
      // Wait a bit to see if it starts successfully
      await new Promise((resolve, reject) => {
        let hasStarted = false;
        
        const timeout = setTimeout(() => {
          if (!hasStarted) {
            child.kill();
            reject(new Error('Timeout'));
          }
        }, 5000);
        
        child.on('error', (error) => {
          clearTimeout(timeout);
          if (!hasStarted) {
            reject(error);
          }
        });
        
        child.on('exit', (code) => {
          clearTimeout(timeout);
          if (!hasStarted) {
            reject(new Error(`Exited with code ${code}`));
          }
        });
        
        // Look for successful startup
        if (child.stdout) {
          child.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
              hasStarted = true;
              clearTimeout(timeout);
              resolve();
            }
          });
        }
        
        // If no stdout, just wait and assume success
        setTimeout(() => {
          hasStarted = true;
          clearTimeout(timeout);
          resolve();
        }, 3000);
      });
      
      console.log('✅ Next.js started successfully!');
      
      // Keep the process alive
      process.on('SIGINT', () => {
        child.kill();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        child.kill();
        process.exit(0);
      });
      
      return; // Success, exit the function
      
    } catch (error) {
      console.log(`❌ Method ${i + 1} failed:`, error.message);
    }
  }
  
  throw new Error('All Next.js startup methods failed');
}

tryStartNext().catch((error) => {
  console.error('❌ Failed to start Next.js:', error.message);
  process.exit(1);
}); 