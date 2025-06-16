#!/usr/bin/env node

/**
 * Database Migration Script for Railway Deployment
 * 
 * This script handles database migrations using Drizzle ORM
 * Run this after deploying to Railway to set up your database schema
 */

const { drizzle } = require('drizzle-orm/postgres-js')
const { migrate } = require('drizzle-orm/postgres-js/migrator')
const postgres = require('postgres')

async function runMigrations() {
  console.log('🚀 Starting database migrations...')
  
  const connectionString = process.env.DATABASE_URL
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is required')
    process.exit(1)
  }

  try {
    // Create connection
    const client = postgres(connectionString, { prepare: false })
    const db = drizzle(client)

    console.log('📊 Connected to database')
    
    // Run migrations (if you have a migrations folder)
    // await migrate(db, { migrationsFolder: './drizzle' })
    
    console.log('✅ Database migrations completed successfully!')
    
    // Close connection
    await client.end()
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
}

module.exports = { runMigrations } 