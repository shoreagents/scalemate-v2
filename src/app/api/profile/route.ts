import { NextRequest, NextResponse } from 'next/server'
import { profileService, UserProfileData } from '@/lib/services/profileService'
import { z } from 'zod'

const profileSchema = z.object({
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  industryCategory: z.string().optional(),
  locationCountry: z.string().optional(),
  locationState: z.string().optional(),
  locationCity: z.string().optional(),
  timezone: z.string().optional(),
  companySize: z.string().optional(),
  yearlyRevenue: z.string().optional(),
  currentChallenges: z.array(z.string()).optional(),
  toolsCurrentlyUsing: z.array(z.string()).optional(),
  primaryGoals: z.array(z.string()).optional(),
  budgetRange: z.string().optional(),
  hiringExperience: z.enum(['none', 'some', 'experienced']).optional(),
  remoteWorkExperience: z.string().optional(),
  preferredCommunication: z.array(z.string()).optional(),
  workingHours: z.object({
    timezone: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    days: z.array(z.string())
  }).optional()
})

const createProfileSchema = z.object({
  userId: z.string().uuid(),
  sessionId: z.string().optional(),
  profileData: profileSchema
})

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validation = createProfileSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid profile data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { userId, sessionId, profileData } = validation.data
    
    // Create or update profile
    const result = await profileService.createOrUpdateProfile(userId, profileData, sessionId)
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: result
    })
    
  } catch (error) {
    console.error('Failed to update profile:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile'
      },
      { status: 500 }
    )
  }
}

// GET - Get profile with analysis
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'User ID is required'
        },
        { status: 400 }
      )
    }
    
    // Get profile analysis
    const analysis = await profileService.getProfileWithAnalysis(userId)
    
    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: 'Profile not found'
        },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: analysis
    })
    
  } catch (error) {
    console.error('Failed to get profile:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get profile'
      },
      { status: 500 }
    )
  }
}

// PUT - Update specific profile fields
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    const updateSchema = z.object({
      userId: z.string().uuid(),
      updates: profileSchema.partial()
    })
    
    const validation = updateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: validation.error.errors
        },
        { status: 400 }
      )
    }

    const { userId, updates } = validation.data
    
    // Update profile
    const result = await profileService.createOrUpdateProfile(userId, updates)
    
    return NextResponse.json({
      success: true,
      message: 'Profile fields updated successfully',
      data: result
    })
    
  } catch (error) {
    console.error('Failed to update profile fields:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update profile fields'
      },
      { status: 500 }
    )
  }
} 