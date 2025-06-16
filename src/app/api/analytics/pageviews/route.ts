import { NextRequest, NextResponse } from 'next/server'
import { db, pageViews } from '@/lib/db'
import { generateId } from '@/lib/utils'
import { eq, desc, and } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const pageView = {
      id: generateId(),
      sessionId: body.sessionId,
      path: body.path,
      title: body.title,
      referrer: body.referrer,
      timestamp: new Date(),
    }

    await db.insert(pageViews).values(pageView)

    return NextResponse.json({
      success: true,
      message: 'Page view tracked successfully',
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error tracking page view:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track page view',
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
    const path = searchParams.get('path')
    const limit = parseInt(searchParams.get('limit') || '50')

    let views

    if (sessionId && path) {
      views = await db.select().from(pageViews)
        .where(and(eq(pageViews.sessionId, sessionId), eq(pageViews.path, path)))
        .limit(limit)
        .orderBy(desc(pageViews.timestamp))
    } else if (sessionId) {
      views = await db.select().from(pageViews)
        .where(eq(pageViews.sessionId, sessionId))
        .limit(limit)
        .orderBy(desc(pageViews.timestamp))
    } else if (path) {
      views = await db.select().from(pageViews)
        .where(eq(pageViews.path, path))
        .limit(limit)
        .orderBy(desc(pageViews.timestamp))
    } else {
      views = await db.select().from(pageViews)
        .limit(limit)
        .orderBy(desc(pageViews.timestamp))
    }

    return NextResponse.json({
      success: true,
      data: views,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error fetching page views:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch page views',
        timestamp: new Date(),
      },
      { status: 500 }
    )
  }
} 