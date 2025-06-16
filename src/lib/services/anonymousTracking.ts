import { dbProxy as db } from '@/lib/db'
import { anonymousSessions, anonymousActivities } from '@/lib/db/schema'
import { eq, desc, and, gte, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export interface ActivityData {
  page?: string
  element?: string
  value?: string
  duration?: number
  metadata?: Record<string, any>
}

export interface DeviceInfo {
  userAgent: string
  screen?: { width: number; height: number }
  timezone?: string
  language?: string
}

export class AnonymousTrackingService {
  
  /**
   * Create or update anonymous session
   */
  async createOrUpdateSession(params: {
    sessionId?: string
    ipAddress?: string
    location?: string
    deviceInfo?: DeviceInfo
    referralSource?: string
    utmParams?: {
      campaign?: string
      source?: string
      medium?: string
    }
  }) {
    const sessionId = params.sessionId || `sess_${nanoid()}`
    
    try {
      // Check if session exists
      const existingSession = await db
        .select()
        .from(anonymousSessions)
        .where(eq(anonymousSessions.sessionId, sessionId))
        .limit(1)
      
      if (existingSession.length > 0) {
        // Update existing session
        await db
          .update(anonymousSessions)
          .set({
            lastActivity: new Date(),
            totalPageViews: sql`${anonymousSessions.totalPageViews} + 1`,
            location: params.location || existingSession[0].location,
            deviceInfo: params.deviceInfo || existingSession[0].deviceInfo,
          })
          .where(eq(anonymousSessions.sessionId, sessionId))
        
        return sessionId
      } else {
        // Create new session
        await db.insert(anonymousSessions).values({
          sessionId,
          ipAddress: params.ipAddress,
          location: params.location,
          deviceInfo: params.deviceInfo,
          totalPageViews: 1,
          referralSource: params.referralSource,
          utmCampaign: params.utmParams?.campaign,
          utmSource: params.utmParams?.source,
          utmMedium: params.utmParams?.medium,
          conversionScore: 0,
          status: 'active'
        })
        
        return sessionId
      }
    } catch (error) {
      console.error('Error creating/updating anonymous session:', error)
      throw new Error('Failed to manage anonymous session')
    }
  }
  
  /**
   * Track activity with intelligent scoring
   */
  async trackActivity(params: {
    sessionId: string
    activityType: 'page_view' | 'button_click' | 'tool_use' | 'download' | 'form_interaction' | 'scroll' | 'time_spent'
    activityData: ActivityData
    pagePath?: string
    elementId?: string
    duration?: number
  }) {
    try {
      // Calculate value score based on activity type and context
      const valueScore = this.calculateActivityScore(params.activityType, params.activityData)
      
      // Insert activity
      await db.insert(anonymousActivities).values({
        sessionId: params.sessionId,
        activityType: params.activityType,
        activityData: params.activityData,
        valueScore,
        pagePath: params.pagePath,
        elementId: params.elementId,
        duration: params.duration,
        timestamp: new Date()
      })
      
      // Update session conversion score
      await this.updateConversionScore(params.sessionId, valueScore)
      
      return { success: true, valueScore }
    } catch (error) {
      console.error('Error tracking activity:', error)
      throw new Error('Failed to track activity')
    }
  }
  
  /**
   * Calculate intelligent activity scoring
   */
  private calculateActivityScore(activityType: string, activityData: ActivityData): number {
    let baseScore = 1
    
    switch (activityType) {
      case 'page_view':
        baseScore = 2
        // Higher score for important pages
        if (activityData.page?.includes('quote') || activityData.page?.includes('tool')) {
          baseScore = 5
        }
        if (activityData.page?.includes('pricing') || activityData.page?.includes('contact')) {
          baseScore = 8
        }
        break
        
      case 'button_click':
        baseScore = 5
        // Higher score for conversion-oriented clicks
        if (activityData.element?.includes('cta') || activityData.element?.includes('signup')) {
          baseScore = 15
        }
        if (activityData.element?.includes('quote') || activityData.element?.includes('start')) {
          baseScore = 20
        }
        break
        
      case 'tool_use':
        baseScore = 15
        // Very high score for tool engagement
        if (activityData.metadata?.completed) {
          baseScore = 30
        }
        break
        
      case 'download':
        baseScore = 20
        // Downloads show high intent
        break
        
      case 'form_interaction':
        baseScore = 10
        // Form fills show engagement
        if (activityData.metadata?.submitted) {
          baseScore = 25
        }
        break
        
      case 'time_spent':
        // Score based on time spent (1 point per 30 seconds, max 10)
        baseScore = Math.min(Math.floor((activityData.duration || 0) / 30000), 10)
        break
        
      default:
        baseScore = 1
    }
    
    return baseScore
  }
  
  /**
   * Update session conversion score
   */
  private async updateConversionScore(sessionId: string, additionalScore: number) {
    try {
      await db
        .update(anonymousSessions)
        .set({
          conversionScore: sql`${anonymousSessions.conversionScore} + ${additionalScore}`,
          lastActivity: new Date()
        })
        .where(eq(anonymousSessions.sessionId, sessionId))
    } catch (error) {
      console.error('Error updating conversion score:', error)
    }
  }
  
  /**
   * Get session summary with activities
   */
  async getSessionSummary(sessionId: string) {
    try {
      const session = await db
        .select()
        .from(anonymousSessions)
        .where(eq(anonymousSessions.sessionId, sessionId))
        .limit(1)
      
      if (session.length === 0) {
        return null
      }
      
      const activities = await db
        .select()
        .from(anonymousActivities)
        .where(eq(anonymousActivities.sessionId, sessionId))
        .orderBy(desc(anonymousActivities.timestamp))
        .limit(50)
      
      // Calculate engagement metrics
      const metrics = this.calculateEngagementMetrics(activities)
      
      return {
        session: session[0],
        activities,
        metrics
      }
    } catch (error) {
      console.error('Error getting session summary:', error)
      throw new Error('Failed to get session summary')
    }
  }
  
  /**
   * Calculate engagement metrics
   */
  private calculateEngagementMetrics(activities: any[]) {
    const totalActivities = activities.length
    const totalValueScore = activities.reduce((sum, activity) => sum + activity.valueScore, 0)
    const uniquePages = new Set(activities.map(a => a.pagePath)).size
    const toolUsage = activities.filter(a => a.activityType === 'tool_use').length
    const downloads = activities.filter(a => a.activityType === 'download').length
    
    // Calculate engagement level
    let engagementLevel = 'low'
    if (totalValueScore > 50) engagementLevel = 'high'
    else if (totalValueScore > 20) engagementLevel = 'medium'
    
    // Calculate conversion probability
    const conversionProbability = Math.min(totalValueScore / 100, 0.95)
    
    return {
      totalActivities,
      totalValueScore,
      uniquePages,
      toolUsage,
      downloads,
      engagementLevel,
      conversionProbability: Math.round(conversionProbability * 100)
    }
  }
  
  /**
   * Convert anonymous session to user
   */
  async convertToUser(sessionId: string, userId: string) {
    try {
      // Update session status
      await db
        .update(anonymousSessions)
        .set({
          status: 'converted',
          lastActivity: new Date()
        })
        .where(eq(anonymousSessions.sessionId, sessionId))
      
      // Update user record with session link
      // This will be handled in the user service
      
      return { success: true }
    } catch (error) {
      console.error('Error converting anonymous session:', error)
      throw new Error('Failed to convert session')
    }
  }
  
  /**
   * Get high-value anonymous sessions for lead generation
   */
  async getHighValueSessions(minScore: number = 30, days: number = 7) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)
      
      const sessions = await db
        .select()
        .from(anonymousSessions)
        .where(
          and(
            gte(anonymousSessions.conversionScore, minScore),
            gte(anonymousSessions.lastActivity, cutoffDate),
            eq(anonymousSessions.status, 'active')
          )
        )
        .orderBy(desc(anonymousSessions.conversionScore))
        .limit(100)
      
      return sessions
    } catch (error) {
      console.error('Error getting high-value sessions:', error)
      throw new Error('Failed to get high-value sessions')
    }
  }
}

export const anonymousTrackingService = new AnonymousTrackingService() 