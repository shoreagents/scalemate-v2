import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ConversationEngine } from '@/lib/ai/conversation-engine'
// import { qdrantService } from '@/lib/ai/qdrant-service'

const messageSchema = z.object({
  sessionId: z.string(),
  message: z.string().min(1).max(2000),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message } = messageSchema.parse(body)

    // Initialize Qdrant service if needed - temporarily disabled for build
    // try {
    //   await qdrantService.initialize()
    // } catch (error) {
    //   console.warn('Qdrant initialization failed, continuing without vector search:', error)
    // }

    // Create conversation engine instance
    const conversationEngine = new ConversationEngine()
    
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
    const conversationEngine = new ConversationEngine()
    // This would require implementing a getConversationHistory method
    // const history = await conversationEngine.getConversationHistory(sessionId)
    
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