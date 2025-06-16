import Anthropic from '@anthropic-ai/sdk'
// import { langchainAgent, ConversationContext, AgentResponse } from './langchain-agent'
// import { qdrantService } from './qdrant-service'
// import { memoryManager } from './memory-manager'
// import { quoteGenerator } from './quote-generator'
import { db } from '@/lib/db'
import { conversationSessions, conversationMessages, conversationMemory, conversationEmbeddings, conversationAnalytics } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { generateEmbedding } from './embeddings'
import { v4 as uuidv4 } from 'uuid'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface ConversationPhase {
  name: string
  description: string
  objectives: string[]
  questions: string[]
  extractionTargets: string[]
}

export const CONVERSATION_PHASES: Record<string, ConversationPhase> = {
  discovery: {
    name: 'Business Discovery',
    description: 'Understanding the business context and current challenges',
    objectives: [
      'Identify business type and industry',
      'Understand current team structure',
      'Discover pain points and bottlenecks',
      'Assess growth goals and timeline'
    ],
    questions: [
      'Tell me about your business - what industry are you in and what does your company do?',
      'How many employees do you currently have, and what are their main roles?',
      'What are the biggest challenges or bottlenecks you\'re facing in your business right now?',
      'Where do you see your business in the next 12-24 months?'
    ],
    extractionTargets: [
      'business_type', 'industry', 'company_size', 'current_team', 
      'pain_points', 'growth_goals', 'timeline', 'revenue_range'
    ]
  },
  role_specification: {
    name: 'Role Specification',
    description: 'Defining the specific offshore role requirements',
    objectives: [
      'Identify specific role needed',
      'Define required skills and experience',
      'Understand daily tasks and responsibilities',
      'Determine reporting structure'
    ],
    questions: [
      'Based on what you\'ve shared, what specific role or position would help solve your biggest challenge?',
      'What skills and experience level would this person need to have?',
      'Can you walk me through what a typical day or week would look like for this role?',
      'How would this person fit into your current team structure?'
    ],
    extractionTargets: [
      'role_title', 'required_skills', 'experience_level', 'daily_tasks',
      'reporting_structure', 'collaboration_needs', 'tools_software'
    ]
  },
  qualification: {
    name: 'Qualification & Requirements',
    description: 'Gathering detailed requirements and preferences',
    objectives: [
      'Determine budget range and expectations',
      'Understand timeline and urgency',
      'Identify communication preferences',
      'Assess management capabilities'
    ],
    questions: [
      'What\'s your budget range for this offshore team member?',
      'How quickly do you need to get someone started?',
      'What are your preferences for communication and collaboration?',
      'Have you managed remote or offshore team members before?'
    ],
    extractionTargets: [
      'budget_range', 'start_timeline', 'communication_preferences',
      'management_experience', 'time_zone_preferences', 'cultural_preferences'
    ]
  },
  quote_generation: {
    name: 'Quote Generation',
    description: 'Creating personalized quote and implementation plan',
    objectives: [
      'Generate accurate pricing quote',
      'Create implementation timeline',
      'Provide role recommendations',
      'Outline next steps'
    ],
    questions: [
      'Let me create a personalized quote based on everything we\'ve discussed...',
      'Here\'s what I recommend for your specific situation...',
      'Would you like me to explain any part of this quote in more detail?',
      'What questions do you have about moving forward?'
    ],
    extractionTargets: [
      'quote_acceptance', 'concerns', 'additional_questions', 'next_steps_interest'
    ]
  }
}

export class ConversationEngine {
  constructor() {
    // Temporarily disable database-dependent components for testing
    // this.memoryManager = new MemoryManager()
    // this.quoteGenerator = new QuoteGenerator()
  }

  async startConversation(anonymousId: string): Promise<string> {
    // Generate a simple session ID for testing
    const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // For now, return the session ID without database operations
    console.log(`✅ Started conversation session: ${sessionId}`)
    return sessionId
  }

