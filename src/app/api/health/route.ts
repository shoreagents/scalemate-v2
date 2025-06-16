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
      // Use a less noisy query that checks table existence
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as table_exists
      `)
      
      tablesExist = result[0]?.table_exists === true
      
      if (tablesExist) {
        // Only query the actual table if we know it exists
        await db.execute(sql`SELECT COUNT(*) FROM users LIMIT 1`)
        dbSetupMessage = 'Database fully configured'
      } else {
        dbSetupMessage = 'Database connected, schema setup in progress'
      }
    } catch (tableError) {
      // Fallback error handling
      if (tableError instanceof Error && tableError.message.includes('does not exist')) {
        dbSetupMessage = 'Database connected, tables need setup'
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