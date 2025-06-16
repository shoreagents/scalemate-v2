import { NextRequest, NextResponse } from 'next/server'
import { db, quoteCalculatorSessions, quoteMessages } from '@/lib/db'
import { sendClaudeMessage, QUOTE_CALCULATOR_SYSTEM_PROMPT } from '@/lib/ai/claude'
import { generateId } from '@/lib/utils'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, message, conversationId } = body

    if (!sessionId || !message) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get or create conversation session
    let session = await db
      .select()
      .from(quoteCalculatorSessions)
      .where(eq(quoteCalculatorSessions.conversationId, conversationId))
      .limit(1)

    if (session.length === 0) {
      // Create new session
      const newSession = {
        id: generateId(),
        sessionId,
        conversationId: conversationId || generateId(),
        currentStep: 'greeting',
        businessInfo: null,
        requirements: null,
        quote: null,
        status: 'active' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await db.insert(quoteCalculatorSessions).values(newSession)
      session = [newSession]
    }

    const currentSession = session[0]

    // Save user message
    const userMessage = {
      id: generateId(),
      sessionId: currentSession.id,
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
    }

    await db.insert(quoteMessages).values(userMessage)

    // Get conversation history
    const messageHistory = await db
      .select()
      .from(quoteMessages)
      .where(eq(quoteMessages.sessionId, currentSession.id))
      .orderBy(quoteMessages.timestamp)

    // Prepare messages for Claude
    const claudeMessages = messageHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }))

    // Get AI response
    const aiResponse = await sendClaudeMessage(
      claudeMessages,
      QUOTE_CALCULATOR_SYSTEM_PROMPT,
      1500
    )

    // Save AI response
    const assistantMessage = {
      id: generateId(),
      sessionId: currentSession.id,
      role: 'assistant' as const,
      content: aiResponse.content,
      timestamp: new Date(),
    }

    await db.insert(quoteMessages).values(assistantMessage)

    // Update session
    await db
      .update(quoteCalculatorSessions)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(quoteCalculatorSessions.id, currentSession.id))

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse.content,
        conversationId: currentSession.conversationId,
        sessionId: currentSession.sessionId,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error in quote calculator chat:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat message',
        timestamp: new Date(),
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get('conversationId')

    if (!conversationId) {
      return NextResponse.json(
        { success: false, error: 'Conversation ID required' },
        { status: 400 }
      )
    }

    // Get session
    const session = await db
      .select()
      .from(quoteCalculatorSessions)
      .where(eq(quoteCalculatorSessions.conversationId, conversationId))
      .limit(1)

    if (session.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get messages
    const messages = await db
      .select()
      .from(quoteMessages)
      .where(eq(quoteMessages.sessionId, session[0].id))
      .orderBy(quoteMessages.timestamp)

    return NextResponse.json({
      success: true,
      data: {
        session: session[0],
        messages,
      },
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch conversation',
        timestamp: new Date(),
      },
      { status: 500 }
    )
  }
} 