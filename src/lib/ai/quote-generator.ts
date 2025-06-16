import Anthropic from '@anthropic-ai/sdk'
import { db } from '@/lib/db'
import { 
  quoteGenerations, 
  roleTemplates, 
  conversationSessions 
} from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { MemoryManager } from './memory-manager'
import { embeddingService } from './embeddings'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface QuoteRequest {
  businessProfile: {
    type: string
    industry: string
    size: string
    revenue?: string
    currentTeam?: number
    painPoints: string[]
    goals: string[]
  }
  roleRequirements: {
    title: string
    skills: string[]
    experienceLevel: string
    dailyTasks: string[]
    reportingStructure?: string
    toolsRequired?: string[]
  }
  qualificationData: {
    budgetRange: string
    timeline: string
    communicationPrefs: string[]
    managementExperience: string
    timeZonePrefs?: string
    culturalPrefs?: string
  }
}

export interface GeneratedQuote {
  id: string
  sessionId: string
  quote: {
    recommendedRole: {
      title: string
      description: string
      keyResponsibilities: string[]
      requiredSkills: string[]
      experienceLevel: string
      category: string
    }
    pricing: {
      hourlyRate: {
        min: number
        max: number
        recommended: number
        currency: string
      }
      monthlyEstimate: {
        partTime: number
        fullTime: number
        currency: string
      }
      setupFees: {
        recruitment: number
        onboarding: number
        total: number
        currency: string
      }
      totalFirstMonth: number
      ongoingMonthly: number
    }
    implementation: {
      timeline: {
        recruitment: string
        interviews: string
        onboarding: string
        fullProductivity: string
      }
      phases: Array<{
        phase: string
        duration: string
        activities: string[]
        deliverables: string[]
      }>
      supportIncluded: string[]
    }
    alternatives: Array<{
      title: string
      description: string
      pricing: {
        hourlyRate: number
        monthlyEstimate: number
      }
      pros: string[]
      cons: string[]
    }>
    riskFactors: Array<{
      risk: string
      mitigation: string
      impact: 'low' | 'medium' | 'high'
    }>
  }
  confidence: number
  generatedAt: Date
  version: number
}

export class QuoteGenerator {
  private memoryManager: MemoryManager

  constructor() {
    this.memoryManager = new MemoryManager()
  }

  async generateQuote(sessionId: string, context: any): Promise<GeneratedQuote> {
    const startTime = Date.now()

    // Get comprehensive context
    const memory = await this.memoryManager.getMemory(sessionId)
    const quoteRequest = this.buildQuoteRequest(memory)
    
    // Find similar successful quotes for reference
    const similarQuotes = await this.findSimilarQuotes(quoteRequest)
    
    // Get role template recommendations
    const roleTemplates = await this.getRecommendedRoleTemplates(quoteRequest)
    
    // Generate the quote using AI
    const generatedQuote = await this.generateQuoteWithAI(
      quoteRequest, 
      similarQuotes, 
      roleTemplates
    )

    // Calculate confidence score
    const confidence = this.calculateConfidence(quoteRequest, generatedQuote)

    // Store the quote
    const quote: GeneratedQuote = {
      id: crypto.randomUUID(),
      sessionId,
      quote: generatedQuote,
      confidence,
      generatedAt: new Date(),
      version: 1
    }

    await this.storeQuote(quote, quoteRequest, roleTemplates[0]?.id)

    // Track generation time
    const generationTime = Date.now() - startTime
    console.log(`Quote generated in ${generationTime}ms with confidence ${confidence}`)

    return quote
  }

