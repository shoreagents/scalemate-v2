import { db } from '@/lib/db'
import { conversationMemory, conversationSessions } from '@/lib/db/schema'
import { eq, and, desc, gte } from 'drizzle-orm'

export interface MemoryItem {
  key: string
  value: any
  importance: number
  memoryType: 'short_term' | 'long_term' | 'context'
  expiresAt?: Date
}

export interface ConversationContext {
  businessContext: Record<string, any>
  roleRequirements: Record<string, any>
  qualificationData: Record<string, any>
  previousInsights: Record<string, any>
  userPreferences: Record<string, any>
}

export class MemoryManager {
  private readonly SHORT_TERM_EXPIRY = 30 * 60 * 1000 // 30 minutes
  private readonly LONG_TERM_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days
  private readonly HIGH_IMPORTANCE_THRESHOLD = 0.8
  private readonly MEDIUM_IMPORTANCE_THRESHOLD = 0.5

  async updateMemory(sessionId: string, extractedData: Record<string, any>): Promise<void> {
    const memoryItems = this.processExtractedData(extractedData)
    
    for (const item of memoryItems) {
      await this.storeMemoryItem(sessionId, item)
    }

    // Clean up expired memory
    await this.cleanupExpiredMemory(sessionId)
  }

  async getMemory(sessionId: string): Promise<ConversationContext> {
    const memoryItems = await db.query.conversationMemory.findMany({
      where: and(
        eq(conversationMemory.sessionId, sessionId),
        // Only get non-expired items
        eq(conversationMemory.expiresAt, null) // or gte(conversationMemory.expiresAt, new Date())
      ),
      orderBy: [desc(conversationMemory.importance), desc(conversationMemory.lastAccessed)]
    })

    return this.buildContext(memoryItems)
  }

  async getRelevantMemory(
    sessionId: string, 
    context: string, 
    limit: number = 10
  ): Promise<MemoryItem[]> {
    // Get memory items sorted by relevance and importance
    const memoryItems = await db.query.conversationMemory.findMany({
      where: eq(conversationMemory.sessionId, sessionId),
      orderBy: [desc(conversationMemory.importance), desc(conversationMemory.accessCount)],
      limit
    })

    // Update access count for retrieved items
    for (const item of memoryItems) {
      await this.incrementAccessCount(item.id)
    }

    return memoryItems.map(item => ({
      key: item.key,
      value: item.value,
      importance: parseFloat(item.importance || '1.0'),
      memoryType: item.memoryType as 'short_term' | 'long_term' | 'context',
      expiresAt: item.expiresAt || undefined
    }))
  }

  async consolidateMemory(sessionId: string): Promise<void> {
    // Get all memory items for the session
    const allMemory = await db.query.conversationMemory.findMany({
      where: eq(conversationMemory.sessionId, sessionId),
      orderBy: desc(conversationMemory.importance)
    })

    // Group related memories
    const consolidatedMemory = this.consolidateRelatedMemories(allMemory)

    // Update consolidated memories
    for (const [key, consolidatedItem] of Object.entries(consolidatedMemory)) {
      await this.storeMemoryItem(sessionId, {
        key,
        value: consolidatedItem.value,
        importance: consolidatedItem.importance,
        memoryType: 'long_term'
      })
    }
  }

  async getMemorySummary(sessionId: string): Promise<string> {
    const context = await this.getMemory(sessionId)
    
    const summary = {
      business: this.summarizeBusinessContext(context.businessContext),
      role: this.summarizeRoleRequirements(context.roleRequirements),
      qualification: this.summarizeQualificationData(context.qualificationData),
      insights: this.summarizePreviousInsights(context.previousInsights)
    }

    return JSON.stringify(summary, null, 2)
  }

  private processExtractedData(extractedData: Record<string, any>): MemoryItem[] {
    const memoryItems: MemoryItem[] = []

    for (const [key, value] of Object.entries(extractedData)) {
      if (value === null || value === undefined || value === '') continue

      const importance = this.calculateImportance(key, value)
      const memoryType = this.determineMemoryType(key, importance)
      const expiresAt = this.calculateExpiry(memoryType)

      memoryItems.push({
        key,
        value,
        importance,
        memoryType,
        expiresAt
      })
    }

    return memoryItems
  }

  private calculateImportance(key: string, value: any): number {
    // Business-critical information gets highest importance
    const highImportanceKeys = [
      'business_type', 'industry', 'revenue_range', 'company_size',
      'role_title', 'budget_range', 'required_skills', 'start_timeline'
    ]

    // Medium importance for operational details
    const mediumImportanceKeys = [
      'pain_points', 'growth_goals', 'daily_tasks', 'communication_preferences',
      'management_experience', 'tools_software'
    ]

    if (highImportanceKeys.includes(key)) {
      return 0.9
    } else if (mediumImportanceKeys.includes(key)) {
      return 0.6
    } else if (typeof value === 'object' && Object.keys(value).length > 3) {
      return 0.7 // Complex objects are generally important
    } else if (typeof value === 'string' && value.length > 100) {
      return 0.5 // Detailed text responses
    } else {
      return 0.3 // Default importance
    }
  }

  private determineMemoryType(key: string, importance: number): 'short_term' | 'long_term' | 'context' {
    if (importance >= this.HIGH_IMPORTANCE_THRESHOLD) {
      return 'long_term'
    } else if (importance >= this.MEDIUM_IMPORTANCE_THRESHOLD) {
      return 'context'
    } else {
      return 'short_term'
    }
  }

