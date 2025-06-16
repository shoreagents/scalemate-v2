import { pgTable, text, timestamp, integer, boolean, jsonb, uuid, varchar, decimal } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// TEST: New table to verify automatic schema sync
export const drizzleSchemaTest = pgTable('drizzle_schema_test', {
  id: uuid('id').primaryKey().defaultRandom(),
  testMessage: varchar('test_message', { length: 255 }).notNull().default('Drizzle can read schema.ts!'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  schemaVersion: varchar('schema_version', { length: 50 }).notNull().default('v2.0'),
})

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