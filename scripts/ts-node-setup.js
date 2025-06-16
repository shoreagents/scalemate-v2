// TypeScript path resolution for Node.js
const path = require('path');
const { register } = require('module');

// Set up module resolution for TypeScript paths
function setupTypeScriptPaths() {
  // Add base URL resolution
  const projectRoot = path.resolve(__dirname, '..');
  
  // Register path mappings
  const originalResolveFilename = require.extensions['.ts'];
  
  // Handle @ imports
  const originalRequire = Module.prototype.require;
  Module.prototype.require = function(id) {
    if (id.startsWith('@/')) {
      const resolvedPath = path.resolve(projectRoot, 'src', id.slice(2));
      return originalRequire.call(this, resolvedPath);
    }
    return originalRequire.call(this, id);
  };
  
  console.log('✅ TypeScript path resolution configured');
}

// Enable ES modules in Node.js for Drizzle
function setupESModules() {
  // Set NODE_OPTIONS for better ES module support
  process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --experimental-modules --experimental-json-modules';
  console.log('✅ ES modules support enabled');
}

function setupDrizzleEnvironment() {
  // Ensure required environment variables for Drizzle
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required for Drizzle operations');
  }
  
  // Set Drizzle-specific environment variables
  process.env.DRIZZLE_KIT_VERBOSE = 'true';
  
  console.log('✅ Drizzle environment configured');
}

module.exports = {
  setupTypeScriptPaths,
  setupESModules,
  setupDrizzleEnvironment
}; 