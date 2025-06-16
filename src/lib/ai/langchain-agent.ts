import { ChatOpenAI } from '@langchain/openai'
import { ChatAnthropic } from '@langchain/anthropic'
import { ConversationChain } from 'langchain/chains'
import { BufferMemory, ConversationSummaryBufferMemory } from 'langchain/memory'
import { PromptTemplate, ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'
import { qdrantService, ConversationDocument } from './qdrant-service'
import { db } from '@/lib/db'
import { conversationSessions, conversationMessages, conversationMemory } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

export interface ConversationContext {
  sessionId: string
  phase: 'discovery' | 'role_specification' | 'qualification' | 'quote_generation'
  step: number
  extractedData: Record<string, any>
  businessContext: string
  roleRequirements: string[]
  qualificationCriteria: Record<string, any>
}

export interface AgentResponse {
  message: string
  phase: string
  step: number
  nextAction: 'continue' | 'next_phase' | 'generate_quote' | 'clarify'
  extractedData: Record<string, any>
  confidence: number
  reasoning: string
  suggestions: string[]
}

export class LangChainConversationAgent {
  private openaiChat: ChatOpenAI | null = null
  private claudeChat: ChatAnthropic | null = null
  private memory: ConversationSummaryBufferMemory | null = null
  private conversationChain: ConversationChain | null = null

  constructor() {
    // Lazy initialization to avoid build-time issues
  }

  private getOpenAIChat(): ChatOpenAI {
    if (!this.openaiChat) {
      this.openaiChat = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY!,
        modelName: 'gpt-4-turbo-preview',
        temperature: 0.7,
        maxTokens: 2000,
      })
    }
    return this.openaiChat
  }

  private getClaudeChat(): ChatAnthropic {
    if (!this.claudeChat) {
      this.claudeChat = new ChatAnthropic({
        anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
        modelName: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        maxTokens: 4000,
      })
    }
    return this.claudeChat
  }

  private getMemory(): ConversationSummaryBufferMemory {
    if (!this.memory) {
      this.memory = new ConversationSummaryBufferMemory({
        llm: this.getOpenAIChat(),
        maxTokenLimit: 2000,
        returnMessages: true,
      })
    }
    return this.memory
  }

  async initializeSession(sessionId: string): Promise<void> {
    // Temporarily skip database operations for testing
    console.log(`🔧 Initializing LangChain session: ${sessionId}`)
    
    // Skip loading conversation history for now
    // const messages = await db.select()...
    
    console.log(`✅ LangChain session initialized: ${sessionId}`)
  }

  async processMessage(
    sessionId: string,
    userMessage: string,
    context: ConversationContext
  ): Promise<AgentResponse> {
    try {
      console.log(`🧠 Processing with LangChain agent: ${userMessage.slice(0, 50)}...`)

      // Skip vector search for now
      // const similarConversations = await qdrantService.searchSimilarConversations(...)
      // const sessionContext = await qdrantService.getConversationContext(...)

      // Determine which AI to use based on the phase and complexity
      const useClaudeForReasoning = this.shouldUseClaudeForReasoning(context.phase, userMessage)

      let response: AgentResponse

      if (useClaudeForReasoning) {
        console.log(`🔮 Using Claude for advanced reasoning`)
        response = await this.processWithClaude(userMessage, context, [], [])
      } else {
        console.log(`🤖 Using OpenAI for conversation`)
        response = await this.processWithOpenAI(userMessage, context, [], [])
      }

      // Skip vector storage for now
      // await this.storeConversationInVector(sessionId, userMessage, response, context)

      // Update memory
      await this.getMemory().chatMemory.addUserMessage(userMessage)
      await this.getMemory().chatMemory.addAIMessage(response.message)

      console.log(`✅ LangChain processing complete`)
      return response

    } catch (error) {
      console.error('❌ Error in LangChain agent:', error)
      
      // Return a fallback response
      return {
        message: "I understand you're looking for offshore staffing solutions. Could you tell me more about your business and what specific role you need help with?",
        phase: context.phase,
        step: context.step,
        nextAction: 'continue',
        extractedData: {},
        confidence: 0.7,
        reasoning: 'Fallback response due to processing error',
        suggestions: ['Tell me about your business', 'Describe the role you need', 'What\'s your timeline?'],
      }
    }
  }

  private shouldUseClaudeForReasoning(phase: string, message: string): boolean {
    // Use Claude for complex reasoning tasks
    const complexityIndicators = [
      'analyze', 'compare', 'evaluate', 'recommend', 'strategy', 'complex',
      'multiple', 'various', 'different', 'best', 'optimal', 'pros and cons'
    ]

    const isComplexQuery = complexityIndicators.some(indicator => 
      message.toLowerCase().includes(indicator)
    )

    const isAdvancedPhase = ['qualification', 'quote_generation'].includes(phase)

    return isComplexQuery || isAdvancedPhase
  }

  private async processWithClaude(
    userMessage: string,
    context: ConversationContext,
    similarConversations: any[],
    sessionContext: any[]
  ): Promise<AgentResponse> {
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(this.getClaudeSystemPrompt(context)),
      new MessagesPlaceholder('chat_history'),
      new HumanMessage(`
        User Message: ${userMessage}
        
        Current Context:
        - Phase: ${context.phase}
        - Step: ${context.step}
        - Extracted Data: ${JSON.stringify(context.extractedData, null, 2)}
        
        Similar Conversations:
        ${similarConversations.map(conv => `- ${conv.document.content} (Score: ${conv.score})`).join('\n')}
        
        Session Context:
        ${sessionContext.map(ctx => `- ${ctx.document.content}`).join('\n')}
        
        Please provide a comprehensive response with analysis and recommendations.
      `)
    ])

    const chain = RunnableSequence.from([
      prompt,
      this.getClaudeChat(),
      new StringOutputParser(),
    ])

    const chatHistory = await this.memory.chatMemory.getMessages()
    const rawResponse = await chain.invoke({
      chat_history: chatHistory,
    })

    return this.parseAgentResponse(rawResponse, context)
  }

  private async processWithOpenAI(
    userMessage: string,
    context: ConversationContext,
    similarConversations: any[],
    sessionContext: any[]
  ): Promise<AgentResponse> {
    const prompt = ChatPromptTemplate.fromMessages([
      new SystemMessage(this.getOpenAISystemPrompt(context)),
      new MessagesPlaceholder('chat_history'),
      new HumanMessage(`
        User: ${userMessage}
        
        Context: Phase ${context.phase}, Step ${context.step}
        Data: ${JSON.stringify(context.extractedData)}
        
        Similar: ${similarConversations.map(c => c.document.content.slice(0, 100)).join('; ')}
      `)
    ])

    const chain = RunnableSequence.from([
      prompt,
      this.getOpenAIChat(),
      new StringOutputParser(),
    ])

    const chatHistory = await this.memory.chatMemory.getMessages()
    const rawResponse = await chain.invoke({
      chat_history: chatHistory,
    })

    return this.parseAgentResponse(rawResponse, context)
  }

  private getClaudeSystemPrompt(context: ConversationContext): string {
    return `You are an expert offshore staffing consultant with deep expertise in business analysis, role specification, and strategic recommendations. You're conducting an intelligent conversation to understand the client's needs and provide personalized offshore staffing solutions.

CURRENT PHASE: ${context.phase.toUpperCase()}

CONVERSATION PHASES:
1. DISCOVERY: Understand business, challenges, goals, current team structure
2. ROLE_SPECIFICATION: Define specific roles, skills, experience levels, responsibilities  
3. QUALIFICATION: Assess budget, timeline, management preferences, cultural fit
4. QUOTE_GENERATION: Create comprehensive quotes with alternatives and implementation plans

YOUR EXPERTISE:
- Business process analysis and optimization
- Offshore team structure design
- Role specification and skill mapping
- Cultural integration strategies
- Risk assessment and mitigation
- Implementation planning and timeline management

RESPONSE REQUIREMENTS:
- Provide thoughtful, analytical responses
- Ask strategic follow-up questions
- Extract and categorize key information
- Offer insights and recommendations
- Maintain professional yet conversational tone
- Progress logically through the conversation phases

RESPONSE FORMAT:
Your response should be structured as:
MESSAGE: [Your conversational response]
PHASE: [Current phase]
STEP: [Current step number]
ACTION: [continue|next_phase|generate_quote|clarify]
EXTRACTED: [JSON object with extracted data]
CONFIDENCE: [0-1 confidence score]
REASONING: [Your analytical reasoning]
SUGGESTIONS: [Array of strategic suggestions]

Focus on providing value through deep analysis, strategic thinking, and actionable recommendations.`
  }

  private getOpenAISystemPrompt(context: ConversationContext): string {
    return `You are a friendly and efficient offshore staffing consultant conducting a conversation to understand client needs and provide quotes.

Phase: ${context.phase} | Step: ${context.step}

PHASES: discovery → role_specification → qualification → quote_generation

Your role:
- Ask relevant questions for current phase
- Extract key information
- Guide conversation naturally
- Provide helpful insights
- Progress through phases logically

Response format:
MESSAGE: [conversational response]
PHASE: [current phase]  
STEP: [step number]
ACTION: [continue|next_phase|generate_quote|clarify]
EXTRACTED: [JSON with extracted data]
CONFIDENCE: [0-1 score]
REASONING: [brief reasoning]
SUGGESTIONS: [helpful suggestions array]

Keep responses natural, helpful, and focused on gathering the right information for each phase.`
  }

  private parseAgentResponse(rawResponse: string, context: ConversationContext): AgentResponse {
    try {
      // Parse structured response
      const lines = rawResponse.split('\n')
      const parsed: any = {}

      for (const line of lines) {
        if (line.startsWith('MESSAGE:')) {
          parsed.message = line.substring(8).trim()
        } else if (line.startsWith('PHASE:')) {
          parsed.phase = line.substring(6).trim()
        } else if (line.startsWith('STEP:')) {
          parsed.step = parseInt(line.substring(5).trim()) || context.step
        } else if (line.startsWith('ACTION:')) {
          parsed.nextAction = line.substring(7).trim()
        } else if (line.startsWith('EXTRACTED:')) {
          try {
            parsed.extractedData = JSON.parse(line.substring(10).trim())
          } catch {
            parsed.extractedData = {}
          }
        } else if (line.startsWith('CONFIDENCE:')) {
          parsed.confidence = parseFloat(line.substring(11).trim()) || 0.8
        } else if (line.startsWith('REASONING:')) {
          parsed.reasoning = line.substring(10).trim()
        } else if (line.startsWith('SUGGESTIONS:')) {
          try {
            parsed.suggestions = JSON.parse(line.substring(12).trim())
          } catch {
            parsed.suggestions = []
          }
        }
      }

      // Fallback to full response as message if parsing fails
      if (!parsed.message) {
        parsed.message = rawResponse
      }

      return {
        message: parsed.message || rawResponse,
        phase: parsed.phase || context.phase,
        step: parsed.step || context.step,
        nextAction: parsed.nextAction || 'continue',
        extractedData: parsed.extractedData || {},
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Standard conversation flow',
        suggestions: parsed.suggestions || [],
      }

    } catch (error) {
      console.error('Error parsing agent response:', error)
      
      // Return fallback response
      return {
        message: rawResponse,
        phase: context.phase,
        step: context.step,
        nextAction: 'continue',
        extractedData: {},
        confidence: 0.7,
        reasoning: 'Fallback response due to parsing error',
        suggestions: [],
      }
    }
  }

  private async storeConversationInVector(
    sessionId: string,
    userMessage: string,
    response: AgentResponse,
    context: ConversationContext
  ): Promise<void> {
    const documents: ConversationDocument[] = [
      {
        id: `${sessionId}-user-${Date.now()}`,
        sessionId,
        content: userMessage,
        metadata: {
          phase: context.phase,
          step: context.step,
          role: 'user',
          timestamp: new Date().toISOString(),
          category: this.categorizeContent(userMessage),
          extractedData: response.extractedData,
        },
      },
      {
        id: `${sessionId}-assistant-${Date.now()}`,
        sessionId,
        content: response.message,
        metadata: {
          phase: response.phase,
          step: response.step,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          category: 'response',
          extractedData: response.extractedData,
        },
      },
    ]

    await qdrantService.addConversationDocuments(documents)
  }

  private categorizeContent(content: string): string {
    const categories = {
      business: ['business', 'company', 'industry', 'revenue', 'size', 'team'],
      role: ['role', 'position', 'job', 'responsibilities', 'skills', 'experience'],
      qualification: ['budget', 'timeline', 'management', 'communication', 'culture'],
      technical: ['technical', 'software', 'programming', 'development', 'technology'],
      insights: ['challenge', 'goal', 'objective', 'problem', 'solution', 'strategy'],
    }

    const lowerContent = content.toLowerCase()
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return category
      }
    }

    return 'general'
  }

  async getConversationSummary(sessionId: string): Promise<string> {
    const summary = await this.memory.predictNewSummary(
      await this.memory.chatMemory.getMessages(),
      ''
    )
    return summary
  }

  async analyzeConversationPatterns(sessionId: string): Promise<{
    clusters: Array<{ cluster: any[]; centroid: string }>
    insights: string[]
    recommendations: string[]
  }> {
    // Get conversation clusters
    const clusters = await qdrantService.clusterConversations(sessionId, 0.8)

    // Use Claude for pattern analysis
    const analysisPrompt = `Analyze these conversation clusters and provide insights:

${clusters.map((cluster, i) => `
Cluster ${i + 1} (${cluster.cluster.length} messages):
Centroid: ${cluster.centroid}
Messages: ${cluster.cluster.map(c => c.document.content.slice(0, 100)).join('; ')}
`).join('\n')}

Provide:
1. Key insights about conversation patterns
2. Recommendations for improvement
3. Identified themes and topics`

    const analysis = await this.claudeChat.invoke([
      new SystemMessage('You are an expert conversation analyst. Provide structured insights.'),
      new HumanMessage(analysisPrompt)
    ])

    return {
      clusters,
      insights: [analysis.content.toString()],
      recommendations: ['Continue current approach', 'Focus on specific areas identified'],
    }
  }
}

// Export singleton instance
export const langchainAgent = new LangChainConversationAgent() 