import { NextRequest, NextResponse } from 'next/server'
import { anonymousTrackingService } from '@/lib/services/anonymousTracking'
import { z } from 'zod'

const createSessionSchema = z.object({
  sessionId: z.string().optional(),
  referralSource: z.string().optional(),
  utmParams: z.object({
    campaign: z.string().optional(),
    source: z.string().optional(),
    medium: z.string().optional()
  }).optional()
})

const trackActivitySchema = z.object({
  sessionId: z.string(),
  activityType: z.enum(['page_view', 'button_click', 'tool_use', 'download', 'form_interaction', 'scroll', 'time_spent']),
  activityData: z.object({
    page: z.string().optional(),
    element: z.string().optional(),
    value: z.string().optional(),
    duration: z.number().optional(),
    metadata: z.record(z.any()).optional()
  }),
  pagePath: z.string().optional(),
  elementId: z.string().optional(),
  duration: z.number().optional()
})

// POST /api/tracking/session - Create or update session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = createSessionSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid session data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { sessionId, referralSource, utmParams } = validation.data
    
    // Extract user info from headers
    const userAgent = request.headers.get('user-agent') || ''
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // Create or update session
    const newSessionId = await anonymousTrackingService.createOrUpdateSession({
      sessionId,
      ipAddress,
      deviceInfo: { userAgent },
      referralSource,
      utmParams
    })
    
    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      message: 'Session created/updated successfully'
    })
    
  } catch (error) {
    console.error('Failed to create/update session:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to manage session'
      },
      { status: 500 }
    )
  }
}

// PUT /api/tracking/activity - Track activity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = trackActivitySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid activity data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { sessionId, activityType, activityData, pagePath, elementId, duration } = validation.data
    
    // Track activity
    const result = await anonymousTrackingService.trackActivity({
      sessionId,
      activityType,
      activityData,
      pagePath,
      elementId,
      duration
    })
    
    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully',
      valueScore: result.valueScore
    })
    
  } catch (error) {
    console.error('Failed to track activity:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to track activity'
      },
      { status: 500 }
    )
  }
}

// GET /api/tracking/summary - Get session summary
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session ID is required'
        },
        { status: 400 }
      )
    }
    
    // Get session summary
    const summary = await anonymousTrackingService.getSessionSummary(sessionId)
    
    if (!summary) {
      return NextResponse.json(
        {
          success: false,
          error: 'Session not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: summary
    })
    
  } catch (error) {
    console.error('Failed to get session summary:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get session summary'
      },
      { status: 500 }
    )
  }
} 