  private buildQuoteRequest(memory: any): QuoteRequest {
    const { businessContext, roleRequirements, qualificationData } = memory

    return {
      businessProfile: {
        type: businessContext.business_type || 'Unknown',
        industry: businessContext.industry || 'General',
        size: businessContext.company_size || 'Small',
        revenue: businessContext.revenue_range,
        currentTeam: businessContext.current_team,
        painPoints: this.extractArray(businessContext.pain_points),
        goals: this.extractArray(businessContext.growth_goals)
      },
      roleRequirements: {
        title: roleRequirements.role_title || 'General Assistant',
        skills: this.extractArray(roleRequirements.required_skills),
        experienceLevel: roleRequirements.experience_level || 'Mid-level',
        dailyTasks: this.extractArray(roleRequirements.daily_tasks),
        reportingStructure: roleRequirements.reporting_structure,
        toolsRequired: this.extractArray(roleRequirements.tools_software)
      },
      qualificationData: {
        budgetRange: qualificationData.budget_range || '$1000-2000/month',
        timeline: qualificationData.start_timeline || '2-4 weeks',
        communicationPrefs: this.extractArray(qualificationData.communication_preferences),
        managementExperience: qualificationData.management_experience || 'Some experience',
        timeZonePrefs: qualificationData.time_zone_preferences,
        culturalPrefs: qualificationData.cultural_preferences
      }
    }
  }

