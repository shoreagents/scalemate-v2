const { exec } = require('child_process')
const { promisify } = require('util')

const execAsync = promisify(exec)

async function setupProduction() {
  try {
    console.log('🚀 Setting up production database...')
    
    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      console.error('❌ DATABASE_URL environment variable is required')
      process.exit(1)
    }
    
    console.log('📊 Running database migrations...')
    await execAsync('npx drizzle-kit push:pg --verbose')
    console.log('✅ Database schema deployed')
    
    console.log('🌱 Seeding database with initial data...')
    await execAsync('node scripts/seed.js')
    console.log('✅ Database seeded')
    
    console.log('🔍 Verifying database setup...')
    
    // Test database connection
    const { Client } = require('pg')
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    })
    
    await client.connect()
    
    // Check if key tables exist
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'user_profiles', 'anonymous_sessions', 'tool_configurations')
    `)
    
    await client.end()
    
    if (result.rows.length >= 4) {
      console.log('✅ All core tables verified')
      console.log('🎉 Production setup completed successfully!')
      
      console.log('\n📋 Next steps:')
      console.log('1. Test your application at the Railway URL')
      console.log('2. Check the health endpoint: /api/health')
      console.log('3. Monitor the application logs')
      
    } else {
      console.log('⚠️  Some tables may be missing. Check the logs above.')
    }
    
  } catch (error) {
    console.error('❌ Production setup failed:', error.message)
    console.error('\n🔧 Troubleshooting steps:')
    console.error('1. Check that DATABASE_URL is correctly set in Railway')
    console.error('2. Verify database connection')
    console.error('3. Check Railway logs for detailed error messages')
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  setupProduction()
}

module.exports = { setupProduction } 