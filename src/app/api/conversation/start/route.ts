import { NextRequest, NextResponse } from 'next/server'
// Dynamic import to prevent build-time initialization issues
// import { ConversationEngine } from '@/lib/ai/conversation-engine'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Check if we're in build time (no DATABASE_URL available)
    if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        {
          success: false,
          error: 'Service temporarily unavailable',
          message: 'Database connection not available'
        },
        { status: 503 }
      )
    }

    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Generate anonymous ID for tracking
    const anonymousId = uuidv4()
    
    // Initialize conversation engine dynamically
    let conversationEngine
    let sessionId
    
    try {
      const { ConversationEngine } = await import('@/lib/ai/conversation-engine')
      conversationEngine = new ConversationEngine()
    
    // Start new conversation
      sessionId = await conversationEngine.startConversation(anonymousId)
    } catch (error) {
      console.error('Failed to initialize conversation engine:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      sessionId,
      anonymousId,
      message: 'Conversation started successfully',
      phase: 'discovery',
      step: 1
    })
    
  } catch (error) {
    console.error('Failed to start conversation:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start conversation',
        message: 'An error occurred while initializing the conversation. Please try again.'
      },
      { status: 500 }
    )
  }
} 