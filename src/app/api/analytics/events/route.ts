import { NextRequest, NextResponse } from 'next/server'
import { db, analyticsEvents } from '@/lib/db'
import { generateId } from '@/lib/utils'
import { eq, desc, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const event = {
      id: generateId(),
      sessionId: body.sessionId,
      eventType: body.eventType,
      eventData: body.eventData || {},
      timestamp: new Date(),
    }

    await db.insert(analyticsEvents).values(event)

    return NextResponse.json({
      success: true,
      message: 'Event tracked successfully',
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error tracking event:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track event',
        timestamp: new Date(),
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
    const limit = parseInt(searchParams.get('limit') || '50')

    let events

    if (sessionId && eventType) {
      events = await db.select().from(analyticsEvents)
        .where(and(eq(analyticsEvents.sessionId, sessionId), eq(analyticsEvents.eventType, eventType)))
        .limit(limit)
        .orderBy(desc(analyticsEvents.timestamp))
    } else if (sessionId) {
      events = await db.select().from(analyticsEvents)
        .where(eq(analyticsEvents.sessionId, sessionId))
        .limit(limit)
        .orderBy(desc(analyticsEvents.timestamp))
    } else if (eventType) {
      events = await db.select().from(analyticsEvents)
        .where(eq(analyticsEvents.eventType, eventType))
        .limit(limit)
        .orderBy(desc(analyticsEvents.timestamp))
    } else {
      events = await db.select().from(analyticsEvents)
        .limit(limit)
        .orderBy(desc(analyticsEvents.timestamp))
    }

    return NextResponse.json({
      success: true,
      data: events,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch events',
        timestamp: new Date(),
      },
      { status: 500 }
    )
  }
} 