import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, varchar, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ========================================
// LEVEL 1: ANONYMOUS USER TRACKING
// ========================================

export const anonymousSessions = pgTable('anonymous_sessions', {
  sessionId: varchar('session_id', { length: 255 }).primaryKey(),
  ipAddress: varchar('ip_address', { length: 45 }),
  location: varchar('location', { length: 100 }),
  deviceInfo: jsonb('device_info'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  totalPageViews: integer('total_page_views').default(0),
  timeOnSite: integer('time_on_site').default(0), // seconds
  referralSource: varchar('referral_source', { length: 500 }),
  utmCampaign: varchar('utm_campaign', { length: 100 }),
  utmSource: varchar('utm_source', { length: 100 }),
  utmMedium: varchar('utm_medium', { length: 100 }),
  conversionScore: integer('conversion_score').default(0),
  status: varchar('status', { length: 20 }).default('active'), // active, converted, expired
})

export const anonymousActivities = pgTable('anonymous_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).references(() => anonymousSessions.sessionId).notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(), // page_view, button_click, tool_use, download, form_interaction
  activityData: jsonb('activity_data').notNull(),
  valueScore: integer('value_score').default(1), // importance of this activity (1-100)
  pagePath: varchar('page_path', { length: 500 }),
  elementId: varchar('element_id', { length: 100 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  duration: integer('duration'), // how long they spent on this activity
})

// ========================================
// LEVEL 2: USER REGISTRATION & PROFILES
// ========================================

// Enhanced users table (extending existing)
// ... existing users table ...

export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  businessName: varchar('business_name', { length: 255 }),
  businessType: varchar('business_type', { length: 100 }), // Real Estate, Healthcare, E-commerce, etc.
  industryCategory: varchar('industry_category', { length: 100 }), // Property Management, Medical Practice, etc.
  locationCountry: varchar('location_country', { length: 100 }),
  locationState: varchar('location_state', { length: 100 }),
  locationCity: varchar('location_city', { length: 100 }),
  timezone: varchar('timezone', { length: 50 }),
  companySize: varchar('company_size', { length: 50 }),
  yearlyRevenue: varchar('yearly_revenue', { length: 50 }),
  currentChallenges: jsonb('current_challenges'), // Array of challenges
  toolsCurrentlyUsing: jsonb('tools_currently_using'), // Array of current tools/CRMs
  primaryGoals: jsonb('primary_goals'), // Array of goals
  budgetRange: varchar('budget_range', { length: 100 }),
  hiringExperience: varchar('hiring_experience', { length: 50 }), // none, some, experienced
  remoteWorkExperience: varchar('remote_work_experience', { length: 50 }),
  preferredCommunication: jsonb('preferred_communication'), // email, slack, teams, etc.
  workingHours: jsonb('working_hours'), // their timezone and preferred hours
  profileCompletionScore: integer('profile_completion_score').default(0), // 0-100%
  onboardingStep: integer('onboarding_step').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ========================================
// LEVEL 3: INDUSTRY-SPECIFIC TOOL LOGIC
// ========================================

export const toolConfigurations = pgTable('tool_configurations', {
  id: uuid('id').primaryKey().defaultRandom(),
  toolName: varchar('tool_name', { length: 100 }).notNull(),
  industryType: varchar('industry_type', { length: 100 }).notNull(),
  questionFlow: jsonb('question_flow').notNull(), // Array of questions
  taskOptions: jsonb('task_options').notNull(), // Industry-specific tasks
  crmIntegrations: jsonb('crm_integrations'), // Available CRM integrations
  roleTemplates: jsonb('role_templates'), // Common roles for industry
  pricingFactors: jsonb('pricing_factors'), // Location, complexity adjustments
  isActive: boolean('is_active').default(true),
  version: varchar('version', { length: 20 }).default('1.0'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const personalizedInteractions = pgTable('personalized_interactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sessionId: varchar('session_id', { length: 255 }),
  interactionType: varchar('interaction_type', { length: 50 }).notNull(),
  toolName: varchar('tool_name', { length: 100 }),
  industryContext: varchar('industry_context', { length: 100 }),
  questionsAsked: jsonb('questions_asked'),
  responsesGiven: jsonb('responses_given'),
  recommendationsMade: jsonb('recommendations_made'),
  completionStatus: varchar('completion_status', { length: 20 }).default('in_progress'),
  completionScore: integer('completion_score').default(0), // 0-100
  timeSpent: integer('time_spent'), // seconds
  profileInfluenceFactors: jsonb('profile_influence_factors'), // which profile aspects influenced this
  conversionValue: decimal('conversion_value', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ========================================
// LEVEL 4: ENHANCED QUOTE SYSTEM
// ========================================

export const profileBasedQuoteSessions = pgTable('profile_based_quote_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  sessionType: varchar('session_type', { length: 20 }).default('authenticated'), // anonymous, authenticated
  businessContext: jsonb('business_context').notNull(), // Pulled from profile
  roleBeingQuoted: varchar('role_being_quoted', { length: 255 }).notNull(),
  industrySpecificQuestions: jsonb('industry_specific_questions'),
  industrySpecificAnswers: jsonb('industry_specific_answers'),
  locationAdjustments: jsonb('location_adjustments'), // Currency, cost of living adjustments
  complexityFactors: jsonb('complexity_factors'), // Technical skills, language requirements
  finalQuote: jsonb('final_quote').notNull(),
  alternativeQuotes: jsonb('alternative_quotes'), // Different role variations
  confidenceScore: decimal('confidence_score', { precision: 5, scale: 2 }).default('0.00'),
  adminNotes: text('admin_notes'),
  status: varchar('status', { length: 20 }).default('draft'), // draft, completed, sent_to_admin, converted
  quoteValidUntil: timestamp('quote_valid_until'),
  conversionProbability: decimal('conversion_probability', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const quoteRecommendations = pgTable('quote_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  quoteSessionId: uuid('quote_session_id').references(() => profileBasedQuoteSessions.id).notNull(),
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // next_tool, upgrade, consultation, course
  recommendationTitle: varchar('recommendation_title', { length: 255 }).notNull(),
  recommendationDescription: text('recommendation_description'),
  recommendationData: jsonb('recommendation_data'),
  basedOnProfile: jsonb('based_on_profile'), // Profile factors that influenced this
  priorityScore: integer('priority_score').default(5), // 1-10
  isActive: boolean('is_active').default(true),
  deliveredAt: timestamp('delivered_at'),
  clickedAt: timestamp('clicked_at'),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ========================================
// LEVEL 5: ADMIN LEAD MANAGEMENT
// ========================================

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  anonymousSessionId: varchar('anonymous_session_id', { length: 255 }).references(() => anonymousSessions.sessionId),
  leadSource: varchar('lead_source', { length: 100 }).notNull(), // quote_calculator, role_builder, contact_form, etc.
  leadScore: integer('lead_score').default(0), // 0-100
  qualificationScore: integer('qualification_score').default(0), // 0-100
  businessProfile: jsonb('business_profile').notNull(),
  activitySummary: jsonb('activity_summary'),
  toolUsageSummary: jsonb('tool_usage_summary'),
  quoteRequests: jsonb('quote_requests'),
  priorityLevel: varchar('priority_level', { length: 20 }).default('medium'), // hot, warm, cold, medium
  assignedTo: uuid('assigned_to'), // Admin/sales person ID
  salesStage: varchar('sales_stage', { length: 50 }).default('new'), // new, contacted, qualified, proposal, negotiation, closed_won, closed_lost
  status: varchar('status', { length: 20 }).default('new'),
  adminNotes: text('admin_notes'),
  lastContactDate: timestamp('last_contact_date'),
  nextFollowUpDate: timestamp('next_follow_up_date'),
  estimatedValue: decimal('estimated_value', { precision: 10, scale: 2 }),
  closeProbability: decimal('close_probability', { precision: 5, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
})

export const leadActivities = pgTable('lead_activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: uuid('lead_id').references(() => leads.id).notNull(),
  activityType: varchar('activity_type', { length: 50 }).notNull(),
  activityTitle: varchar('activity_title', { length: 255 }).notNull(),
  activityDetails: jsonb('activity_details'),
  impactOnScore: integer('impact_on_score').default(0), // +/- points to lead score
  performedBy: varchar('performed_by', { length: 50 }), // system, admin, user
  isVisible: boolean('is_visible').default(true), // show in timeline
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// ========================================
// LEVEL 6: RE-ENGAGEMENT SYSTEM
// ========================================

export const userRecommendations = pgTable('user_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  recommendationType: varchar('recommendation_type', { length: 50 }).notNull(), // next_tool, content, upgrade, course
  recommendationTitle: varchar('recommendation_title', { length: 255 }).notNull(),
  recommendationDescription: text('recommendation_description'),
  recommendationUrl: varchar('recommendation_url', { length: 500 }),
  basedOnProfile: jsonb('based_on_profile'),
  basedOnActivity: jsonb('based_on_activity'),
  priorityScore: integer('priority_score').default(5), // 1-10
  category: varchar('category', { length: 50 }), // tool, course, content, upgrade
  shownOnDashboard: boolean('shown_on_dashboard').default(false),
  clicked: boolean('clicked').default(false),
  completed: boolean('completed').default(false),
  dismissed: boolean('dismissed').default(false),
  isActive: boolean('is_active').default(true),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const engagementCampaigns = pgTable('engagement_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  campaignType: varchar('campaign_type', { length: 50 }).notNull(), // welcome_series, tool_suggestion, upgrade_prompt, re_engagement
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(),
  messageTemplate: jsonb('message_template').notNull(),
  personalizationData: jsonb('personalization_data'), // Data used for personalization
  sendMethod: varchar('send_method', { length: 20 }).notNull(), // email, dashboard_notification, popup
  scheduledFor: timestamp('scheduled_for').notNull(),
  sentAt: timestamp('sent_at'),
  openedAt: timestamp('opened_at'),
  clickedAt: timestamp('clicked_at'),
  conversionResult: varchar('conversion_result', { length: 50 }), // signed_up, used_tool, upgraded, purchased
  conversionValue: decimal('conversion_value', { precision: 10, scale: 2 }),
  status: varchar('status', { length: 20 }).default('scheduled'), // scheduled, sent, opened, clicked, converted, failed
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ========================================
// EXISTING TABLES (keeping all your current tables)
// ========================================

// Users and Sessions
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  preferences: jsonb('preferences'),
})

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  sessionId: varchar('session_id', { length: 255 }).notNull().unique(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  country: varchar('country', { length: 100 }),
  city: varchar('city', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
})

export const pageViews = pgTable('page_views', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  path: varchar('path', { length: 500 }).notNull(),
  title: varchar('title', { length: 500 }),
  referrer: varchar('referrer', { length: 500 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  timeOnPage: integer('time_on_page'),
})

export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  eventData: jsonb('event_data'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// AI Quote Calculator
export const quoteCalculatorSessions = pgTable('quote_calculator_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  conversationId: varchar('conversation_id', { length: 255 }).notNull(),
  currentStep: varchar('current_step', { length: 50 }).notNull(),
  businessInfo: jsonb('business_info'),
  requirements: jsonb('requirements'),
  quote: jsonb('quote'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const quoteMessages = pgTable('quote_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => quoteCalculatorSessions.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'),
})

// Readiness Test
export const readinessTestSessions = pgTable('readiness_test_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  currentQuestion: integer('current_question').notNull().default(0),
  totalQuestions: integer('total_questions').notNull(),
  results: jsonb('results'),
  status: varchar('status', { length: 20 }).notNull().default('in_progress'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const testResponses = pgTable('test_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => readinessTestSessions.id).notNull(),
  questionId: varchar('question_id', { length: 255 }).notNull(),
  questionText: text('question_text').notNull(),
  answer: text('answer').notNull(),
  score: integer('score').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// Blog and Content
export const authors = pgTable('authors', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  bio: text('bio'),
  avatar: varchar('avatar', { length: 500 }),
  socialLinks: jsonb('social_links'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),
  color: varchar('color', { length: 7 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  count: integer('count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  excerpt: text('excerpt'),
  content: text('content').notNull(),
  authorId: uuid('author_id').references(() => authors.id).notNull(),
  publishedAt: timestamp('published_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  featuredImage: varchar('featured_image', { length: 500 }),
  seoTitle: varchar('seo_title', { length: 500 }),
  seoDescription: text('seo_description'),
  readingTime: integer('reading_time').notNull(),
  views: integer('views').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const postCategories = pgTable('post_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => blogPosts.id).notNull(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
})

export const postTags = pgTable('post_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => blogPosts.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
})

// Email and Marketing
export const emailCaptures = pgTable('email_captures', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  sessionId: varchar('session_id', { length: 255 }).notNull(),
  source: varchar('source', { length: 50 }).notNull(),
  metadata: jsonb('metadata'),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  confirmedAt: timestamp('confirmed_at'),
})

export const emailCampaigns = pgTable('email_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  content: text('content').notNull(),
  templateId: varchar('template_id', { length: 255 }),
  audienceId: varchar('audience_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  stats: jsonb('stats'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Advanced AI Quote Calculator System
export const conversationSessions = pgTable('conversation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  anonymousId: varchar('anonymous_id', { length: 255 }).notNull(),
  phase: varchar('phase', { length: 50 }).notNull().default('discovery'),
  currentStep: integer('current_step').notNull().default(1),
  totalSteps: integer('total_steps').notNull().default(4),
  conversationState: jsonb('conversation_state'),
  userProfile: jsonb('user_profile'),
  businessContext: jsonb('business_context'),
  roleRequirements: jsonb('role_requirements'),
  qualificationData: jsonb('qualification_data'),
  generatedQuote: jsonb('generated_quote'),
  completionRate: decimal('completion_rate', { precision: 5, scale: 2 }).default('0.00'),
  engagementScore: decimal('engagement_score', { precision: 5, scale: 2 }).default('0.00'),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  lastInteraction: timestamp('last_interaction').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => conversationSessions.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // 'user', 'assistant', 'system'
  content: text('content').notNull(),
  phase: varchar('phase', { length: 50 }).notNull(),
  step: integer('step').notNull(),
  messageType: varchar('message_type', { length: 50 }).notNull(), // 'question', 'response', 'clarification', 'summary'
  extractedData: jsonb('extracted_data'),
  confidence: decimal('confidence', { precision: 5, scale: 2 }),
  processingTime: integer('processing_time'), // milliseconds
  tokenCount: integer('token_count'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  metadata: jsonb('metadata'),
})

export const conversationMemory = pgTable('conversation_memory', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => conversationSessions.id).notNull(),
  memoryType: varchar('memory_type', { length: 50 }).notNull(), // 'short_term', 'long_term', 'context'
  key: varchar('key', { length: 255 }).notNull(),
  value: jsonb('value').notNull(),
  importance: decimal('importance', { precision: 5, scale: 2 }).default('1.00'),
  accessCount: integer('access_count').default(0),
  lastAccessed: timestamp('last_accessed').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const conversationEmbeddings = pgTable('conversation_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => conversationSessions.id).notNull(),
  messageId: uuid('message_id').references(() => conversationMessages.id),
  content: text('content').notNull(),
  embedding: text('embedding').notNull(), // JSON string of vector
  embeddingModel: varchar('embedding_model', { length: 100 }).notNull().default('text-embedding-3-small'),
  dimensions: integer('dimensions').notNull().default(1536),
  category: varchar('category', { length: 50 }).notNull(), // 'business_info', 'role_requirements', 'pain_points', 'goals'
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const roleTemplates = pgTable('role_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description').notNull(),
  skillsRequired: jsonb('skills_required').notNull(),
  experienceLevel: varchar('experience_level', { length: 50 }).notNull(),
  hourlyRateRange: jsonb('hourly_rate_range').notNull(),
  commonTasks: jsonb('common_tasks').notNull(),
  qualificationQuestions: jsonb('qualification_questions').notNull(),
  pricingFactors: jsonb('pricing_factors').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const quoteGenerations = pgTable('quote_generations', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => conversationSessions.id).notNull(),
  roleTemplateId: uuid('role_template_id').references(() => roleTemplates.id),
  businessProfile: jsonb('business_profile').notNull(),
  roleRequirements: jsonb('role_requirements').notNull(),
  pricingInputs: jsonb('pricing_inputs').notNull(),
  generatedQuote: jsonb('generated_quote').notNull(),
  confidence: decimal('confidence', { precision: 5, scale: 2 }).notNull(),
  alternativeOptions: jsonb('alternative_options'),
  implementationPlan: jsonb('implementation_plan'),
  riskFactors: jsonb('risk_factors'),
  generationTime: integer('generation_time'), // milliseconds
  version: integer('version').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('generated'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const conversationAnalytics = pgTable('conversation_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => conversationSessions.id).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  phase: varchar('phase', { length: 50 }).notNull(),
  step: integer('step').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  sessionDuration: integer('session_duration'), // seconds
  metadata: jsonb('metadata'),
})

export const reEngagementCampaigns = pgTable('re_engagement_campaigns', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => conversationSessions.id).notNull(),
  campaignType: varchar('campaign_type', { length: 50 }).notNull(),
  triggerCondition: jsonb('trigger_condition').notNull(),
  messageTemplate: text('message_template').notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  sentAt: timestamp('sent_at'),
  responseAt: timestamp('response_at'),
  status: varchar('status', { length: 20 }).notNull().default('scheduled'),
  engagementResult: jsonb('engagement_result'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ========================================
// TEST TABLE
// ========================================

export const testTable = pgTable('test_table', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  testData: jsonb('test_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}))

export const quoteCalculatorSessionsRelations = relations(quoteCalculatorSessions, ({ many }) => ({
  messages: many(quoteMessages),
}))

export const quoteMessagesRelations = relations(quoteMessages, ({ one }) => ({
  session: one(quoteCalculatorSessions, {
    fields: [quoteMessages.sessionId],
    references: [quoteCalculatorSessions.id],
  }),
}))

export const readinessTestSessionsRelations = relations(readinessTestSessions, ({ many }) => ({
  responses: many(testResponses),
}))

export const testResponsesRelations = relations(testResponses, ({ one }) => ({
  session: one(readinessTestSessions, {
    fields: [testResponses.sessionId],
    references: [readinessTestSessions.id],
  }),
}))

export const authorsRelations = relations(authors, ({ many }) => ({
  posts: many(blogPosts),
}))

export const blogPostsRelations = relations(blogPosts, ({ one, many }) => ({
  author: one(authors, {
    fields: [blogPosts.authorId],
    references: [authors.id],
  }),
  categories: many(postCategories),
  tags: many(postTags),
}))

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(blogPosts, {
    fields: [postCategories.postId],
    references: [blogPosts.id],
  }),
  category: one(categories, {
    fields: [postCategories.categoryId],
    references: [categories.id],
  }),
}))

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(blogPosts, {
    fields: [postTags.postId],
    references: [blogPosts.id],
  }),
  tag: one(tags, {
    fields: [postTags.tagId],
    references: [tags.id],
  }),
}))

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(postCategories),
}))

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}))

// Advanced AI Quote Calculator Relations
export const conversationSessionsRelations = relations(conversationSessions, ({ many }) => ({
  messages: many(conversationMessages),
  memory: many(conversationMemory),
  embeddings: many(conversationEmbeddings),
  quotes: many(quoteGenerations),
  analytics: many(conversationAnalytics),
  reEngagementCampaigns: many(reEngagementCampaigns),
}))

export const conversationMessagesRelations = relations(conversationMessages, ({ one, many }) => ({
  session: one(conversationSessions, {
    fields: [conversationMessages.sessionId],
    references: [conversationSessions.id],
  }),
  embeddings: many(conversationEmbeddings),
}))

export const conversationMemoryRelations = relations(conversationMemory, ({ one }) => ({
  session: one(conversationSessions, {
    fields: [conversationMemory.sessionId],
    references: [conversationSessions.id],
  }),
}))

export const conversationEmbeddingsRelations = relations(conversationEmbeddings, ({ one }) => ({
  session: one(conversationSessions, {
    fields: [conversationEmbeddings.sessionId],
    references: [conversationSessions.id],
  }),
  message: one(conversationMessages, {
    fields: [conversationEmbeddings.messageId],
    references: [conversationMessages.id],
  }),
}))

export const roleTemplatesRelations = relations(roleTemplates, ({ many }) => ({
  quotes: many(quoteGenerations),
}))

export const quoteGenerationsRelations = relations(quoteGenerations, ({ one }) => ({
  session: one(conversationSessions, {
    fields: [quoteGenerations.sessionId],
    references: [conversationSessions.id],
  }),
  roleTemplate: one(roleTemplates, {
    fields: [quoteGenerations.roleTemplateId],
    references: [roleTemplates.id],
  }),
}))

export const conversationAnalyticsRelations = relations(conversationAnalytics, ({ one }) => ({
  session: one(conversationSessions, {
    fields: [conversationAnalytics.sessionId],
    references: [conversationSessions.id],
  }),
}))

export const reEngagementCampaignsRelations = relations(reEngagementCampaigns, ({ one }) => ({
  session: one(conversationSessions, {
    fields: [reEngagementCampaigns.sessionId],
    references: [conversationSessions.id],
  }),
}))

// ========================================
// NEW PROFILE-BASED ARCHITECTURE RELATIONS
// ========================================

export const anonymousSessionsRelations = relations(anonymousSessions, ({ many, one }) => ({
  activities: many(anonymousActivities),
  leads: many(leads),
}))

export const anonymousActivitiesRelations = relations(anonymousActivities, ({ one }) => ({
  session: one(anonymousSessions, {
    fields: [anonymousActivities.sessionId],
    references: [anonymousSessions.sessionId],
  }),
}))

export const userProfilesRelations = relations(userProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [userProfiles.userId],
    references: [users.id],
  }),
  interactions: many(personalizedInteractions),
  quoteSessions: many(profileBasedQuoteSessions),
  recommendations: many(userRecommendations),
  campaigns: many(engagementCampaigns),
}))

export const personalizedInteractionsRelations = relations(personalizedInteractions, ({ one }) => ({
  user: one(users, {
    fields: [personalizedInteractions.userId],
    references: [users.id],
  }),
  profile: one(userProfiles, {
    fields: [personalizedInteractions.userId],
    references: [userProfiles.userId],
  }),
}))

export const profileBasedQuoteSessionsRelations = relations(profileBasedQuoteSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [profileBasedQuoteSessions.userId],
    references: [users.id],
  }),
  recommendations: many(quoteRecommendations),
}))

export const quoteRecommendationsRelations = relations(quoteRecommendations, ({ one }) => ({
  quoteSession: one(profileBasedQuoteSessions, {
    fields: [quoteRecommendations.quoteSessionId],
    references: [profileBasedQuoteSessions.id],
  }),
}))

export const leadsRelations = relations(leads, ({ one, many }) => ({
  user: one(users, {
    fields: [leads.userId],
    references: [users.id],
  }),
  anonymousSession: one(anonymousSessions, {
    fields: [leads.anonymousSessionId],
    references: [anonymousSessions.sessionId],
  }),
  activities: many(leadActivities),
}))

export const leadActivitiesRelations = relations(leadActivities, ({ one }) => ({
  lead: one(leads, {
    fields: [leadActivities.leadId],
    references: [leads.id],
  }),
}))

export const userRecommendationsRelations = relations(userRecommendations, ({ one }) => ({
  user: one(users, {
    fields: [userRecommendations.userId],
    references: [users.id],
  }),
}))

export const engagementCampaignsRelations = relations(engagementCampaigns, ({ one }) => ({
  user: one(users, {
    fields: [engagementCampaigns.userId],
    references: [users.id],
  }),
})) 