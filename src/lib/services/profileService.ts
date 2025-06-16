import { dbProxy as db } from '@/lib/db'
import { users, userProfiles, leads, leadActivities } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { anonymousTrackingService } from './anonymousTracking'

export interface UserProfileData {
  businessName?: string
  businessType?: string
  industryCategory?: string
  locationCountry?: string
  locationState?: string
  locationCity?: string
  timezone?: string
  companySize?: string
  yearlyRevenue?: string
  currentChallenges?: string[]
  toolsCurrentlyUsing?: string[]
  primaryGoals?: string[]
  budgetRange?: string
  hiringExperience?: string
  remoteWorkExperience?: string
  preferredCommunication?: string[]
  workingHours?: {
    timezone: string
    startTime: string
    endTime: string
    days: string[]
  }
}

export interface ProfileAnalysis {
  completionScore: number
  missingFields: string[]
  industryMatch: string
  targetingRecommendations: string[]
  nextSteps: string[]
}

export class ProfileService {
  
  /**
   * Create or update user profile
   */
  async createOrUpdateProfile(userId: string, profileData: UserProfileData, sessionId?: string) {
    try {
      // Check if profile exists
      const existingProfile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1)
      
      // Calculate completion score
      const completionScore = this.calculateCompletionScore(profileData)
      
      const profileRecord = {
        userId,
        ...profileData,
        profileCompletionScore: completionScore,
        updatedAt: new Date(),
      }
      
      if (existingProfile.length > 0) {
        // Update existing profile
        await db
          .update(userProfiles)
          .set(profileRecord)
          .where(eq(userProfiles.userId, userId))
      } else {
        // Create new profile
        await db.insert(userProfiles).values({
          ...profileRecord,
          createdAt: new Date(),
          onboardingStep: 1,
          isActive: true
        })
      }
      
      // Convert anonymous session if provided
      if (sessionId) {
        await anonymousTrackingService.convertToUser(sessionId, userId)
        await this.linkUserToSession(userId, sessionId)
      }
      
      // Create or update lead record
      await this.createOrUpdateLead(userId, sessionId, 'profile_completion')
      
      // Track profile completion activity
      await this.trackProfileActivity(userId, 'profile_updated', {
        completionScore,
        fieldsCompleted: Object.keys(profileData).length
      })
      
      return {
        success: true,
        completionScore,
        profile: profileRecord
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error)
      throw new Error('Failed to manage profile')
    }
  }
  
  /**
   * Calculate profile completion score
   */
  private calculateCompletionScore(profileData: UserProfileData): number {
    const fields = [
      'businessName',
      'businessType', 
      'industryCategory',
      'locationCountry',
      'locationCity',
      'companySize',
      'currentChallenges',
      'toolsCurrentlyUsing',
      'primaryGoals',
      'budgetRange',
      'hiringExperience'
    ]
    
    let completedFields = 0
    const totalFields = fields.length
    
    fields.forEach(field => {
      const value = profileData[field as keyof UserProfileData]
      if (value && (Array.isArray(value) ? value.length > 0 : value.toString().trim() !== '')) {
        completedFields++
      }
    })
    
    // Bonus points for detailed information
    let bonusPoints = 0
    if (profileData.workingHours) bonusPoints += 5
    if (profileData.yearlyRevenue) bonusPoints += 5
    if (profileData.preferredCommunication?.length) bonusPoints += 5
    
    const baseScore = Math.round((completedFields / totalFields) * 100)
    return Math.min(baseScore + bonusPoints, 100)
  }
  
  /**
   * Get user profile with analysis
   */
  async getProfileWithAnalysis(userId: string): Promise<ProfileAnalysis | null> {
    try {
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1)
      
      if (profile.length === 0) {
        return null
      }
      
      const profileData = profile[0]
      
      // Analyze profile
      const analysis = this.analyzeProfile(profileData)
      
      return {
        completionScore: profileData.profileCompletionScore || 0,
        missingFields: analysis.missingFields,
        industryMatch: analysis.industryMatch,
        targetingRecommendations: analysis.targetingRecommendations,
        nextSteps: analysis.nextSteps
      }
    } catch (error) {
      console.error('Error getting profile analysis:', error)
      throw new Error('Failed to analyze profile')
    }
  }
  
  /**
   * Analyze profile for industry targeting and recommendations
   */
  private analyzeProfile(profileData: any) {
    const missingFields: string[] = []
    const targetingRecommendations: string[] = []
    const nextSteps: string[] = []
    
    // Check required fields
    const requiredFields = [
      { field: 'businessName', label: 'Business Name' },
      { field: 'businessType', label: 'Business Type' },
      { field: 'industryCategory', label: 'Industry Category' },
      { field: 'locationCountry', label: 'Country' },
      { field: 'companySize', label: 'Company Size' },
      { field: 'budgetRange', label: 'Budget Range' }
    ]
    
    requiredFields.forEach(({ field, label }) => {
      if (!profileData[field]) {
        missingFields.push(label)
      }
    })
    
    // Industry-specific analysis
    const industryMatch = this.getIndustryMatch(profileData.businessType, profileData.industryCategory)
    
    // Generate targeting recommendations
    if (profileData.businessType === 'Real Estate') {
      targetingRecommendations.push('Focus on property management and CRM integration tools')
      targetingRecommendations.push('Highlight Australian real estate compliance features')
      if (profileData.toolsCurrentlyUsing?.includes('VaultRe')) {
        targetingRecommendations.push('Emphasize VaultRe integration capabilities')
      }
    } else if (profileData.businessType === 'Healthcare') {
      targetingRecommendations.push('Emphasize HIPAA compliance and patient data security')
      targetingRecommendations.push('Focus on appointment scheduling and patient communication')
    } else if (profileData.businessType === 'E-commerce') {
      targetingRecommendations.push('Highlight inventory management and customer service automation')
      targetingRecommendations.push('Focus on order processing and shipping coordination')
    }
    
    // Generate next steps
    if (profileData.profileCompletionScore < 80) {
      nextSteps.push('Complete your business profile for personalized recommendations')
    }
    if (!profileData.primaryGoals?.length) {
      nextSteps.push('Define your primary hiring goals')
    }
    if (profileData.hiringExperience === 'none') {
      nextSteps.push('Take our offshore hiring readiness assessment')
      nextSteps.push('Download our beginner\'s guide to offshore hiring')
    }
    
    return {
      missingFields,
      industryMatch,
      targetingRecommendations,
      nextSteps
    }
  }
  
  /**
   * Get industry match for targeting
   */
  private getIndustryMatch(businessType?: string, industryCategory?: string): string {
    if (!businessType) return 'general'
    
    const industryMap: Record<string, string> = {
      'Real Estate': 'real_estate',
      'Healthcare': 'healthcare', 
      'E-commerce': 'ecommerce',
      'Professional Services': 'professional_services',
      'Manufacturing': 'manufacturing',
      'Technology': 'technology',
      'Education': 'education',
      'Non-profit': 'nonprofit'
    }
    
    return industryMap[businessType] || 'general'
  }
  
  /**
   * Link user to anonymous session
   */
  private async linkUserToSession(userId: string, sessionId: string) {
    try {
      // Update user record with session ID
      await db
        .update(users)
        .set({ 
          sessionId,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
    } catch (error) {
      console.error('Error linking user to session:', error)
    }
  }
  
  /**
   * Create or update lead record
   */
  private async createOrUpdateLead(userId: string, sessionId?: string, source: string = 'profile_completion') {
    try {
      // Get user profile for lead data
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1)
      
      if (profile.length === 0) return
      
      const profileData = profile[0]
      
      // Calculate lead score based on profile completion and industry
      const leadScore = this.calculateLeadScore(profileData)
      
      // Check if lead already exists
      const existingLead = await db
        .select()
        .from(leads)
        .where(eq(leads.userId, userId))
        .limit(1)
      
      const leadData = {
        userId,
        anonymousSessionId: sessionId || undefined,
        leadSource: source,
        leadScore,
        qualificationScore: leadScore,
        businessProfile: {
          businessName: profileData.businessName,
          businessType: profileData.businessType,
          industryCategory: profileData.industryCategory,
          location: `${profileData.locationCity || ''}, ${profileData.locationCountry || ''}`,
          companySize: profileData.companySize,
          budgetRange: profileData.budgetRange
        },
        priorityLevel: leadScore >= 70 ? 'hot' : leadScore >= 40 ? 'warm' : 'cold',
        lastUpdated: new Date()
      }
      
      if (existingLead.length > 0) {
        // Update existing lead
        await db
          .update(leads)
          .set(leadData)
          .where(eq(leads.userId, userId))
      } else {
        // Create new lead
        await db.insert(leads).values({
          ...leadData,
          createdAt: new Date(),
          status: 'new',
          salesStage: 'new'
        })
      }
    } catch (error) {
      console.error('Error creating/updating lead:', error)
    }
  }
  
  /**
   * Calculate lead score based on profile data
   */
  private calculateLeadScore(profileData: any): number {
    let score = 0
    
    // Profile completion (0-40 points)
    score += (profileData.profileCompletionScore || 0) * 0.4
    
    // Budget range (0-20 points)
    const budgetScores: Record<string, number> = {
      '$500-1000/month': 5,
      '$1000-2000/month': 10,
      '$2000-4000/month': 15,
      '$4000+/month': 20
    }
    score += budgetScores[profileData.budgetRange] || 0
    
    // Industry type (0-15 points)
    const industryScores: Record<string, number> = {
      'Real Estate': 15,
      'Healthcare': 12,
      'E-commerce': 10,
      'Professional Services': 8,
      'Technology': 10
    }
    score += industryScores[profileData.businessType] || 5
    
    // Hiring experience (0-10 points)
    const experienceScores: Record<string, number> = {
      'experienced': 10,
      'some': 7,
      'none': 3
    }
    score += experienceScores[profileData.hiringExperience] || 3
    
    // Company size (0-10 points)
    const sizeScores: Record<string, number> = {
      '1-5 employees': 5,
      '6-20 employees': 8,
      '21-50 employees': 10,
      '50+ employees': 10
    }
    score += sizeScores[profileData.companySize] || 5
    
    // Goals clarity (0-5 points)
    if (profileData.primaryGoals?.length >= 2) score += 5
    
    return Math.min(Math.round(score), 100)
  }
  
  /**
   * Track profile-related activity
   */
  private async trackProfileActivity(userId: string, activityType: string, details: any) {
    try {
      const lead = await db
        .select()
        .from(leads)
        .where(eq(leads.userId, userId))
        .limit(1)
      
      if (lead.length === 0) return
      
      await db.insert(leadActivities).values({
        leadId: lead[0].id,
        activityType,
        activityTitle: this.getActivityTitle(activityType),
        activityDetails: details,
        impactOnScore: this.getActivityImpact(activityType),
        performedBy: 'user',
        isVisible: true,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Error tracking profile activity:', error)
    }
  }
  
  private getActivityTitle(activityType: string): string {
    const titles: Record<string, string> = {
      'profile_updated': 'Profile Updated',
      'profile_completed': 'Profile Completed',
      'industry_selected': 'Industry Information Added',
      'goals_defined': 'Goals Defined'
    }
    return titles[activityType] || 'Profile Activity'
  }
  
  private getActivityImpact(activityType: string): number {
    const impacts: Record<string, number> = {
      'profile_updated': 5,
      'profile_completed': 15,
      'industry_selected': 8,
      'goals_defined': 10
    }
    return impacts[activityType] || 2
  }
  
  /**
   * Get industry-specific tool configurations
   */
  async getIndustryRecommendations(userId: string) {
    try {
      const profile = await db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1)
      
      if (profile.length === 0) {
        return []
      }
      
      const industryMatch = this.getIndustryMatch(profile[0].businessType, profile[0].industryCategory)
      
      // Return industry-specific recommendations
      return this.getRecommendationsByIndustry(industryMatch, profile[0])
    } catch (error) {
      console.error('Error getting industry recommendations:', error)
      return []
    }
  }
  
  private getRecommendationsByIndustry(industry: string, profileData: any) {
    const baseRecommendations = [
      {
        type: 'tool',
        title: 'Enhanced Quote Calculator',
        description: 'Get personalized quotes based on your business profile',
        priority: 10
      }
    ]
    
    if (industry === 'real_estate') {
      return [
        ...baseRecommendations,
        {
          type: 'tool',
          title: 'Real Estate Role Builder',
          description: 'Create detailed job descriptions for property management roles',
          priority: 9
        },
        {
          type: 'course',
          title: 'Offshore Property Management Training',
          description: 'Learn to train offshore staff on Australian real estate processes',
          priority: 8
        }
      ]
    }
    
    // Add more industry-specific recommendations here
    
    return baseRecommendations
  }
}

export const profileService = new ProfileService() 