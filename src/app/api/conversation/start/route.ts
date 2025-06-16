import { NextRequest, NextResponse } from 'next/server'
import { ConversationEngine } from '@/lib/ai/conversation-engine'
import { headers } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const userAgent = headersList.get('user-agent') || ''
    const forwarded = headersList.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : headersList.get('x-real-ip') || 'unknown'

    // Generate anonymous ID for tracking
    const anonymousId = uuidv4()
    
    // Initialize conversation engine
    const conversationEngine = new ConversationEngine()
    
    // Start new conversation
    const sessionId = await conversationEngine.startConversation(anonymousId)
    
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