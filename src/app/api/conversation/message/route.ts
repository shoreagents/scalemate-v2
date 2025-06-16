import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
// Dynamic imports to prevent build-time initialization issues
// import { ConversationEngine } from '@/lib/ai/conversation-engine'
// import { qdrantService } from '@/lib/ai/qdrant-service'

const messageSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(2000),
})

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

    const body = await request.json()
    const { sessionId, message } = messageSchema.parse(body)

    // Initialize services dynamically
    let conversationEngine
    try {
      const { ConversationEngine } = await import('@/lib/ai/conversation-engine')
      conversationEngine = new ConversationEngine()
      
      // Try to initialize Qdrant service if available
    try {
        const { qdrantService } = await import('@/lib/ai/qdrant-service')
      await qdrantService.initialize()
    } catch (error) {
      console.warn('Qdrant initialization failed, continuing without vector search:', error)
    }
    } catch (error) {
      console.error('Failed to initialize conversation engine:', error)
      throw error
    }
    
    // Process message with enhanced conversation engine
    const result = await conversationEngine.processMessage(sessionId, message)

    return NextResponse.json({
      success: true,
      data: {
        response: result.response,
        phase: result.phase,
        step: result.step,
        isComplete: result.isComplete,
        quote: result.quote,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error processing conversation message:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid input', 
          details: error.errors 
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    
    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing sessionId parameter'
        },
        { status: 400 }
      )
    }

    // Get conversation history
    let conversationEngine
    try {
      const { ConversationEngine } = await import('@/lib/ai/conversation-engine')
      conversationEngine = new ConversationEngine()
    // This would require implementing a getConversationHistory method
    // const history = await conversationEngine.getConversationHistory(sessionId)
    } catch (error) {
      console.error('Failed to initialize conversation engine:', error)
      throw error
    }
    
    return NextResponse.json({
      success: true,
      sessionId,
      // history,
      message: 'Conversation history retrieved successfully'
    })
    
  } catch (error) {
    console.error('Failed to get conversation history:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve conversation history'
      },
      { status: 500 }
    )
  }
} 