import { NextResponse } from 'next/server'
import { dbProxy as db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const startTime = Date.now()
    
    // Test database connection
    await db.execute(sql`SELECT 1 as health_check`)
    
    const responseTime = Date.now() - startTime
    
    // Test table existence by checking a key table
    await db.execute(sql`SELECT COUNT(*) FROM users LIMIT 1`)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: {
          status: 'connected',
          responseTime: `${responseTime}ms`
        },
        application: {
          status: 'running',
          nodeEnv: process.env.NODE_ENV || 'development'
        }
      },
      version: '2.0.0'
    })
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