  private calculateExpiry(memoryType: 'short_term' | 'long_term' | 'context'): Date | undefined {
    const now = new Date()
    
    switch (memoryType) {
      case 'short_term':
        return new Date(now.getTime() + this.SHORT_TERM_EXPIRY)
      case 'context':
        return new Date(now.getTime() + this.LONG_TERM_EXPIRY)
      case 'long_term':
        return undefined // Never expires
      default:
        return new Date(now.getTime() + this.SHORT_TERM_EXPIRY)
    }
  }

  private async storeMemoryItem(sessionId: string, item: MemoryItem): Promise<void> {
    // Check if memory item already exists
    const existing = await db.query.conversationMemory.findFirst({
      where: and(
        eq(conversationMemory.sessionId, sessionId),
        eq(conversationMemory.key, item.key)
      )
    })

    if (existing) {
      // Update existing memory item
      await db.update(conversationMemory)
        .set({
          value: item.value,
          importance: item.importance.toString(),
          memoryType: item.memoryType,
          expiresAt: item.expiresAt,
          lastAccessed: new Date(),
          accessCount: (existing.accessCount || 0) + 1
        })
        .where(eq(conversationMemory.id, existing.id))
    } else {
      // Create new memory item
      await db.insert(conversationMemory).values({
        sessionId,
        key: item.key,
        value: item.value,
        importance: item.importance.toString(),
        memoryType: item.memoryType,
        expiresAt: item.expiresAt,
        accessCount: 1
      })
    }
  }

  private buildContext(memoryItems: any[]): ConversationContext {
    const context: ConversationContext = {
      businessContext: {},
      roleRequirements: {},
      qualificationData: {},
      previousInsights: {},
      userPreferences: {}
    }

    for (const item of memoryItems) {
      const category = this.categorizeMemoryItem(item.key)
      context[category][item.key] = item.value
    }

    return context
  }

  private categorizeMemoryItem(key: string): keyof ConversationContext {
    const businessKeys = [
      'business_type', 'industry', 'company_size', 'current_team',
      'revenue_range', 'growth_goals', 'pain_points'
    ]

    const roleKeys = [
      'role_title', 'required_skills', 'experience_level', 'daily_tasks',
      'reporting_structure', 'collaboration_needs', 'tools_software'
    ]

    const qualificationKeys = [
      'budget_range', 'start_timeline', 'communication_preferences',
      'management_experience', 'time_zone_preferences', 'cultural_preferences'
    ]

    const insightKeys = [
      'recommendations', 'concerns', 'priorities', 'decision_factors'
    ]

    if (businessKeys.includes(key)) return 'businessContext'
    if (roleKeys.includes(key)) return 'roleRequirements'
    if (qualificationKeys.includes(key)) return 'qualificationData'
    if (insightKeys.includes(key)) return 'previousInsights'
    
    return 'userPreferences'
  }

  private consolidateRelatedMemories(memoryItems: any[]): Record<string, any> {
    const consolidated: Record<string, any> = {}

    // Group by category
    const categories = {
      business: memoryItems.filter(item => this.categorizeMemoryItem(item.key) === 'businessContext'),
      role: memoryItems.filter(item => this.categorizeMemoryItem(item.key) === 'roleRequirements'),
      qualification: memoryItems.filter(item => this.categorizeMemoryItem(item.key) === 'qualificationData'),
      insights: memoryItems.filter(item => this.categorizeMemoryItem(item.key) === 'previousInsights')
    }

    // Consolidate each category
    for (const [categoryName, items] of Object.entries(categories)) {
      if (items.length > 0) {
        consolidated[`${categoryName}_summary`] = {
          value: this.mergeMemoryItems(items),
          importance: Math.max(...items.map(item => parseFloat(item.importance || '0')))
        }
      }
    }

    return consolidated
  }

  private mergeMemoryItems(items: any[]): any {
    const merged: Record<string, any> = {}
    
    for (const item of items) {
      merged[item.key] = item.value
    }

    return merged
  }

  private async incrementAccessCount(memoryId: string): Promise<void> {
    await db.update(conversationMemory)
      .set({
        accessCount: db.raw('access_count + 1'),
        lastAccessed: new Date()
      })
      .where(eq(conversationMemory.id, memoryId))
  }

  private async cleanupExpiredMemory(sessionId: string): Promise<void> {
    const now = new Date()
    
    await db.delete(conversationMemory)
      .where(and(
        eq(conversationMemory.sessionId, sessionId),
        gte(conversationMemory.expiresAt, now)
      ))
  }

  private summarizeBusinessContext(context: Record<string, any>): string {
    const parts = []
    
    if (context.business_type) parts.push(`Business: ${context.business_type}`)
    if (context.industry) parts.push(`Industry: ${context.industry}`)
    if (context.company_size) parts.push(`Size: ${context.company_size}`)
    if (context.revenue_range) parts.push(`Revenue: ${context.revenue_range}`)
    
    return parts.join(' | ')
  }

  private summarizeRoleRequirements(context: Record<string, any>): string {
    const parts = []
    
    if (context.role_title) parts.push(`Role: ${context.role_title}`)
    if (context.experience_level) parts.push(`Level: ${context.experience_level}`)
    if (context.required_skills) parts.push(`Skills: ${Array.isArray(context.required_skills) ? context.required_skills.join(', ') : context.required_skills}`)
    
    return parts.join(' | ')
  }

  private summarizeQualificationData(context: Record<string, any>): string {
    const parts = []
    
    if (context.budget_range) parts.push(`Budget: ${context.budget_range}`)
    if (context.start_timeline) parts.push(`Timeline: ${context.start_timeline}`)
    if (context.management_experience) parts.push(`Management: ${context.management_experience}`)
    
    return parts.join(' | ')
  }

  private summarizePreviousInsights(context: Record<string, any>): string {
    const insights = Object.values(context).filter(Boolean)
    return insights.slice(0, 3).join(' | ')
  }
} 