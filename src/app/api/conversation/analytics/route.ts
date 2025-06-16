import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { conversationAnalytics, conversationSessions } from '@/lib/db/schema'
import { eq, desc, and, gte, sql } from 'drizzle-orm'
import { z } from 'zod'

const analyticsEventSchema = z.object({
  sessionId: z.string().uuid(),
  eventType: z.string(),
  eventData: z.record(z.any()),
  phase: z.string().optional(),
  step: z.number().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = analyticsEventSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid analytics data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { sessionId, eventType, eventData, phase, step } = validation.data

    // Get user agent and IP from headers
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    // Store analytics event
    await db.insert(conversationAnalytics).values({
      sessionId,
      eventType,
      eventData,
      phase: phase || 'unknown',
      step: step || 0,
      userAgent,
      ipAddress,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent,
        ipAddress
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Analytics event tracked successfully'
    })
    
  } catch (error) {
    console.error('Failed to track analytics event:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track analytics event'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const eventType = searchParams.get('eventType')
    const phase = searchParams.get('phase')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing sessionId parameter'
        },
        { status: 400 }
      )
    }

    // Build query conditions
    const conditions = [eq(conversationAnalytics.sessionId, sessionId)]
    
    if (eventType) {
      conditions.push(eq(conversationAnalytics.eventType, eventType))
    }
    
    if (phase) {
      conditions.push(eq(conversationAnalytics.phase, phase))
    }

    // Get analytics events
    const events = await db.query.conversationAnalytics.findMany({
      where: and(...conditions),
      orderBy: desc(conversationAnalytics.timestamp),
      limit
    })

    // Get session summary
    const sessionSummary = await db.query.conversationSessions.findFirst({
      where: eq(conversationSessions.id, sessionId)
    })

    // Calculate session metrics
    const metrics = await calculateSessionMetrics(sessionId)
    
    return NextResponse.json({
      success: true,
      sessionId,
      events,
      sessionSummary,
      metrics,
      totalEvents: events.length
    })
    
  } catch (error) {
    console.error('Failed to get analytics data:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve analytics data'
      },
      { status: 500 }
    )
  }
}

async function calculateSessionMetrics(sessionId: string) {
  try {
    // Get all events for the session
    const events = await db.query.conversationAnalytics.findMany({
      where: eq(conversationAnalytics.sessionId, sessionId),
      orderBy: desc(conversationAnalytics.timestamp)
    })

    if (events.length === 0) {
      return {
        totalEvents: 0,
        sessionDuration: 0,
        phaseDistribution: {},
        eventTypeDistribution: {},
        engagementScore: 0
      }
    }

    // Calculate session duration
    const firstEvent = events[events.length - 1]
    const lastEvent = events[0]
    const sessionDuration = new Date(lastEvent.timestamp).getTime() - new Date(firstEvent.timestamp).getTime()

    // Calculate phase distribution
    const phaseDistribution: Record<string, number> = {}
    const eventTypeDistribution: Record<string, number> = {}

    for (const event of events) {
      phaseDistribution[event.phase] = (phaseDistribution[event.phase] || 0) + 1
      eventTypeDistribution[event.eventType] = (eventTypeDistribution[event.eventType] || 0) + 1
    }

    // Calculate engagement score (simplified)
    const messageEvents = events.filter(e => e.eventType === 'message_sent' || e.eventType === 'message_received')
    const engagementScore = Math.min(100, (messageEvents.length / 10) * 100) // Max 100 for 10+ messages

    return {
      totalEvents: events.length,
      sessionDuration: Math.round(sessionDuration / 1000), // Convert to seconds
      phaseDistribution,
      eventTypeDistribution,
      engagementScore: Math.round(engagementScore),
      messageCount: messageEvents.length,
      averageResponseTime: calculateAverageResponseTime(events)
    }
  } catch (error) {
    console.error('Failed to calculate session metrics:', error)
    return {
      totalEvents: 0,
      sessionDuration: 0,
      phaseDistribution: {},
      eventTypeDistribution: {},
      engagementScore: 0
    }
  }
}

function calculateAverageResponseTime(events: any[]): number {
  const messageEvents = events.filter(e => 
    e.eventType === 'message_sent' || e.eventType === 'message_received'
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  if (messageEvents.length < 2) return 0

  let totalResponseTime = 0
  let responseCount = 0

  for (let i = 1; i < messageEvents.length; i++) {
    const currentEvent = messageEvents[i]
    const previousEvent = messageEvents[i - 1]
    
    // Calculate time between user message and AI response
    if (previousEvent.eventType === 'message_sent' && currentEvent.eventType === 'message_received') {
      const responseTime = new Date(currentEvent.timestamp).getTime() - new Date(previousEvent.timestamp).getTime()
      totalResponseTime += responseTime
      responseCount++
    }
  }

  return responseCount > 0 ? Math.round(totalResponseTime / responseCount / 1000) : 0 // Convert to seconds
} 