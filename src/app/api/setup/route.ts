import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { dbProxy as db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function POST() {
  try {
    console.log('🚀 Manual database setup initiated...')
    
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL not found'
      }, { status: 400 })
    }
    
    console.log('✅ DATABASE_URL found')
    
    // Try to run drizzle-kit push
    console.log('📋 Running drizzle schema push...')
    
    const pushResult = execSync('npx drizzle-kit push:pg', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env }
    })
    
    console.log('Schema push result:', pushResult)
    
    // Try to run seeding
    console.log('📋 Running database seeding...')
    
    const seedResult = execSync('node scripts/seed.js', {
      encoding: 'utf8',
      cwd: process.cwd(),
      env: { ...process.env }
    })
    
    console.log('Seed result:', seedResult)
    
    // Verify tables exist
    const result = await db.execute(sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `)
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      tables: result.map(r => r.table_name),
      logs: {
        push: pushResult,
        seed: seedResult
      }
    })
    
  } catch (error) {
    console.error('Setup failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stderr: error instanceof Error && 'stderr' in error ? error.stderr : null
    }, { status: 500 })
  }
}

// Only allow in development/production with proper auth
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to trigger database setup',
    endpoint: '/api/setup',
    method: 'POST'
  })
} 