  private async generateQuoteWithAI(
    request: QuoteRequest,
    similarQuotes: any[],
    roleTemplates: any[]
  ): Promise<any> {
    const systemPrompt = this.buildQuoteGenerationPrompt(request, similarQuotes, roleTemplates)

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      temperature: 0.3,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Generate a comprehensive quote for this offshore staffing request:

BUSINESS PROFILE:
- Type: ${request.businessProfile.type}
- Industry: ${request.businessProfile.industry}
- Size: ${request.businessProfile.size}
- Pain Points: ${request.businessProfile.painPoints.join(', ')}
- Goals: ${request.businessProfile.goals.join(', ')}

ROLE REQUIREMENTS:
- Title: ${request.roleRequirements.title}
- Skills: ${request.roleRequirements.skills.join(', ')}
- Experience: ${request.roleRequirements.experienceLevel}
- Daily Tasks: ${request.roleRequirements.dailyTasks.join(', ')}

QUALIFICATION DATA:
- Budget: ${request.qualificationData.budgetRange}
- Timeline: ${request.qualificationData.timeline}
- Management Experience: ${request.qualificationData.managementExperience}

Please generate a detailed quote following the JSON structure specified in the system prompt.`
        }
      ]
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    
    try {
      // Extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (error) {
      console.error('Failed to parse AI quote response:', error)
      return this.generateFallbackQuote(request)
    }
  }

  private buildQuoteGenerationPrompt(
    request: QuoteRequest,
    similarQuotes: any[],
    roleTemplates: any[]
  ): string {
    return `You are an expert offshore staffing consultant creating personalized quotes for ScaleMate clients.

PRICING GUIDELINES:
- Entry Level (0-2 years): $8-15/hour
- Mid Level (2-5 years): $12-25/hour  
- Senior Level (5+ years): $20-40/hour
- Specialist/Expert: $25-50/hour

SETUP FEES:
- Recruitment: $500-1500 (based on role complexity)
- Onboarding: $300-800 (based on role complexity)

ROLE CATEGORIES & BASE RATES:
- Administrative: $8-18/hour
- Customer Service: $10-20/hour
- Content/Marketing: $12-25/hour
- Technical/Development: $15-40/hour
- Design/Creative: $12-30/hour
- Finance/Accounting: $15-35/hour
- Sales/Business Development: $12-30/hour

SIMILAR QUOTES FOR REFERENCE:
${similarQuotes.map(q => `- ${q.role}: $${q.hourlyRate}/hour for ${q.experienceLevel} in ${q.industry}`).join('\n')}

AVAILABLE ROLE TEMPLATES:
${roleTemplates.map(t => `- ${t.name}: ${t.description} (${t.experienceLevel})`).join('\n')}

RESPONSE FORMAT:
Return ONLY valid JSON with this exact structure:

{
  "recommendedRole": {
    "title": "Specific role title",
    "description": "2-3 sentence role description",
    "keyResponsibilities": ["responsibility1", "responsibility2", "responsibility3"],
    "requiredSkills": ["skill1", "skill2", "skill3"],
    "experienceLevel": "Entry/Mid/Senior",
    "category": "Administrative/Technical/Creative/etc"
  },
  "pricing": {
    "hourlyRate": {
      "min": 15,
      "max": 25,
      "recommended": 20,
      "currency": "USD"
    },
    "monthlyEstimate": {
      "partTime": 1600,
      "fullTime": 3200,
      "currency": "USD"
    },
    "setupFees": {
      "recruitment": 800,
      "onboarding": 500,
      "total": 1300,
      "currency": "USD"
    },
    "totalFirstMonth": 4500,
    "ongoingMonthly": 3200
  },
  "implementation": {
    "timeline": {
      "recruitment": "1-2 weeks",
      "interviews": "3-5 days",
      "onboarding": "1 week",
      "fullProductivity": "2-3 weeks"
    },
    "phases": [
      {
        "phase": "Recruitment & Screening",
        "duration": "1-2 weeks",
        "activities": ["Post job", "Screen candidates", "Initial interviews"],
        "deliverables": ["Candidate shortlist", "Interview summaries"]
      }
    ],
    "supportIncluded": ["Dedicated account manager", "24/7 support", "Performance monitoring"]
  },
  "alternatives": [
    {
      "title": "Alternative role option",
      "description": "Brief description",
      "pricing": {
        "hourlyRate": 18,
        "monthlyEstimate": 2880
      },
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1", "Con 2"]
    }
  ],
  "riskFactors": [
    {
      "risk": "Risk description",
      "mitigation": "How we mitigate it",
      "impact": "low/medium/high"
    }
  ]
}

IMPORTANT:
- Base pricing on role complexity, required skills, and experience level
- Consider the client's budget range but don't compromise quality
- Include 2-3 alternative options
- Be specific about timelines and deliverables
- Address potential risks and how ScaleMate mitigates them
- Ensure all numbers are realistic and competitive`
  }

  private generateFallbackQuote(request: QuoteRequest): any {
    // Generate a basic quote structure as fallback
    const baseRate = this.calculateBaseRate(request.roleRequirements)
    
    return {
      recommendedRole: {
        title: request.roleRequirements.title,
        description: `A skilled ${request.roleRequirements.experienceLevel} professional to help with ${request.roleRequirements.dailyTasks.slice(0, 2).join(' and ')}.`,
        keyResponsibilities: request.roleRequirements.dailyTasks.slice(0, 4),
        requiredSkills: request.roleRequirements.skills.slice(0, 5),
        experienceLevel: request.roleRequirements.experienceLevel,
        category: this.categorizeRole(request.roleRequirements.title)
      },
      pricing: {
        hourlyRate: {
          min: Math.max(8, baseRate - 3),
          max: baseRate + 5,
          recommended: baseRate,
          currency: 'USD'
        },
        monthlyEstimate: {
          partTime: baseRate * 80, // 20 hours/week
          fullTime: baseRate * 160, // 40 hours/week
          currency: 'USD'
        },
        setupFees: {
          recruitment: 800,
          onboarding: 500,
          total: 1300,
          currency: 'USD'
        },
        totalFirstMonth: (baseRate * 160) + 1300,
        ongoingMonthly: baseRate * 160
      },
      implementation: {
        timeline: {
          recruitment: '1-2 weeks',
          interviews: '3-5 days',
          onboarding: '1 week',
          fullProductivity: '2-3 weeks'
        },
        phases: [
          {
            phase: 'Recruitment & Screening',
            duration: '1-2 weeks',
            activities: ['Job posting', 'Candidate screening', 'Initial interviews'],
            deliverables: ['Qualified candidate pool', 'Interview reports']
          }
        ],
        supportIncluded: ['Account management', 'Ongoing support', 'Performance monitoring']
      },
      alternatives: [],
      riskFactors: [
        {
          risk: 'Communication barriers',
          mitigation: 'English proficiency testing and communication training',
          impact: 'low'
        }
      ]
    }
  }

  private calculateBaseRate(roleRequirements: any): number {
    let baseRate = 15 // Default mid-range rate

    // Adjust based on experience level
    switch (roleRequirements.experienceLevel.toLowerCase()) {
      case 'entry':
      case 'junior':
        baseRate = 12
        break
      case 'mid':
      case 'intermediate':
        baseRate = 18
        break
      case 'senior':
        baseRate = 28
        break
      case 'expert':
      case 'lead':
        baseRate = 35
        break
    }

    // Adjust based on role category
    const category = this.categorizeRole(roleRequirements.title)
    switch (category) {
      case 'Technical':
        baseRate += 5
        break
      case 'Creative':
        baseRate += 2
        break
      case 'Finance':
        baseRate += 3
        break
      case 'Sales':
        baseRate += 1
        break
    }

    // Adjust based on required skills complexity
    const complexSkills = ['programming', 'development', 'design', 'analytics', 'finance']
    const hasComplexSkills = roleRequirements.skills.some((skill: string) => 
      complexSkills.some(complex => skill.toLowerCase().includes(complex))
    )
    
    if (hasComplexSkills) {
      baseRate += 3
    }

    return Math.min(50, Math.max(8, baseRate)) // Cap between $8-50/hour
  }

  private categorizeRole(title: string): string {
    const titleLower = title.toLowerCase()
    
    if (titleLower.includes('developer') || titleLower.includes('programmer') || titleLower.includes('technical')) {
      return 'Technical'
    } else if (titleLower.includes('design') || titleLower.includes('creative') || titleLower.includes('marketing')) {
      return 'Creative'
    } else if (titleLower.includes('finance') || titleLower.includes('accounting') || titleLower.includes('bookkeeping')) {
      return 'Finance'
    } else if (titleLower.includes('sales') || titleLower.includes('business development')) {
      return 'Sales'
    } else if (titleLower.includes('customer') || titleLower.includes('support')) {
      return 'Customer Service'
    } else {
      return 'Administrative'
    }
  }

  private calculateConfidence(request: QuoteRequest, quote: any): number {
    let confidence = 0.5 // Base confidence

    // Increase confidence based on data completeness
    if (request.businessProfile.type !== 'Unknown') confidence += 0.1
    if (request.businessProfile.industry !== 'General') confidence += 0.1
    if (request.roleRequirements.skills.length > 2) confidence += 0.1
    if (request.qualificationData.budgetRange !== '$1000-2000/month') confidence += 0.1
    if (request.roleRequirements.dailyTasks.length > 2) confidence += 0.1

    // Increase confidence based on quote completeness
    if (quote.alternatives && quote.alternatives.length > 0) confidence += 0.05
    if (quote.riskFactors && quote.riskFactors.length > 0) confidence += 0.05

    return Math.min(1.0, Math.max(0.1, confidence))
  }

  private async findSimilarQuotes(request: QuoteRequest): Promise<any[]> {
    try {
      // Use embedding search to find similar business profiles and role requirements
      const searchQuery = `${request.businessProfile.industry} ${request.roleRequirements.title} ${request.roleRequirements.skills.join(' ')}`
      
      const similarContent = await embeddingService.findSimilarContent(searchQuery, {
        categories: ['quote_generation'],
        limit: 5,
        threshold: 0.6
      })

      // Extract quote data from similar content
      return similarContent.map(content => ({
        role: request.roleRequirements.title,
        hourlyRate: 20, // Placeholder - would extract from actual stored quotes
        experienceLevel: request.roleRequirements.experienceLevel,
        industry: request.businessProfile.industry
      }))
    } catch (error) {
      console.error('Failed to find similar quotes:', error)
      return []
    }
  }

  private async getRecommendedRoleTemplates(request: QuoteRequest): Promise<any[]> {
    // TODO: Implement role template retrieval when database is properly configured
    console.log(`🎯 Getting role templates for: ${request.roleRequirements.title}`)
    return []
  }

  private async storeQuote(
    quote: GeneratedQuote,
    request: QuoteRequest,
    roleTemplateId?: string
  ): Promise<void> {
    // TODO: Implement quote storage when database is properly configured
    console.log(`💾 Storing quote for session: ${quote.sessionId}`)
  }

  private extractArray(value: any): string[] {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      return value.split(',').map(item => item.trim()).filter(Boolean)
    }
    return []
  }
} 