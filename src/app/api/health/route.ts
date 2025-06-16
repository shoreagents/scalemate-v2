import { NextResponse } from 'next/server'
import { dbProxy as db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test basic database connection
    await db.execute(sql`SELECT 1 as health_check`)
    const responseTime = Date.now() - startTime
    
    let tablesExist = false
    let dbSetupMessage = ''
    
    try {
      // Check if main tables exist (graceful check for initial deployment)
      await db.execute(sql`SELECT COUNT(*) FROM users LIMIT 1`)
      tablesExist = true
      dbSetupMessage = 'Database fully configured'
    } catch (tableError) {
      // Tables don't exist yet - this is OK for initial deployment
      if (tableError instanceof Error && tableError.message.includes('does not exist')) {
        dbSetupMessage = 'Database connected, tables need setup. Run: node scripts/setup-production.js'
      } else {
        throw tableError
      }
    }
    
    // Return healthy if database is connected, even if tables need setup
    return NextResponse.json({
      status: tablesExist ? 'healthy' : 'setup_required',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          responseTime: `${responseTime}ms`,
          tablesExist,
          message: dbSetupMessage
        },
        application: {
          status: 'running',
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      },
      version: '2.0.0'
    }, { status: tablesExist ? 200 : 202 }) // 202 = Accepted (setup required)
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: {
            status: 'disconnected',
            error: error instanceof Error ? error.message : 'Unknown error'
          },
          application: {
            status: 'running',
            nodeEnv: process.env.NODE_ENV || 'development'
          }
        },
        version: '2.0.0'
      },
      { status: 500 }
    )
  }
} 