  async processMessage(
    sessionId: string, 
    userMessage: string
  ): Promise<{
    response: string
    phase: string
    step: number
    isComplete: boolean
    quote?: any
  }> {
    console.log(`📝 Processing message for session ${sessionId}: ${userMessage}`)

    try {
      // Use Anthropic directly for now
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      })

      const response = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        temperature: 0.7,
        system: `You are an expert offshore staffing consultant. Help the user understand their offshore staffing needs and provide personalized recommendations. Ask relevant questions to understand their business, role requirements, budget, and timeline.`,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      })

      const aiMessage = response.content[0].type === 'text' ? response.content[0].text : 'I can help you with offshore staffing. What would you like to know?'

      console.log(`🤖 AI Response: ${aiMessage.slice(0, 100)}...`)

      return {
        response: aiMessage,
        phase: 'discovery',
        step: 1,
        isComplete: false,
        quote: null
      }

    } catch (error) {
      console.error('❌ Error processing message:', error)
      
      // Return a fallback response
      return {
        response: "I'm here to help you find the perfect offshore team member for your business. Could you tell me about your company and what kind of role you're looking to fill?",
        phase: 'discovery',
        step: 1,
        isComplete: false,
        quote: null
      }
    }
  }

  private async generateWelcomeMessage(): Promise<string> {
    return `👋 Hi there! I'm your AI assistant, and I'm here to help you find the perfect offshore team member for your business.

I'll ask you a few questions to understand your specific needs, and then I'll create a personalized quote and implementation plan just for you.

This usually takes about 5-10 minutes, and by the end, you'll have:
✅ A detailed quote with transparent pricing
✅ Specific role recommendations
✅ A clear implementation timeline
✅ Next steps to get started

Let's begin! Tell me about your business - what industry are you in and what does your company do?`
  }

  private async generateAIResponse(
    context: any, 
    userMessage: string, 
    session: any
  ): Promise<{
    content: string
    messageType: string
    confidence: number
    nextPhase: string
    nextStep: number
    shouldGenerateQuote: boolean
  }> {
    const currentPhase = CONVERSATION_PHASES[session.phase]
    const systemPrompt = this.buildSystemPrompt(currentPhase, context, session)

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    // Analyze response to determine next phase/step
    const analysis = await this.analyzeResponse(content, session)

    return {
      content,
      messageType: analysis.messageType,
      confidence: analysis.confidence,
      nextPhase: analysis.nextPhase,
      nextStep: analysis.nextStep,
      shouldGenerateQuote: analysis.shouldGenerateQuote
    }
  }

  private buildSystemPrompt(phase: ConversationPhase, context: any, session: any): string {
    return `You are an expert AI assistant for ScaleMate, specializing in offshore staffing solutions. You're currently in the "${phase.name}" phase of a conversation.

PHASE OBJECTIVES:
${phase.objectives.map(obj => `- ${obj}`).join('\n')}

CONVERSATION CONTEXT:
- Current Phase: ${session.phase}
- Current Step: ${session.currentStep} of ${session.totalSteps}
- Business Context: ${JSON.stringify(context.businessContext || {})}
- Role Requirements: ${JSON.stringify(context.roleRequirements || {})}
- Previous Insights: ${JSON.stringify(context.previousInsights || {})}

EXTRACTION TARGETS FOR THIS PHASE:
${phase.extractionTargets.map(target => `- ${target}`).join('\n')}

GUIDELINES:
1. Ask ONE focused question at a time
2. Be conversational and empathetic
3. Extract specific data points naturally
4. Acknowledge what they've shared before asking the next question
5. If they give incomplete answers, ask follow-up questions
6. Keep responses under 150 words
7. Use emojis sparingly but effectively
8. Always relate back to their business goals

RESPONSE FORMAT:
- Start with acknowledgment of their input
- Ask your next question clearly
- End with encouragement or context about why you're asking

Remember: You're building trust and gathering information to create the perfect offshore staffing solution for their specific needs.`
  }

  private async extractDataFromMessage(message: string, phase: string): Promise<Record<string, any>> {
    const extractionPrompt = `Extract structured data from this user message for the ${phase} phase:

Message: "${message}"

Extract relevant information and return as JSON with these potential fields:
${CONVERSATION_PHASES[phase].extractionTargets.map(target => `- ${target}`).join('\n')}

Return only valid JSON with extracted values. If information isn't present, omit the field.`

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.1,
      messages: [
        {
          role: 'user',
          content: extractionPrompt
        }
      ]
    })

    try {
      const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
      return JSON.parse(content)
    } catch (error) {
      console.error('Failed to parse extracted data:', error)
      return {}
    }
  }

  private async analyzeResponse(
    response: string, 
    session: any
  ): Promise<{
    messageType: string
    confidence: number
    nextPhase: string
    nextStep: number
    shouldGenerateQuote: boolean
  }> {
    // Simple logic for phase progression
    const phases = ['discovery', 'role_specification', 'qualification', 'quote_generation']
    const currentPhaseIndex = phases.indexOf(session.phase)
    
    let nextPhase = session.phase
    let nextStep = session.currentStep

    // Progress to next step/phase based on conversation flow
    if (session.currentStep >= 4 && currentPhaseIndex < phases.length - 1) {
      nextPhase = phases[currentPhaseIndex + 1]
      nextStep = 1
    } else if (session.currentStep < 4) {
      nextStep = session.currentStep + 1
    }

    return {
      messageType: 'question',
      confidence: 0.85,
      nextPhase,
      nextStep,
      shouldGenerateQuote: nextPhase === 'quote_generation' && nextStep >= 2
    }
  }

    private async buildConversationContext(session: any): Promise<any> {
    // const memory = await this.memoryManager.getMemory(session.id)

    return {
      sessionId: session.id,
      phase: session.phase,
      step: session.currentStep,
      businessContext: {},
      roleRequirements: {},
      qualificationData: {},
      previousInsights: {},
      conversationHistory: session.messages?.slice(0, 5) || []
    }
  }

  private async saveMessage(
    sessionId: string,
    role: string,
    content: string,
    phase: string,
    step: number,
    messageType: string,
    extractedData?: any,
    confidence?: number,
    processingTime?: number
  ): Promise<void> {
    // TODO: Fix database schema and implement proper message saving
    console.log('Message would be saved:', { sessionId, role, content: content.slice(0, 50) })
  }

  private async generateAndStoreEmbedding(
    sessionId: string,
    content: string,
    phase: string
  ): Promise<void> {
    try {
      const embedding = await generateEmbedding(content)
      
      await db.insert(conversationEmbeddings).values({
        sessionId,
        content,
        embedding: JSON.stringify(embedding),
        category: phase,
        tags: { phase, timestamp: new Date().toISOString() }
      })
    } catch (error) {
      console.error('Failed to generate embedding:', error)
    }
  }

  private async updateSessionState(
    sessionId: string,
    phase: string,
    step: number,
    extractedData: any
  ): Promise<any> {
    const completionRate = ((step - 1) / 16) * 100 // 4 phases × 4 steps

    return await db.update(conversationSessions)
      .set({
        phase,
        currentStep: step,
        completionRate: completionRate.toString(),
        lastInteraction: new Date(),
        updatedAt: new Date()
      })
      .where(eq(conversationSessions.id, sessionId))
      .returning()
  }

  private async trackEvent(
    sessionId: string,
    eventType: string,
    eventData: any
  ): Promise<void> {
    // TODO: Fix database schema and implement proper event tracking
    console.log('Event would be tracked:', { sessionId, eventType, eventData })
  }

  // Helper methods for LangChain agent context
  private async getBusinessContext(sessionId: string): Promise<string> {
    // TODO: Implement when database is working
    return 'Business context not available'
  }

  private async getRoleRequirements(sessionId: string): Promise<string[]> {
    // TODO: Implement when database is working
    return []
  }

  private async getQualificationCriteria(sessionId: string): Promise<Record<string, any>> {
    // TODO: Implement when database is working
    return {}
  }
} 